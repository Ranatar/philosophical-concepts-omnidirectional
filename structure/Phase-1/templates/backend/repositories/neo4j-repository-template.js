/**
 * Template for Neo4j repositories
 * Replace all instances of `GraphEntity` with the actual entity name
 * Replace all instances of `graphEntity` with the lowercase entity name
 * Replace the label and relationship types as appropriate
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { driver } = require('../../../shared/lib/db/neo4j/driver');
const { GraphEntity, GraphRelationship } = require('../../../shared/models/Graph');

/**
 * Repository for GraphEntity in Neo4j
 */
class Neo4jGraphEntityRepository {
  /**
   * Create a new Neo4jGraphEntityRepository
   * @param {Object} [options={}] - Repository options
   * @param {Object} [options.driver] - Neo4j driver instance
   * @param {string} [options.label='GraphEntity'] - Node label
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(options = {}, logger = defaultLogger) {
    this.driver = options.driver || driver;
    this.label = options.label || 'GraphEntity';
    this.logger = logger;
  }

  /**
   * Find all graph entities
   * @param {Object} [options={}] - Query options
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.skip] - Number of results to skip
   * @param {string} [options.orderBy] - Property to order by
   * @param {string} [options.orderDirection='ASC'] - Order direction ('ASC' or 'DESC')
   * @param {Object} [options.filters={}] - Filter criteria
   * @returns {Promise<Array<GraphEntity>>} Promise resolving to array of graph entities
   */
  async findAll(options = {}) {
    const session = this.driver.session();
    
    try {
      const { 
        limit, 
        skip, 
        orderBy, 
        orderDirection = 'ASC', 
        filters = {} 
      } = options;
      
      // Build the query
      let queryParts = [`MATCH (n:${this.label})`];
      let queryParams = {};
      
      // Add filters if provided
      if (Object.keys(filters).length > 0) {
        const { whereClause, filterParams } = this._buildWhereClause(filters);
        
        if (whereClause) {
          queryParts.push(`WHERE ${whereClause}`);
          queryParams = { ...queryParams, ...filterParams };
        }
      }
      
      // Add return clause
      queryParts.push('RETURN n');
      
      // Add ordering if provided
      if (orderBy) {
        queryParts.push(`ORDER BY n.${orderBy} ${orderDirection}`);
      }
      
      // Add pagination
      if (limit !== undefined) {
        queryParts.push('LIMIT $limit');
        queryParams.limit = limit;
        
        if (skip !== undefined) {
          queryParts.push('SKIP $skip');
          queryParams.skip = skip;
        }
      }
      
      // Execute the query
      const result = await session.run(queryParts.join(' '), queryParams);
      
      // Convert records to graph entities
      return result.records.map(record => {
        const node = record.get('n');
        return this._nodeToEntity(node);
      });
    } catch (error) {
      this.logger.error(`Error finding graph entities: ${error.message}`, {
        options,
        stack: error.stack
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Find a graph entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise<GraphEntity|null>} Promise resolving to entity or null if not found
   */
  async findById(id) {
    const session = this.driver.session();
    
    try {
      const query = `
        MATCH (n:${this.label} {entity_id: $id})
        RETURN n
      `;
      
      const result = await session.run(query, { id });
      
      if (result.records.length === 0) {
        return null;
      }
      
      const node = result.records[0].get('n');
      return this._nodeToEntity(node);
    } catch (error) {
      this.logger.error(`Error finding graph entity by ID ${id}: ${error.message}`, {
        id,
        stack: error.stack
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Check if a graph entity exists
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} Promise resolving to whether entity exists
   */
  async exists(id) {
    const session = this.driver.session();
    
    try {
      const query = `
        MATCH (n:${this.label} {entity_id: $id})
        RETURN COUNT(n) > 0 AS exists
      `;
      
      const result = await session.run(query, { id });
      
      return result.records[0].get('exists');
    } catch (error) {
      this.logger.error(`Error checking if graph entity exists: ${error.message}`, {
        id,
        stack: error.stack
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create a new graph entity
   * @param {GraphEntity} entity - Entity to create
   * @returns {Promise<GraphEntity>} Promise resolving to created entity
   */
  async create(entity) {
    const session = this.driver.session();
    
    try {
      const properties = this._entityToProperties(entity);
      
      const query = `
        CREATE (n:${this.label} $properties)
        RETURN n
      `;
      
      const result = await session.run(query, { properties });
      
      const node = result.records[0].get('n');
      return this._nodeToEntity(node);
    } catch (error) {
      this.logger.error(`Error creating graph entity: ${error.message}`, {
        entity,
        stack: error.stack
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Update a graph entity
   * @param {string} id - Entity ID
   * @param {GraphEntity} entity - Entity with updated values
   * @returns {Promise<GraphEntity>} Promise resolving to updated entity
   */
  async update(id, entity) {
    const session = this.driver.session();
    
    try {
      const properties = this._entityToProperties(entity);
      
      // Remove id from properties (since we're using it in the MATCH clause)
      delete properties.entity_id;
      
      const query = `
        MATCH (n:${this.label} {entity_id: $id})
        SET n += $properties
        RETURN n
      `;
      
      const result = await session.run(query, { id, properties });
      
      if (result.records.length === 0) {
        return null;
      }
      
      const node = result.records[0].get('n');
      return this._nodeToEntity(node);
    } catch (error) {
      this.logger.error(`Error updating graph entity ${id}: ${error.message}`, {
        id,
        entity,
        stack: error.stack
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Delete a graph entity
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} Promise resolving to whether the entity was deleted
   */
  async delete(id) {
    const session = this.driver.session();
    
    try {
      const query = `
        MATCH (n:${this.label} {entity_id: $id})
        DETACH DELETE n
        RETURN COUNT(n) > 0 AS deleted
      `;
      
      const result = await session.run(query, { id });
      
      return result.records[0].get('deleted');
    } catch (error) {
      this.logger.error(`Error deleting graph entity ${id}: ${error.message}`, {
        id,
        stack: error.stack
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Find graph entities connected to a specific entity
   * @param {string} id - Entity ID
   * @param {string} [relationshipType] - Relationship type (optional)
   * @param {string} [direction='OUTGOING'] - Relationship direction ('OUTGOING', 'INCOMING', or 'BOTH')
   * @returns {Promise<Array<Object>>} Promise resolving to array of { entity, relationship } objects
   */
  async findConnected(id, relationshipType, direction = 'OUTGOING') {
    const session = this.driver.session();
    
    try {
      // Build relationship pattern based on direction
      let relationshipPattern;
      if (direction === 'OUTGOING') {
        relationshipPattern = '-[r]->';
      } else if (direction === 'INCOMING') {
        relationshipPattern = '<-[r]-';
      } else {
        relationshipPattern = '-[r]-';
      }
      
      // Add relationship type if provided
      if (relationshipType) {
        relationshipPattern = relationshipPattern.replace('r', `r:${relationshipType}`);
      }
      
      const query = `
        MATCH (n:${this.label} {entity_id: $id})${relationshipPattern}(m:${this.label})
        RETURN m, r
      `;
      
      const result = await session.run(query, { id });
      
      return result.records.map(record => {
        const connectedNode = record.get('m');
        const relationship = record.get('r');
        
        return {
          entity: this._nodeToEntity(connectedNode),
          relationship: this._relationshipToObject(relationship)
        };
      });
    } catch (error) {
      this.logger.error(`Error finding connected graph entities: ${error.message}`, {
        id,
        relationshipType,
        direction,
        stack: error.stack
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create a relationship between two graph entities
   * @param {string} fromId - ID of the source entity
   * @param {string} toId - ID of the target entity
   * @param {string} relationshipType - Relationship type
   * @param {Object} [properties={}] - Relationship properties
   * @returns {Promise<Object>} Promise resolving to created relationship
   */
  async createRelationship(fromId, toId, relationshipType, properties = {}) {
    const session = this.driver.session();
    
    try {
      const query = `
        MATCH (from:${this.label} {entity_id: $fromId})
        MATCH (to:${this.label} {entity_id: $toId})
        CREATE (from)-[r:${relationshipType} $properties]->(to)
        RETURN r
      `;
      
      const result = await session.run(query, { fromId, toId, properties });
      
      if (result.records.length === 0) {
        return null;
      }
      
      const relationship = result.records[0].get('r');
      return this._relationshipToObject(relationship);
    } catch (error) {
      this.logger.error(`Error creating relationship: ${error.message}`, {
        fromId,
        toId,
        relationshipType,
        properties,
        stack: error.stack
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Update a relationship between two graph entities
   * @param {string} fromId - ID of the source entity
   * @param {string} toId - ID of the target entity
   * @param {string} relationshipType - Relationship type
   * @param {Object} properties - Relationship properties
   * @returns {Promise<Object>} Promise resolving to updated relationship
   */
  async updateRelationship(fromId, toId, relationshipType, properties) {
    const session = this.driver.session();
    
    try {
      const query = `
        MATCH (from:${this.label} {entity_id: $fromId})-[r:${relationshipType}]->(to:${this.label} {entity_id: $toId})
        SET r += $properties
        RETURN r
      `;
      
      const result = await session.run(query, { fromId, toId, properties });
      
      if (result.records.length === 0) {
        return null;
      }
      
      const relationship = result.records[0].get('r');
      return this._relationshipToObject(relationship);
    } catch (error) {
      this.logger.error(`Error updating relationship: ${error.message}`, {
        fromId,
        toId,
        relationshipType,
        properties,
        stack: error.stack
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Delete a relationship between two graph entities
   * @param {string} fromId - ID of the source entity
   * @param {string} toId - ID of the target entity
   * @param {string} [relationshipType] - Relationship type (optional)
   * @returns {Promise<boolean>} Promise resolving to whether the relationship was deleted
   */
  async deleteRelationship(fromId, toId, relationshipType) {
    const session = this.driver.session();
    
    try {
      // Build relationship pattern
      let relationshipPattern = 'r';
      if (relationshipType) {
        relationshipPattern = `r:${relationshipType}`;
      }
      
      const query = `
        MATCH (from:${this.label} {entity_id: $fromId})-[${relationshipPattern}]->(to:${this.label} {entity_id: $toId})
        DELETE r
        RETURN COUNT(r) > 0 AS deleted
      `;
      
      const result = await session.run(query, { fromId, toId });
      
      return result.records[0].get('deleted');
    } catch (error) {
      this.logger.error(`Error deleting relationship: ${error.message}`, {
        fromId,
        toId,
        relationshipType,
        stack: error.stack
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Find entities by a property value
   * @param {string} property - Property name
   * @param {*} value - Property value
   * @returns {Promise<Array<GraphEntity>>} Promise resolving to array of entities
   */
  async findByProperty(property, value) {
    const session = this.driver.session();
    
    try {
      const query = `
        MATCH (n:${this.label})
        WHERE n.${property} = $value
        RETURN n
      `;
      
      const result = await session.run(query, { value });
      
      return result.records.map(record => {
        const node = record.get('n');
        return this._nodeToEntity(node);
      });
    } catch (error) {
      this.logger.error(`Error finding entities by property ${property}: ${error.message}`, {
        property,
        value,
        stack: error.stack
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Run a custom Cypher query
   * @param {string} query - Cypher query
   * @param {Object} [params={}] - Query parameters
   * @returns {Promise<Array<Object>>} Promise resolving to query results
   */
  async runCustomQuery(query, params = {}) {
    const session = this.driver.session();
    
    try {
      const result = await session.run(query, params);
      
      return result.records.map(record => {
        const obj = {};
        
        record.keys.forEach(key => {
          const value = record.get(key);
          
          if (value && value.constructor && value.constructor.name === 'Node') {
            obj[key] = this._nodeToEntity(value);
          } else if (value && value.constructor && value.constructor.name === 'Relationship') {
            obj[key] = this._relationshipToObject(value);
          } else {
            obj[key] = value;
          }
        });
        
        return obj;
      });
    } catch (error) {
      this.logger.error(`Error running custom query: ${error.message}`, {
        query,
        params,
        stack: error.stack
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Convert a Neo4j node to a graph entity
   * @param {Object} node - Neo4j node
   * @returns {GraphEntity} Graph entity
   * @private
   */
  _nodeToEntity(node) {
    const properties = node.properties;
    
    // Map Neo4j node properties to GraphEntity properties
    return new GraphEntity({
      id: properties.entity_id,
      name: properties.name,
      type: properties.type,
      // Map other properties as needed
      createdAt: properties.created_at,
      updatedAt: properties.updated_at
    });
  }

  /**
   * Convert a graph entity to Neo4j node properties
   * @param {GraphEntity} entity - Graph entity
   * @returns {Object} Neo4j node properties
   * @private
   */
  _entityToProperties(entity) {
    // Map GraphEntity properties to Neo4j node properties
    return {
      entity_id: entity.id,
      name: entity.name,
      type: entity.type,
      // Map other properties as needed
      created_at: entity.createdAt instanceof Date 
        ? entity.createdAt.toISOString() 
        : entity.createdAt,
      updated_at: entity.updatedAt instanceof Date 
        ? entity.updatedAt.toISOString() 
        : entity.updatedAt
    };
  }

  /**
   * Convert a Neo4j relationship to an object
   * @param {Object} relationship - Neo4j relationship
   * @returns {Object} Relationship object
   * @private
   */
  _relationshipToObject(relationship) {
    return {
      id: relationship.identity.toString(),
      type: relationship.type,
      properties: relationship.properties,
      startNodeId: relationship.start.toString(),
      endNodeId: relationship.end.toString()
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
    const filterParams = {};
    
    // Process each filter
    Object.entries(filters).forEach(([key, value]) => {
      // Create a parameter name that is safe for Neo4j
      const paramName = key.replace(/[^a-zA-Z0-9]/g, '_');
      
      if (value === null) {
        clauses.push(`n.${key} IS NULL`);
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          clauses.push(`n.${key} IN $${paramName}`);
          filterParams[paramName] = value;
        }
      } else if (typeof value === 'object') {
        // Handle special operators
        if (value.$lt !== undefined) {
          clauses.push(`n.${key} < $${paramName}_lt`);
          filterParams[`${paramName}_lt`] = value.$lt;
        }
        if (value.$lte !== undefined) {
          clauses.push(`n.${key} <= $${paramName}_lte`);
          filterParams[`${paramName}_lte`] = value.$lte;
        }
        if (value.$gt !== undefined) {
          clauses.push(`n.${key} > $${paramName}_gt`);
          filterParams[`${paramName}_gt`] = value.$gt;
        }
        if (value.$gte !== undefined) {
          clauses.push(`n.${key} >= $${paramName}_gte`);
          filterParams[`${paramName}_gte`] = value.$gte;
        }
        if (value.$ne !== undefined) {
          clauses.push(`n.${key} <> $${paramName}_ne`);
          filterParams[`${paramName}_ne`] = value.$ne;
        }
        if (value.$contains !== undefined) {
          clauses.push(`n.${key} CONTAINS $${paramName}_contains`);
          filterParams[`${paramName}_contains`] = value.$contains;
        }
        if (value.$startsWith !== undefined) {
          clauses.push(`n.${key} STARTS WITH $${paramName}_startsWith`);
          filterParams[`${paramName}_startsWith`] = value.$startsWith;
        }
        if (value.$endsWith !== undefined) {
          clauses.push(`n.${key} ENDS WITH $${paramName}_endsWith`);
          filterParams[`${paramName}_endsWith`] = value.$endsWith;
        }
      } else {
        clauses.push(`n.${key} = $${paramName}`);
        filterParams[paramName] = value;
      }
    });
    
    return {
      whereClause: clauses.join(' AND '),
      filterParams
    };
  }
}

module.exports = Neo4jGraphEntityRepository;
