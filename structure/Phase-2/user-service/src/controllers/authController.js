/**
 * Auth Controller
 * Handles HTTP requests for authentication
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { BadRequestError } = require('../../../shared/lib/errors/HttpErrors');
const { validate } = require('../../../shared/lib/validation/validators');
const { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema, 
  changePasswordSchema 
} = require('../validation/authSchemas');
const AuthService = require('../services/authService');

class AuthController {
  constructor(authService = new AuthService(), logger = defaultLogger) {
    this.authService = authService;
    this.logger = logger;
    
    // Bind methods to ensure correct `this` context
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.requestPasswordReset = this.requestPasswordReset.bind(this);
  }

  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async register(req, res, next) {
    try {
      // Validate request body
      const validated = validate(req.body, registerSchema);
      
      // Add client info for activity logging
      validated.ip = req.ip;
      validated.userAgent = req.get('user-agent');
      
      const result = await this.authService.register(validated);
      
      res.status(201).sendSuccess(result, {}, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login with credentials
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async login(req, res, next) {
    try {
      // Validate request body
      const validated = validate(req.body, loginSchema);
      
      // Add client info for activity logging
      const credentials = {
        ...validated,
        ip: req.ip,
        userAgent: req.get('user-agent')
      };
      
      const result = await this.authService.login(credentials);
      
      res.sendSuccess(result, {}, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async logout(req, res, next) {
    try {
      // Get user from auth middleware
      const { user_id: userId } = req.user;
      
      // Get refresh token from request
      const refreshToken = req.body.refreshToken;
      
      if (!refreshToken) {
        throw new BadRequestError('Refresh token is required');
      }
      
      await this.authService.logout(userId, refreshToken);
      
      res.sendSuccess({ message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async refreshToken(req, res, next) {
    try {
      // Validate request body
      const validated = validate(req.body, refreshTokenSchema);
      
      const tokens = await this.authService.refreshToken(validated.refreshToken);
      
      res.sendSuccess({ tokens }, {}, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async changePassword(req, res, next) {
    try {
      // Get user from auth middleware
      const { user_id: userId } = req.user;
      
      // Validate request body
      const validated = validate(req.body, changePasswordSchema);
      
      await this.authService.changePassword(userId, validated);
      
      res.sendSuccess({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async getCurrentUser(req, res, next) {
    try {
      // Get user from auth middleware
      const { user_id: userId } = req.user;
      
      const user = await this.authService.userService.findById(userId);
      
      if (!user) {
        throw new NotFoundError('User not found');
      }
      
      res.sendSuccess({ user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new BadRequestError('Email is required');
      }
      
      const result = await this.authService.requestPasswordReset(email);
      
      res.sendSuccess(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify current session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async verifySession(req, res, next) {
    try {
      // Extract token from request header
      const authHeader = req.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new BadRequestError('Invalid authorization header');
      }
      
      const token = authHeader.substring(7);
      const sessionInfo = await this.authService.validateSession(token);
      
      res.sendSuccess(sessionInfo);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
