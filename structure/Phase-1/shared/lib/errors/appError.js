/**
 * Base error class for the Philosophy Service
 * All custom errors should extend this class
 */

const { ERROR_CODES } = require('../../constants/errorCodes');

class AppError extends Error {
  /**
   * Create an application error
   * @param {Object} errorType - Error type from ERROR_CODES
   * @param {string} message - Custom error message (optional)
   * @param {Object} details - Additional error details
   * @param {Error} cause - The original error that caused this error
   */
  constructor(errorType, message = null, details = null, cause = null) {
    // Use custom message if provided, otherwise use default from errorType
    const errorMessage = message || errorType.message;
    
    super(errorMessage);
    
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    
    // Error properties
    this.code = errorType.code;
    this.httpStatus = errorType.httpStatus;
    this.timestamp = new Date().toISOString();
    this.details = details;
    
    // Store the original error if provided
    if (cause) {
      this.cause = cause;
    }
    
    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON representation
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    const json = {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp
    };

    if (this.details) {
      json.details = this.details;
    }

    if (process.env.NODE_ENV === 'development') {
      json.stack = this.stack;
      if (this.cause) {
        json.cause = {
          name: this.cause.name,
          message: this.cause.message,
          stack: this.cause.stack
        };
      }
    }

    return json;
  }

  /**
   * Create error response for HTTP responses
   * @returns {Object} Error response object
   */
  toResponse() {
    return {
      error: this.toJSON()
    };
  }

  /**
   * Check if error is operational (expected) or programming error
   * @returns {boolean} True if operational error
   */
  isOperational() {
    // Most errors extending AppError are operational
    // Override this method in subclasses for different behavior
    return true;
  }

  /**
   * Create an AppError from a generic Error object
   * @param {Error} error - The error to convert
   * @param {Object} defaultErrorType - Default error type if conversion fails
   * @returns {AppError} The converted AppError
   */
  static fromError(error, defaultErrorType = ERROR_CODES.INTERNAL_SERVER_ERROR) {
    // If already an AppError, return as is
    if (error instanceof AppError) {
      return error;
    }

    // Try to determine error type based on error properties
    let errorType = defaultErrorType;
    let details = null;

    // Handle database errors
    if (error.code === 'ECONNREFUSED') {
      errorType = ERROR_CODES.CONNECTION_ERROR;
    } else if (error.code === '23505' || error.code === 11000) {
      // PostgreSQL or MongoDB duplicate key error
      errorType = ERROR_CODES.DUPLICATE_KEY;
      details = { field: error.detail || error.keyValue };
    } else if (error.name === 'ValidationError') {
      errorType = ERROR_CODES.VALIDATION_ERROR;
      details = error.details || error.errors;
    } else if (error.name === 'JsonWebTokenError') {
      errorType = ERROR_CODES.INVALID_TOKEN;
    } else if (error.name === 'TokenExpiredError') {
      errorType = ERROR_CODES.INVALID_TOKEN;
      details = { expired: true };
    }

    return new AppError(errorType, error.message, details, error);
  }

  /**
   * Log the error
   * @param {Object} logger - Logger instance
   * @param {Object} context - Additional context to log
   */
  log(logger, context = {}) {
    const logData = {
      error: this.toJSON(),
      context
    };

    // Log at appropriate level based on HTTP status
    if (this.httpStatus >= 500) {
      logger.error('Application error', logData);
    } else if (this.httpStatus >= 400) {
      logger.warn('Client error', logData);
    } else {
      logger.info('Application error', logData);
    }
  }

  /**
   * Create a new error with additional context
   * @param {Object} additionalDetails - Additional details to add
   * @returns {AppError} New error with combined details
   */
  withDetails(additionalDetails) {
    const combinedDetails = {
      ...this.details,
      ...additionalDetails
    };
    
    return new AppError(
      { code: this.code, message: this.message, httpStatus: this.httpStatus },
      this.message,
      combinedDetails,
      this.cause
    );
  }
}

module.exports = AppError;