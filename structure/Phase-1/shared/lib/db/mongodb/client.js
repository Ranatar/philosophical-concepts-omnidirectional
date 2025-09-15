/**
 * MongoDB client configuration for the Philosophy Service
 * Provides connection management and query utilities
 */

const { MongoClient, ObjectId } = require('mongodb');
const { logger } = require('../../logging/logger');
const { DatabaseMetrics } = require('../../metrics/prometheus');

// MongoDB connection configuration
const defaultConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  database: process.env.MONGODB_DATABASE || 'philosophy_db',
  
  // Connection options
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE) || 10,
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
    maxIdleTimeMS: parseInt(process.env.MONGODB_IDLE_TIMEOUT) || 60000,
    waitQueueTimeoutMS: parseInt(process.env.MONGODB_WAIT_TIMEOUT) || 5000,
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_TIMEOUT) || 5000,
    socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 30000,
    
    // Authentication
    authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
    
    // Retry writes
    retryWrites: process.env.MONGODB_RETRY_WRITES !== 'false',
    
    // Read preference
    readPreference: process.env.MONGODB_READ_PREFERENCE || 'primary',
    
    // Application name
    appName: process.env.SERVICE_NAME || 'philosophy-service'
  }
};

/**
 * MongoDB client wrapper with enhanced functionality
 */
class MongoDBClient {
  constructor(config = {}, serviceName = 'unknown') {
    this.config = { ...defaultConfig, ...config };
    this.serviceName = serviceName;
    this.client = null;
    this.db = null;
    this.metrics = new DatabaseMetrics('mongodb', serviceName);
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    if (this.client && this.isConnected) {
      logger.warn('MongoDB client already connected');
      return;
    }

    try {
      // Create MongoClient instance
      this.client = new MongoClient(this.config.uri, this.config.options);
      
      // Connect to MongoDB
      await this.client.connect();
      
      // Get database instance
      this.db = this.client.db(this.config.database);
      
      // Test the connection
      await this.db.admin().ping();
      
      this.isConnected = true;
      
      logger.info('MongoDB client connected', {
        service: this.serviceName,
        database: this.config.database
      });

      // Set up event listeners
      this.setupEventListeners();
      
      // Start metrics collection
      this.startMetricsCollection();
      
    } catch (error) {
      logger.error('Failed to connect to MongoDB', {
        error,
        service: this.serviceName,
        uri: this.config.uri.replace(/\/\/.*@/, '//<credentials>@') // Hide credentials in logs
      });
      throw error;
    }
  }

  /**
   * Get collection instance
   * @param {string} collectionName - Collection name
   * @returns {Collection} MongoDB collection
   */
  collection(collectionName) {
    if (!this.db) {
      throw new Error('MongoDB client not connected');
    }
    return this.db.collection(collectionName);
  }

  /**
   * Find documents
   * @param {string} collectionName - Collection name
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of documents
   */
  async find(collectionName, filter = {}, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      const cursor = collection.find(filter, options);
      
      // Apply options
      if (options.sort) cursor.sort(options.sort);
      if (options.limit) cursor.limit(options.limit);
      if (options.skip) cursor.skip(options.skip);
      if (options.projection) cursor.project(options.projection);
      
      const results = await cursor.toArray();
      
      // Record metrics
      this.metrics.recordQuery('find', collectionName, Date.now() - start, true);
      
      return results;
      
    } catch (error) {
      this.metrics.recordQuery('find', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Find one document
   * @param {string} collectionName - Collection name
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Document or null
   */
  async findOne(collectionName, filter = {}, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      const result = await collection.findOne(filter, options);
      
      this.metrics.recordQuery('findOne', collectionName, Date.now() - start, true);
      
      return result;
      
    } catch (error) {
      this.metrics.recordQuery('findOne', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Find document by ID
   * @param {string} collectionName - Collection name
   * @param {string|ObjectId} id - Document ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>} Document or null
   */
  async findById(collectionName, id, options = {}) {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return this.findOne(collectionName, { _id: objectId }, options);
  }

  /**
   * Insert one document
   * @param {string} collectionName - Collection name
   * @param {Object} document - Document to insert
   * @param {Object} options - Insert options
   * @returns {Promise<Object>} Insert result
   */
  async insertOne(collectionName, document, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      
      // Add timestamps if not present
      if (!document.created_at) {
        document.created_at = new Date();
      }
      
      const result = await collection.insertOne(document, options);
      
      this.metrics.recordQuery('insertOne', collectionName, Date.now() - start, true);
      
      return {
        insertedId: result.insertedId,
        acknowledged: result.acknowledged,
        document: { ...document, _id: result.insertedId }
      };
      
    } catch (error) {
      this.metrics.recordQuery('insertOne', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Insert many documents
   * @param {string} collectionName - Collection name
   * @param {Array<Object>} documents - Documents to insert
   * @param {Object} options - Insert options
   * @returns {Promise<Object>} Insert result
   */
  async insertMany(collectionName, documents, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      
      // Add timestamps if not present
      const docsWithTimestamps = documents.map(doc => ({
        ...doc,
        created_at: doc.created_at || new Date()
      }));
      
      const result = await collection.insertMany(docsWithTimestamps, options);
      
      this.metrics.recordQuery('insertMany', collectionName, Date.now() - start, true);
      
      return {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds,
        acknowledged: result.acknowledged
      };
      
    } catch (error) {
      this.metrics.recordQuery('insertMany', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Update one document
   * @param {string} collectionName - Collection name
   * @param {Object} filter - Query filter
   * @param {Object} update - Update operations
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateOne(collectionName, filter, update, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      
      // Add updated_at timestamp
      if (update.$set) {
        update.$set.updated_at = new Date();
      } else {
        update.$set = { updated_at: new Date() };
      }
      
      const result = await collection.updateOne(filter, update, options);
      
      this.metrics.recordQuery('updateOne', collectionName, Date.now() - start, true);
      
      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        acknowledged: result.acknowledged,
        upsertedId: result.upsertedId
      };
      
    } catch (error) {
      this.metrics.recordQuery('updateOne', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Update many documents
   * @param {string} collectionName - Collection name
   * @param {Object} filter - Query filter
   * @param {Object} update - Update operations
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateMany(collectionName, filter, update, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      
      // Add updated_at timestamp
      if (update.$set) {
        update.$set.updated_at = new Date();
      } else {
        update.$set = { updated_at: new Date() };
      }
      
      const result = await collection.updateMany(filter, update, options);
      
      this.metrics.recordQuery('updateMany', collectionName, Date.now() - start, true);
      
      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        acknowledged: result.acknowledged
      };
      
    } catch (error) {
      this.metrics.recordQuery('updateMany', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Replace one document
   * @param {string} collectionName - Collection name
   * @param {Object} filter - Query filter
   * @param {Object} replacement - Replacement document
   * @param {Object} options - Replace options
   * @returns {Promise<Object>} Replace result
   */
  async replaceOne(collectionName, filter, replacement, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      
      // Add timestamps
      replacement.updated_at = new Date();
      if (!replacement.created_at) {
        replacement.created_at = new Date();
      }
      
      const result = await collection.replaceOne(filter, replacement, options);
      
      this.metrics.recordQuery('replaceOne', collectionName, Date.now() - start, true);
      
      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        acknowledged: result.acknowledged,
        upsertedId: result.upsertedId
      };
      
    } catch (error) {
      this.metrics.recordQuery('replaceOne', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Delete one document
   * @param {string} collectionName - Collection name
   * @param {Object} filter - Query filter
   * @param {Object} options - Delete options
   * @returns {Promise<Object>} Delete result
   */
  async deleteOne(collectionName, filter, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      const result = await collection.deleteOne(filter, options);
      
      this.metrics.recordQuery('deleteOne', collectionName, Date.now() - start, true);
      
      return {
        deletedCount: result.deletedCount,
        acknowledged: result.acknowledged
      };
      
    } catch (error) {
      this.metrics.recordQuery('deleteOne', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Delete many documents
   * @param {string} collectionName - Collection name
   * @param {Object} filter - Query filter
   * @param {Object} options - Delete options
   * @returns {Promise<Object>} Delete result
   */
  async deleteMany(collectionName, filter, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      const result = await collection.deleteMany(filter, options);
      
      this.metrics.recordQuery('deleteMany', collectionName, Date.now() - start, true);
      
      return {
        deletedCount: result.deletedCount,
        acknowledged: result.acknowledged
      };
      
    } catch (error) {
      this.metrics.recordQuery('deleteMany', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Count documents
   * @param {string} collectionName - Collection name
   * @param {Object} filter - Query filter
   * @param {Object} options - Count options
   * @returns {Promise<number>} Document count
   */
  async count(collectionName, filter = {}, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      const count = await collection.countDocuments(filter, options);
      
      this.metrics.recordQuery('count', collectionName, Date.now() - start, true);
      
      return count;
      
    } catch (error) {
      this.metrics.recordQuery('count', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Aggregate pipeline
   * @param {string} collectionName - Collection name
   * @param {Array} pipeline - Aggregation pipeline
   * @param {Object} options - Aggregation options
   * @returns {Promise<Array>} Aggregation results
   */
  async aggregate(collectionName, pipeline, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      const cursor = collection.aggregate(pipeline, options);
      const results = await cursor.toArray();
      
      this.metrics.recordQuery('aggregate', collectionName, Date.now() - start, true);
      
      return results;
      
    } catch (error) {
      this.metrics.recordQuery('aggregate', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Find one and update
   * @param {string} collectionName - Collection name
   * @param {Object} filter - Query filter
   * @param {Object} update - Update operations
   * @param {Object} options - Options
   * @returns {Promise<Object>} Updated document
   */
  async findOneAndUpdate(collectionName, filter, update, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      
      // Add updated_at timestamp
      if (update.$set) {
        update.$set.updated_at = new Date();
      } else {
        update.$set = { updated_at: new Date() };
      }
      
      const result = await collection.findOneAndUpdate(
        filter,
        update,
        { returnDocument: 'after', ...options }
      );
      
      this.metrics.recordQuery('findOneAndUpdate', collectionName, Date.now() - start, true);
      
      return result.value;
      
    } catch (error) {
      this.metrics.recordQuery('findOneAndUpdate', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Find one and delete
   * @param {string} collectionName - Collection name
   * @param {Object} filter - Query filter
   * @param {Object} options - Options
   * @returns {Promise<Object>} Deleted document
   */
  async findOneAndDelete(collectionName, filter, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      const result = await collection.findOneAndDelete(filter, options);
      
      this.metrics.recordQuery('findOneAndDelete', collectionName, Date.now() - start, true);
      
      return result.value;
      
    } catch (error) {
      this.metrics.recordQuery('findOneAndDelete', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Create index
   * @param {string} collectionName - Collection name
   * @param {Object} keys - Index keys
   * @param {Object} options - Index options
   * @returns {Promise<string>} Index name
   */
  async createIndex(collectionName, keys, options = {}) {
    const collection = this.collection(collectionName);
    return collection.createIndex(keys, options);
  }

  /**
   * Drop index
   * @param {string} collectionName - Collection name
   * @param {string} indexName - Index name
   * @returns {Promise<Object>} Drop result
   */
  async dropIndex(collectionName, indexName) {
    const collection = this.collection(collectionName);
    return collection.dropIndex(indexName);
  }

  /**
   * List indexes
   * @param {string} collectionName - Collection name
   * @returns {Promise<Array>} Array of indexes
   */
  async listIndexes(collectionName) {
    const collection = this.collection(collectionName);
    return collection.indexes();
  }

  /**
   * Bulk write operations
   * @param {string} collectionName - Collection name
   * @param {Array} operations - Bulk operations
   * @param {Object} options - Bulk write options
   * @returns {Promise<Object>} Bulk write result
   */
  async bulkWrite(collectionName, operations, options = {}) {
    const start = Date.now();
    
    try {
      const collection = this.collection(collectionName);
      const result = await collection.bulkWrite(operations, options);
      
      this.metrics.recordQuery('bulkWrite', collectionName, Date.now() - start, true);
      
      return result;
      
    } catch (error) {
      this.metrics.recordQuery('bulkWrite', collectionName, Date.now() - start, false);
      throw error;
    }
  }

  /**
   * Start a session for transactions
   * @param {Object} options - Session options
   * @returns {ClientSession} MongoDB session
   */
  startSession(options = {}) {
    if (!this.client) {
      throw new Error('MongoDB client not connected');
    }
    return this.client.startSession(options);
  }

  /**
   * Execute transaction
   * @param {Function} callback - Transaction callback
   * @param {Object} options - Transaction options
   * @returns {Promise<any>} Transaction result
   */
  async transaction(callback, options = {}) {
    const session = this.startSession();
    const start = Date.now();
    
    try {
      await session.withTransaction(async () => {
        return callback(session);
      }, options);
      
      this.metrics.recordQuery('transaction', 'transaction', Date.now() - start, true);
      
    } catch (error) {
      this.metrics.recordQuery('transaction', 'transaction', Date.now() - start, false);
      throw error;
      
    } finally {
      await session.endSession();
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    this.client.on('serverOpening', () => {
      logger.debug('MongoDB server opening', { service: this.serviceName });
    });

    this.client.on('serverClosed', () => {
      logger.warn('MongoDB server closed', { service: this.serviceName });
    });

    this.client.on('error', (error) => {
      logger.error('MongoDB client error', { error, service: this.serviceName });
    });

    this.client.on('timeout', () => {
      logger.error('MongoDB client timeout', { service: this.serviceName });
    });

    this.client.on('close', () => {
      logger.info('MongoDB client closed', { service: this.serviceName });
      this.isConnected = false;
    });
  }

  /**
   * Start collecting metrics
   */
  startMetricsCollection() {
    if (!this.client) return;

    setInterval(() => {
      try {
        const stats = this.client.topology?.s?.pool;
        if (stats) {
          this.metrics.updateConnectionPool(
            stats.totalConnectionCount || 0,
            stats.availableConnectionCount || 0,
            stats.waitQueueSize || 0
          );
        }
      } catch (error) {
        logger.debug('Failed to collect MongoDB metrics', { error });
      }
    }, 5000);
  }

  /**
   * Close the connection
   */
  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      logger.info('MongoDB connection closed', {
        service: this.serviceName
      });
    }
  }

  /**
   * Get connection statistics
   * @returns {Object} Connection statistics
   */
  getStats() {
    if (!this.client || !this.isConnected) {
      return { connected: false };
    }

    const topology = this.client.topology;
    const pool = topology?.s?.pool;

    return {
      connected: this.isConnected,
      connections: {
        total: pool?.totalConnectionCount || 0,
        available: pool?.availableConnectionCount || 0,
        waitQueue: pool?.waitQueueSize || 0
      }
    };
  }
}

// Create singleton instance for default connection
let defaultClient = null;

/**
 * Get default MongoDB client
 * @param {string} serviceName - Service name for metrics
 * @returns {MongoDBClient} Default client instance
 */
function getDefaultClient(serviceName = 'default') {
  if (!defaultClient) {
    defaultClient = new MongoDBClient({}, serviceName);
  }
  return defaultClient;
}

module.exports = {
  MongoDBClient,
  getDefaultClient,
  ObjectId
};