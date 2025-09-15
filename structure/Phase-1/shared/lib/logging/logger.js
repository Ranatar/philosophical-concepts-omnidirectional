/**
 * Logger configuration for the Philosophy Service
 * Uses Winston for flexible, structured logging
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey'
  }
};

// Add colors to Winston
winston.addColors(logLevels.colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.align(),
  winston.format.printf(info => {
    const { timestamp, level, message, service, ...meta } = info;
    
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      // Handle error objects specially
      if (meta.error && meta.error.stack) {
        meta.error = {
          message: meta.error.message,
          stack: meta.error.stack.split('\n').slice(0, 5).join('\n') + '...'
        };
      }
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    
    return `${timestamp} [${service || 'app'}] ${level}: ${message}${metaStr}`;
  })
);

/**
 * Create a logger instance
 * @param {string} service - Service name for log identification
 * @param {Object} options - Logger options
 * @returns {winston.Logger} Logger instance
 */
function createLogger(service = 'app', options = {}) {
  const {
    level = process.env.LOG_LEVEL || 'info',
    logDir = process.env.LOG_DIR || 'logs',
    enableConsole = process.env.NODE_ENV !== 'test',
    enableFile = process.env.NODE_ENV === 'production',
    maxFiles = 5,
    maxSize = '20m'
  } = options;

  const transports = [];

  // Console transport
  if (enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
        level: process.env.NODE_ENV === 'production' ? 'info' : level
      })
    );
  }

  // File transports
  if (enableFile) {
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, `${service}-error.log`),
        level: 'error',
        format: logFormat,
        maxsize: maxSize,
        maxFiles: maxFiles,
        tailable: true
      })
    );

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, `${service}-combined.log`),
        format: logFormat,
        maxsize: maxSize,
        maxFiles: maxFiles,
        tailable: true
      })
    );

    // Debug log file (in development)
    if (process.env.NODE_ENV === 'development') {
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, `${service}-debug.log`),
          level: 'debug',
          format: logFormat,
          maxsize: maxSize,
          maxFiles: 2,
          tailable: true
        })
      );
    }
  }

  // Create logger instance
  const logger = winston.createLogger({
    level,
    levels: logLevels.levels,
    format: logFormat,
    defaultMeta: { service },
    transports,
    exitOnError: false
  });

  // Add convenience methods
  logger.logRequest = function(req, res, duration) {
    this.http('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  };

  logger.logError = function(error, context = {}) {
    const errorInfo = {
      message: error.message,
      code: error.code,
      stack: error.stack,
      ...context
    };

    if (error.details) {
      errorInfo.details = error.details;
    }

    this.error('Error occurred', { error: errorInfo });
  };

  logger.logDatabaseQuery = function(query, duration, params = null) {
    const logData = {
      query: query.substring(0, 1000), // Truncate long queries
      duration: `${duration}ms`
    };

    if (params && process.env.NODE_ENV === 'development') {
      logData.params = params;
    }

    this.debug('Database query', logData);
  };

  logger.logApiCall = function(service, method, duration, success = true) {
    const logData = {
      service,
      method,
      duration: `${duration}ms`,
      success
    };

    this.info('External API call', logData);
  };

  logger.logCacheOperation = function(operation, key, hit = true) {
    this.debug('Cache operation', {
      operation,
      key,
      hit
    });
  };

  logger.logMetric = function(metric, value, tags = {}) {
    this.verbose('Metric', {
      metric,
      value,
      tags
    });
  };

  return logger;
}

// Create default logger instance
const defaultLogger = createLogger();

// Export both the factory function and default instance
module.exports = {
  createLogger,
  logger: defaultLogger,
  
  // Re-export Winston log levels for convenience
  levels: logLevels.levels,
  
  // Utility function to create child logger
  child: (metadata) => defaultLogger.child(metadata),
  
  // Stream for Morgan HTTP logging
  stream: {
    write: (message) => {
      defaultLogger.http(message.trim());
    }
  }
};