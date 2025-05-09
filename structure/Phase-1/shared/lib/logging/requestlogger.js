/**
 * HTTP request logging middleware
 * Provides standardized request logging for Express applications
 */

const { defaultLogger, createChildLogger } = require('./logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate and attach a request ID if one doesn't exist
 * @param {Object} req - Express request object
 * @returns {string} Request ID
 */
function getOrCreateRequestId(req) {
  if (!req.id) {
    req.id = req.headers['x-request-id'] || uuidv4();
  }
  
  return req.id;
}

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Sanitize sensitive request data for logging
 * @param {Object} req - Express request object
 * @returns {Object} Sanitized request data
 */
function sanitizeRequest(req) {
  const sanitized = {
    method: req.method,
    url: req.originalUrl || req.url,
    params: { ...req.params },
    query: { ...req.query },
    headers: { ...req.headers },
    body: { ...req.body }
  };
  
  // Remove sensitive headers
  const sensitiveHeaders = ['authorization', 'cookie', 'x-auth-token'];
  sensitiveHeaders.forEach(header => {
    if (sanitized.headers[header]) {
      sanitized.headers[header] = '[REDACTED]';
    }
  });
  
  // Remove sensitive fields from body
  const sensitiveFields = ['password', 'token', 'key', 'secret', 'apiKey', 'apiSecret'];
  if (typeof sanitized.body === 'object' && sanitized.body !== null) {
    Object.keys(sanitized.body).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized.body[key] = '[REDACTED]';
      }
    });
  }
  
  return sanitized;
}

/**
 * Create a request logger middleware
 * @param {Object} options - Configuration options
 * @param {winston.Logger} [options.logger=defaultLogger] - Logger instance
 * @param {boolean} [options.logBody=true] - Whether to log request body
 * @param {boolean} [options.logResponse=false] - Whether to log response body
 * @param {number} [options.maxBodyLength=1000] - Maximum body length to log
 * @returns {Function} Express middleware function
 */
function createRequestLogger({
  logger = defaultLogger,
  logBody = true,
  logResponse = false,
  maxBodyLength = 1000
} = {}) {
  return function requestLogger(req, res, next) {
    // Generate or get request ID
    const requestId = getOrCreateRequestId(req);
    
    // Set request ID in response header
    res.setHeader('X-Request-ID', requestId);
    
    // Create child logger with request context
    const requestLogger = createChildLogger({
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: getClientIp(req)
    }, logger);
    
    // Attach logger to request for use in other middlewares/routes
    req.logger = requestLogger;
    
    // Record request start time
    const startTime = process.hrtime();
    
    // Log request
    const sanitizedReq = sanitizeRequest(req);
    let requestLog = {
      message: `Request started: ${req.method} ${req.originalUrl || req.url}`,
      params: sanitizedReq.params,
      query: sanitizedReq.query
    };
    
    // Include body if configured to do so
    if (logBody && req.body) {
      let bodyStr = JSON.stringify(sanitizedReq.body);
      if (bodyStr.length > maxBodyLength) {
        bodyStr = bodyStr.substring(0, maxBodyLength) + '... [truncated]';
      }
      
      requestLog.body = JSON.parse(bodyStr);
    }
    
    requestLogger.info(requestLog);
    
    // Capture response data if configured
    if (logResponse) {
      const originalSend = res.send;
      res.send = function(body) {
        res.responseBody = body;
        return originalSend.apply(res, arguments);
      };
    }
    
    // Log on response finish
    res.on('finish', () => {
      // Calculate request duration
      const hrDuration = process.hrtime(startTime);
      const durationMs = (hrDuration[0] * 1000) + (hrDuration[1] / 1000000);
      
      let responseLog = {
        message: `Request completed: ${req.method} ${req.originalUrl || req.url}`,
        statusCode: res.statusCode,
        duration: durationMs.toFixed(2) + 'ms'
      };
      
      // Include response body if configured
      if (logResponse && res.responseBody) {
        try {
          let responseBody = typeof res.responseBody === 'string' 
            ? JSON.parse(res.responseBody) 
            : res.responseBody;
            
          let bodyStr = JSON.stringify(responseBody);
          if (bodyStr.length > maxBodyLength) {
            bodyStr = bodyStr.substring(0, maxBodyLength) + '... [truncated]';
          }
          
          responseLog.body = JSON.parse(bodyStr);
        } catch (err) {
          // If response is not JSON, include as string
          let respStr = String(res.responseBody);
          if (respStr.length > maxBodyLength) {
            respStr = respStr.substring(0, maxBodyLength) + '... [truncated]';
          }
          
          responseLog.body = respStr;
        }
      }
      
      // Log at appropriate level based on status code
      if (res.statusCode >= 500) {
        requestLogger.error(responseLog);
      } else if (res.statusCode >= 400) {
        requestLogger.warn(responseLog);
      } else {
        requestLogger.info(responseLog);
      }
    });
    
    next();
  };
}

module.exports = {
  createRequestLogger
};
