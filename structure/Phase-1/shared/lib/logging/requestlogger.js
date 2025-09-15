/**
 * Request logging middleware for the Philosophy Service
 * Provides detailed logging of HTTP requests and responses
 */

const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('./logger');

/**
 * Generate a unique request ID
 * @returns {string} UUID v4
 */
function generateRequestId() {
  return uuidv4();
}

/**
 * Custom token to get request ID
 */
morgan.token('request-id', (req) => req.id);

/**
 * Custom token to get user ID if authenticated
 */
morgan.token('user-id', (req) => req.user?.user_id || 'anonymous');

/**
 * Custom token to get response time in milliseconds
 */
morgan.token('response-time-ms', (req, res) => {
  if (!req._startTime) return '0';
  const diff = process.hrtime(req._startTime);
  const ms = diff[0] * 1e3 + diff[1] * 1e-6;
  return ms.toFixed(3);
});

/**
 * Custom token to get request body (sanitized)
 */
morgan.token('body', (req) => {
  if (!req.body || Object.keys(req.body).length === 0) return '-';
  
  // Sanitize sensitive data
  const sanitized = { ...req.body };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return JSON.stringify(sanitized);
});

/**
 * Custom token to get query parameters
 */
morgan.token('query', (req) => {
  if (!req.query || Object.keys(req.query).length === 0) return '-';
  return JSON.stringify(req.query);
});

/**
 * Custom token to get error message if any
 */
morgan.token('error-message', (req, res) => {
  return res.locals.errorMessage || '-';
});

/**
 * Custom token to get service name
 */
morgan.token('service', (req) => {
  return req.app.get('service-name') || 'unknown-service';
});

/**
 * Create custom Morgan format for structured logging
 */
const structuredFormat = (tokens, req, res) => {
  const log = {
    timestamp: new Date().toISOString(),
    requestId: tokens['request-id'](req, res),
    service: tokens['service'](req, res),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(tokens.status(req, res)),
    contentLength: tokens.res(req, res, 'content-length') || '0',
    responseTime: parseFloat(tokens['response-time-ms'](req, res)),
    userAgent: tokens['user-agent'](req, res),
    ip: tokens['remote-addr'](req, res),
    userId: tokens['user-id'](req, res),
    referrer: tokens.referrer(req, res) || '-',
    httpVersion: tokens['http-version'](req, res),
    query: tokens.query(req, res),
    body: process.env.LOG_REQUEST_BODY === 'true' ? tokens.body(req, res) : '-',
    error: tokens['error-message'](req, res)
  };

  return JSON.stringify(log);
};

/**
 * Create request logging middleware
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
function createRequestLogger(options = {}) {
  const {
    skip = false,
    skipPaths = ['/health', '/metrics', '/favicon.ico'],
    skipMethods = ['OPTIONS'],
    logBody = process.env.LOG_REQUEST_BODY === 'true',
    immediate = false
  } = options;

  // Skip function
  const skipFunction = (req, res) => {
    if (skip) return true;
    if (skipMethods.includes(req.method)) return true;
    if (skipPaths.some(path => req.path.startsWith(path))) return true;
    return false;
  };

  // Create Morgan middleware with custom format
  const morganMiddleware = morgan(structuredFormat, {
    skip: skipFunction,
    immediate,
    stream: {
      write: (message) => {
        try {
          const log = JSON.parse(message);
          
          // Determine log level based on status code
          let level = 'http';
          if (log.status >= 500) level = 'error';
          else if (log.status >= 400) level = 'warn';
          
          logger[level]('HTTP Request', log);
        } catch (error) {
          // Fallback to plain text logging
          logger.http(message.trim());
        }
      }
    }
  });

  // Return middleware chain
  return [
    // Add request ID
    (req, res, next) => {
      req.id = req.headers['x-request-id'] || generateRequestId();
      res.setHeader('X-Request-ID', req.id);
      
      // Store start time for accurate response time calculation
      req._startTime = process.hrtime();
      
      // Add request ID to logger context for this request
      req.logger = logger.child({ requestId: req.id });
      
      next();
    },
    
    // Morgan middleware
    morganMiddleware,
    
    // Log request details (if verbose logging enabled)
    (req, res, next) => {
      if (process.env.LOG_LEVEL === 'debug' || process.env.LOG_LEVEL === 'verbose') {
        req.logger.verbose('Incoming request', {
          method: req.method,
          url: req.url,
          headers: req.headers,
          query: req.query,
          body: logBody ? req.body : '[BODY LOGGING DISABLED]'
        });
      }
      next();
    }
  ];
}

/**
 * Error logging middleware
 * Should be placed after all other middleware
 */
function errorLoggingMiddleware(err, req, res, next) {
  // Store error message for Morgan to pick up
  res.locals.errorMessage = err.message;
  
  // Log the error with context
  const errorContext = {
    requestId: req.id,
    method: req.method,
    url: req.url,
    userId: req.user?.user_id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
  
  req.logger.logError(err, errorContext);
  
  next(err);
}

/**
 * Create slow request logging middleware
 * Logs requests that exceed a certain threshold
 */
function createSlowRequestLogger(threshold = 1000) {
  return (req, res, next) => {
    const start = Date.now();
    
    // Override end method
    const originalEnd = res.end;
    res.end = function(...args) {
      const duration = Date.now() - start;
      
      if (duration > threshold) {
        req.logger.warn('Slow request detected', {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          userId: req.user?.user_id,
          query: req.query
        });
      }
      
      originalEnd.apply(res, args);
    };
    
    next();
  };
}

/**
 * Create audit logging middleware for sensitive operations
 */
function createAuditLogger() {
  const auditOperations = [
    { method: 'POST', pattern: /\/users$/ },
    { method: 'PUT', pattern: /\/users\/[\w-]+$/ },
    { method: 'DELETE', pattern: /\/users\/[\w-]+$/ },
    { method: 'POST', pattern: /\/concepts$/ },
    { method: 'DELETE', pattern: /\/concepts\/[\w-]+$/ },
    { method: 'POST', pattern: /\/synthesis$/ },
    { method: 'POST', pattern: /\/api-keys$/ },
    { method: 'DELETE', pattern: /\/api-keys\/[\w-]+$/ }
  ];
  
  return (req, res, next) => {
    const shouldAudit = auditOperations.some(op => 
      op.method === req.method && op.pattern.test(req.path)
    );
    
    if (shouldAudit) {
      const originalSend = res.send;
      res.send = function(data) {
        const auditLog = {
          timestamp: new Date().toISOString(),
          requestId: req.id,
          userId: req.user?.user_id || 'anonymous',
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.body,
          statusCode: res.statusCode,
          ip: req.ip,
          userAgent: req.get('user-agent')
        };
        
        logger.info('AUDIT', auditLog);
        
        return originalSend.call(this, data);
      };
    }
    
    next();
  };
}

module.exports = {
  createRequestLogger,
  errorLoggingMiddleware,
  createSlowRequestLogger,
  createAuditLogger,
  generateRequestId
};