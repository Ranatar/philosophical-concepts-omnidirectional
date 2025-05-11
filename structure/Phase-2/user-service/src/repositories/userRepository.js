/**
 * User Repository
 * Handles database operations for users
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { getPostgresPool, transaction } = require('../config/db');
const UserModel = require('../models/userModel');
const { select, insert, update, delete: del } = require('../../../shared/lib/db/postgres/queryBuilder');

class UserRepository {
  constructor(logger = defaultLogger) {
    this.logger = logger;
    this.tableName = 'users';
  }

  /**
   * Find all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Promise resolving to { items, total }
   */
  async findAll(options = {}) {
    const { page = 1, pageSize = 20, sortBy = 'created_at', sortOrder = 'desc', filters = {} } = options;

    try {
      // Build select query
      const selectQuery = select(this.tableName);

      // Apply filters
      if (filters.status) {
        selectQuery.whereEquals('status', filters.status);
      }
      if (filters.role) {
        selectQuery.whereEquals('role', filters.role);
      }
      if (filters.search) {
        selectQuery.whereRaw(
          '(username ILIKE $1 OR email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)',
          [`%${filters.search}%`]
        );
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

      const items = itemsResult.rows.map(row => UserModel.fromDatabase(row));
      const total = parseInt(countResult.rows[0].total, 10);

      return { items, total };
    } catch (error) {
      this.logger.error('Error finding users:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<UserModel|null>} Promise resolving to user or null
   */
  async findById(userId) {
    try {
      const selectQuery = select(this.tableName)
        .whereEquals('user_id', userId)
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(selectQuery);

      if (result.rows.length === 0) {
        return null;
      }

      return UserModel.fromDatabase(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error finding user by ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<UserModel|null>} Promise resolving to user or null
   */
  async findByUsername(username) {
    try {
      const selectQuery = select(this.tableName)
        .whereEquals('username', username)
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(selectQuery);

      if (result.rows.length === 0) {
        return null;
      }

      return UserModel.fromDatabase(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error finding user by username ${username}:`, error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - Email
   * @returns {Promise<UserModel|null>} Promise resolving to user or null
   */
  async findByEmail(email) {
    try {
      const selectQuery = select(this.tableName)
        .whereEquals('email', email)
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(selectQuery);

      if (result.rows.length === 0) {
        return null;
      }

      return UserModel.fromDatabase(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error finding user by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {UserModel} user - User to create
   * @returns {Promise<UserModel>} Promise resolving to created user
   */
  async create(user) {
    try {
      const dbUser = user.toDatabase();
      
      const insertQuery = insert(this.tableName, dbUser)
        .returning('*')
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(insertQuery);

      return UserModel.fromDatabase(result.rows[0]);
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update a user
   * @param {string} userId - User ID
   * @param {UserModel} user - User with updated values
   * @returns {Promise<UserModel|null>} Promise resolving to updated user or null
   */
  async update(userId, user) {
    try {
      const dbUser = user.toDatabase();
      delete dbUser.user_id; // Don't update ID
      delete dbUser.created_at; // Don't update creation date

      const updateQuery = update(this.tableName, dbUser)
        .whereEquals('user_id', userId)
        .returning('*')
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(updateQuery);

      if (result.rows.length === 0) {
        return null;
      }

      return UserModel.fromDatabase(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Promise resolving to whether user was deleted
   */
  async delete(userId) {
    try {
      const deleteQuery = del(this.tableName)
        .whereEquals('user_id', userId)
        .returning('user_id')
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(deleteQuery);

      return result.rows.length > 0;
    } catch (error) {
      this.logger.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user exists
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Promise resolving to whether user exists
   */
  async exists(userId) {
    try {
      const query = select(this.tableName, ['user_id'])
        .whereEquals('user_id', userId)
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(query);

      return result.rows.length > 0;
    } catch (error) {
      this.logger.error(`Error checking user existence ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if username exists
   * @param {string} username - Username
   * @returns {Promise<boolean>} Promise resolving to whether username exists
   */
  async usernameExists(username) {
    try {
      const query = select(this.tableName, ['user_id'])
        .whereEquals('username', username)
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(query);

      return result.rows.length > 0;
    } catch (error) {
      this.logger.error(`Error checking username existence ${username}:`, error);
      throw error;
    }
  }

  /**
   * Check if email exists
   * @param {string} email - Email
   * @returns {Promise<boolean>} Promise resolving to whether email exists
   */
  async emailExists(email) {
    try {
      const query = select(this.tableName, ['user_id'])
        .whereEquals('email', email)
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(query);

      return result.rows.length > 0;
    } catch (error) {
      this.logger.error(`Error checking email existence ${email}:`, error);
      throw error;
    }
  }

  /**
   * Update user's last login time
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Promise resolving to whether update was successful
   */
  async updateLastLogin(userId) {
    try {
      const updateQuery = update(this.tableName, { last_login: new Date() })
        .whereEquals('user_id', userId)
        .returning('user_id')
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(updateQuery);

      return result.rows.length > 0;
    } catch (error) {
      this.logger.error(`Error updating last login for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user's password
   * @param {string} userId - User ID
   * @param {string} passwordHash - New password hash
   * @returns {Promise<boolean>} Promise resolving to whether update was successful
   */
  async updatePassword(userId, passwordHash) {
    try {
      const updateQuery = update(this.tableName, { 
        password_hash: passwordHash,
        updated_at: new Date()
      })
        .whereEquals('user_id', userId)
        .returning('user_id')
        .build();

      const pool = getPostgresPool();
      const result = await pool.query(updateQuery);

      return result.rows.length > 0;
    } catch (error) {
      this.logger.error(`Error updating password for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create user with transaction support
   * @param {UserModel} user - User to create
   * @param {Function} callback - Callback to execute in transaction
   * @returns {Promise<UserModel>} Promise resolving to created user
   */
  async createWithTransaction(user, callback) {
    return transaction(async (client) => {
      const dbUser = user.toDatabase();
      
      const insertQuery = insert(this.tableName, dbUser)
        .returning('*')
        .build();

      const result = await client.query(insertQuery.text, insertQuery.params);
      const createdUser = UserModel.fromDatabase(result.rows[0]);

      if (callback) {
        await callback(client, createdUser);
      }

      return createdUser;
    });
  }
}

module.exports = UserRepository;
