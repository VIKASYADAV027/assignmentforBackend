const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Course = require('../models/Course');
const { auth } = require('../middleware/auth');
const { validate, courseSchemas } = require('../middleware/validation');
const redisClient = require('../utils/redis');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `courses-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @route   POST /api/courses/upload
// @desc    Upload course data from CSV file
// @access  Private (Admin only)
router.post('/upload', auth, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No CSV file uploaded'
      });
    }

    const results = [];
    const errors = [];
    let processedCount = 0;
    let successCount = 0;

    // Read and parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        try {
          // Process each row
          for (const row of results) {
            processedCount++;
            
            try {
              // Transform CSV data to match our schema
              const courseData = {
                uniqueId: row.uniqueId || row.course_id || `course_${Date.now()}_${processedCount}`,
                courseName: row.courseName || row.title || row.name,
                courseCode: row.courseCode || row.code,
                universityCode: row.universityCode || row.university_code,
                universityName: row.universityName || row.university_name,
                departmentSchool: row.departmentSchool || row.department || row.school,
                disciplineMajor: row.disciplineMajor || row.discipline || row.major,
                specialization: row.specialization,
                courseLevel: row.courseLevel || row.level || 'Undergraduate',
                overviewDescription: row.overviewDescription || row.description,
                summary: row.summary || row.overviewDescription || row.description,
                prerequisites: row.prerequisites ? row.prerequisites.split(';').map(p => p.trim()) : [],
                learningOutcomes: row.learningOutcomes ? row.learningOutcomes.split(';').map(l => l.trim()) : [],
                teachingMethodology: row.teachingMethodology || row.methodology || 'Not specified',
                assessmentMethods: row.assessmentMethods ? row.assessmentMethods.split(';').map(a => a.trim()) : [],
                credits: parseInt(row.credits) || 0,
                durationMonths: parseInt(row.durationMonths) || parseInt(row.duration) || 12,
                languageOfInstruction: row.languageOfInstruction || row.language || 'English',
                syllabusUrl: row.syllabusUrl || row.syllabus_url,
                keywords: row.keywords ? row.keywords.split(',').map(k => k.trim()) : [],
                professorName: row.professorName || row.instructor,
                professorEmail: row.professorEmail || row.instructor_email,
                officeLocation: row.officeLocation,
                openForIntake: row.openForIntake,
                admissionOpenYears: row.admissionOpenYears || '2024',
                attendanceType: row.attendanceType || row.attendance || 'Full-time',
                firstYearTuitionFee: parseFloat(row.firstYearTuitionFee) || parseFloat(row.tuition) || 0,
                totalTuitionFee: parseFloat(row.totalTuitionFee) || parseFloat(row.tuition) || 0,
                tuitionFeeCurrency: row.tuitionFeeCurrency || row.currency || 'USD',
                applicationFeeAmount: parseFloat(row.applicationFeeAmount) || 0,
                applicationFeeCurrency: row.applicationFeeCurrency || 'USD',
                applicationFeeWaived: row.applicationFeeWaived === 'true',
                requiredApplicationMaterials: row.requiredApplicationMaterials || 'Standard application materials',
                twelfthGradeRequirement: row.twelfthGradeRequirement,
                undergraduateDegreeRequirement: row.undergraduateDegreeRequirement,
                minimumIELTSScore: row.minimumIELTSScore ? parseFloat(row.minimumIELTSScore) : undefined,
                minimumTOEFLScore: row.minimumTOEFLScore ? parseFloat(row.minimumTOEFLScore) : undefined,
                minimumPTEScore: row.minimumPTEScore ? parseFloat(row.minimumPTEScore) : undefined,
                minimumDuolingoScore: row.minimumDuolingoScore ? parseFloat(row.minimumDuolingoScore) : undefined,
                minimumCambridgeEnglishScore: row.minimumCambridgeEnglishScore,
                otherEnglishTestsAccepted: row.otherEnglishTestsAccepted,
                greRequired: row.greRequired === 'true',
                greScore: row.greScore,
                gmatRequired: row.gmatRequired === 'true',
                gmatScore: row.gmatScore,
                satRequired: row.satRequired === 'true',
                satScore: row.satScore,
                actRequired: row.actRequired === 'true',
                actScore: row.actScore,
                waiverOptions: row.waiverOptions,
                partnerCourse: row.partnerCourse === 'true',
                ftRanking2024: row.ftRanking2024 ? parseInt(row.ftRanking2024) : undefined,
                acceptanceRate: row.acceptanceRate ? parseFloat(row.acceptanceRate) : undefined,
                domesticApplicationDeadline: row.domesticApplicationDeadline || '2024-12-31',
                internationalApplicationDeadline: row.internationalApplicationDeadline || '2024-12-31',
                courseUrl: row.courseUrl || row.url || '#'
              };

              // Check if course already exists
              const existingCourse = await Course.findOne({ uniqueId: courseData.uniqueId });
              
              if (existingCourse) {
                // Update existing course
                await Course.findOneAndUpdate(
                  { uniqueId: courseData.uniqueId },
                  courseData,
                  { new: true, runValidators: true }
                );
              } else {
                // Create new course
                const course = new Course(courseData);
                await course.save();
              }
              
              successCount++;
            } catch (error) {
              errors.push({
                row: processedCount,
                error: error.message,
                data: row
              });
            }
          }

          // Invalidate cache after upload
          await redisClient.invalidateCourseCache();

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            message: 'Course data upload completed',
            summary: {
              totalProcessed: processedCount,
              successful: successCount,
              errors: errors.length
            },
            errors: errors.slice(0, 10) // Return first 10 errors
          });
        } catch (error) {
          console.error('CSV processing error:', error);
          res.status(500).json({
            error: 'Error processing CSV file',
            details: error.message
          });
        }
      });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'File upload failed',
      details: error.message
    });
  }
});

// @route   GET /api/courses
// @desc    Get all courses with optional search and filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      query, 
      universityCode, 
      courseLevel, 
      disciplineMajor, 
      attendanceType, 
      minTuition, 
      maxTuition, 
      limit = 50,
      page = 1 
    } = req.query;

    // Create cache key based on query parameters
    const cacheKey = JSON.stringify({
      query,
      universityCode,
      courseLevel,
      disciplineMajor,
      attendanceType,
      minTuition,
      maxTuition,
      limit,
      page
    });

    // Try to get from cache first
    const cachedData = await redisClient.getCachedCourses(cacheKey);
    if (cachedData) {
      return res.json({
        ...cachedData,
        fromCache: true
      });
    }

    // Build search query
    const searchQuery = {};
    
    if (query) {
      searchQuery.$text = { $search: query };
    }
    
    if (universityCode) searchQuery.universityCode = universityCode;
    if (courseLevel) searchQuery.courseLevel = courseLevel;
    if (disciplineMajor) searchQuery.disciplineMajor = disciplineMajor;
    if (attendanceType) searchQuery.attendanceType = attendanceType;
    
    if (minTuition !== undefined || maxTuition !== undefined) {
      searchQuery.firstYearTuitionFee = {};
      if (minTuition !== undefined) searchQuery.firstYearTuitionFee.$gte = parseFloat(minTuition);
      if (maxTuition !== undefined) searchQuery.firstYearTuitionFee.$lte = parseFloat(maxTuition);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const courses = await Course.find(searchQuery)
      .sort(query ? { score: { $meta: 'textScore' } } : { courseName: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Course.countDocuments(searchQuery);

    const result = {
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      fromCache: false
    };

    // Cache the result
    await redisClient.setCachedCourses(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      error: 'Error fetching courses',
      details: error.message
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findOne({ 
      $or: [
        { uniqueId: req.params.id },
        { _id: req.params.id }
      ]
    });

    if (!course) {
      return res.status(404).json({
        error: 'Course not found'
      });
    }

    res.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      error: 'Error fetching course',
      details: error.message
    });
  }
});

// @route   GET /api/courses/stats/summary
// @desc    Get course statistics
// @access  Public
router.get('/stats/summary', async (req, res) => {
  try {
    // Try to get from cache
    const cachedStats = await redisClient.get('course_stats');
    if (cachedStats) {
      return res.json({
        ...cachedStats,
        fromCache: true
      });
    }

    const stats = await Course.aggregate([
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          avgTuition: { $avg: '$firstYearTuitionFee' },
          minTuition: { $min: '$firstYearTuitionFee' },
          maxTuition: { $max: '$firstYearTuitionFee' }
        }
      }
    ]);

    const levelStats = await Course.aggregate([
      {
        $group: {
          _id: '$courseLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    const attendanceStats = await Course.aggregate([
      {
        $group: {
          _id: '$attendanceType',
          count: { $sum: 1 }
        }
      }
    ]);

    const universityStats = await Course.aggregate([
      {
        $group: {
          _id: '$universityCode',
          universityName: { $first: '$universityName' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const result = {
      summary: stats[0] || {},
      byLevel: levelStats,
      byAttendance: attendanceStats,
      topUniversities: universityStats,
      fromCache: false
    };

    // Cache for 1 hour
    await redisClient.set('course_stats', result, 3600);

    res.json(result);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Error fetching course statistics',
      details: error.message
    });
  }
});

module.exports = router;
