/**
 * Template for PostgreSQL repositories
 * Replace all instances of `Entity` with the actual entity name
 * Replace all instances of `entity` with the lowercase entity name
 * Replace all instances of `entities` with the plural lowercase entity name
 * Replace with appropriate table name and column names
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { client } = require('../../../shared/lib/db/postgres/client');
const Entity = require('../../../shared/models/Entity');

/**
 * Repository for Entity in PostgreSQL
 */
class PostgresEntityRepository {
  /**
   * Create a new PostgresEntityRepository
   * @param {Object} [options={}] - Repository options
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(options = {}, logger = defaultLogger) {
    this.tableName = options.tableName || 'entities';
    this.client = options.client || client;
    this.logger = logger;
  }

  /**
   * Find all entities with pagination and filtering
   * @param {number} page - Page number
   * @param {number} pageSize - Page size
   * @param {string} [sortBy] - Sort field
   * @param {string} [sortOrder='asc'] - Sort order ('asc' or 'desc')
   * @param {Object} [filters={}] - Filter criteria
   * @returns {Promise<Object>} Promise resolving to { items, total } object
   */
  async findAll(page, pageSize, sortBy, sortOrder = 'asc', filters = {}) {
    try {
      // Calculate offset
      const offset = (page - 1) * pageSize;
      
      // Build the query
      let query = `SELECT * FROM ${this.tableName}`;
      let countQuery = `SELECT COUNT(*) FROM ${this.tableName}`;
      let queryParams = [];
      
      // Add filters if provided
      if (Object.keys(filters).length > 0) {
        const { whereClause, filterParams } = this._buildWhereClause(filters);
        
        if (whereClause) {
          query += ` WHERE ${whereClause}`;
          countQuery += ` WHERE ${whereClause}`;
          queryParams = [...filterParams];
        }
      }
      
      // Add sorting if provided
      if (sortBy) {
        const sanitizedSortBy = this._sanitizeColumnName(sortBy);
        const sanitizedSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        
        query += ` ORDER BY ${sanitizedSortBy} ${sanitizedSortOrder}`;
      } else {
        // Default sorting by ID or creation date
        query += ` ORDER BY entity_id ASC`;
      }
      
      // Add pagination
      query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
      queryParams.push(pageSize, offset);
      
      // Execute the queries
      const [itemsResult, countResult] = await Promise.all([
        this.client.query(query, queryParams),
        this.client.query(countQuery, queryParams.slice(0, -2)) // Exclude pagination params
      ]);
      
      // Convert rows to entities
      const items = itemsResult.rows.map(row => this._rowToEntity(row));
      const total = parseInt(countResult.rows[0].count, 10);
      
      return { items, total };
    } catch (error) {
      this.logger.error(`Error finding entities: ${error.message}`, {
        page,
        pageSize,
        sortBy,
        sortOrder,
        filters,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Find an entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise<Entity|null>} Promise resolving to entity or null if not found
   */
  async findById(id) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE entity_id = $1`;
      const result = await this.client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this._rowToEntity(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error finding entity by ID ${id}: ${error.message}`, {
        id,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Check if an entity exists
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} Promise resolving to whether entity exists
   */
  async exists(id) {
    try {
      const query = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE entity_id = $1)`;
      const result = await this.client.query(query, [id]);
      
      return result.rows[0].exists;
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
   * @param {Entity} entity - Entity to create
   * @returns {Promise<Entity>} Promise resolving to created entity
   */
  async create(entity) {
    try {
      const dbEntity = this._entityToDb(entity);
      
      // Build query
      const columns = Object.keys(dbEntity);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const values = columns.map(col => dbEntity[col]);
      
      const query = `
        INSERT INTO ${this.tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *;
      `;
      
      const result = await this.client.query(query, values);
      
      return this._rowToEntity(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error creating entity: ${error.message}`, {
        entity,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update an entity
   * @param {string} id - Entity ID
   * @param {Entity} entity - Entity with updated values
   * @returns {Promise<Entity>} Promise resolving to updated entity
   */
  async update(id, entity) {
    try {
      const dbEntity = this._entityToDb(entity);
      
      // Remove id from values to update (since we're using it in the WHERE clause)
      delete dbEntity.entity_id;
      
      // Build query
      const columns = Object.keys(dbEntity);
      const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
      const values = columns.map(col => dbEntity[col]);
      
      // Add ID as the last parameter
      values.push(id);
      
      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE entity_id = $${values.length}
        RETURNING *;
      `;
      
      const result = await this.client.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this._rowToEntity(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error updating entity ${id}: ${error.message}`, {
        id,
        entity,
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
      const query = `DELETE FROM ${this.tableName} WHERE entity_id = $1 RETURNING entity_id`;
      const result = await this.client.query(query, [id]);
      
      return result.rows.length > 0;
    } catch (error) {
      this.logger.error(`Error deleting entity ${id}: ${error.message}`, {
        id,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Find entities by a field value
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @returns {Promise<Array<Entity>>} Promise resolving to array of entities
   */
  async findByField(field, value) {
    try {
      const sanitizedField = this._sanitizeColumnName(field);
      
      const query = `SELECT * FROM ${this.tableName} WHERE ${sanitizedField} = $1`;
      const result = await this.client.query(query, [value]);
      
      return result.rows.map(row => this._rowToEntity(row));
    } catch (error) {
      this.logger.error(`Error finding entities by field ${field}: ${error.message}`, {
        field,
        value,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Convert a database row to an entity
   * @param {Object} row - Database row
   * @returns {Entity} Entity instance
   * @private
   */
  _rowToEntity(row) {
    // Map from DB column names to Entity property names
    return new Entity({
      id: row.entity_id,
      name: row.name,
      description: row.description,
      // Map other fields as needed
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Convert an entity to a database object
   * @param {Entity} entity - Entity instance
   * @returns {Object} Database object
   * @private
   */
  _entityToDb(entity) {
    // Map from Entity property names to DB column names
    return {
      entity_id: entity.id,
      name: entity.name,
      description: entity.description,
      // Map other fields as needed
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }

  /**
   * Build a WHERE clause from filters
   * @param {Object} filters - Filter criteria
   * @returns {Object} Object with whereClause and filterParams
   * @private
   */
  _buildWhereClause(filters) {
    const clauses = [];
    const filterParams = [];
    
    // Process each filter
    Object.entries(filters).forEach(([key, value]) => {
      const sanitizedKey = this._sanitizeColumnName(key);
      
      if (value === null) {
        clauses.push(`${sanitizedKey} IS NULL`);
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          const placeholders = value.map((_, i) => `$${filterParams.length + i + 1}`).join(', ');
          clauses.push(`${sanitizedKey} IN (${placeholders})`);
          filterParams.push(...value);
        }
      } else if (typeof value === 'object') {
        // Handle special operators
        if (value.$lt !== undefined) {
          clauses.push(`${sanitizedKey} < $${filterParams.length + 1}`);
          filterParams.push(value.$lt);
        }
        if (value.$lte !== undefined) {
          clauses.push(`${sanitizedKey} <= $${filterParams.length + 1}`);
          filterParams.push(value.$lte);
        }
        if (value.$gt !== undefined) {
          clauses.push(`${sanitizedKey} > $${filterParams.length + 1}`);
          filterParams.push(value.$gt);
        }
        if (value.$gte !== undefined) {
          clauses.push(`${sanitizedKey} >= $${filterParams.length + 1}`);
          filterParams.push(value.$gte);
        }
        if (value.$ne !== undefined) {
          clauses.push(`${sanitizedKey} != $${filterParams.length + 1}`);
          filterParams.push(value.$ne);
        }
        if (value.$like !== undefined) {
          clauses.push(`${sanitizedKey} LIKE $${filterParams.length + 1}`);
          filterParams.push(value.$like);
        }
        if (value.$ilike !== undefined) {
          clauses.push(`${sanitizedKey} ILIKE $${filterParams.length + 1}`);
          filterParams.push(value.$ilike);
        }
      } else {
        clauses.push(`${sanitizedKey} = $${filterParams.length + 1}`);
        filterParams.push(value);
      }
    });
    
    return {
      whereClause: clauses.join(' AND '),
      filterParams
    };
  }

  /**
   * Sanitize a column name to prevent SQL injection
   * @param {string} columnName - Column name to sanitize
   * @returns {string} Sanitized column name
   * @private
   */
  _sanitizeColumnName(columnName) {
    // Simple validation to prevent SQL injection in column names
    // Only allow alphanumeric characters, underscores, and snake_case
    if (!/^[a-zA-Z0-9_]+$/.test(columnName)) {
      throw new Error(`Invalid column name: ${columnName}`);
    }
    
    return columnName;
  }
}

module.exports = PostgresEntityRepository;
