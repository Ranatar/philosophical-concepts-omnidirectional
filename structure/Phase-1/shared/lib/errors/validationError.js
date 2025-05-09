/**
 * Specialized error class for validation errors
 * Extends the basic AppError to provide specific functionality
 * for handling and formatting validation errors
 */

const AppError = require('./AppError');
const errorCodes = require('../../constants/errorCodes');

class ValidationError extends AppError {
  /**
   * Create a new ValidationError
   * @param {string} message - Human-readable error message
   * @param {Object|Array} validationErrors - Validation errors object or array
   * @param {number} [code=errorCodes.VALIDATION_ERROR] - Error code
   * @param {Error} [originalError=null] - Original error if this is a wrapper
   */
  constructor(message = 'Validation Error', validationErrors = {}, code = errorCodes.VALIDATION_ERROR, originalError = null) {
    super(message, code, 422, { validationErrors }, originalError);
    
    this.validationErrors = validationErrors;
  }
  
  /**
   * Add a validation error for a specific field
   * @param {string} field - Field name
   * @param {string} message - Error message
   * @returns {ValidationError} This instance for chaining
   */
  addFieldError(field, message) {
    // Initialize validationErrors as object if it's not already
    if (!this.validationErrors || Array.isArray(this.validationErrors)) {
      this.validationErrors = {};
    }
    
    // Initialize field errors array if needed
    if (!this.validationErrors[field]) {
      this.validationErrors[field] = [];
    }
    
    // Add the error message
    this.validationErrors[field].push(message);
    
    // Update the data property to keep it in sync
    this.data = { validationErrors: this.validationErrors };
    
    return this;
  }
  
  /**
   * Check if there are any validation errors
   * @returns {boolean} True if there are validation errors
   */
  hasErrors() {
    if (Array.isArray(this.validationErrors)) {
      return this.validationErrors.length > 0;
    }
    
    return Object.keys(this.validationErrors || {}).length > 0;
  }
  
  /**
   * Get all errors for a specific field
   * @param {string} field - Field name
   * @returns {Array} Array of error messages for the field
   */
  getFieldErrors(field) {
    if (Array.isArray(this.validationErrors)) {
      return this.validationErrors.filter(error => error.field === field);
    }
    
    return (this.validationErrors && this.validationErrors[field]) || [];
  }
  
  /**
   * Get the first error message for a specific field
   * @param {string} field - Field name
   * @returns {string|null} First error message or null if none
   */
  getFirstFieldError(field) {
    const errors = this.getFieldErrors(field);
    return errors.length > 0 ? (typeof errors[0] === 'string' ? errors[0] : errors[0].message) : null;
  }
  
  /**
   * Create a ValidationError from a Joi validation error
   * @param {Error} joiError - Joi validation error
   * @returns {ValidationError} New ValidationError instance
   */
  static fromJoiError(joiError) {
    const validationErrors = {};
    
    // Process each validation error detail
    if (joiError && joiError.details) {
      joiError.details.forEach(detail => {
        const field = detail.path.join('.');
        
        if (!validationErrors[field]) {
          validationErrors[field] = [];
        }
        
        validationErrors[field].push(detail.message);
      });
    }
    
    return new ValidationError('Validation Error', validationErrors, errorCodes.VALIDATION_ERROR, joiError);
  }
  
  /**
   * Create a ValidationError from a Mongoose validation error
   * @param {Error} mongooseError - Mongoose validation error
   * @returns {ValidationError} New ValidationError instance
   */
  static fromMongooseError(mongooseError) {
    const validationErrors = {};
    
    // Process Mongoose validation errors
    if (mongooseError && mongooseError.errors) {
      Object.keys(mongooseError.errors).forEach(field => {
        validationErrors[field] = [mongooseError.errors[field].message];
      });
    }
    
    return new ValidationError('Validation Error', validationErrors, errorCodes.VALIDATION_ERROR, mongooseError);
  }
  
  /**
   * Create a ValidationError from a Yup validation error
   * @param {Error} yupError - Yup validation error
   * @returns {ValidationError} New ValidationError instance
   */
  static fromYupError(yupError) {
    const validationErrors = {};
    
    // Process Yup validation errors
    if (yupError && yupError.inner) {
      yupError.inner.forEach(error => {
        const field = error.path;
        
        if (!validationErrors[field]) {
          validationErrors[field] = [];
        }
        
        validationErrors[field].push(error.message);
      });
    }
    
    return new ValidationError('Validation Error', validationErrors, errorCodes.VALIDATION_ERROR, yupError);
  }
}

module.exports = ValidationError;
