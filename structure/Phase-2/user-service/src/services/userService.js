/**
 * User Service
 * Business logic for user management
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { ConflictError, NotFoundError } = require('../../../shared/lib/errors/HttpErrors');
const UserRepository = require('../repositories/userRepository');
const ActivityService = require('./activityService');
const UserModel = require('../models/userModel');

class UserService {
  constructor(
    userRepository = new UserRepository(),
    activityService = new ActivityService(),
    logger = defaultLogger
  ) {
    this.userRepository = userRepository;
    this.activityService = activityService;
    this.logger = logger;
  }

  /**
   * Find all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Promise resolving to { items, total }
   */
  async findAll(options = {}) {
    try {
      const result = await this.userRepository.findAll(options);
      
      return {
        items: result.items.map(user => user.toPublic()),
        total: result.total
      };
    } catch (error) {
      this.logger.error('Error finding users:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Promise resolving to user or null
   */
  async findById(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      return user ? user.toPublic() : null;
    } catch (error) {
      this.logger.error(`Error finding user by ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} Promise resolving to user or null
   */
  async findByUsername(username) {
    try {
      const user = await this.userRepository.findByUsername(username);
      return user ? user.toPublic() : null;
    } catch (error) {
      this.logger.error(`Error finding user by username ${username}:`, error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - Email
   * @returns {Promise<Object|null>} Promise resolving to user or null
   */
  async findByEmail(email) {
    try {
      const user = await this.userRepository.findByEmail(email);
      return user ? user.toPublic() : null;
    } catch (error) {
      this.logger.error(`Error finding user by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Promise resolving to created user
   */
  async create(userData) {
    try {
      // Check if username already exists
      if (await this.userRepository.usernameExists(userData.username)) {
        throw new ConflictError('Username already exists');
      }

      // Check if email already exists
      if (await this.userRepository.emailExists(userData.email)) {
        throw new ConflictError('Email already exists');
      }

      // Create user model
      const user = new UserModel(userData);
      
      // Validate user data
      const validation = user.validate();
      if (!validation.isValid) {
        throw new ConflictError('Invalid user data', { errors: validation.errors });
      }

      // Create user with transaction to ensure activity is logged
      const createdUser = await this.userRepository.createWithTransaction(user, async (client) => {
        // Log user creation activity
        if (this.activityService) {
          await this.activityService.logActivity({
            user_id: user.user_id,
            activity_type: 'user_created',
            details: { username: user.username }
          }, client);
        }
      });

      return createdUser.toPublic();
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update a user
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object|null>} Promise resolving to updated user or null
   */
  async update(userId, userData) {
    try {
      // Get existing user
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Check if new username conflicts with existing
      if (userData.username && userData.username !== existingUser.username) {
        if (await this.userRepository.usernameExists(userData.username)) {
          throw new ConflictError('Username already exists');
        }
      }

      // Check if new email conflicts with existing
      if (userData.email && userData.email !== existingUser.email) {
        if (await this.userRepository.emailExists(userData.email)) {
          throw new ConflictError('Email already exists');
        }
      }

      // Update user
      existingUser.update(userData);
      
      // Validate updated user data
      const validation = existingUser.validate();
      if (!validation.isValid) {
        throw new ConflictError('Invalid user data', { errors: validation.errors });
      }

      const updatedUser = await this.userRepository.update(userId, existingUser);
      
      if (!updatedUser) {
        throw new NotFoundError('User not found');
      }

      // Log profile update activity
      await this.activityService.logProfileUpdate(userId, {
        updated_fields: Object.keys(userData)
      });

      return updatedUser.toPublic();
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
      const deleted = await this.userRepository.delete(userId);
      
      if (deleted) {
        // Delete user's activities
        await this.activityService.deleteUserActivities(userId);
      }
      
      return deleted;
    } catch (error) {
      this.logger.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Promise resolving to user profile
   */
  async getProfile(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user.toProfile();
    } catch (error) {
      this.logger.error(`Error getting profile for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Promise resolving to updated profile
   */
  async updateProfile(userId, profileData) {
    try {
      // Filter out fields that can't be updated through profile
      const allowedFields = ['first_name', 'last_name', 'settings'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (profileData[field] !== undefined) {
          filteredData[field] = profileData[field];
        }
      });

      const updatedUser = await this.update(userId, filteredData);
      
      if (!updatedUser) {
        throw new NotFoundError('User not found');
      }

      const user = await this.userRepository.findById(userId);
      return user.toProfile();
    } catch (error) {
      this.logger.error(`Error updating profile for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's full model (for internal use only)
   * @param {string} userId - User ID
   * @returns {Promise<UserModel|null>} Promise resolving to user model or null
   */
  async getUserModel(userId) {
    return this.userRepository.findById(userId);
  }

  /**
   * Get user by username or email (for authentication)
   * @param {string} login - Username or email
   * @returns {Promise<UserModel|null>} Promise resolving to user model or null
   */
  async getUserByLogin(login) {
    try {
      // Check if login looks like an email
      if (login.includes('@')) {
        return this.userRepository.findByEmail(login);
      } else {
        return this.userRepository.findByUsername(login);
      }
    } catch (error) {
      this.logger.error(`Error finding user by login ${login}:`, error);
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
      return this.userRepository.updateLastLogin(userId);
    } catch (error) {
      this.logger.error(`Error updating last login for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user exists
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Promise resolving to whether user exists
   */
  async exists(userId) {
    return this.userRepository.exists(userId);
  }
}

module.exports = UserService;
