/**
 * Centralized logger configuration for the entire application
 * Uses Winston for logging with different transport options
 */

const winston = require('winston');
const { format } = winston;

/**
 * Configuration options for the logger
 * @typedef {Object} LoggerConfig
 * @property {string} serviceName - Name of the service using this logger
 * @property {string} logLevel - Minimum log level to record
 * @property {boolean} prettyPrint - Whether to format logs for human readability
 * @property {boolean} useConsole - Whether to log to console
 * @property {boolean} useFile - Whether to log to file
 * @property {string} filePath - Path to log file if useFile is true
 */

/**
 * Create a custom format with service name
 * @param {string} serviceName - Name of the service
 * @returns {winston.Format} Winston format
 */
const createServiceFormat = (serviceName) => format((info) => {
  info.service = serviceName;
  return info;
});

/**
 * Create and configure a logger instance
 * @param {LoggerConfig} config - Logger configuration
 * @returns {winston.Logger} Configured logger instance
 */
function createLogger(config = {}) {
  const {
    serviceName = 'philosophy-service',
    logLevel = process.env.LOG_LEVEL || 'info',
    prettyPrint = process.env.NODE_ENV === 'development',
    useConsole = true,
    useFile = false,
    filePath = `logs/${serviceName}.log`
  } = config;
  
  // Define formats based on configuration
  const baseFormat = format.combine(
    createServiceFormat(serviceName)(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.errors({ stack: true })
  );
  
  // Create formats for different outputs
  const consoleFormat = prettyPrint
    ? format.combine(
        baseFormat,
        format.colorize(),
        format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? `\n${JSON.stringify(meta, null, 2)}`
            : '';
          return `[${timestamp}] [${service}] ${level}: ${message}${metaStr}`;
        })
      )
    : format.combine(
        baseFormat,
        format.json()
      );
      
  const fileFormat = format.combine(
    baseFormat,
    format.json()
  );
  
  // Configure transports
  const transports = [];
  
  if (useConsole) {
    transports.push(new winston.transports.Console({
      level: logLevel,
      format: consoleFormat
    }));
  }
  
  if (useFile) {
    transports.push(new winston.transports.File({
      level: logLevel,
      filename: filePath,
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }));
  }
  
  // Create the logger
  return winston.createLogger({
    level: logLevel,
    defaultMeta: { service: serviceName },
    transports,
    // Handle uncaught exceptions and rejections
    exceptionHandlers: useConsole
      ? [new winston.transports.Console({ format: consoleFormat })]
      : [],
    rejectionHandlers: useConsole
      ? [new winston.transports.Console({ format: consoleFormat })]
      : []
  });
}

// Create default logger
const defaultLogger = createLogger();

/**
 * Create a child logger with specific context
 * @param {Object} context - Context to add to all logs
 * @param {winston.Logger} [parentLogger=defaultLogger] - Parent logger instance
 * @returns {winston.Logger} Child logger instance
 */
function createChildLogger(context, parentLogger = defaultLogger) {
  return parentLogger.child(context);
}

module.exports = {
  createLogger,
  createChildLogger,
  defaultLogger
};
