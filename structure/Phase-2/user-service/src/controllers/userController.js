/**
 * User Controller
 * Handles HTTP requests for user management
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { NotFoundError } = require('../../../shared/lib/errors/HttpErrors');
const { validate } = require('../../../shared/lib/validation/validators');
const { createUserSchema, updateUserSchema, getUsersSchema } = require('../validation/userSchemas');
const UserService = require('../services/userService');

class UserController {
  constructor(userService = new UserService(), logger = defaultLogger) {
    this.userService = userService;
    this.logger = logger;
    
    // Bind methods to ensure correct `this` context
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  /**
   * Get all users with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async getAll(req, res, next) {
    try {
      // Validate query parameters
      const validated = validate(req.query, getUsersSchema);
      
      const result = await this.userService.findAll(validated);
      
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
   * Get a single user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await this.userService.findById(id);
      
      if (!user) {
        throw new NotFoundError('User not found', null, { id });
      }
      
      res.sendSuccess(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async create(req, res, next) {
    try {
      // Validate request body
      const validated = validate(req.body, createUserSchema);
      
      const user = await this.userService.create(validated);
      
      res.status(201).sendSuccess(user, {}, 'User created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const validated = validate(req.body, updateUserSchema);
      
      const user = await this.userService.update(id, validated);
      
      if (!user) {
        throw new NotFoundError('User not found', null, { id });
      }
      
      res.sendSuccess(user, {}, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      const success = await this.userService.delete(id);
      
      if (!success) {
        throw new NotFoundError('User not found', null, { id });
      }
      
      res.sendSuccess({ id }, {}, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
