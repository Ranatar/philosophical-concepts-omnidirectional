/**
 * Neo4j driver configuration for the Philosophy Service
 * Provides connection management and query utilities
 */

const neo4j = require('neo4j-driver');
const { logger } = require('../../logging/logger');
const { DatabaseMetrics } = require('../../metrics/prometheus');

// Neo4j connection configuration
const defaultConfig = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  username: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'neo4j',
  database: process.env.NEO4J_DATABASE || 'neo4j',
  
  // Driver configuration
  maxConnectionPoolSize: parseInt(process.env.NEO4J_POOL_SIZE) || 50,
  connectionAcquisitionTimeout: parseInt(process.env.NEO4J_CONNECTION_TIMEOUT) || 60000,
  maxTransactionRetryTime: parseInt(process.env.NEO4J_RETRY_TIME) || 30000,
  
  // Logging
  logging: {
    level: process.env.NEO4J_LOG_LEVEL || 'info',
    logger: (level, message) => {
      logger[level](`Neo4j: ${message}`);
    }
  }
};

/**
 * Neo4j driver wrapper with enhanced functionality
 */
class Neo4jDriver {
  constructor(config = {}, serviceName = 'unknown') {
    this.config = { ...defaultConfig, ...config };
    this.serviceName = serviceName;
    this.driver = null;
    this.metrics = new DatabaseMetrics('neo4j', serviceName);
    this.isConnected = false;
  }

  /**
   * Initialize the driver connection
   */
  async connect() {
    if (this.driver) {
      logger.warn('Neo4j driver already initialized');
      return;
    }

    try {
      // Create driver instance
      this.driver = neo4j.driver(
        this.config.uri,
        neo4j.auth.basic(this.config.username, this.config.password),
        {
          maxConnectionPoolSize: this.config.maxConnectionPoolSize,
          connectionAcquisitionTimeout: this.config.connectionAcquisitionTimeout,
          maxTransactionRetryTime: this.config.maxTransactionRetryTime,
          logging: this.config.logging
        }
      );

      // Verify connectivity
      await this.driver.verifyConnectivity();
      this.isConnected = true;
      
      logger.info('Neo4j driver initialized', {
        service: this.serviceName,
        uri: this.config.uri,
        database: this.config.database
      });

      // Start metrics collection
      this.startMetricsCollection();
      
    } catch (error) {
      logger.error('Failed to initialize Neo4j connection', {
        error,
        service: this.serviceName,
        uri: this.config.uri
      });
      throw error;
    }
  }

  /**
   * Get a session for executing queries
   * @param {Object} options - Session options
   * @returns {Session} Neo4j session
   */
  getSession(options = {}) {
    if (!this.driver) {
      throw new Error('Neo4j driver not connected');
    }

    const sessionConfig = {
      database: options.database || this.config.database,
      defaultAccessMode: options.accessMode || neo4j.session.WRITE
    };

    return this.driver.session(sessionConfig);
  }

  /**
   * Execute a read query with automatic session management
   * @param {string} cypher - Cypher query
   * @param {Object} params - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result
   */
  async read(cypher, params = {}, options = {}) {
    return this.executeQuery(cypher, params, { ...options, accessMode: neo4j.session.READ });
  }

  /**
   * Execute a write query with automatic session management
   * @param {string} cypher - Cypher query
   * @param {Object} params - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result
   */
  async write(cypher, params = {}, options = {}) {
    return this.executeQuery(cypher, params, { ...options, accessMode: neo4j.session.WRITE });
  }

  /**
   * Execute a query with automatic session and transaction management
   * @param {string} cypher - Cypher query
   * @param {Object} params - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result
   */
  async executeQuery(cypher, params = {}, options = {}) {
    const {
      database = this.config.database,
      accessMode = neo4j.session.WRITE,
      metadata = {},
      timeout = 30000
    } = options;

    const session = this.getSession({ database, accessMode });
    const start = Date.now();
    
    try {
      // Execute query with timeout
      const result = await session.executeRead(async tx => {
        return tx.run(cypher, params, { metadata, timeout });
      });
      
      // Record metrics
      const duration = Date.now() - start;
      this.metrics.recordQuery(
        accessMode === neo4j.session.READ ? 'read' : 'write',
        this.extractNodeLabel(cypher),
        duration,
        true
      );
      
      // Log slow queries
      if (duration > 1000) {
        logger.warn('Slow Neo4j query detected', {
          query: cypher.substring(0, 200),
          duration,
          service: this.serviceName
        });
      }

      // Transform result for easier consumption
      return this.transformResult(result);
      
    } catch (error) {
      // Record failed query metric
      this.metrics.recordQuery(
        accessMode === neo4j.session.READ ? 'read' : 'write',
        this.extractNodeLabel(cypher),
        Date.now() - start,
        false
      );
      
      logger.error('Neo4j query failed', {
        error,
        query: cypher.substring(0, 200),
        service: this.serviceName
      });
      
      throw error;
      
    } finally {
      await session.close();
    }
  }

  /**
   * Execute multiple queries in a transaction
   * @param {Function} work - Transaction work function
   * @param {Object} options - Transaction options
   * @returns {Promise<any>} Transaction result
   */
  async transaction(work, options = {}) {
    const {
      database = this.config.database,
      accessMode = neo4j.session.WRITE,
      metadata = {},
      timeout = 60000
    } = options;

    const session = this.getSession({ database, accessMode });
    const start = Date.now();
    
    try {
      const result = await session.executeWrite(async tx => {
        // Create transaction wrapper with metrics
        const wrappedTx = {
          run: async (cypher, params = {}) => {
            const queryStart = Date.now();
            try {
              const result = await tx.run(cypher, params, { metadata, timeout });
              this.metrics.recordQuery('transaction', this.extractNodeLabel(cypher), Date.now() - queryStart, true);
              return this.transformResult(result);
            } catch (error) {
              this.metrics.recordQuery('transaction', this.extractNodeLabel(cypher), Date.now() - queryStart, false);
              throw error;
            }
          },
          
          // Convenience methods
          create: (node, labels, properties) => this.createNode(node, labels, properties, wrappedTx),
          match: (pattern, where) => this.matchNodes(pattern, where, wrappedTx),
          merge: (pattern, onCreate, onMatch) => this.mergeNode(pattern, onCreate, onMatch, wrappedTx)
        };
        
        return work(wrappedTx);
      });
      
      this.metrics.recordQuery('transaction', 'transaction', Date.now() - start, true);
      
      return result;
      
    } catch (error) {
      this.metrics.recordQuery('transaction', 'transaction', Date.now() - start, false);
      
      logger.error('Neo4j transaction failed', {
        error,
        service: this.serviceName
      });
      
      throw error;
      
    } finally {
      await session.close();
    }
  }

  /**
   * Create a node
   * @param {string} variable - Variable name for the node
   * @param {string|Array<string>} labels - Node labels
   * @param {Object} properties - Node properties
   * @param {Object} tx - Transaction object (optional)
   * @returns {Promise<Object>} Created node
   */
  async createNode(variable, labels, properties, tx = null) {
    const labelString = Array.isArray(labels) ? labels.join(':') : labels;
    const cypher = `CREATE (${variable}:${labelString} $props) RETURN ${variable}`;
    
    if (tx) {
      const result = await tx.run(cypher, { props: properties });
      return result.records[0]?.get(variable);
    } else {
      const result = await this.write(cypher, { props: properties });
      return result.records[0]?.get(variable);
    }
  }

  /**
   * Match nodes
   * @param {string} pattern - Match pattern
   * @param {Object} where - WHERE conditions
   * @param {Object} tx - Transaction object (optional)
   * @returns {Promise<Array>} Matched nodes
   */
  async matchNodes(pattern, where = {}, tx = null) {
    let cypher = `MATCH ${pattern}`;
    
    if (Object.keys(where).length > 0) {
      const conditions = Object.entries(where)
        .map(([key, value]) => `${key} = $${key}`)
        .join(' AND ');
      cypher += ` WHERE ${conditions}`;
    }
    
    cypher += ' RETURN *';
    
    if (tx) {
      const result = await tx.run(cypher, where);
      return result.records;
    } else {
      const result = await this.read(cypher, where);
      return result.records;
    }
  }

  /**
   * Merge a node (create if not exists)
   * @param {string} pattern - Merge pattern
   * @param {Object} onCreate - Properties to set on create
   * @param {Object} onMatch - Properties to set on match
   * @param {Object} tx - Transaction object (optional)
   * @returns {Promise<Object>} Merged node
   */
  async mergeNode(pattern, onCreate = {}, onMatch = {}, tx = null) {
    let cypher = `MERGE ${pattern}`;
    
    if (Object.keys(onCreate).length > 0) {
      cypher += ' ON CREATE SET n += $onCreate';
    }
    
    if (Object.keys(onMatch).length > 0) {
      cypher += ' ON MATCH SET n += $onMatch';
    }
    
    cypher += ' RETURN n';
    
    const params = { onCreate, onMatch };
    
    if (tx) {
      const result = await tx.run(cypher, params);
      return result.records[0]?.get('n');
    } else {
      const result = await this.write(cypher, params);
      return result.records[0]?.get('n');
    }
  }

  /**
   * Create a relationship
   * @param {string} startNode - Start node pattern
   * @param {string} relType - Relationship type
   * @param {Object} relProps - Relationship properties
   * @param {string} endNode - End node pattern
   * @param {Object} tx - Transaction object (optional)
   * @returns {Promise<Object>} Created relationship
   */
  async createRelationship(startNode, relType, relProps, endNode, tx = null) {
    const cypher = `
      MATCH ${startNode}, ${endNode}
      CREATE (a)-[r:${relType} $props]->(b)
      RETURN r
    `;
    
    if (tx) {
      const result = await tx.run(cypher, { props: relProps });
      return result.records[0]?.get('r');
    } else {
      const result = await this.write(cypher, { props: relProps });
      return result.records[0]?.get('r');
    }
  }

  /**
   * Delete nodes and relationships
   * @param {string} pattern - Pattern to match
   * @param {Object} where - WHERE conditions
   * @param {boolean} detach - Whether to detach delete
   * @param {Object} tx - Transaction object (optional)
   * @returns {Promise<Object>} Delete summary
   */
  async delete(pattern, where = {}, detach = true, tx = null) {
    let cypher = `MATCH ${pattern}`;
    
    if (Object.keys(where).length > 0) {
      const conditions = Object.entries(where)
        .map(([key, value]) => `${key} = $${key}`)
        .join(' AND ');
      cypher += ` WHERE ${conditions}`;
    }
    
    cypher += detach ? ' DETACH DELETE n' : ' DELETE n';
    
    if (tx) {
      return tx.run(cypher, where);
    } else {
      return this.write(cypher, where);
    }
  }

  /**
   * Transform Neo4j result to a more convenient format
   * @param {Result} result - Neo4j query result
   * @returns {Object} Transformed result
   */
  transformResult(result) {
    return {
      records: result.records.map(record => {
        const obj = {};
        record.keys.forEach(key => {
          const value = record.get(key);
          obj[key] = this.transformValue(value);
        });
        return obj;
      }),
      summary: {
        query: result.summary.query.text,
        parameters: result.summary.query.parameters,
        queryType: result.summary.queryType,
        counters: result.summary.counters,
        updateStatistics: result.summary.updateStatistics,
        executionTime: result.summary.resultAvailableAfter?.toNumber() || 0,
        consumedTime: result.summary.resultConsumedAfter?.toNumber() || 0
      }
    };
  }

  /**
   * Transform Neo4j value to JavaScript value
   * @param {any} value - Neo4j value
   * @returns {any} JavaScript value
   */
  transformValue(value) {
    if (neo4j.isInt(value)) {
      return value.toNumber();
    } else if (neo4j.isNode(value)) {
      return {
        id: value.identity.toNumber(),
        labels: value.labels,
        properties: value.properties
      };
    } else if (neo4j.isRelationship(value)) {
      return {
        id: value.identity.toNumber(),
        type: value.type,
        startNodeId: value.start.toNumber(),
        endNodeId: value.end.toNumber(),
        properties: value.properties
      };
    } else if (neo4j.isPath(value)) {
      return {
        start: this.transformValue(value.start),
        end: this.transformValue(value.end),
        segments: value.segments.map(segment => ({
          start: this.transformValue(segment.start),
          relationship: this.transformValue(segment.relationship),
          end: this.transformValue(segment.end)
        })),
        length: value.length
      };
    } else if (Array.isArray(value)) {
      return value.map(v => this.transformValue(v));
    } else if (value && typeof value === 'object') {
      const transformed = {};
      for (const [key, val] of Object.entries(value)) {
        transformed[key] = this.transformValue(val);
      }
      return transformed;
    }
    
    return value;
  }

  /**
   * Extract node label from Cypher query (for metrics)
   * @param {string} cypher - Cypher query
   * @returns {string} Node label or 'unknown'
   */
  extractNodeLabel(cypher) {
    const patterns = [
      /:(\w+)/,           // Label in node pattern
      /CREATE.*:(\w+)/i,  // CREATE with label
      /MATCH.*:(\w+)/i,   // MATCH with label
      /MERGE.*:(\w+)/i    // MERGE with label
    ];

    for (const pattern of patterns) {
      const match = cypher.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    return 'unknown';
  }

  /**
   * Start collecting connection pool metrics
   */
  startMetricsCollection() {
    if (!this.driver) return;

    setInterval(async () => {
      try {
        const serverInfo = await this.driver.getServerInfo();
        const poolStats = this.driver._connectionPool?._pools?.[0];
        
        if (poolStats) {
          this.metrics.updateConnectionPool(
            poolStats.activeResourceCount || 0,
            poolStats.idleResourceCount || 0,
            poolStats.pendingAcquireCount || 0
          );
        }
      } catch (error) {
        logger.debug('Failed to collect Neo4j metrics', { error });
      }
    }, 5000);
  }

  /**
   * Close the driver connection
   */
  async close() {
    if (this.driver) {
      await this.driver.close();
      this.isConnected = false;
      logger.info('Neo4j driver closed', {
        service: this.serviceName
      });
    }
  }

  /**
   * Get driver statistics
   * @returns {Object} Driver statistics
   */
  async getStats() {
    if (!this.driver) {
      return null;
    }

    try {
      const serverInfo = await this.driver.getServerInfo();
      return {
        serverVersion: serverInfo.version,
        protocol: serverInfo.protocolVersion,
        connected: this.isConnected
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance for default connection
let defaultDriver = null;

/**
 * Get default Neo4j driver
 * @param {string} serviceName - Service name for metrics
 * @returns {Neo4jDriver} Default driver instance
 */
function getDefaultDriver(serviceName = 'default') {
  if (!defaultDriver) {
    defaultDriver = new Neo4jDriver({}, serviceName);
  }
  return defaultDriver;
}

module.exports = {
  Neo4jDriver,
  getDefaultDriver,
  
  // Re-export neo4j-driver types and utilities
  neo4j,
  int: neo4j.int,
  isInt: neo4j.isInt,
  isNode: neo4j.isNode,
  isRelationship: neo4j.isRelationship,
  isPath: neo4j.isPath
};