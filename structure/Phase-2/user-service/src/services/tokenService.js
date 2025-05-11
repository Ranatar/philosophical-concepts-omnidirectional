/**
 * Token Service
 * Business logic for JWT token management
 */

const { defaultJwtHelper } = require('../../../shared/lib/auth/jwtHelper');
const { getRedisClient } = require('../config/db');
const { defaultLogger } = require('../../../shared/lib/logging/logger');
const config = require('../config');

class TokenService {
  constructor(jwtHelper = defaultJwtHelper, logger = defaultLogger) {
    this.jwtHelper = jwtHelper;
    this.logger = logger;
    this.refreshTokenPrefix = 'refresh_token:';
    this.blacklistPrefix = 'token_blacklist:';
    this.userTokensPrefix = 'user_tokens:';
  }

  /**
   * Generate access and refresh tokens
   * @param {Object} payload - Token payload
   * @returns {Object} Tokens
   */
  generateTokens(payload) {
    try {
      const tokenPayload = {
        user_id: payload.user_id,
        username: payload.username,
        role: payload.role
      };

      // Generate access token
      const accessToken = this.jwtHelper.generateToken(tokenPayload, {
        expiresIn: config.jwt.accessTokenExpiry
      });

      // Generate refresh token
      const refreshToken = this.jwtHelper.generateRefreshToken(tokenPayload, {
        expiresIn: config.jwt.refreshTokenExpiry
      });

      // Store refresh token in Redis
      this.storeRefreshToken(refreshToken, payload.user_id);

      return {
        accessToken,
        refreshToken
      };
    } catch (error) {
      this.logger.error('Error generating tokens:', error);
      throw error;
    }
  }

  /**
   * Verify access token
   * @param {string} token - Access token
   * @returns {Object|null} Token payload or null if invalid
   */
  verifyAccessToken(token) {
    try {
      return this.jwtHelper.verifyToken(token);
    } catch (error) {
      this.logger.debug('Access token verification failed:', error);
      return null;
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - Refresh token
   * @returns {Object|null} Token payload or null if invalid
   */
  verifyRefreshToken(token) {
    try {
      return this.jwtHelper.verifyRefreshToken(token);
    } catch (error) {
      this.logger.debug('Refresh token verification failed:', error);
      return null;
    }
  }

  /**
   * Store refresh token in Redis
   * @param {string} token - Refresh token
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async storeRefreshToken(token, userId) {
    try {
      const redis = getRedisClient();
      const decoded = this.jwtHelper.decodeToken(token);
      
      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token format');
      }

      // Store token with expiration
      const key = this.refreshTokenPrefix + token;
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      
      await redis.setex(key, ttl, userId);

      // Add token to user's token set
      const userTokensKey = this.userTokensPrefix + userId;
      await redis.sadd(userTokensKey, token);
      await redis.expire(userTokensKey, ttl);
    } catch (error) {
      this.logger.error('Error storing refresh token:', error);
      throw error;
    }
  }

  /**
   * Check if refresh token is valid
   * @param {string} token - Refresh token
   * @returns {Promise<boolean>} Whether token is valid
   */
  async isRefreshTokenValid(token) {
    try {
      const redis = getRedisClient();
      const key = this.refreshTokenPrefix + token;
      const userId = await redis.get(key);
      
      return userId !== null;
    } catch (error) {
      this.logger.error('Error checking refresh token validity:', error);
      return false;
    }
  }

  /**
   * Invalidate refresh token
   * @param {string} token - Refresh token
   * @returns {Promise<void>}
   */
  async invalidateRefreshToken(token) {
    try {
      const redis = getRedisClient();
      const key = this.refreshTokenPrefix + token;
      
      // Get user ID before deleting
      const userId = await redis.get(key);
      
      if (userId) {
        // Remove from user's token set
        const userTokensKey = this.userTokensPrefix + userId;
        await redis.srem(userTokensKey, token);
      }
      
      // Delete token
      await redis.del(key);
      
      // Add to blacklist
      const decoded = this.jwtHelper.decodeToken(token);
      if (decoded && decoded.exp) {
        const blacklistKey = this.blacklistPrefix + token;
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        
        if (ttl > 0) {
          await redis.setex(blacklistKey, ttl, '1');
        }
      }
    } catch (error) {
      this.logger.error('Error invalidating refresh token:', error);
      throw error;
    }
  }

  /**
   * Invalidate all refresh tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async invalidateUserTokens(userId) {
    try {
      const redis = getRedisClient();
      const userTokensKey = this.userTokensPrefix + userId;
      
      // Get all user's tokens
      const tokens = await redis.smembers(userTokensKey);
      
      // Delete each token
      for (const token of tokens) {
        await this.invalidateRefreshToken(token);
      }
      
      // Delete user's token set
      await redis.del(userTokensKey);
    } catch (error) {
      this.logger.error(`Error invalidating all tokens for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if token is blacklisted
   * @param {string} token - Token to check
   * @returns {Promise<boolean>} Whether token is blacklisted
   */
  async isTokenBlacklisted(token) {
    try {
      const redis = getRedisClient();
      const blacklistKey = this.blacklistPrefix + token;
      const exists = await redis.exists(blacklistKey);
      
      return exists === 1;
    } catch (error) {
      this.logger.error('Error checking token blacklist:', error);
      return false;
    }
  }

  /**
   * Get token from request headers
   * @param {Object} headers - Request headers
   * @returns {string|null} Token or null
   */
  getTokenFromHeaders(headers) {
    const authorization = headers.authorization;
    
    if (!authorization) {
      return null;
    }
    
    // Check for Bearer token
    const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
    
    if (bearerMatch) {
      return bearerMatch[1];
    }
    
    return null;
  }

  /**
   * Create middleware for JWT verification
   * @param {Object} options - Middleware options
   * @returns {Function} Express middleware
   */
  createAuthMiddleware(options = {}) {
    return async (req, res, next) => {
      try {
        const token = this.getTokenFromHeaders(req.headers);
        
        if (!token) {
          if (options.credentialsRequired !== false) {
            return res.status(401).json({
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'No authorization token provided'
              }
            });
          }
          
          return next();
        }
        
        // Check if token is blacklisted
        if (await this.isTokenBlacklisted(token)) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Token has been invalidated'
            }
          });
        }
        
        // Verify token
        const payload = this.verifyAccessToken(token);
        
        if (!payload) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid access token'
            }
          });
        }
        
        // Attach user info to request
        req.user = payload;
        req.token = token;
        
        next();
      } catch (error) {
        this.logger.error('Error in auth middleware:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Authentication error'
          }
        });
      }
    };
  }
}

module.exports = TokenService;
