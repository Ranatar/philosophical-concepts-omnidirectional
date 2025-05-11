/**
 * Activity Service
 * Business logic for user activity tracking
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const ActivityRepository = require('../repositories/activityRepository');
const ActivityModel = require('../models/activityModel');
const config = require('../config');

class ActivityService {
  constructor(
    activityRepository = new ActivityRepository(),
    logger = defaultLogger
  ) {
    this.activityRepository = activityRepository;
    this.logger = logger;
    this.isEnabled = config.features.enableActivityTracking;
  }

  /**
   * Log user activity
   * @param {Object} activityData - Activity data
   * @param {Object} [client] - Database client for transactions
   * @returns {Promise<Object|null>} Promise resolving to activity or null if disabled
   */
  async logActivity(activityData, client = null) {
    if (!this.isEnabled) {
      return null;
    }

    try {
      const activity = new ActivityModel(activityData);
      const validation = activity.validate();
      
      if (!validation.isValid) {
        this.logger.warn('Invalid activity data:', validation.errors);
        return null;
      }

      // If client is provided, we're in a transaction
      if (client) {
        const dbActivity = activity.toDatabase();
        const query = `
          INSERT INTO user_activity (activity_id, user_id, activity_type, target_id, activity_date, details)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const params = [
          dbActivity.activity_id,
          dbActivity.user_id,
          dbActivity.activity_type,
          dbActivity.target_id,
          dbActivity.activity_date,
          dbActivity.details
        ];
        const result = await client.query(query, params);
        return ActivityModel.fromDatabase(result.rows[0]).toPublic();
      }

      const createdActivity = await this.activityRepository.create(activity);
      return createdActivity.toPublic();
    } catch (error) {
      this.logger.error('Error logging activity:', error);
      return null;
    }
  }

  /**
   * Log login activity
   * @param {string} userId - User ID
   * @param {Object} [details={}] - Additional details
   * @returns {Promise<Object|null>} Promise resolving to activity or null if disabled
   */
  async logLogin(userId, details = {}) {
    return this.logActivity(ActivityModel.createLoginActivity(userId, details));
  }

  /**
   * Log logout activity
   * @param {string} userId - User ID
   * @param {Object} [details={}] - Additional details
   * @returns {Promise<Object|null>} Promise resolving to activity or null if disabled
   */
  async logLogout(userId, details = {}) {
    return this.logActivity(ActivityModel.createLogoutActivity(userId, details));
  }

  /**
   * Log password change activity
   * @param {string} userId - User ID
   * @param {Object} [details={}] - Additional details
   * @returns {Promise<Object|null>} Promise resolving to activity or null if disabled
   */
  async logPasswordChange(userId, details = {}) {
    return this.logActivity(ActivityModel.createPasswordChangeActivity(userId, details));
  }

  /**
   * Log profile update activity
   * @param {string} userId - User ID
   * @param {Object} [details={}] - Additional details
   * @returns {Promise<Object|null>} Promise resolving to activity or null if disabled
   */
  async logProfileUpdate(userId, details = {}) {
    return this.logActivity(ActivityModel.createProfileUpdateActivity(userId, details));
  }

  /**
   * Get user activities
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Promise resolving to { items, total }
   */
  async getUserActivities(userId, options = {}) {
    try {
      const result = await this.activityRepository.findByUserId(userId, options);
      
      return {
        items: result.items.map(activity => activity.toPublic()),
        total: result.total
      };
    } catch (error) {
      this.logger.error(`Error getting activities for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get recent user activities
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of activities
   * @returns {Promise<Array>} Promise resolving to recent activities
   */
  async getRecentActivities(userId, limit = 10) {
    try {
      const activities = await this.activityRepository.getRecentActivities(userId, limit);
      return activities.map(activity => activity.toPublic());
    } catch (error) {
      this.logger.error(`Error getting recent activities for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get activity statistics
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Promise resolving to activity statistics
   */
  async getActivityStats(userId, options = {}) {
    try {
      return await this.activityRepository.getActivityStats(userId, options);
    } catch (error) {
      this.logger.error(`Error getting activity stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user activities
   * @param {string} userId - User ID
   * @returns {Promise<number>} Promise resolving to number of deleted activities
   */
  async deleteUserActivities(userId) {
    try {
      return await this.activityRepository.deleteByUserId(userId);
    } catch (error) {
      this.logger.error(`Error deleting activities for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old activities
   * @param {number} daysToKeep - Number of days to keep activities
   * @returns {Promise<number>} Promise resolving to number of deleted activities
   */
  async cleanupOldActivities(daysToKeep = 90) {
    try {
      const beforeDate = new Date();
      beforeDate.setDate(beforeDate.getDate() - daysToKeep);
      
      const deletedCount = await this.activityRepository.deleteOldActivities(beforeDate);
      this.logger.info(`Cleaned up ${deletedCount} old activities`);
      
      return deletedCount;
    } catch (error) {
      this.logger.error('Error cleaning up old activities:', error);
      throw error;
    }
  }

  /**
   * Check if user has recent activity
   * @param {string} userId - User ID
   * @param {string} activityType - Activity type
   * @param {number} withinMinutes - Time window in minutes
   * @returns {Promise<boolean>} Promise resolving to whether activity was performed recently
   */
  async hasRecentActivity(userId, activityType, withinMinutes = 60) {
    try {
      return await this.activityRepository.hasRecentActivity(userId, activityType, withinMinutes);
    } catch (error) {
      this.logger.error(`Error checking recent activity for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Log concept-related activity
   * @param {string} userId - User ID
   * @param {string} conceptId - Concept ID
   * @param {string} activityType - Activity type
   * @param {Object} [details={}] - Additional details
   * @returns {Promise<Object|null>} Promise resolving to activity or null if disabled
   */
  async logConceptActivity(userId, conceptId, activityType, details = {}) {
    const activity = {
      user_id: userId,
      activity_type: activityType,
      target_id: conceptId,
      details
    };

    return this.logActivity(activity);
  }

  /**
   * Log batch activities
   * @param {Array<Object>} activities - Array of activity data
   * @returns {Promise<Array>} Promise resolving to created activities
   */
  async logBatchActivities(activities) {
    if (!this.isEnabled) {
      return [];
    }

    try {
      const activityModels = activities.map(data => new ActivityModel(data));
      
      // Validate all activities
      const validActivities = activityModels.filter(activity => {
        const validation = activity.validate();
        if (!validation.isValid) {
          this.logger.warn('Invalid activity data:', validation.errors);
          return false;
        }
        return true;
      });

      if (validActivities.length === 0) {
        return [];
      }

      const createdActivities = await this.activityRepository.bulkCreate(validActivities);
      return createdActivities.map(activity => activity.toPublic());
    } catch (error) {
      this.logger.error('Error logging batch activities:', error);
      return [];
    }
  }

  /**
   * Get activity details by ID
   * @param {string} activityId - Activity ID
   * @returns {Promise<Object|null>} Promise resolving to activity or null
   */
  async getActivityById(activityId) {
    try {
      const activity = await this.activityRepository.findById(activityId);
      return activity ? activity.toPublic() : null;
    } catch (error) {
      this.logger.error(`Error getting activity by ID ${activityId}:`, error);
      throw error;
    }
  }
}

module.exports = ActivityService;
