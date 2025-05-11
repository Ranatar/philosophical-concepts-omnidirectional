/**
 * User validation schemas
 */

const Joi = require('joi');
const { USER_ACTIVE, USER_INACTIVE, USER_LOCKED } = require('../../../shared/constants/statuses');
const { ROLE_USER, ROLE_ADMIN, ROLE_MODERATOR } = require('../../../shared/constants/roles');

// Schema for creating a new user
const createUserSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),
    
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      'any.required': 'Password is required'
    }),
    
  first_name: Joi.string()
    .max(100)
    .messages({
      'string.max': 'First name cannot exceed 100 characters'
    }),
    
  last_name: Joi.string()
    .max(100)
    .messages({
      'string.max': 'Last name cannot exceed 100 characters'
    }),
    
  role: Joi.string()
    .valid(ROLE_USER, ROLE_ADMIN, ROLE_MODERATOR)
    .default(ROLE_USER)
    .messages({
      'any.only': 'Invalid role'
    }),
    
  status: Joi.string()
    .valid(USER_ACTIVE, USER_INACTIVE, USER_LOCKED)
    .default(USER_ACTIVE)
    .messages({
      'any.only': 'Invalid status'
    }),
    
  settings: Joi.object()
    .default({})
});

// Schema for updating a user
const updateUserSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .messages({
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters'
    }),
    
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
    
  first_name: Joi.string()
    .max(100)
    .allow('')
    .messages({
      'string.max': 'First name cannot exceed 100 characters'
    }),
    
  last_name: Joi.string()
    .max(100)
    .allow('')
    .messages({
      'string.max': 'Last name cannot exceed 100 characters'
    }),
    
  role: Joi.string()
    .valid(ROLE_USER, ROLE_ADMIN, ROLE_MODERATOR)
    .messages({
      'any.only': 'Invalid role'
    }),
    
  status: Joi.string()
    .valid(USER_ACTIVE, USER_INACTIVE, USER_LOCKED)
    .messages({
      'any.only': 'Invalid status'
    }),
    
  settings: Joi.object()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Schema for getting users with filters
const getUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  
  sortBy: Joi.string()
    .valid('username', 'email', 'created_at', 'last_login', 'role', 'status')
    .default('created_at'),
    
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc'),
    
  status: Joi.string()
    .valid(USER_ACTIVE, USER_INACTIVE, USER_LOCKED),
    
  role: Joi.string()
    .valid(ROLE_USER, ROLE_ADMIN, ROLE_MODERATOR),
    
  search: Joi.string()
    .max(100)
    .messages({
      'string.max': 'Search term cannot exceed 100 characters'
    })
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  getUsersSchema
};
