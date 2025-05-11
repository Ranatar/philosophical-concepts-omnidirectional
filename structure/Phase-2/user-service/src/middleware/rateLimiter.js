/**
 * Rate Limiter Middleware
 */

const rateLimit = require('express-rate-limit');
const { getRedisClient } = require('../config/db');
const { ForbiddenError } = require('../../../shared/lib/errors/HttpErrors');
const config = require('../config');

/**
 * Create Redis-backed rate limiter store
 * @returns {Object} Rate limiter store
 */
function createRedisStore() {
  const redis = getRedisClient();
  
  return {
    incr: async (key) => {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, config.rateLimit.windowMs / 1000);
      }
      return current;
    },
    
    decrement: async (key) => {
      const current = await redis.decr(key);
      if (current <= 0) {
        await redis.del(key);
        return 0;
      }
      return current;
    },
    
    resetKey: async (key) => {
      await redis.del(key);
    }
  };
}

/**
 * General rate limiter
 */
const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new ForbiddenError(
      'Too many requests from this IP, please try again later',
      null,
      {
        retryAfter: Math.round(config.rateLimit.windowMs / 1000)
      }
    );
  },
  keyGenerator: (req) => req.ip,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

/**
 * Strict rate limiter for auth endpoints
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    throw new ForbiddenError(
      'Too many failed authentication attempts, please try again later',
      null,
      {
        retryAfter: 900 // 15 minutes
      }
    );
  },
  keyGenerator: (req) => `auth_${req.ip}_${req.path}`
});

/**
 * Rate limiter for password reset requests
 */
const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  handler: (req, res) => {
    throw new ForbiddenError(
      'Too many password reset requests, please try again later',
      null,
      {
        retryAfter: 3600 // 1 hour
      }
    );
  },
  keyGenerator: (req) => `reset_${req.ip}_${req.body.email || ''}`
});

/**
 * Rate limiter for registration
 */
const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour
  handler: (req, res) => {
    throw new ForbiddenError(
      'Too many registration attempts, please try again later',
      null,
      {
        retryAfter: 3600 // 1 hour
      }
    );
  },
  keyGenerator: (req) => `register_${req.ip}`
});

/**
 * Dynamic rate limiter based on user role
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
function createDynamicRateLimiter(options = {}) {
  const limits = {
    guest: options.guest || 50,
    user: options.user || 100,
    moderator: options.moderator || 200,
    admin: options.admin || 500
  };
  
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    handler: (req, res) => {
      throw new ForbiddenError(
        'Rate limit exceeded, please try again later',
        null,
        {
          retryAfter: Math.round((options.windowMs || 900000) / 1000)
        }
      );
    },
    keyGenerator: (req) => {
      if (req.user) {
        return `user_${req.user.user_id}`;
      }
      return `ip_${req.ip}`;
    },
    max: (req) => {
      if (req.user) {
        return limits[req.user.role] || limits.user;
      }
      return limits.guest;
    }
  });
}

/**
 * Create rate limiter with Redis store
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
function createRedisRateLimiter(options = {}) {
  try {
    const redisStore = createRedisStore();
    
    return rateLimit({
      store: redisStore,
      windowMs: options.windowMs || config.rateLimit.windowMs,
      max: options.max || config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      handler: options.handler || ((req, res) => {
        throw new ForbiddenError(
          options.message || 'Too many requests, please try again later',
          null,
          {
            retryAfter: Math.round((options.windowMs || config.rateLimit.windowMs) / 1000)
          }
        );
      }),
      keyGenerator: options.keyGenerator || ((req) => req.ip),
      skip: options.skip
    });
  } catch (error) {
    // Fallback to memory store if Redis is not available
    console.error('Failed to create Redis rate limiter, falling back to memory store:', error);
    return rateLimit(options);
  }
}

module.exports = {
  rateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  registrationRateLimiter,
  createDynamicRateLimiter,
  createRedisRateLimiter
};
