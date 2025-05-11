/**
 * Error Handler Middleware
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { 
  BadRequestError, 
  UnauthorizedError, 
  ForbiddenError, 
  NotFoundError, 
  ConflictError, 
  ValidationError, 
  InternalServerError 
} = require('../../../shared/lib/errors/HttpErrors');

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  defaultLogger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user ? req.user.user_id : undefined
  });

  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Handle known application errors
  if (err instanceof BadRequestError ||
      err instanceof UnauthorizedError ||
      err instanceof ForbiddenError ||
      err instanceof NotFoundError ||
      err instanceof ConflictError ||
      err instanceof ValidationError ||
      err instanceof InternalServerError) {
    
    const errorResponse = {
      success: false,
      error: {
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message
      }
    };

    // Add validation errors if present
    if (err instanceof ValidationError && err.validationErrors) {
      errorResponse.error.details = {
        validationErrors: err.validationErrors
      };
    }

    // Add additional error data if present
    if (err.data && isDevelopment) {
      errorResponse.error.data = err.data;
    }

    // Add stack trace in development
    if (isDevelopment) {
      errorResponse.error.stack = err.stack;
    }

    return res.status(err.statusCode).json(errorResponse);
  }

  // Handle Joi validation errors
  if (err.isJoi) {
    const validationErrors = {};
    
    if (err.details) {
      err.details.forEach(detail => {
        const field = detail.path.join('.');
        if (!validationErrors[field]) {
          validationErrors[field] = [];
        }
        validationErrors[field].push(detail.message);
      });
    }

    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          validationErrors
        }
      }
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token expired'
      }
    });
  }

  // Handle database errors
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Resource already exists'
      }
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid reference'
      }
    });
  }

  // Handle syntax errors in JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid JSON'
      }
    });
  }

  // Default error response
  const errorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? err.message : 'An unexpected error occurred'
    }
  };

  if (isDevelopment) {
    errorResponse.error.stack = err.stack;
  }

  res.status(500).json(errorResponse);
};

/**
 * Not found handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`
    }
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
