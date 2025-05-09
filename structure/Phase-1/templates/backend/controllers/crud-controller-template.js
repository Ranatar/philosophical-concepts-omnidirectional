/**
 * Template for CRUD controllers
 * Replace all instances of `Entity` with the actual entity name
 * Replace all instances of `entity` with the lowercase entity name
 * Replace all references to entityService with the actual service
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { NotFoundError } = require('../../../shared/lib/errors/HttpErrors');
const { validate } = require('../../../shared/lib/validation/validators');
const { createEntitySchema, updateEntitySchema } = require('../validation/entitySchemas');

/**
 * CRUD controller for Entity resources
 */
class EntityController {
  /**
   * Create a new EntityController
   * @param {Object} entityService - Entity service instance
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(entityService, logger = defaultLogger) {
    this.entityService = entityService;
    this.logger = logger;
  }

  /**
   * Get all entities with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when the operation is complete
   */
  async getAll(req, res, next) {
    try {
      const { page = 1, pageSize = 20, sortBy, sortOrder, ...filters } = req.query;
      
      const options = {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        sortBy,
        sortOrder,
        filters
      };
      
      const result = await this.entityService.findAll(options);
      
      res.sendPaginated(
        result.items,
        {
          total: result.total,
          page: options.page,
          pageSize: options.pageSize
        },
        { filters }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single entity by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when the operation is complete
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      
      const entity = await this.entityService.findById(id);
      
      if (!entity) {
        throw new NotFoundError('Entity not found', null, { id });
      }
      
      res.sendSuccess(entity);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new entity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when the operation is complete
   */
  async create(req, res, next) {
    try {
      const data = validate(req.body, createEntitySchema);
      
      // Add creator/user info from auth if available
      if (req.user) {
        data.createdBy = req.user.id;
      }
      
      const entity = await this.entityService.create(data);
      
      res.status(201).sendSuccess(entity, {}, 'Entity created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an entity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when the operation is complete
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = validate(req.body, updateEntitySchema);
      
      // Add updater info from auth if available
      if (req.user) {
        data.updatedBy = req.user.id;
      }
      
      const entity = await this.entityService.update(id, data);
      
      if (!entity) {
        throw new NotFoundError('Entity not found', null, { id });
      }
      
      res.sendSuccess(entity, {}, 'Entity updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an entity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when the operation is complete
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      const success = await this.entityService.delete(id);
      
      if (!success) {
        throw new NotFoundError('Entity not found', null, { id });
      }
      
      res.sendSuccess({ id }, {}, 'Entity deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = EntityController;
