/**
 * Base error class for all application errors
 * Extends the native Error class with additional properties
 * to provide consistent error handling across the application
 */

const errorCodes = require('../../constants/errorCodes');

class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} message - Human-readable error message
   * @param {number} code - Error code from errorCodes constant
   * @param {number} [statusCode=500] - HTTP status code
   * @param {Object} [data=null] - Additional error data
   * @param {Error} [originalError=null] - Original error if this is a wrapper
   */
  constructor(message, code, statusCode = 500, data = null, originalError = null) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code || errorCodes.UNKNOWN_ERROR;
    this.statusCode = statusCode;
    this.data = data;
    this.originalError = originalError;
    this.timestamp = new Date();
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    // If we're wrapping an original error, append its stack
    if (originalError && originalError.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
  
  /**
   * Converts the error to a plain object that can be serialized to JSON
   * @returns {Object} Serialized error object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      data: this.data,
      timestamp: this.timestamp,
      // Don't include stack trace in production for security reasons
      stack: process.env.NODE_ENV === 'production' ? undefined : this.stack
    };
  }
  
  /**
   * Creates a copy of the error with additional data
   * @param {Object} additionalData - Data to add to the error
   * @returns {AppError} New error instance with combined data
   */
  withData(additionalData) {
    const newData = {
      ...(this.data || {}),
      ...(additionalData || {})
    };
    
    return new this.constructor(
      this.message,
      this.code,
      this.statusCode,
      newData,
      this.originalError
    );
  }
  
  /**
   * Creates a new error that wraps the current one
   * @param {string} message - New error message
   * @param {number} [code] - New error code (defaults to current code)
   * @param {number} [statusCode] - New status code (defaults to current status code)
   * @returns {AppError} New error instance that wraps this one
   */
  wrap(message, code, statusCode) {
    return new AppError(
      message,
      code || this.code,
      statusCode || this.statusCode,
      this.data,
      this
    );
  }
}

module.exports = AppError;
