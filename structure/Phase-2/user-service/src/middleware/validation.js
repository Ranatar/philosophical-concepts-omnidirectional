/**
 * Validation Middleware
 */

const { ValidationError } = require('../../../shared/lib/errors/HttpErrors');
const { validate } = require('../../../shared/lib/validation/validators');

/**
 * Validate request data against a schema
 * @param {string} location - Request property to validate (body, query, params)
 * @param {Object} schema - Joi schema
 * @returns {Function} Express middleware
 */
const validateRequest = (location, schema) => {
  return (req, res, next) => {
    try {
      if (!req[location]) {
        throw new ValidationError(`Missing ${location} data`);
      }
      
      const validated = validate(req[location], schema);
      
      // Replace request data with validated data
      req[location] = validated;
      
      next();
    } catch (error) {
      // If it's already a ValidationError, pass it through
      if (error instanceof ValidationError) {
        next(error);
      } else {
        // Convert other errors to ValidationError
        next(new ValidationError(error.message));
      }
    }
  };
};

/**
 * Validate UUID parameters
 * @param {string|Array<string>} paramNames - Parameter name(s) to validate
 * @returns {Function} Express middleware
 */
const validateUuidParams = (...paramNames) => {
  return (req, res, next) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const errors = {};
    
    paramNames.forEach(paramName => {
      const value = req.params[paramName];
      
      if (!value) {
        errors[paramName] = [`Parameter '${paramName}' is required`];
      } else if (!uuidRegex.test(value)) {
        errors[paramName] = [`Parameter '${paramName}' must be a valid UUID`];
      }
    });
    
    if (Object.keys(errors).length > 0) {
      return next(new ValidationError('Invalid parameters', errors));
    }
    
    next();
  };
};

/**
 * Sanitize request data
 * @param {string} location - Request property to sanitize (body, query, params)
 * @returns {Function} Express middleware
 */
const sanitizeRequest = (location) => {
  return (req, res, next) => {
    if (!req[location] || typeof req[location] !== 'object') {
      return next();
    }
    
    // Sanitize strings by trimming whitespace
    const sanitize = (obj) => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'string') {
            obj[key] = obj[key].trim();
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitize(obj[key]);
          }
        }
      }
    };
    
    sanitize(req[location]);
    next();
  };
};

/**
 * Validate pagination parameters
 * @returns {Function} Express middleware
 */
const validatePagination = () => {
  return (req, res, next) => {
    const { page, pageSize, limit, offset } = req.query;
    
    // Convert to numbers
    if (page !== undefined) {
      req.query.page = parseInt(page, 10);
      
      if (isNaN(req.query.page) || req.query.page < 1) {
        return next(new ValidationError('Page must be a positive integer'));
      }
    }
    
    if (pageSize !== undefined) {
      req.query.pageSize = parseInt(pageSize, 10);
      
      if (isNaN(req.query.pageSize) || req.query.pageSize < 1 || req.query.pageSize > 100) {
        return next(new ValidationError('Page size must be between 1 and 100'));
      }
    }
    
    if (limit !== undefined) {
      req.query.limit = parseInt(limit, 10);
      
      if (isNaN(req.query.limit) || req.query.limit < 1 || req.query.limit > 100) {
        return next(new ValidationError('Limit must be between 1 and 100'));
      }
    }
    
    if (offset !== undefined) {
      req.query.offset = parseInt(offset, 10);
      
      if (isNaN(req.query.offset) || req.query.offset < 0) {
        return next(new ValidationError('Offset must be a non-negative integer'));
      }
    }
    
    next();
  };
};

/**
 * Validate date parameters
 * @param {Array<string>} dateParams - Date parameter names
 * @returns {Function} Express middleware
 */
const validateDateParams = (...dateParams) => {
  return (req, res, next) => {
    const errors = {};
    
    dateParams.forEach(param => {
      const value = req.query[param] || req.body[param] || req.params[param];
      
      if (value) {
        const date = new Date(value);
        
        if (isNaN(date.getTime())) {
          errors[param] = [`Parameter '${param}' must be a valid date`];
        }
      }
    });
    
    if (Object.keys(errors).length > 0) {
      return next(new ValidationError('Invalid date parameters', errors));
    }
    
    next();
  };
};

/**
 * Check content type
 * @param {string} expectedType - Expected content type
 * @returns {Function} Express middleware
 */
const checkContentType = (expectedType) => {
  return (req, res, next) => {
    const contentType = req.get('content-type');
    
    if (!contentType || !contentType.includes(expectedType)) {
      return next(new ValidationError(
        `Content-Type must be ${expectedType}`,
        { contentType: [`Expected ${expectedType}, got ${contentType || 'none'}`] }
      ));
    }
    
    next();
  };
};

module.exports = {
  validateRequest,
  validateUuidParams,
  sanitizeRequest,
  validatePagination,
  validateDateParams,
  checkContentType
};
