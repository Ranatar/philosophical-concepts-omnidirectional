/**
 * Validation error class with extended functionality
 * Provides comprehensive validation error handling
 */

const AppError = require('./AppError');
const { ERROR_CODES } = require('../../constants/errorCodes');

class ValidationError extends AppError {
  /**
   * Create a validation error
   * @param {Array|Object} errors - Validation errors
   * @param {string} message - Custom error message
   */
  constructor(errors, message = 'Validation failed') {
    const details = {
      errors: Array.isArray(errors) ? errors : [errors],
      errorCount: Array.isArray(errors) ? errors.length : 1
    };
    
    super(ERROR_CODES.VALIDATION_ERROR, message, details);
    
    // Store errors for easy access
    this.errors = details.errors;
  }

  /**
   * Add an error to the validation error
   * @param {string} field - Field name
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   * @returns {ValidationError} - Returns this for chaining
   */
  addError(field, message, meta = null) {
    const error = { field, message };
    if (meta) {
      error.meta = meta;
    }
    
    this.errors.push(error);
    this.details.errors = this.errors;
    this.details.errorCount = this.errors.length;
    
    return this;
  }

  /**
   * Check if there are any errors
   * @returns {boolean}
   */
  hasErrors() {
    return this.errors.length > 0;
  }

  /**
   * Get errors for a specific field
   * @param {string} field - Field name
   * @returns {Array} - Array of errors for the field
   */
  getFieldErrors(field) {
    return this.errors.filter(error => error.field === field);
  }

  /**
   * Check if a specific field has errors
   * @param {string} field - Field name
   * @returns {boolean}
   */
  hasFieldError(field) {
    return this.errors.some(error => error.field === field);
  }

  /**
   * Create validation error from Joi validation result
   * @param {Object} joiError - Joi validation error
   * @returns {ValidationError}
   */
  static fromJoi(joiError) {
    const errors = joiError.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type,
      meta: detail.context
    }));
    
    return new ValidationError(errors, 'Validation failed');
  }

  /**
   * Create validation error for missing required fields
   * @param {string[]} fields - Array of missing field names
   * @returns {ValidationError}
   */
  static missingFields(fields) {
    const errors = fields.map(field => ({
      field,
      message: `${field} is required`,
      type: 'required'
    }));
    
    return new ValidationError(errors, 'Missing required fields');
  }

  /**
   * Create validation error for invalid field format
   * @param {string} field - Field name
   * @param {string} expectedFormat - Expected format description
   * @param {*} value - The invalid value (optional)
   * @returns {ValidationError}
   */
  static invalidFormat(field, expectedFormat, value = null) {
    const error = {
      field,
      message: `Invalid format for ${field}. Expected: ${expectedFormat}`,
      type: 'format'
    };
    
    if (value !== null && process.env.NODE_ENV === 'development') {
      error.meta = { providedValue: value };
    }
    
    return new ValidationError([error], 'Invalid field format');
  }

  /**
   * Create validation error for value out of range
   * @param {string} field - Field name
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} value - The provided value
   * @returns {ValidationError}
   */
  static outOfRange(field, min, max, value) {
    const error = {
      field,
      message: `${field} must be between ${min} and ${max}`,
      type: 'range',
      meta: { min, max, providedValue: value }
    };
    
    return new ValidationError([error], 'Value out of range');
  }

  /**
   * Create validation error for invalid enum value
   * @param {string} field - Field name
   * @param {Array} validValues - Array of valid values
   * @param {*} value - The invalid value
   * @returns {ValidationError}
   */
  static invalidEnum(field, validValues, value) {
    const error = {
      field,
      message: `${field} must be one of: ${validValues.join(', ')}`,
      type: 'enum',
      meta: { 
        validValues, 
        providedValue: process.env.NODE_ENV === 'development' ? value : undefined 
      }
    };
    
    return new ValidationError([error], 'Invalid enum value');
  }

  /**
   * Create validation error for string length
   * @param {string} field - Field name
   * @param {number} minLength - Minimum length
   * @param {number} maxLength - Maximum length
   * @param {number} actualLength - Actual length
   * @returns {ValidationError}
   */
  static invalidLength(field, minLength, maxLength, actualLength) {
    let message;
    if (minLength && maxLength) {
      message = `${field} must be between ${minLength} and ${maxLength} characters`;
    } else if (minLength) {
      message = `${field} must be at least ${minLength} characters`;
    } else {
      message = `${field} must be at most ${maxLength} characters`;
    }
    
    const error = {
      field,
      message,
      type: 'length',
      meta: { minLength, maxLength, actualLength }
    };
    
    return new ValidationError([error], 'Invalid field length');
  }

  /**
   * Create validation error for invalid UUID
   * @param {string} field - Field name
   * @param {string} value - The invalid value
   * @returns {ValidationError}
   */
  static invalidUUID(field, value) {
    const error = {
      field,
      message: `${field} must be a valid UUID`,
      type: 'uuid',
      meta: process.env.NODE_ENV === 'development' ? { providedValue: value } : {}
    };
    
    return new ValidationError([error], 'Invalid UUID format');
  }

  /**
   * Create validation error for invalid email
   * @param {string} field - Field name
   * @param {string} value - The invalid value
   * @returns {ValidationError}
   */
  static invalidEmail(field, value) {
    const error = {
      field,
      message: `${field} must be a valid email address`,
      type: 'email',
      meta: process.env.NODE_ENV === 'development' ? { providedValue: value } : {}
    };
    
    return new ValidationError([error], 'Invalid email format');
  }

  /**
   * Create validation error for business rule violation
   * @param {string} rule - Business rule description
   * @param {Object} context - Context of the violation
   * @returns {ValidationError}
   */
  static businessRule(rule, context = null) {
    const error = {
      field: 'business_rule',
      message: rule,
      type: 'business_rule',
      meta: context
    };
    
    return new ValidationError([error], 'Business rule violation');
  }

  /**
   * Merge multiple validation errors into one
   * @param {...ValidationError} errors - Validation errors to merge
   * @returns {ValidationError}
   */
  static merge(...errors) {
    const allErrors = [];
    
    for (const error of errors) {
      if (error instanceof ValidationError) {
        allErrors.push(...error.errors);
      }
    }
    
    return new ValidationError(allErrors, 'Multiple validation errors');
  }
}

module.exports = ValidationError;