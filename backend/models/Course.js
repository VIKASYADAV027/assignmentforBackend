const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  courseName: {
    type: String,
    required: true,
    index: true
  },
  courseCode: {
    type: String,
    required: true
  },
  universityCode: {
    type: String,
    required: true,
    index: true
  },
  universityName: {
    type: String,
    required: true,
    index: true
  },
  departmentSchool: {
    type: String,
    required: true
  },
  disciplineMajor: {
    type: String,
    required: true,
    index: true
  },
  specialization: {
    type: String
  },
  courseLevel: {
    type: String,
    enum: ['Undergraduate', 'Postgraduate', 'Doctorate', 'Diploma', 'Certificate'],
    required: true,
    index: true
  },
  overviewDescription: {
    type: String,
    required: true,
    index: true
  },
  summary: {
    type: String,
    required: true
  },
  prerequisites: [{
    type: String
  }],
  learningOutcomes: [{
    type: String
  }],
  teachingMethodology: {
    type: String,
    required: true
  },
  assessmentMethods: [{
    type: String
  }],
  credits: {
    type: Number,
    required: true
  },
  durationMonths: {
    type: Number,
    required: true
  },
  languageOfInstruction: {
    type: String,
    required: true
  },
  syllabusUrl: {
    type: String
  },
  keywords: [{
    type: String,
    index: true
  }],
  professorName: {
    type: String
  },
  professorEmail: {
    type: String
  },
  officeLocation: {
    type: String
  },
  openForIntake: {
    type: String
  },
  admissionOpenYears: {
    type: String,
    required: true
  },
  attendanceType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Online'],
    required: true,
    index: true
  },
  firstYearTuitionFee: {
    type: Number,
    required: true,
    index: true
  },
  totalTuitionFee: {
    type: Number,
    required: true
  },
  tuitionFeeCurrency: {
    type: String,
    required: true,
    default: 'USD'
  },
  applicationFeeAmount: {
    type: Number,
    required: true
  },
  applicationFeeCurrency: {
    type: String,
    required: true,
    default: 'USD'
  },
  applicationFeeWaived: {
    type: Boolean,
    default: false
  },
  requiredApplicationMaterials: {
    type: String,
    required: true
  },
  twelfthGradeRequirement: {
    type: String
  },
  undergraduateDegreeRequirement: {
    type: String
  },
  minimumIELTSScore: {
    type: Number
  },
  minimumTOEFLScore: {
    type: Number
  },
  minimumPTEScore: {
    type: Number
  },
  minimumDuolingoScore: {
    type: Number
  },
  minimumCambridgeEnglishScore: {
    type: String
  },
  otherEnglishTestsAccepted: {
    type: String
  },
  greRequired: {
    type: Boolean,
    default: false
  },
  greScore: {
    type: String
  },
  gmatRequired: {
    type: Boolean,
    default: false
  },
  gmatScore: {
    type: String
  },
  satRequired: {
    type: Boolean,
    default: false
  },
  satScore: {
    type: String
  },
  actRequired: {
    type: Boolean,
    default: false
  },
  actScore: {
    type: String
  },
  waiverOptions: {
    type: String
  },
  partnerCourse: {
    type: Boolean,
    default: false
  },
  ftRanking2024: {
    type: Number
  },
  acceptanceRate: {
    type: Number
  },
  domesticApplicationDeadline: {
    type: String,
    required: true
  },
  internationalApplicationDeadline: {
    type: String,
    required: true
  },
  courseUrl: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
courseSchema.index({ universityCode: 1, courseLevel: 1 });
courseSchema.index({ disciplineMajor: 1, courseLevel: 1 });
courseSchema.index({ firstYearTuitionFee: 1, courseLevel: 1 });
courseSchema.index({ attendanceType: 1, courseLevel: 1 });

// Text index for full-text search
courseSchema.index({
  courseName: 'text',
  overviewDescription: 'text',
  disciplineMajor: 'text',
  keywords: 'text'
});

// Virtual for formatted tuition fee
courseSchema.virtual('formattedTuitionFee').get(function() {
  return `${this.tuitionFeeCurrency} ${this.firstYearTuitionFee.toLocaleString()}`;
});

// Virtual for duration in years
courseSchema.virtual('durationYears').get(function() {
  return (this.durationMonths / 12).toFixed(1);
});

// Instance method to get course summary
courseSchema.methods.getSummary = function() {
  return {
    id: this.uniqueId,
    name: this.courseName,
    university: this.universityName,
    level: this.courseLevel,
    duration: `${this.durationMonths} months`,
    tuition: this.formattedTuitionFee,
    attendance: this.attendanceType
  };
};

// Static method to search courses
courseSchema.statics.searchCourses = function(query, filters = {}) {
  const searchQuery = {};
  
  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  // Apply filters
  if (filters.universityCode) {
    searchQuery.universityCode = filters.universityCode;
  }
  
  if (filters.courseLevel) {
    searchQuery.courseLevel = filters.courseLevel;
  }
  
  if (filters.disciplineMajor) {
    searchQuery.disciplineMajor = filters.disciplineMajor;
  }
  
  if (filters.attendanceType) {
    searchQuery.attendanceType = filters.attendanceType;
  }
  
  if (filters.minTuition !== undefined || filters.maxTuition !== undefined) {
    searchQuery.firstYearTuitionFee = {};
    if (filters.minTuition !== undefined) {
      searchQuery.firstYearTuitionFee.$gte = filters.minTuition;
    }
    if (filters.maxTuition !== undefined) {
      searchQuery.firstYearTuitionFee.$lte = filters.maxTuition;
    }
  }
  
  return this.find(searchQuery)
    .sort(query ? { score: { $meta: 'textScore' } } : { courseName: 1 })
    .limit(filters.limit || 50);
};

// Ensure virtual fields are serialized
courseSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Course', courseSchema);
