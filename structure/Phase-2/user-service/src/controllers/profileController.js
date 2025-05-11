/**
 * Profile Controller
 * Handles HTTP requests for user profile management
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { NotFoundError } = require('../../../shared/lib/errors/HttpErrors');
const { validate } = require('../../../shared/lib/validation/validators');
const { updateProfileSchema } = require('../validation/profileSchemas');
const UserService = require('../services/userService');

class ProfileController {
  constructor(userService = new UserService(), logger = defaultLogger) {
    this.userService = userService;
    this.logger = logger;
    
    // Bind methods to ensure correct `this` context
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.getOwnProfile = this.getOwnProfile.bind(this);
    this.updateOwnProfile = this.updateOwnProfile.bind(this);
  }

  /**
   * Get user profile by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async getProfile(req, res, next) {
    try {
      const { id } = req.params;
      
      const profile = await this.userService.getProfile(id);
      
      if (!profile) {
        throw new NotFoundError('User profile not found', null, { id });
      }
      
      res.sendSuccess(profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile by ID (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async updateProfile(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const validated = validate(req.body, updateProfileSchema);
      
      const profile = await this.userService.updateProfile(id, validated);
      
      if (!profile) {
        throw new NotFoundError('User profile not found', null, { id });
      }
      
      res.sendSuccess(profile, {}, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async getOwnProfile(req, res, next) {
    try {
      // Get user from auth middleware
      const { user_id: userId } = req.user;
      
      const profile = await this.userService.getProfile(userId);
      
      if (!profile) {
        throw new NotFoundError('User profile not found');
      }
      
      res.sendSuccess(profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user's profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async updateOwnProfile(req, res, next) {
    try {
      // Get user from auth middleware
      const { user_id: userId } = req.user;
      
      // Validate request body
      const validated = validate(req.body, updateProfileSchema);
      
      const profile = await this.userService.updateProfile(userId, validated);
      
      if (!profile) {
        throw new NotFoundError('User profile not found');
      }
      
      res.sendSuccess(profile, {}, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProfileController;
