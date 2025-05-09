/**
 * User model for the philosophy service
 */

const { v4: uuidv4 } = require('uuid');
const { ROLE_USER } = require('../constants/roles');
const { USER_ACTIVE } = require('../constants/statuses');

/**
 * User class representing a user in the system
 */
class User {
  /**
   * Create a new User instance
   * @param {Object} userData - User data
   * @param {string} [userData.user_id] - User ID (generated if not provided)
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email address
   * @param {string} [userData.password_hash] - Hashed password
   * @param {string} [userData.first_name] - First name
   * @param {string} [userData.last_name] - Last name
   * @param {string} [userData.status=USER_ACTIVE] - User status
   * @param {string} [userData.role=ROLE_USER] - User role
   * @param {Object} [userData.settings={}] - User settings
   * @param {Date} [userData.created_at] - Creation date
   * @param {Date} [userData.updated_at] - Last update date
   * @param {Date} [userData.last_login] - Last login date
   */
  constructor(userData = {}) {
    this.user_id = userData.user_id || uuidv4();
    this.username = userData.username;
    this.email = userData.email;
    this.password_hash = userData.password_hash;
    this.first_name = userData.first_name || '';
    this.last_name = userData.last_name || '';
    this.status = userData.status || USER_ACTIVE;
    this.role = userData.role || ROLE_USER;
    this.settings = userData.settings || {};
    
    // Date fields
    this.created_at = userData.created_at instanceof Date 
      ? userData.created_at 
      : userData.created_at ? new Date(userData.created_at) : new Date();
      
    this.updated_at = userData.updated_at instanceof Date 
      ? userData.updated_at 
      : userData.updated_at ? new Date(userData.updated_at) : new Date();
      
    this.last_login = userData.last_login instanceof Date 
      ? userData.last_login 
      : userData.last_login ? new Date(userData.last_login) : null;
  }
  
  /**
   * Get user's full name
   * @returns {string} Full name
   */
  getFullName() {
    if (this.first_name || this.last_name) {
      return `${this.first_name} ${this.last_name}`.trim();
    }
    return this.username;
  }
  
  /**
   * Check if the user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean} Whether the user has the role
   */
  hasRole(role) {
    return this.role === role;
  }
  
  /**
   * Check if the user is active
   * @returns {boolean} Whether the user is active
   */
  isActive() {
    return this.status === USER_ACTIVE;
  }
  
  /**
   * Convert the user to a public-facing object (no sensitive data)
   * @returns {Object} Public user data
   */
  toPublic() {
    return {
      user_id: this.user_id,
      username: this.username,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      status: this.status,
      role: this.role,
      created_at: this.created_at,
      last_login: this.last_login
    };
  }
  
  /**
   * Convert the user to a database object
   * @returns {Object} Database representation
   */
  toDatabase() {
    return {
      user_id: this.user_id,
      username: this.username,
      email: this.email,
      password_hash: this.password_hash,
      first_name: this.first_name,
      last_name: this.last_name,
      status: this.status,
      role: this.role,
      settings: JSON.stringify(this.settings),
      created_at: this.created_at,
      updated_at: this.updated_at,
      last_login: this.last_login
    };
  }
  
  /**
   * Update user with new data
   * @param {Object} userData - User data to update
   * @returns {User} Updated user instance
   */
  update(userData = {}) {
    // Only update allowed fields
    if (userData.username !== undefined) this.username = userData.username;
    if (userData.email !== undefined) this.email = userData.email;
    if (userData.first_name !== undefined) this.first_name = userData.first_name;
    if (userData.last_name !== undefined) this.last_name = userData.last_name;
    if (userData.status !== undefined) this.status = userData.status;
    if (userData.role !== undefined) this.role = userData.role;
    if (userData.settings !== undefined) this.settings = userData.settings;
    if (userData.password_hash !== undefined) this.password_hash = userData.password_hash;
    
    // Always update the updated_at field
    this.updated_at = new Date();
    
    // Update last_login if provided
    if (userData.last_login !== undefined) {
      this.last_login = userData.last_login instanceof Date 
        ? userData.last_login 
        : new Date(userData.last_login);
    }
    
    return this;
  }
  
  /**
   * Create a User instance from a database row
   * @param {Object} row - Database row
   * @returns {User} User instance
   */
  static fromDatabase(row) {
    if (!row) return null;
    
    const userData = {
      user_id: row.user_id,
      username: row.username,
      email: row.email,
      password_hash: row.password_hash,
      first_name: row.first_name,
      last_name: row.last_name,
      status: row.status,
      role: row.role,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings || {},
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_login: row.last_login
    };
    
    return new User(userData);
  }
}

module.exports = User;
