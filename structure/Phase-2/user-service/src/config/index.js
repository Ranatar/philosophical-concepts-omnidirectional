/**
 * User Service Configuration
 * Central configuration for the user microservice
 */

require('dotenv').config();

module.exports = {
  // Service info
  serviceName: 'user-service',
  version: process.env.VERSION || '1.0.0',
  
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'philosophy_users',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10
    },
    ssl: process.env.DB_SSL === 'true'
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: parseInt(process.env.REDIS_DB, 10) || 0
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'philosophy-service',
    audience: process.env.JWT_AUDIENCE || 'philosophy-service-clients'
  },
  
  // Password hashing
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100 // limit each IP to 100 requests per windowMs
  },
  
  // CORS
  corsOptions: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID']
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // API versioning
  apiVersion: process.env.API_VERSION || 'v1',
  
  // External services
  services: {
    conceptService: process.env.CONCEPT_SERVICE_URL || 'http://concept-service:3002',
    graphService: process.env.GRAPH_SERVICE_URL || 'http://graph-service:3003',
    thesisService: process.env.THESIS_SERVICE_URL || 'http://thesis-service:3004'
  },
  
  // Feature flags
  features: {
    enablePasswordReset: process.env.FEATURE_PASSWORD_RESET === 'true',
    enableEmailVerification: process.env.FEATURE_EMAIL_VERIFICATION === 'true',
    enableActivityTracking: process.env.FEATURE_ACTIVITY_TRACKING !== 'false'
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    name: 'philosophy.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },
  
  // Email configuration (for future email features)
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'noreply@philosophy-service.com'
  }
};
