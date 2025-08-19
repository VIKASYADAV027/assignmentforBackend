const express = require('express');
const Course = require('../models/Course');
const { validate, recommendationSchemas } = require('../middleware/validation');
const redisClient = require('../utils/redis');

const router = express.Router();

// Mock Gemini AI service (replace with actual API integration)
class GeminiAIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  async generateRecommendations(preferences) {
    try {
      // In a real implementation, you would make an API call to Gemini AI
      // For this assessment, we'll simulate the AI response
      
      const { topics, skillLevel = 'intermediate', duration, maxTuition } = preferences;
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock recommendations based on preferences
      const mockRecommendations = this.generateMockRecommendations(preferences);
      
      return {
        success: true,
        recommendations: mockRecommendations,
        reasoning: `Based on your interest in ${topics.join(', ')}, I've recommended courses that align with your ${skillLevel} skill level and preferences.`
      };
    } catch (error) {
      console.error('Gemini AI API error:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }

  generateMockRecommendations(preferences) {
    const { topics, skillLevel, duration, maxTuition } = preferences;
    
    // Mock course recommendations based on topics
    const mockCourses = [
      {
        id: 'ai_ml_001',
        title: 'Advanced Machine Learning',
        university: 'Stanford University',
        level: 'Postgraduate',
        duration: '12 months',
        tuition: 45000,
        matchScore: 95,
        reasoning: 'Perfect for AI/ML enthusiasts with strong mathematical background'
      },
      {
        id: 'data_science_001',
        title: 'Data Science and Analytics',
        university: 'MIT',
        level: 'Postgraduate',
        duration: '18 months',
        tuition: 52000,
        matchScore: 92,
        reasoning: 'Comprehensive program covering data analysis and visualization'
      },
      {
        id: 'web_dev_001',
        title: 'Full-Stack Web Development',
        university: 'UC Berkeley',
        level: 'Undergraduate',
        duration: '24 months',
        tuition: 38000,
        matchScore: 88,
        reasoning: 'Hands-on program with modern web technologies'
      },
      {
        id: 'cybersecurity_001',
        title: 'Cybersecurity and Network Security',
        university: 'Carnegie Mellon University',
        level: 'Postgraduate',
        duration: '16 months',
        tuition: 48000,
        matchScore: 85,
        reasoning: 'Specialized program for security professionals'
      },
      {
        id: 'business_tech_001',
        title: 'Business Technology Management',
        university: 'Harvard University',
        level: 'Postgraduate',
        duration: '20 months',
        tuition: 55000,
        matchScore: 82,
        reasoning: 'Combines business strategy with technology implementation'
      }
    ];

    // Filter based on preferences
    let filteredCourses = mockCourses;

    if (maxTuition) {
      filteredCourses = filteredCourses.filter(course => course.tuition <= maxTuition);
    }

    if (duration) {
      const durationMap = {
        short: 12,
        medium: 18,
        long: 24
      };
      const maxDuration = durationMap[duration];
      if (maxDuration) {
        filteredCourses = filteredCourses.filter(course => 
          parseInt(course.duration) <= maxDuration
        );
      }
    }

    // Sort by match score
    filteredCourses.sort((a, b) => b.matchScore - a.matchScore);

    return filteredCourses.slice(0, 5);
  }

  // Real Gemini AI integration (commented out for assessment)
  /*
  async callGeminiAPI(prompt) {
    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
  */
}

const geminiService = new GeminiAIService();

// @route   POST /api/recommendations
// @desc    Get AI-powered course recommendations
// @access  Public
router.post('/', validate(recommendationSchemas.getRecommendations), async (req, res) => {
  try {
    const { topics, skillLevel, duration, maxTuition } = req.body;

    // Create cache key based on preferences
    const cacheKey = JSON.stringify({
      topics: topics.sort(),
      skillLevel,
      duration,
      maxTuition
    });

    // Try to get from cache first
    const cachedRecommendations = await redisClient.getCachedRecommendations(cacheKey);
    if (cachedRecommendations) {
      return res.json({
        ...cachedRecommendations,
        fromCache: true
      });
    }

    // Generate AI recommendations
    const aiResponse = await geminiService.generateRecommendations({
      topics,
      skillLevel,
      duration,
      maxTuition
    });

    // Find matching courses from database
    const matchingCourses = await Course.find({
      $or: [
        { keywords: { $in: topics } },
        { disciplineMajor: { $in: topics } },
        { courseName: { $regex: topics.join('|'), $options: 'i' } },
        { overviewDescription: { $regex: topics.join('|'), $options: 'i' } }
      ]
    })
    .limit(10)
    .lean();

    // Combine AI recommendations with database courses
    const result = {
      aiRecommendations: aiResponse.recommendations,
      databaseCourses: matchingCourses.map(course => ({
        id: course.uniqueId,
        title: course.courseName,
        university: course.universityName,
        level: course.courseLevel,
        duration: `${course.durationMonths} months`,
        tuition: course.firstYearTuitionFee,
        description: course.overviewDescription,
        attendanceType: course.attendanceType,
        courseUrl: course.courseUrl
      })),
      reasoning: aiResponse.reasoning,
      preferences: { topics, skillLevel, duration, maxTuition },
      fromCache: false
    };

    // Cache the result for 1 hour
    await redisClient.setCachedRecommendations(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      error: 'Error generating recommendations',
      details: error.message
    });
  }
});

// @route   GET /api/recommendations/popular
// @desc    Get popular course recommendations
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    // Try to get from cache
    const cachedPopular = await redisClient.get('popular_recommendations');
    if (cachedPopular) {
      return res.json({
        ...cachedPopular,
        fromCache: true
      });
    }

    // Get popular courses based on various criteria
    const popularCourses = await Course.aggregate([
      {
        $addFields: {
          popularityScore: {
            $add: [
              { $ifNull: ['$ftRanking2024', 1000] },
              { $multiply: [{ $ifNull: ['$acceptanceRate', 50] }, -1] },
              { $cond: [{ $eq: ['$partnerCourse', true] }, 100, 0] }
            ]
          }
        }
      },
      {
        $sort: { popularityScore: 1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          id: '$uniqueId',
          title: '$courseName',
          university: '$universityName',
          level: '$courseLevel',
          duration: '$durationMonths',
          tuition: '$firstYearTuitionFee',
          description: '$overviewDescription',
          ranking: '$ftRanking2024',
          acceptanceRate: '$acceptanceRate',
          courseUrl: '$courseUrl'
        }
      }
    ]);

    const result = {
      popularCourses,
      reasoning: 'These courses are ranked based on university rankings, acceptance rates, and partnership status.',
      fromCache: false
    };

    // Cache for 2 hours
    await redisClient.set('popular_recommendations', result, 7200);

    res.json(result);
  } catch (error) {
    console.error('Popular recommendations error:', error);
    res.status(500).json({
      error: 'Error fetching popular recommendations',
      details: error.message
    });
  }
});

// @route   GET /api/recommendations/topics
// @desc    Get available topics for recommendations
// @access  Public
router.get('/topics', async (req, res) => {
  try {
    // Try to get from cache
    const cachedTopics = await redisClient.get('available_topics');
    if (cachedTopics) {
      return res.json({
        topics: cachedTopics,
        fromCache: true
      });
    }

    // Get unique disciplines and keywords
    const disciplines = await Course.distinct('disciplineMajor');
    const keywords = await Course.distinct('keywords');
    
    // Combine and clean up topics
    const allTopics = [...new Set([...disciplines, ...keywords])]
      .filter(topic => topic && topic.trim().length > 0)
      .sort();

    // Cache for 24 hours
    await redisClient.set('available_topics', allTopics, 86400);

    res.json({
      topics: allTopics,
      fromCache: false
    });
  } catch (error) {
    console.error('Topics error:', error);
    res.status(500).json({
      error: 'Error fetching available topics',
      details: error.message
    });
  }
});

module.exports = router;
