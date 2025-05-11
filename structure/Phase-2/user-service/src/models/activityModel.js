/**
 * Activity Model
 * Defines the user activity entity structure
 */

const { v4: uuidv4 } = require('uuid');

class ActivityModel {
  /**
   * Create a new ActivityModel instance
   * @param {Object} activityData - Activity data
   * @param {string} [activityData.activity_id] - Activity ID (generated if not provided)
   * @param {string} activityData.user_id - User ID
   * @param {string} activityData.activity_type - Activity type
   * @param {string} [activityData.target_id] - Target resource ID
   * @param {Date} [activityData.activity_date] - Activity date
   * @param {Object} [activityData.details={}] - Additional activity details
   */
  constructor(activityData = {}) {
    this.activity_id = activityData.activity_id || uuidv4();
    this.user_id = activityData.user_id;
    this.activity_type = activityData.activity_type;
    this.target_id = activityData.target_id || null;
    this.activity_date = activityData.activity_date instanceof Date 
      ? activityData.activity_date 
      : activityData.activity_date ? new Date(activityData.activity_date) : new Date();
    this.details = activityData.details || {};
  }
  
  /**
   * Convert the activity to a database object
   * @returns {Object} Database representation
   */
  toDatabase() {
    return {
      activity_id: this.activity_id,
      user_id: this.user_id,
      activity_type: this.activity_type,
      target_id: this.target_id,
      activity_date: this.activity_date,
      details: JSON.stringify(this.details)
    };
  }
  
  /**
   * Convert the activity to a public-facing object
   * @returns {Object} Public activity data
   */
  toPublic() {
    return {
      activity_id: this.activity_id,
      user_id: this.user_id,
      activity_type: this.activity_type,
      target_id: this.target_id,
      activity_date: this.activity_date,
      details: this.details
    };
  }
  
  /**
   * Create an ActivityModel instance from a database row
   * @param {Object} row - Database row
   * @returns {ActivityModel} Activity instance
   */
  static fromDatabase(row) {
    if (!row) return null;
    
    const activityData = {
      activity_id: row.activity_id,
      user_id: row.user_id,
      activity_type: row.activity_type,
      target_id: row.target_id,
      activity_date: row.activity_date,
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details || {}
    };
    
    return new ActivityModel(activityData);
  }
  
  /**
   * Validate activity data
   * @returns {Object} Validation result
   */
  validate() {
    const errors = [];
    
    if (!this.user_id) {
      errors.push('User ID is required');
    }
    
    if (!this.activity_type) {
      errors.push('Activity type is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Create activity for user login
   * @param {string} userId - User ID
   * @param {Object} [details={}] - Additional details
   * @returns {ActivityModel} Activity instance
   */
  static createLoginActivity(userId, details = {}) {
    return new ActivityModel({
      user_id: userId,
      activity_type: 'login',
      details
    });
  }
  
  /**
   * Create activity for user logout
   * @param {string} userId - User ID
   * @param {Object} [details={}] - Additional details
   * @returns {ActivityModel} Activity instance
   */
  static createLogoutActivity(userId, details = {}) {
    return new ActivityModel({
      user_id: userId,
      activity_type: 'logout',
      details
    });
  }
  
  /**
   * Create activity for password change
   * @param {string} userId - User ID
   * @param {Object} [details={}] - Additional details
   * @returns {ActivityModel} Activity instance
   */
  static createPasswordChangeActivity(userId, details = {}) {
    return new ActivityModel({
      user_id: userId,
      activity_type: 'password_change',
      details
    });
  }
  
  /**
   * Create activity for profile update
   * @param {string} userId - User ID
   * @param {Object} [details={}] - Additional details
   * @returns {ActivityModel} Activity instance
   */
  static createProfileUpdateActivity(userId, details = {}) {
    return new ActivityModel({
      user_id: userId,
      activity_type: 'profile_update',
      details
    });
  }
  
  /**
   * Create activity for concept creation
   * @param {string} userId - User ID
   * @param {string} conceptId - Concept ID
   * @param {Object} [details={}] - Additional details
   * @returns {ActivityModel} Activity instance
   */
  static createConceptCreationActivity(userId, conceptId, details = {}) {
    return new ActivityModel({
      user_id: userId,
      activity_type: 'create_concept',
      target_id: conceptId,
      details
    });
  }
  
  /**
   * Create activity for concept viewing
   * @param {string} userId - User ID
   * @param {string} conceptId - Concept ID
   * @param {Object} [details={}] - Additional details
   * @returns {ActivityModel} Activity instance
   */
  static createConceptViewActivity(userId, conceptId, details = {}) {
    return new ActivityModel({
      user_id: userId,
      activity_type: 'view_concept',
      target_id: conceptId,
      details
    });
  }
}

module.exports = ActivityModel;
