/**
 * Template for CRUD services
 * Replace all instances of `Entity` with the actual entity name
 * Replace all instances of `entity` with the lowercase entity name
 * Replace all references to entityRepository with the actual repository
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { defaultEventProducer } = require('../../../shared/lib/messaging/producers');
const { ValidationError } = require('../../../shared/lib/errors/HttpErrors');
const Entity = require('../../../shared/models/Entity');

/**
 * Service for Entity CRUD operations
 */
class EntityService {
  /**
   * Create a new EntityService
   * @param {Object} entityRepository - Entity repository instance
   * @param {Object} [eventProducer=defaultEventProducer] - Event producer for domain events
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(entityRepository, eventProducer = defaultEventProducer, logger = defaultLogger) {
    this.entityRepository = entityRepository;
    this.eventProducer = eventProducer;
    this.logger = logger;
  }

  /**
   * Find all entities with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.pageSize=20] - Page size
   * @param {string} [options.sortBy] - Sort field
   * @param {string} [options.sortOrder='asc'] - Sort order ('asc' or 'desc')
   * @param {Object} [options.filters] - Filter criteria
   * @returns {Promise<Object>} Promise resolving to { items, total } object
   */
  async findAll(options = {}) {
    const { page = 1, pageSize = 20, sortBy, sortOrder = 'asc', filters = {} } = options;
    
    try {
      const result = await this.entityRepository.findAll(
        page,
        pageSize,
        sortBy,
        sortOrder,
        filters
      );
      
      return {
        items: result.items.map(item => {
          // Convert repository model to domain model if needed
          return this._toDomainModel(item);
        }),
        total: result.total
      };
    } catch (error) {
      this.logger.error(`Error finding entities: ${error.message}`, {
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Find entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise<Entity|null>} Promise resolving to entity or null if not found
   */
  async findById(id) {
    try {
      const entity = await this.entityRepository.findById(id);
      
      if (!entity) {
        return null;
      }
      
      return this._toDomainModel(entity);
    } catch (error) {
      this.logger.error(`Error finding entity by ID ${id}: ${error.message}`, {
        id,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Check if entity exists
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} Promise resolving to whether entity exists
   */
  async exists(id) {
    try {
      return await this.entityRepository.exists(id);
    } catch (error) {
      this.logger.error(`Error checking if entity exists: ${error.message}`, {
        id,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create a new entity
   * @param {Object} data - Entity data
   * @returns {Promise<Entity>} Promise resolving to created entity
   */
  async create(data) {
    try {
      // Additional validation if needed
      this._validateCreate(data);
      
      // Create domain model
      const entity = new Entity(data);
      
      // Save to repository
      const savedEntity = await this.entityRepository.create(entity);
      
      // Publish domain event
      await this._publishDomainEvent('created', savedEntity);
      
      return this._toDomainModel(savedEntity);
    } catch (error) {
      this.logger.error(`Error creating entity: ${error.message}`, {
        data,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update an entity
   * @param {string} id - Entity ID
   * @param {Object} data - Entity data to update
   * @returns {Promise<Entity|null>} Promise resolving to updated entity or null if not found
   */
  async update(id, data) {
    try {
      // Check if entity exists
      const existingEntity = await this.entityRepository.findById(id);
      
      if (!existingEntity) {
        return null;
      }
      
      // Additional validation if needed
      this._validateUpdate(data, existingEntity);
      
      // Update domain model
      const updatedEntity = this._toDomainModel(existingEntity).update(data);
      
      // Save to repository
      const savedEntity = await this.entityRepository.update(id, updatedEntity);
      
      // Publish domain event
      await this._publishDomainEvent('updated', savedEntity);
      
      return this._toDomainModel(savedEntity);
    } catch (error) {
      this.logger.error(`Error updating entity ${id}: ${error.message}`, {
        id,
        data,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Delete an entity
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} Promise resolving to whether the entity was deleted
   */
  async delete(id) {
    try {
      // Check if entity exists
      const existingEntity = await this.entityRepository.findById(id);
      
      if (!existingEntity) {
        return false;
      }
      
      // Delete from repository
      const deleted = await this.entityRepository.delete(id);
      
      if (deleted) {
        // Publish domain event
        await this._publishDomainEvent('deleted', this._toDomainModel(existingEntity));
      }
      
      return deleted;
    } catch (error) {
      this.logger.error(`Error deleting entity ${id}: ${error.message}`, {
        id,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Validate entity data for creation
   * @param {Object} data - Entity data
   * @throws {ValidationError} If validation fails
   * @private
   */
  _validateCreate(data) {
    // Add custom validation logic not covered by schema validation
    // Example: Check for unique fields, business rules, etc.
    
    // Example: Check if name is unique
    if (data.name && this._isNameTaken(data.name)) {
      throw new ValidationError('Name is already taken');
    }
  }

  /**
   * Validate entity data for update
   * @param {Object} data - Entity data
   * @param {Object} existingEntity - Existing entity
   * @throws {ValidationError} If validation fails
   * @private
   */
  _validateUpdate(data, existingEntity) {
    // Add custom validation logic not covered by schema validation
    
    // Example: Check if name is unique (but allow unchanged name)
    if (data.name && data.name !== existingEntity.name && this._isNameTaken(data.name)) {
      throw new ValidationError('Name is already taken');
    }
  }

  /**
   * Check if a name is already taken
   * @param {string} name - Name to check
   * @returns {Promise<boolean>} Promise resolving to whether name is taken
   * @private
   */
  async _isNameTaken(name) {
    // Implement logic to check if name is taken
    // This is just a placeholder
    return false;
  }

  /**
   * Convert repository model to domain model
   * @param {Object} repositoryModel - Repository model
   * @returns {Entity} Domain model
   * @private
   */
  _toDomainModel(repositoryModel) {
    // If repository returns plain objects, convert to domain model
    if (!(repositoryModel instanceof Entity)) {
      return new Entity(repositoryModel);
    }
    
    return repositoryModel;
  }

  /**
   * Publish a domain event for the entity
   * @param {string} action - Action performed ('created', 'updated', 'deleted', etc.)
   * @param {Entity} entity - Entity involved
   * @returns {Promise<string>} Promise resolving to event ID
   * @private
   */
  async _publishDomainEvent(action, entity) {
    try {
      // Skip if no event producer
      if (!this.eventProducer) {
        return null;
      }
      
      // Define entity type (lowercase entity name, e.g., 'user', 'concept', etc.)
      const entityType = 'entity';
      
      // Basic entity data for event
      const entityData = {
        id: entity.id,
        name: entity.name,
        // Include other relevant fields
      };
      
      // Publish the domain event
      const eventId = await this.eventProducer.publishDomainEvent(
        entityType,
        action,
        entityData
      );
      
      this.logger.debug(`Published domain event: ${entityType}.${action}`, { eventId });
      
      return eventId;
    } catch (error) {
      // Log but don't throw - event publishing should not affect the main flow
      this.logger.error(`Error publishing domain event: ${error.message}`, {
        action,
        entityId: entity.id,
        stack: error.stack
      });
      
      return null;
    }
  }
}

module.exports = EntityService;
