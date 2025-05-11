/**
 * Activity Repository
 * Handles database operations for user activities
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { getPostgresPool } = require('../config/db');
const ActivityModel = require('../models/activityModel');
const { select, insert, delete: del } = require('../../../shared/lib/db/postgres/queryBuilder');

class ActivityRepository {
  constructor(logger = defaultLogger) {
    this.logger = logger;
    this.tableName = 'user_activity';
  }

  /**
   * Find activities by user ID with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Promise resolving to { items, total }
   */
  async findByUserId(userId, options = {}) {
    const { page = 1, pageSize = 20, sortBy = 'activity_date', sortOrder = 'desc', filters = {} } = options;

    try {
      // Build select query
      const selectQuery = select(this.tableName)
        .whereEquals('user_id', userId);

      // Apply filters
      if (filters.activity_type) {
        selectQuery.whereEquals('activity_type', filters.activity_type);
      }
      if (filters.target_id) {
        selectQuery.whereEquals('target_id', filters.target_id);
      }
      if (filters.fromDate) {
        selectQuery.where('activity_date', '>=', filters.fromDate);
      }
      if (filters.toDate) {
        selectQuery.where('activity_date', '<=', filters.toDate);
      }

      // Apply pagination and sorting
      selectQuery
        .orderBy(sortBy, sortOrder)
        .paginate({ page, pageSize });

      // Get count
      const countQuery = selectQuery.buildCount();

      // Execute queries
      const pool = getPostgresPool();
      const [itemsResult, countResult] = await Promise.all([
        pool.query(selectQuery.build()),
        pool.query(countQuery)
      ]);

      const items = itemsResult.rows.map(row => ActivityModel.fromDatabase(row));
      const total = parseInt(countResult.rows[0].total, 10);

      return { items, total };
    } catch (error) {
      this.logger.error(`Error finding activities for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Find activity by ID
   * @param {string} activityId - Activity ID
   * @returns {Promise<ActivityModel|null>} Promise resolving to activity or null
   */
  async findById(activityId) {
    try {
      const selectQuery = select(this.tableName)
        .whereEquals('activity_id', activityId)
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(selectQuery);

      if (result.rows.length === 0) {
        return null;
      }

      return ActivityModel.fromDatabase(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error finding activity by ID ${activityId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new activity
   * @param {ActivityModel} activity - Activity to create
   * @returns {Promise<ActivityModel>} Promise resolving to created activity
   */
  async create(activity) {
    try {
      const dbActivity = activity.toDatabase();
      
      const insertQuery = insert(this.tableName, dbActivity)
        .returning('*')
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(insertQuery);

      return ActivityModel.fromDatabase(result.rows[0]);
    } catch (error) {
      this.logger.error('Error creating activity:', error);
      throw error;
    }
  }

  /**
   * Bulk create activities
   * @param {Array<ActivityModel>} activities - Activities to create
   * @returns {Promise<Array<ActivityModel>>} Promise resolving to created activities
   */
  async bulkCreate(activities) {
    try {
      const dbActivities = activities.map(activity => activity.toDatabase());
      
      const insertQuery = insert(this.tableName, dbActivities)
        .returning('*')
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(insertQuery);

      return result.rows.map(row => ActivityModel.fromDatabase(row));
    } catch (error) {
      this.logger.error('Error bulk creating activities:', error);
      throw error;
    }
  }

  /**
   * Delete activity by ID
   * @param {string} activityId - Activity ID
   * @returns {Promise<boolean>} Promise resolving to whether activity was deleted
   */
  async delete(activityId) {
    try {
      const deleteQuery = del(this.tableName)
        .whereEquals('activity_id', activityId)
        .returning('activity_id')
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(deleteQuery);

      return result.rows.length > 0;
    } catch (error) {
      this.logger.error(`Error deleting activity ${activityId}:`, error);
      throw error;
    }
  }

  /**
   * Delete activities by user ID
   * @param {string} userId - User ID
   * @returns {Promise<number>} Promise resolving to number of deleted activities
   */
  async deleteByUserId(userId) {
    try {
      const deleteQuery = del(this.tableName)
        .whereEquals('user_id', userId)
        .returning('activity_id')
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(deleteQuery);

      return result.rows.length;
    } catch (error) {
      this.logger.error(`Error deleting activities for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete activities older than a certain date
   * @param {Date} beforeDate - Delete activities before this date
   * @returns {Promise<number>} Promise resolving to number of deleted activities
   */
  async deleteOldActivities(beforeDate) {
    try {
      const deleteQuery = del(this.tableName)
        .where('activity_date', '<', beforeDate)
        .returning('activity_id')
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(deleteQuery);

      return result.rows.length;
    } catch (error) {
      this.logger.error(`Error deleting old activities before ${beforeDate}:`, error);
      throw error;
    }
  }

  /**
   * Get activity statistics for a user
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Promise resolving to activity statistics
   */
  async getActivityStats(userId, options = {}) {
    const { fromDate, toDate } = options;

    try {
      let query = `
        SELECT 
          activity_type,
          COUNT(*) as count,
          DATE_TRUNC('day', activity_date) as date
        FROM ${this.tableName}
        WHERE user_id = $1
      `;
      const params = [userId];

      if (fromDate) {
        params.push(fromDate);
        query += ` AND activity_date >= $${params.length}`;
      }

      if (toDate) {
        params.push(toDate);
        query += ` AND activity_date <= $${params.length}`;
      }

      query += ` GROUP BY activity_type, DATE_TRUNC('day', activity_date)
                 ORDER BY date DESC, activity_type`;

      const pool = getPostgresPool();
      const result = await pool.query(query, params);

      // Transform results into a more useful format
      const stats = {};
      result.rows.forEach(row => {
        const date = row.date.toISOString().split('T')[0];
        if (!stats[date]) {
          stats[date] = {};
        }
        stats[date][row.activity_type] = parseInt(row.count, 10);
      });

      return stats;
    } catch (error) {
      this.logger.error(`Error getting activity stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get recent activities for a user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of activities to return
   * @returns {Promise<Array<ActivityModel>>} Promise resolving to recent activities
   */
  async getRecentActivities(userId, limit = 10) {
    try {
      const selectQuery = select(this.tableName)
        .whereEquals('user_id', userId)
        .orderBy('activity_date', 'desc')
        .limit(limit)
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(selectQuery);

      return result.rows.map(row => ActivityModel.fromDatabase(row));
    } catch (error) {
      this.logger.error(`Error getting recent activities for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user has performed a specific activity type recently
   * @param {string} userId - User ID
   * @param {string} activityType - Activity type
   * @param {number} withinMinutes - Time window in minutes
   * @returns {Promise<boolean>} Promise resolving to whether activity was performed recently
   */
  async hasRecentActivity(userId, activityType, withinMinutes = 60) {
    try {
      const timeThreshold = new Date(Date.now() - withinMinutes * 60 * 1000);
      
      const selectQuery = select(this.tableName, ['activity_id'])
        .whereEquals('user_id', userId)
        .whereEquals('activity_type', activityType)
        .where('activity_date', '>=', timeThreshold)
        .limit(1)
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(selectQuery);

      return result.rows.length > 0;
    } catch (error) {
      this.logger.error(`Error checking recent activity for user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = ActivityRepository;
