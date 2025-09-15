/**
 * HTTP-specific error classes for the Philosophy Service
 * These provide convenient shortcuts for common HTTP errors
 */

const AppError = require('./AppError');
const { ERROR_CODES } = require('../../constants/errorCodes');

/**
 * BadRequestError - 400
 */
class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details = null) {
    super(ERROR_CODES.BAD_REQUEST, message, details);
  }
}

/**
 * UnauthorizedError - 401
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details = null) {
    super(ERROR_CODES.UNAUTHORIZED, message, details);
  }
}

/**
 * ForbiddenError - 403
 */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details = null) {
    super(ERROR_CODES.INSUFFICIENT_PERMISSIONS, message, details);
  }
}

/**
 * NotFoundError - 404
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource', id = null) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    const details = id ? { resource, id } : { resource };
    super(ERROR_CODES.NOT_FOUND, message, details);
  }
}

/**
 * ConflictError - 409
 */
class ConflictError extends AppError {
  constructor(message = 'Conflict', details = null) {
    super(ERROR_CODES.DUPLICATE_KEY, message, details);
  }
}

/**
 * ValidationError - 400
 */
class ValidationError extends AppError {
  constructor(errors, message = 'Validation failed') {
    const details = Array.isArray(errors) ? { errors } : errors;
    super(ERROR_CODES.VALIDATION_ERROR, message, details);
  }

  /**
   * Create validation error for missing required fields
   * @param {string[]} fields - Array of missing field names
   * @returns {ValidationError}
   */
  static missingFields(fields) {
    const errors = fields.map(field => ({
      field,
      message: `${field} is required`
    }));
    return new ValidationError(errors, 'Missing required fields');
  }

  /**
   * Create validation error for invalid field values
   * @param {Object} fieldErrors - Object with field names as keys and error messages as values
   * @returns {ValidationError}
   */
  static invalidFields(fieldErrors) {
    const errors = Object.entries(fieldErrors).map(([field, message]) => ({
      field,
      message
    }));
    return new ValidationError(errors, 'Invalid field values');
  }
}

/**
 * TooManyRequestsError - 429
 */
class TooManyRequestsError extends AppError {
  constructor(retryAfter = null) {
    const message = 'Too many requests';
    const details = retryAfter ? { retryAfter } : null;
    super(ERROR_CODES.CLAUDE_RATE_LIMIT, message, details);
  }
}

/**
 * InternalServerError - 500
 */
class InternalServerError extends AppError {
  constructor(message = 'Internal server error', cause = null) {
    super(ERROR_CODES.INTERNAL_SERVER_ERROR, message, null, cause);
  }
}

/**
 * ServiceUnavailableError - 503
 */
class ServiceUnavailableError extends AppError {
  constructor(service = null, retryAfter = null) {
    const message = service ? `${service} is temporarily unavailable` : 'Service temporarily unavailable';
    const details = { service, retryAfter };
    super(ERROR_CODES.SERVICE_UNAVAILABLE, message, details);
  }
}

/**
 * GatewayTimeoutError - 504
 */
class GatewayTimeoutError extends AppError {
  constructor(service = null) {
    const message = service ? `${service} request timeout` : 'Gateway timeout';
    const details = service ? { service } : null;
    super(ERROR_CODES.CLAUDE_TIMEOUT, message, details);
  }
}

/**
 * NotImplementedError - 501
 */
class NotImplementedError extends AppError {
  constructor(feature = null) {
    const message = feature ? `${feature} is not implemented` : 'Not implemented';
    const details = feature ? { feature } : null;
    super(ERROR_CODES.NOT_IMPLEMENTED, message, details);
  }
}

/**
 * Helper function to create appropriate HTTP error based on status code
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} details - Error details
 * @returns {AppError} Appropriate error instance
 */
function createHttpError(statusCode, message = null, details = null) {
  switch (statusCode) {
    case 400:
      return new BadRequestError(message, details);
    case 401:
      return new UnauthorizedError(message, details);
    case 403:
      return new ForbiddenError(message, details);
    case 404:
      return new NotFoundError(message, details);
    case 409:
      return new ConflictError(message, details);
    case 429:
      return new TooManyRequestsError(details?.retryAfter);
    case 500:
      return new InternalServerError(message);
    case 501:
      return new NotImplementedError(message);
    case 503:
      return new ServiceUnavailableError(message, details?.retryAfter);
    case 504:
      return new GatewayTimeoutError(message);
    default:
      if (statusCode >= 400 && statusCode < 500) {
        return new BadRequestError(message || `Client error: ${statusCode}`, details);
      } else if (statusCode >= 500) {
        return new InternalServerError(message || `Server error: ${statusCode}`);
      }
      return new AppError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        message || `Unexpected status code: ${statusCode}`,
        details
      );
  }
}

module.exports = {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,
  ServiceUnavailableError,
  GatewayTimeoutError,
  NotImplementedError,
  createHttpError
};