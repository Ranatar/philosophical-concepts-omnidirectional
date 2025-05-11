/**
 * User Service Server
 * Entry point for the User microservice
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const { createRequestLogger } = require('../../../shared/lib/logging/requestLogger');
const { defaultLogger } = require('../../../shared/lib/logging/logger');
const config = require('./config');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const { initializeDatabase } = require('./config/db');

const app = express();
const logger = defaultLogger;

// Security middleware
app.use(helmet());
app.use(cors(config.corsOptions));
app.use(compression());

// Request logging
app.use(createRequestLogger({ logger }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'user-service',
    version: config.version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`
    }
  });
});

// Start server
async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // Start listening
    const server = app.listen(config.port, () => {
      logger.info(`User Service started on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Version: ${config.version}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close database connections
      // await closeDatabase();

      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
