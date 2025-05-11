/**
 * Activity Controller
 * Handles HTTP requests for user activity management
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { NotFoundError, ForbiddenError } = require('../../../shared/lib/errors/HttpErrors');
const { validate } = require('../../../shared/lib/validation/validators');
const { getActivitiesSchema } = require('../validation/activitySchemas');
const ActivityService = require('../services/activityService');

class ActivityController {
  constructor(activityService = new ActivityService(), logger = defaultLogger) {
    this.activityService = activityService;
    this.logger = logger;
    
    // Bind methods to ensure correct `this` context
    this.getUserActivities = this.getUserActivities.bind(this);
    this.getOwnActivities = this.getOwnActivities.bind(this);
    this.getRecentActivities = this.getRecentActivities.bind(this);
    this.getActivityStats = this.getActivityStats.bind(this);
    this.getActivityById = this.getActivityById.bind(this);
  }

  /**
   * Get activities for a specific user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async getUserActivities(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate query parameters
      const validated = validate(req.query, getActivitiesSchema);
      
      const result = await this.activityService.getUserActivities(id, validated);
      
      res.sendPaginated(
        result.items,
        {
          total: result.total,
          page: validated.page,
          pageSize: validated.pageSize
        },
        { userId: id, filters: validated.filters }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's activities
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async getOwnActivities(req, res, next) {
    try {
      // Get user from auth middleware
      const { user_id: userId } = req.user;
      
      // Validate query parameters
      const validated = validate(req.query, getActivitiesSchema);
      
      const result = await this.activityService.getUserActivities(userId, validated);
      
      res.sendPaginated(
        result.items,
        {
          total: result.total,
          page: validated.page,
          pageSize: validated.pageSize
        },
        { filters: validated.filters }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent activities for current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async getRecentActivities(req, res, next) {
    try {
      // Get user from auth middleware
      const { user_id: userId } = req.user;
      
      const limit = parseInt(req.query.limit, 10) || 10;
      
      const activities = await this.activityService.getRecentActivities(userId, limit);
      
      res.sendSuccess(activities);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get activity statistics for current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async getActivityStats(req, res, next) {
    try {
      // Get user from auth middleware
      const { user_id: userId } = req.user;
      
      const options = {
        fromDate: req.query.fromDate ? new Date(req.query.fromDate) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate) : undefined
      };
      
      const stats = await this.activityService.getActivityStats(userId, options);
      
      res.sendSuccess(stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get activity by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async getActivityById(req, res, next) {
    try {
      const { id } = req.params;
      const { user_id: userId, role } = req.user;
      
      const activity = await this.activityService.getActivityById(id);
      
      if (!activity) {
        throw new NotFoundError('Activity not found', null, { id });
      }
      
      // Check if user has access to this activity
      if (activity.user_id !== userId && role !== 'admin') {
        throw new ForbiddenError('You do not have access to this activity');
      }
      
      res.sendSuccess(activity);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ActivityController;
