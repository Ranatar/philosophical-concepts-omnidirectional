/**
 * JWT helper for authentication and authorization
 * Provides utilities for generating, verifying, and managing JWT tokens
 */

const jwt = require('jsonwebtoken');
const { defaultLogger } = require('../logging/logger');
const { UnauthorizedError } = require('../errors/HttpErrors');

/**
 * Default JWT options
 */
const DEFAULT_OPTIONS = {
  algorithm: 'HS256',  // HMAC with SHA-256
  expiresIn: '1h',     // 1 hour
  issuer: 'philosophy-service',
  audience: 'philosophy-service-clients'
};

/**
 * Default refresh token options (longer expiration)
 */
const DEFAULT_REFRESH_OPTIONS = {
  algorithm: 'HS256',
  expiresIn: '7d',     // 7 days
  issuer: 'philosophy-service',
  audience: 'philosophy-service-clients'
};

/**
 * Default verification options
 */
const DEFAULT_VERIFY_OPTIONS = {
  algorithms: ['HS256'],
  issuer: 'philosophy-service',
  audience: 'philosophy-service-clients'
};

/**
 * JWT helper class
 */
class JwtHelper {
  /**
   * Create a new JWT helper
   * @param {Object} [options] - JWT options
   * @param {string} options.secret - JWT secret
   * @param {string} [options.refreshSecret] - JWT refresh secret (defaults to secret)
   * @param {Object} [options.jwtOptions] - JWT sign options
   * @param {Object} [options.refreshOptions] - JWT refresh sign options
   * @param {Object} [options.verifyOptions] - JWT verify options
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(options = {}, logger = defaultLogger) {
    this.secret = options.secret || process.env.JWT_SECRET;
    this.refreshSecret = options.refreshSecret || process.env.JWT_REFRESH_SECRET || this.secret;
    
    if (!this.secret) {
      throw new Error('JWT secret is required');
    }
    
    this.jwtOptions = { ...DEFAULT_OPTIONS, ...(options.jwtOptions || {}) };
    this.refreshOptions = { ...DEFAULT_REFRESH_OPTIONS, ...(options.refreshOptions || {}) };
    this.verifyOptions = { ...DEFAULT_VERIFY_OPTIONS, ...(options.verifyOptions || {}) };
    
    this.logger = logger;
  }
  
  /**
   * Generate a JWT token
   * @param {Object} payload - Token payload
   * @param {Object} [options] - JWT options (overrides defaults)
   * @returns {string} JWT token
   */
  generateToken(payload, options = {}) {
    const tokenOptions = { ...this.jwtOptions, ...options };
    
    try {
      return jwt.sign(payload, this.secret, tokenOptions);
    } catch (err) {
      this.logger.error('Failed to generate JWT token', {
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }
  
  /**
   * Generate a refresh token
   * @param {Object} payload - Token payload
   * @param {Object} [options] - JWT options (overrides defaults)
   * @returns {string} Refresh token
   */
  generateRefreshToken(payload, options = {}) {
    const tokenOptions = { ...this.refreshOptions, ...options };
    
    try {
      return jwt.sign(payload, this.refreshSecret, tokenOptions);
    } catch (err) {
      this.logger.error('Failed to generate refresh token', {
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }
  
  /**
   * Verify a JWT token
   * @param {string} token - JWT token to verify
   * @param {Object} [options] - JWT verification options (overrides defaults)
   * @returns {Object} Decoded token payload
   * @throws {UnauthorizedError} If token is invalid
   */
  verifyToken(token, options = {}) {
    const verifyOptions = { ...this.verifyOptions, ...options };
    
    try {
      return jwt.verify(token, this.secret, verifyOptions);
    } catch (err) {
      this.logger.debug('JWT token verification failed', {
        error: err.message,
        name: err.name
      });
      
      // Map JWT errors to more specific error messages
      switch (err.name) {
        case 'TokenExpiredError':
          throw new UnauthorizedError('Token has expired', null, { expired: true });
          
        case 'JsonWebTokenError':
          throw new UnauthorizedError('Invalid token', null, { invalid: true });
          
        case 'NotBeforeError':
          throw new UnauthorizedError('Token not yet valid', null, { notBefore: true });
          
        default:
          throw new UnauthorizedError('Token verification failed', null, { verification: true });
      }
    }
  }
  
  /**
   * Verify a refresh token
   * @param {string} token - Refresh token to verify
   * @param {Object} [options] - JWT verification options (overrides defaults)
   * @returns {Object} Decoded token payload
   * @throws {UnauthorizedError} If token is invalid
   */
  verifyRefreshToken(token, options = {}) {
    const verifyOptions = { ...this.verifyOptions, ...options };
    
    try {
      return jwt.verify(token, this.refreshSecret, verifyOptions);
    } catch (err) {
      this.logger.debug('Refresh token verification failed', {
        error: err.message,
        name: err.name
      });
      
      // Map JWT errors to more specific error messages
      switch (err.name) {
        case 'TokenExpiredError':
          throw new UnauthorizedError('Refresh token has expired', null, { expired: true });
          
        case 'JsonWebTokenError':
          throw new UnauthorizedError('Invalid refresh token', null, { invalid: true });
          
        case 'NotBeforeError':
          throw new UnauthorizedError('Refresh token not yet valid', null, { notBefore: true });
          
        default:
          throw new UnauthorizedError('Refresh token verification failed', null, { verification: true });
      }
    }
  }
  
  /**
   * Decode a JWT token without verification
   * @param {string} token - JWT token to decode
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (err) {
      this.logger.debug('JWT token decoding failed', {
        error: err.message
      });
      
      return null;
    }
  }
  
  /**
   * Check if a token is expired
   * @param {string} token - JWT token to check
   * @returns {boolean} Whether the token is expired
   */
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      // exp is in seconds, Date.now() is in milliseconds
      return decoded.exp * 1000 < Date.now();
    } catch (err) {
      this.logger.debug('JWT token expiration check failed', {
        error: err.message
      });
      
      return true;
    }
  }
  
  /**
   * Get time remaining until token expiration
   * @param {string} token - JWT token to check
   * @returns {number} Seconds until expiration (negative if expired)
   */
  getTokenTimeRemaining(token) {
    try {
      const decoded = this.decodeToken(token);
      
      if (!decoded || !decoded.exp) {
        return -1;
      }
      
      // exp is in seconds, Date.now() is in milliseconds
      return Math.floor(decoded.exp - Date.now() / 1000);
    } catch (err) {
      this.logger.debug('JWT token time remaining check failed', {
        error: err.message
      });
      
      return -1;
    }
  }
  
  /**
   * Refresh an access token using a refresh token
   * @param {string} refreshToken - Refresh token
   * @param {Object} [additionalPayload={}] - Additional payload to include in new token
   * @param {Object} [accessOptions={}] - Options for new access token
   * @returns {Object} New access token and its decoded payload
   * @throws {UnauthorizedError} If refresh token is invalid
   */
  refreshAccessToken(refreshToken, additionalPayload = {}, accessOptions = {}) {
    // Verify the refresh token
    const payload = this.verifyRefreshToken(refreshToken);
    
    // Generate a new access token with the original payload plus any additional data
    const newPayload = { ...payload, ...additionalPayload };
    
    // Remove any refresh token specific fields
    delete newPayload.iat;
    delete newPayload.exp;
    delete newPayload.nbf;
    delete newPayload.jti;
    
    const accessToken = this.generateToken(newPayload, accessOptions);
    
    return {
      accessToken,
      payload: this.decodeToken(accessToken)
    };
  }
  
  /**
   * Create a middleware for JWT token verification
   * @param {Object} [options] - Middleware options
   * @param {boolean} [options.credentialsRequired=true] - Whether to require credentials
   * @param {string} [options.tokenField='authorization'] - Token header/query field
   * @param {boolean} [options.useQueryParam=false] - Whether to check query params for token
   * @param {function} [options.getToken] - Custom function to extract token
   * @returns {function} Express middleware function
   */
  createMiddleware(options = {}) {
    const {
      credentialsRequired = true,
      tokenField = 'authorization',
      useQueryParam = false,
      getToken = null
    } = options;
    
    // Return the middleware function
    return (req, res, next) => {
      let token;
      
      // Custom token extraction function
      if (typeof getToken === 'function') {
        token = getToken(req);
      } 
      // Get token from headers or query params
      else {
        // Check headers
        if (req.headers && req.headers[tokenField.toLowerCase()]) {
          const authHeader = req.headers[tokenField.toLowerCase()];
          
          // If authorization header starts with 'Bearer ', extract the token
          if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
          } else {
            token = authHeader;
          }
        }
        
        // Check query params if enabled and no token in headers
        if (!token && useQueryParam && req.query && req.query[tokenField]) {
          token = req.query[tokenField];
        }
      }
      
      // If no token and credentials are required, return error
      if (!token) {
        if (credentialsRequired) {
          return next(new UnauthorizedError('No authorization token provided'));
        }
        
        // If credentials are not required, continue
        return next();
      }
      
      // Verify the token
      try {
        const decoded = this.verifyToken(token);
        
        // Attach the decoded token to the request
        req.user = decoded;
        next();
      } catch (err) {
        next(err);
      }
    };
  }
}

// Create and export a default instance
const defaultJwtHelper = new JwtHelper({
  secret: process.env.JWT_SECRET || 'default-jwt-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET
});

module.exports = {
  JwtHelper,
  defaultJwtHelper
};
