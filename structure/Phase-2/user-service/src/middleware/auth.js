/**
 * Authentication and Authorization Middleware
 */

const { UnauthorizedError, ForbiddenError } = require('../../../shared/lib/errors/HttpErrors');
const TokenService = require('../services/tokenService');

const tokenService = new TokenService();

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from headers
    const authHeader = req.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authorization token provided');
    }
    
    const token = authHeader.substring(7);
    
    // Check if token is blacklisted
    if (await tokenService.isTokenBlacklisted(token)) {
      throw new UnauthorizedError('Token has been invalidated');
    }
    
    // Verify token
    const payload = tokenService.verifyAccessToken(token);
    
    if (!payload) {
      throw new UnauthorizedError('Invalid access token');
    }
    
    // Attach user info to request
    req.user = payload;
    req.token = token;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Get token from headers
    const authHeader = req.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Check if token is blacklisted
      if (!(await tokenService.isTokenBlacklisted(token))) {
        // Verify token
        const payload = tokenService.verifyAccessToken(token);
        
        if (payload) {
          // Attach user info to request
          req.user = payload;
          req.token = token;
        }
      }
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

/**
 * Authorization middleware factory
 * Checks if user has required role(s)
 * @param {string|Array<string>} requiredRoles - Required role(s)
 * @returns {Function} Express middleware
 */
const authorize = (...requiredRoles) => {
  return (req, res, next) => {
    // Make sure user is authenticated
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    
    const { role } = req.user;
    
    // Admin has access to everything
    if (role === 'admin') {
      return next();
    }
    
    // Check if user has one of the required roles
    if (requiredRoles.length === 0 || requiredRoles.includes(role)) {
      return next();
    }
    
    next(new ForbiddenError('Insufficient permissions'));
  };
};

/**
 * Permission checking middleware factory
 * Checks if user has required permission(s)
 * @param {string|Array<string>} requiredPermissions - Required permission(s)
 * @returns {Function} Express middleware
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    // Make sure user is authenticated
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    
    // TODO: Implement permission checking logic based on user role
    // For now, this is a placeholder
    
    next();
  };
};

/**
 * Check if user is the owner of the resource
 * @param {Function} getUserId - Function to extract user ID from request
 * @returns {Function} Express middleware
 */
const isOwner = (getUserId) => {
  return async (req, res, next) => {
    // Make sure user is authenticated
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    
    const { user_id: currentUserId, role } = req.user;
    
    // Admin has access to everything
    if (role === 'admin') {
      return next();
    }
    
    // Get the owner ID of the resource
    const ownerId = await getUserId(req);
    
    if (ownerId !== currentUserId) {
      return next(new ForbiddenError('You do not have access to this resource'));
    }
    
    next();
  };
};

/**
 * Rate limiting specifically for authentication endpoints
 * This is a simple implementation - in production, use redis-backed rate limiting
 */
const authRateLimit = (() => {
  const attempts = new Map();
  const maxAttempts = 5;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  return (req, res, next) => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    
    // Clean up old entries
    for (const [k, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(k);
      }
    }
    
    const userData = attempts.get(key);
    
    if (!userData) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }
    
    if (userData.count >= maxAttempts) {
      const timeRemaining = userData.firstAttempt + windowMs - now;
      
      if (timeRemaining > 0) {
        return next(new ForbiddenError(
          `Too many attempts. Please try again in ${Math.ceil(timeRemaining / 1000)} seconds`
        ));
      }
      
      // Reset counter
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }
    
    userData.count++;
    next();
  };
})();

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  requirePermission,
  isOwner,
  authRateLimit
};
