/**
 * Validation utilities for data validation
 */

const Joi = require('joi');
const ValidationError = require('../errors/ValidationError');

/**
 * Convert a Joi validation error to a ValidationError
 * @param {Error} joiError - Joi validation error
 * @returns {ValidationError} ValidationError instance
 */
function joiToValidationError(joiError) {
  return ValidationError.fromJoiError(joiError);
}

/**
 * Validate data against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema
 * @param {Object} [options={}] - Joi validation options
 * @returns {Object} Validated data
 * @throws {ValidationError} If validation fails
 */
function validate(data, schema, options = {}) {
  const defaultOptions = {
    abortEarly: false,
    stripUnknown: true,
    presence: 'required'
  };
  
  const validationOptions = { ...defaultOptions, ...options };
  
  const { error, value } = schema.validate(data, validationOptions);
  
  if (error) {
    throw joiToValidationError(error);
  }
  
  return value;
}

/**
 * Common validation schemas
 */
const schemas = {
  id: Joi.string().uuid(),
  
  name: Joi.string().min(1).max(255),
  
  email: Joi.string().email(),
  
  username: Joi.string().alphanum().min(3).max(30),
  
  password: Joi.string().min(8).max(100).pattern(
    new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])')
  ).message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  uuid: Joi.string().uuid(),
  
  date: Joi.date().iso(),
  
  timestamp: Joi.date().timestamp(),
  
  integer: Joi.number().integer(),
  
  positiveInteger: Joi.number().integer().positive(),
  
  nonNegativeInteger: Joi.number().integer().min(0),
  
  float: Joi.number(),
  
  positiveFloat: Joi.number().positive(),
  
  nonNegativeFloat: Joi.number().min(0),
  
  boolean: Joi.boolean(),
  
  array: Joi.array(),
  
  object: Joi.object(),
  
  string: Joi.string(),
  
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(20)
  }),
  
  sorting: Joi.object({
    field: Joi.string().required(),
    direction: Joi.string().valid('asc', 'desc').default('asc')
  }),
  
  /**
   * Create a schema for ID validation
   * @param {string} idName - ID field name
   * @returns {Object} Joi schema
   */
  idSchema: (idName) => {
    const schema = {};
    schema[idName] = Joi.string().uuid().required();
    return Joi.object(schema);
  }
};

/**
 * Common validation patterns for fields
 */
const patterns = {
  /**
   * Validate a UUID
   * @param {string} uuid - UUID to validate
   * @returns {boolean} Whether the UUID is valid
   */
  isUuid: (uuid) => {
    if (!uuid) return false;
    
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(uuid);
  },
  
  /**
   * Validate an email address
   * @param {string} email - Email address to validate
   * @returns {boolean} Whether the email is valid
   */
  isEmail: (email) => {
    if (!email) return false;
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  },
  
  /**
   * Validate a strong password
   * @param {string} password - Password to validate
   * @returns {boolean} Whether the password is strong
   */
  isStrongPassword: (password) => {
    if (!password) return false;
    
    // At least 8 characters, with at least one uppercase, one lowercase, one number, and one special character
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    return passwordPattern.test(password);
  },
  
  /**
   * Check if a value is a valid date
   * @param {*} date - Date to validate
   * @returns {boolean} Whether the date is valid
   */
  isValidDate: (date) => {
    if (!date) return false;
    
    const d = new Date(date);
    return !isNaN(d.getTime());
  },
  
  /**
   * Check if a value is a valid integer
   * @param {*} value - Value to validate
   * @returns {boolean} Whether the value is a valid integer
   */
  isInteger: (value) => {
    if (value === null || value === undefined) return false;
    
    return Number.isInteger(Number(value));
  },
  
  /**
   * Check if a value is a valid number
   * @param {*} value - Value to validate
   * @returns {boolean} Whether the value is a valid number
   */
  isNumber: (value) => {
    if (value === null || value === undefined) return false;
    
    const num = Number(value);
    return !isNaN(num);
  },
  
  /**
   * Check if a value is a non-empty string
   * @param {*} value - Value to validate
   * @returns {boolean} Whether the value is a non-empty string
   */
  isNonEmptyString: (value) => {
    if (value === null || value === undefined) return false;
    
    return typeof value === 'string' && value.trim().length > 0;
  },
  
  /**
   * Check if a value is an array
   * @param {*} value - Value to validate
   * @returns {boolean} Whether the value is an array
   */
  isArray: (value) => {
    return Array.isArray(value);
  },
  
  /**
   * Check if a value is an object
   * @param {*} value - Value to validate
   * @returns {boolean} Whether the value is an object
   */
  isObject: (value) => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  },
  
  /**
   * Check if a value is a boolean
   * @param {*} value - Value to validate
   * @returns {boolean} Whether the value is a boolean
   */
  isBoolean: (value) => {
    return typeof value === 'boolean';
  }
};

module.exports = {
  validate,
  joiToValidationError,
  schemas,
  patterns
};
