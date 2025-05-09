/**
 * Response formatter for API responses
 * Provides standardized formatting for all API responses
 */

const AppError = require('../errors/AppError');
const errorCodes = require('../../constants/errorCodes');

/**
 * Format a successful response
 * @param {*} data - Response data
 * @param {Object} [meta={}] - Additional metadata
 * @param {string} [message] - Success message
 * @returns {Object} Formatted success response
 */
function success(data, meta = {}, message) {
  const response = {
    success: true,
    data
  };
  
  if (message) {
    response.message = message;
  }
  
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }
  
  return response;
}

/**
 * Format a paginated response
 * @param {Array} data - Paginated data
 * @param {Object} pagination - Pagination information
 * @param {number} pagination.total - Total number of items
 * @param {number} pagination.page - Current page number
 * @param {number} pagination.pageSize - Page size
 * @param {number} [pagination.pageCount] - Total number of pages
 * @param {Object} [meta={}] - Additional metadata
 * @param {string} [message] - Success message
 * @returns {Object} Formatted paginated response
 */
function paginated(data, pagination, meta = {}, message) {
  const pageCount = pagination.pageCount || 
    Math.ceil(pagination.total / pagination.pageSize);
  
  return success(
    data,
    {
      pagination: {
        total: pagination.total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        pageCount
      },
      ...meta
    },
    message
  );
}

/**
 * Format an error response
 * @param {Error|AppError} error - Error object
 * @param {Object} [meta={}] - Additional metadata
 * @returns {Object} Formatted error response
 */
function error(error, meta = {}) {
  // If it's an AppError, use its properties
  if (error instanceof AppError) {
    const response = {
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    };
    
    if (error.data) {
      response.error.details = error.data;
    }
    
    if (Object.keys(meta).length > 0) {
      response.meta = meta;
    }
    
    return response;
  }
  
  // Otherwise, create a generic error response
  const response = {
    success: false,
    error: {
      code: errorCodes.UNKNOWN_ERROR,
      message: error.message || 'An unexpected error occurred'
    }
  };
  
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }
  
  return response;
}

/**
 * Format a validation error response
 * @param {Object|Array} validationErrors - Validation errors
 * @param {string} [message='Validation failed'] - Error message
 * @param {Object} [meta={}] - Additional metadata
 * @returns {Object} Formatted validation error response
 */
function validationError(validationErrors, message = 'Validation failed', meta = {}) {
  const response = {
    success: false,
    error: {
      code: errorCodes.VALIDATION_ERROR,
      message,
      details: {
        validationErrors
      }
    }
  };
  
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }
  
  return response;
}

/**
 * Format a not found error response
 * @param {string} [resource='Resource'] - Resource type that was not found
 * @param {string|number} [identifier] - Resource identifier
 * @param {Object} [meta={}] - Additional metadata
 * @returns {Object} Formatted not found error response
 */
function notFound(resource = 'Resource', identifier, meta = {}) {
  const message = identifier
    ? `${resource} with identifier '${identifier}' not found`
    : `${resource} not found`;
  
  const response = {
    success: false,
    error: {
      code: errorCodes.NOT_FOUND,
      message
    }
  };
  
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }
  
  return response;
}

/**
 * Format an unauthorized error response
 * @param {string} [message='Unauthorized'] - Error message
 * @param {Object} [meta={}] - Additional metadata
 * @returns {Object} Formatted unauthorized error response
 */
function unauthorized(message = 'Unauthorized', meta = {}) {
  const response = {
    success: false,
    error: {
      code: errorCodes.UNAUTHORIZED,
      message
    }
  };
  
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }
  
  return response;
}

/**
 * Format a forbidden error response
 * @param {string} [message='Forbidden'] - Error message
 * @param {Object} [meta={}] - Additional metadata
 * @returns {Object} Formatted forbidden error response
 */
function forbidden(message = 'Forbidden', meta = {}) {
  const response = {
    success: false,
    error: {
      code: errorCodes.FORBIDDEN,
      message
    }
  };
  
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }
  
  return response;
}

/**
 * Format a conflict error response
 * @param {string} [message='Conflict'] - Error message
 * @param {Object} [meta={}] - Additional metadata
 * @returns {Object} Formatted conflict error response
 */
function conflict(message = 'Conflict', meta = {}) {
  const response = {
    success: false,
    error: {
      code: errorCodes.CONFLICT,
      message
    }
  };
  
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }
  
  return response;
}

/**
 * Format a service unavailable error response
 * @param {string} [message='Service unavailable'] - Error message
 * @param {Object} [meta={}] - Additional metadata
 * @returns {Object} Formatted service unavailable error response
 */
function serviceUnavailable(message = 'Service unavailable', meta = {}) {
  const response = {
    success: false,
    error: {
      code: errorCodes.SERVICE_UNAVAILABLE,
      message
    }
  };
  
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }
  
  return response;
}

/**
 * Create an Express middleware to format responses
 * @returns {Function} Express middleware function
 */
function createResponseFormatter() {
  return function responseFormatter(req, res, next) {
    // Add format methods to res object
    
    /**
     * Send a success response
     * @param {*} data - Response data
     * @param {Object} [meta={}] - Additional metadata
     * @param {string} [message] - Success message
     * @returns {Object} Express response
     */
    res.sendSuccess = function(data, meta = {}, message) {
      return res.json(success(data, meta, message));
    };
    
    /**
     * Send a paginated response
     * @param {Array} data - Paginated data
     * @param {Object} pagination - Pagination information
     * @param {Object} [meta={}] - Additional metadata
     * @param {string} [message] - Success message
     * @returns {Object} Express response
     */
    res.sendPaginated = function(data, pagination, meta = {}, message) {
      return res.json(paginated(data, pagination, meta, message));
    };
    
    /**
     * Send an error response
     * @param {Error|AppError} error - Error object
     * @param {Object} [meta={}] - Additional metadata
     * @returns {Object} Express response
     */
    res.sendError = function(error, meta = {}) {
      const statusCode = error instanceof AppError ? error.statusCode : 500;
      return res.status(statusCode).json(error(error, meta));
    };
    
    /**
     * Send a validation error response
     * @param {Object|Array} validationErrors - Validation errors
     * @param {string} [message='Validation failed'] - Error message
     * @param {Object} [meta={}] - Additional metadata
     * @returns {Object} Express response
     */
    res.sendValidationError = function(validationErrors, message = 'Validation failed', meta = {}) {
      return res.status(422).json(validationError(validationErrors, message, meta));
    };
    
    /**
     * Send a not found error response
     * @param {string} [resource='Resource'] - Resource type that was not found
     * @param {string|number} [identifier] - Resource identifier
     * @param {Object} [meta={}] - Additional metadata
     * @returns {Object} Express response
     */
    res.sendNotFound = function(resource = 'Resource', identifier, meta = {}) {
      return res.status(404).json(notFound(resource, identifier, meta));
    };
    
    /**
     * Send an unauthorized error response
     * @param {string} [message='Unauthorized'] - Error message
     * @param {Object} [meta={}] - Additional metadata
     * @returns {Object} Express response
     */
    res.sendUnauthorized = function(message = 'Unauthorized', meta = {}) {
      return res.status(401).json(unauthorized(message, meta));
    };
    
    /**
     * Send a forbidden error response
     * @param {string} [message='Forbidden'] - Error message
     * @param {Object} [meta={}] - Additional metadata
     * @returns {Object} Express response
     */
    res.sendForbidden = function(message = 'Forbidden', meta = {}) {
      return res.status(403).json(forbidden(message, meta));
    };
    
    /**
     * Send a conflict error response
     * @param {string} [message='Conflict'] - Error message
     * @param {Object} [meta={}] - Additional metadata
     * @returns {Object} Express response
     */
    res.sendConflict = function(message = 'Conflict', meta = {}) {
      return res.status(409).json(conflict(message, meta));
    };
    
    /**
     * Send a service unavailable error response
     * @param {string} [message='Service unavailable'] - Error message
     * @param {Object} [meta={}] - Additional metadata
     * @returns {Object} Express response
     */
    res.sendServiceUnavailable = function(message = 'Service unavailable', meta = {}) {
      return res.status(503).json(serviceUnavailable(message, meta));
    };
    
    next();
  };
}

module.exports = {
  success,
  paginated,
  error,
  validationError,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  serviceUnavailable,
  createResponseFormatter
};
