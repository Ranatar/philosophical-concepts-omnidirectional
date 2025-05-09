/**
 * Neo4j driver for the philosophy service
 * Provides a configured driver instance and utility methods for database operations
 */

const neo4j = require('neo4j-driver');
const { defaultLogger } = require('../../logging/logger');

// Default configuration
const DEFAULT_CONFIG = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  user: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'password',
  database: process.env.NEO4J_DATABASE || null, // Default database if not specified
  maxConnectionPoolSize: process.env.NEO4J_MAX_CONN_POOL_SIZE ? parseInt(process.env.NEO4J_MAX_CONN_POOL_SIZE, 10) : 100,
  connectionAcquisitionTimeout: 60000, // 60 seconds
  connectionTimeout: 30000, // 30 seconds
  maxTransactionRetryTime: 30000, // 30 seconds
  logging: {
    level: process.env.NEO4J_LOGGING_LEVEL || 'warn',
    logger: (level, message) => {
      const methods = {
        error: 'error',
        warn: 'warn',
        info: 'info',
        debug: 'debug'
      };
      const method = methods[level] || 'info';
      defaultLogger[method](message);
    }
  }
};

/**
 * Neo4j client class
 */
class Neo4jDriver {
  /**
   * Create a new Neo4j driver
   * @param {Object} [config] - Configuration options
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(config = {}, logger = defaultLogger) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = logger;
    this.driver = null;
    this.isConnected = false;
  }
  
  /**
   * Initialize the Neo4j driver
   * @returns {neo4j.Driver} The Neo4j driver instance
   */
  initialize() {
    if (!this.driver) {
      this.logger.info('Initializing Neo4j driver', {
        uri: this.config.uri,
        user: this.config.user,
        database: this.config.database
      });
      
      try {
        this.driver = neo4j.driver(
          this.config.uri,
          neo4j.auth.basic(this.config.user, this.config.password),
          {
            maxConnectionPoolSize: this.config.maxConnectionPoolSize,
            connectionAcquisitionTimeout: this.config.connectionAcquisitionTimeout,
            connectionTimeout: this.config.connectionTimeout,
            maxTransactionRetryTime: this.config.maxTransactionRetryTime,
            logging: this.config.logging
          }
        );
        
        this.isConnected = true;
      } catch (err) {
        this.logger.error('Failed to initialize Neo4j driver', {
          error: err.message,
          stack: err.stack
        });
        throw err;
      }
    }
    
    return this.driver;
  }
  
  /**
   * Get the driver instance
   * @returns {neo4j.Driver} The Neo4j driver instance
   */
  getDriver() {
    if (!this.driver) {
      return this.initialize();
    }
    return this.driver;
  }
  
  /**
   * Create a session
   * @param {Object} [options] - Session options
   * @param {string} [options.database] - Database name
   * @param {string} [options.defaultAccessMode] - Default access mode (READ or WRITE)
   * @param {object} [options.bookmarks] - Bookmarks for causal consistency
   * @returns {neo4j.Session} Neo4j session
   */
  createSession(options = {}) {
    const driver = this.getDriver();
    
    const sessionOptions = {};
    
    if (options.database || this.config.database) {
      sessionOptions.database = options.database || this.config.database;
    }
    
    if (options.defaultAccessMode) {
      sessionOptions.defaultAccessMode = options.defaultAccessMode;
    }
    
    if (options.bookmarks) {
      sessionOptions.bookmarks = options.bookmarks;
    }
    
    return driver.session(sessionOptions);
  }
  
  /**
   * Execute a Cypher query
   * @param {string} cypher - Cypher query
   * @param {Object} [params={}] - Query parameters
   * @param {Object} [options={}] - Session options
   * @returns {Promise<Array>} Query results
   */
  async run(cypher, params = {}, options = {}) {
    const session = this.createSession(options);
    const start = Date.now();
    
    try {
      this.logger.debug('Executing Neo4j query', {
        cypher,
        params
      });
      
      const result = await session.run(cypher, params);
      const duration = Date.now() - start;
      
      this.logger.debug('Neo4j query completed', {
        cypher,
        duration,
        recordCount: result.records.length
      });
      
      return result.records;
    } catch (err) {
      const duration = Date.now() - start;
      this.logger.error('Error executing Neo4j query', {
        cypher,
        params,
        duration,
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    } finally {
      session.close();
    }
  }
  
  /**
   * Execute a read transaction
   * @param {Function} work - Transaction function
   * @param {Object} [options={}] - Session options
   * @returns {Promise<*>} Transaction result
   */
  async readTransaction(work, options = {}) {
    const session = this.createSession({
      ...options,
      defaultAccessMode: neo4j.session.READ
    });
    
    try {
      return await session.readTransaction(work);
    } finally {
      session.close();
    }
  }
  
  /**
   * Execute a write transaction
   * @param {Function} work - Transaction function
   * @param {Object} [options={}] - Session options
   * @returns {Promise<*>} Transaction result
   */
  async writeTransaction(work, options = {}) {
    const session = this.createSession({
      ...options,
      defaultAccessMode: neo4j.session.WRITE
    });
    
    try {
      return await session.writeTransaction(work);
    } finally {
      session.close();
    }
  }
  
  /**
   * Check if the database connection is healthy
   * @returns {Promise<boolean>} Whether the connection is healthy
   */
  async healthCheck() {
    try {
      await this.run('RETURN 1 as n');
      return true;
    } catch (err) {
      this.logger.error('Neo4j health check failed', {
        error: err.message
      });
      return false;
    }
  }
  
  /**
   * Close the driver
   * @returns {Promise<void>}
   */
  async close() {
    if (this.driver) {
      this.logger.info('Closing Neo4j driver');
      await this.driver.close();
      this.driver = null;
      this.isConnected = false;
    }
  }
  
  /**
   * Convert Neo4j record to plain object
   * @param {neo4j.Record} record - Neo4j record
   * @returns {Object} Plain object
   */
  static recordToObject(record) {
    if (!record) return null;
    
    const result = {};
    const keys = record.keys;
    
    for (const key of keys) {
      const value = record.get(key);
      result[key] = Neo4jDriver.valueToObject(value);
    }
    
    return result;
  }
  
  /**
   * Convert Neo4j value to plain object/value
   * @param {*} value - Neo4j value
   * @returns {*} Plain object/value
   */
  static valueToObject(value) {
    if (value === null || value === undefined) {
      return value;
    }
    
    // Convert Neo4j Node to plain object
    if (neo4j.isNode(value)) {
      const node = {
        id: value.identity.toString(),
        labels: value.labels,
        properties: { ...value.properties }
      };
      
      // Convert date properties
      Object.keys(node.properties).forEach(key => {
        if (neo4j.isDateTime(node.properties[key])) {
          node.properties[key] = node.properties[key].toString();
        }
      });
      
      return node;
    }
    
    // Convert Neo4j Relationship to plain object
    if (neo4j.isRelationship(value)) {
      const relationship = {
        id: value.identity.toString(),
        type: value.type,
        startNodeId: value.start.toString(),
        endNodeId: value.end.toString(),
        properties: { ...value.properties }
      };
      
      // Convert date properties
      Object.keys(relationship.properties).forEach(key => {
        if (neo4j.isDateTime(relationship.properties[key])) {
          relationship.properties[key] = relationship.properties[key].toString();
        }
      });
      
      return relationship;
    }
    
    // Convert Neo4j Path to plain object
    if (neo4j.isPath(value)) {
      return {
        segments: value.segments.map(segment => ({
          start: Neo4jDriver.valueToObject(segment.start),
          relationship: Neo4jDriver.valueToObject(segment.relationship),
          end: Neo4jDriver.valueToObject(segment.end)
        }))
      };
    }
    
    // Convert Neo4j DateTime to ISO string
    if (neo4j.isDateTime(value)) {
      return value.toString();
    }
    
    // Convert Neo4j Int to number
    if (neo4j.isInt(value)) {
      return value.toNumber();
    }
    
    // Convert arrays recursively
    if (Array.isArray(value)) {
      return value.map(item => Neo4jDriver.valueToObject(item));
    }
    
    // Convert objects recursively
    if (typeof value === 'object') {
      const result = {};
      for (const key of Object.keys(value)) {
        result[key] = Neo4jDriver.valueToObject(value[key]);
      }
      return result;
    }
    
    // Return primitive values as is
    return value;
  }
  
  /**
   * Convert Neo4j records to plain objects
   * @param {Array<neo4j.Record>} records - Neo4j records
   * @returns {Array<Object>} Plain objects
   */
  static recordsToObjects(records) {
    if (!records) return [];
    return records.map(record => Neo4jDriver.recordToObject(record));
  }
}

// Create and export default instance
const defaultDriver = new Neo4jDriver();

module.exports = {
  neo4j,
  Neo4jDriver,
  defaultDriver
};
