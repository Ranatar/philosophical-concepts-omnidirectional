/**
 * HTTP-specific error classes that extend the base AppError
 * Provide standardized error types for common HTTP error scenarios
 */

const AppError = require('./AppError');
const errorCodes = require('../../constants/errorCodes');

/**
 * 400 Bad Request error
 * Used when the request is malformed or invalid
 */
class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code = errorCodes.BAD_REQUEST, data = null, originalError = null) {
    super(message, code, 400, data, originalError);
  }
}

/**
 * 401 Unauthorized error
 * Used when authentication is required and has failed or not been provided
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = errorCodes.UNAUTHORIZED, data = null, originalError = null) {
    super(message, code, 401, data, originalError);
  }
}

/**
 * 403 Forbidden error
 * Used when the user is authenticated but doesn't have permission to access the resource
 */
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = errorCodes.FORBIDDEN, data = null, originalError = null) {
    super(message, code, 403, data, originalError);
  }
}

/**
 * 404 Not Found error
 * Used when the requested resource could not be found
 */
class NotFoundError extends AppError {
  constructor(message = 'Not Found', code = errorCodes.NOT_FOUND, data = null, originalError = null) {
    super(message, code, 404, data, originalError);
  }
}

/**
 * 409 Conflict error
 * Used when the request could not be completed due to a conflict with the current state of the resource
 */
class ConflictError extends AppError {
  constructor(message = 'Conflict', code = errorCodes.CONFLICT, data = null, originalError = null) {
    super(message, code, 409, data, originalError);
  }
}

/**
 * 422 Unprocessable Entity error
 * Used when the request was well-formed but contains semantic errors
 */
class ValidationError extends AppError {
  constructor(message = 'Validation Error', code = errorCodes.VALIDATION_ERROR, data = null, originalError = null) {
    super(message, code, 422, data, originalError);
  }
}

/**
 * 429 Too Many Requests error
 * Used when the user has sent too many requests in a given amount of time
 */
class TooManyRequestsError extends AppError {
  constructor(message = 'Too Many Requests', code = errorCodes.TIMEOUT, data = null, originalError = null) {
    super(message, code, 429, data, originalError);
  }
}

/**
 * 500 Internal Server Error
 * Used for unexpected server errors
 */
class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', code = errorCodes.INTERNAL_SERVER_ERROR, data = null, originalError = null) {
    super(message, code, 500, data, originalError);
  }
}

/**
 * 503 Service Unavailable error
 * Used when the server is not ready to handle the request
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service Unavailable', code = errorCodes.SERVICE_UNAVAILABLE, data = null, originalError = null) {
    super(message, code, 503, data, originalError);
  }
}

/**
 * Create appropriate HTTP error from status code
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {number} [code] - Error code from errorCodes constant
 * @param {Object} [data] - Additional error data
 * @returns {AppError} Appropriate error instance
 */
function createHttpError(statusCode, message, code, data) {
  switch (statusCode) {
    case 400:
      return new BadRequestError(message, code, data);
    case 401:
      return new UnauthorizedError(message, code, data);
    case 403:
      return new ForbiddenError(message, code, data);
    case 404:
      return new NotFoundError(message, code, data);
    case 409:
      return new ConflictError(message, code, data);
    case 422:
      return new ValidationError(message, code, data);
    case 429:
      return new TooManyRequestsError(message, code, data);
    case 503:
      return new ServiceUnavailableError(message, code, data);
    default:
      return new InternalServerError(message, code, data);
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
  createHttpError
};
