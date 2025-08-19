const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Validation schemas
const authSchemas = {
  signup: Joi.object({
    username: Joi.string()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  })
};

const courseSchemas = {
  search: Joi.object({
    query: Joi.string().optional(),
    universityCode: Joi.string().optional(),
    courseLevel: Joi.string().valid('Undergraduate', 'Postgraduate', 'Doctorate', 'Diploma', 'Certificate').optional(),
    disciplineMajor: Joi.string().optional(),
    attendanceType: Joi.string().valid('Full-time', 'Part-time', 'Online').optional(),
    minTuition: Joi.number().min(0).optional(),
    maxTuition: Joi.number().min(0).optional(),
    limit: Joi.number().integer().min(1).max(100).optional()
  }),

  upload: Joi.object({
    // This will be handled by multer for file upload
  })
};

const recommendationSchemas = {
  getRecommendations: Joi.object({
    topics: Joi.array().items(Joi.string()).min(1).required()
      .messages({
        'array.min': 'At least one topic is required',
        'any.required': 'Topics are required'
      }),
    skillLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
    duration: Joi.string().valid('short', 'medium', 'long').optional(),
    maxTuition: Joi.number().min(0).optional()
  })
};

module.exports = {
  validate,
  authSchemas,
  courseSchemas,
  recommendationSchemas
};
