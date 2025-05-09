/**
 * MongoDB client for the philosophy service
 * Provides a configured client instance and utility methods for database operations
 */

const { MongoClient, ObjectId } = require('mongodb');
const { defaultLogger } = require('../../logging/logger');

// Default configuration
const DEFAULT_CONFIG = {
  uri: process.env.MONGODB_URI || 'mongodb://mongo:mongo@localhost:27017/philosophy',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: process.env.MONGODB_POOL_SIZE ? parseInt(process.env.MONGODB_POOL_SIZE, 10) : 10,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 30000
  },
  database: process.env.MONGODB_DATABASE || 'philosophy'
};

/**
 * MongoDB client class
 */
class MongoDbClient {
  /**
   * Create a new MongoDB client
   * @param {Object} [config] - Configuration options
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(config = {}, logger = defaultLogger) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      options: { ...DEFAULT_CONFIG.options, ...(config.options || {}) }
    };
    this.logger = logger;
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }
  
  /**
   * Initialize the MongoDB client
   * @returns {Promise<MongoClient>} The MongoDB client instance
   */
  async initialize() {
    if (!this.client) {
      this.logger.info('Initializing MongoDB client', {
        uri: this.config.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Hide credentials in logs
        database: this.config.database
      });
      
      try {
        this.client = new MongoClient(this.config.uri, this.config.options);
        
        await this.client.connect();
        this.db = this.client.db(this.config.database);
        this.isConnected = true;
        
        this.logger.info('MongoDB client connected successfully');
      } catch (err) {
        this.logger.error('Failed to initialize MongoDB client', {
          error: err.message,
          stack: err.stack
        });
        throw err;
      }
    }
    
    return this.client;
  }
  
  /**
   * Get the MongoDB client instance
   * @returns {Promise<MongoClient>} The MongoDB client instance
   */
  async getClient() {
    if (!this.client) {
      return this.initialize();
    }
    return this.client;
  }
  
  /**
   * Get the MongoDB database instance
   * @returns {Promise<Db>} The MongoDB database instance
   */
  async getDb() {
    if (!this.db) {
      await this.initialize();
    }
    return this.db;
  }
  
  /**
   * Get a MongoDB collection
   * @param {string} collectionName - Collection name
   * @returns {Promise<Collection>} MongoDB collection
   */
  async getCollection(collectionName) {
    const db = await this.getDb();
    return db.collection(collectionName);
  }
  
  /**
   * Create a new ObjectId
   * @param {string} [id] - Existing ID string (optional)
   * @returns {ObjectId} New ObjectId
   */
  createObjectId(id) {
    return id ? new ObjectId(id) : new ObjectId();
  }
  
  /**
   * Find documents in a collection
   * @param {string} collectionName - Collection name
   * @param {Object} query - Query filter
   * @param {Object} [options={}] - Query options
   * @returns {Promise<Array>} Found documents
   */
  async find(collectionName, query, options = {}) {
    const start = Date.now();
    const collection = await this.getCollection(collectionName);
    
    try {
      this.logger.debug('Executing MongoDB find', {
        collection: collectionName,
        query,
        options
      });
      
      const cursor = collection.find(query, options);
      const result = await cursor.toArray();
      
      const duration = Date.now() - start;
      this.logger.debug('MongoDB find completed', {
        collection: collectionName,
        duration,
        count: result.length
      });
      
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      this.logger.error('Error executing MongoDB find', {
        collection: collectionName,
        query,
        options,
        duration,
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }
  
  /**
   * Find a single document in a collection
   * @param {string} collectionName - Collection name
   * @param {Object} query - Query filter
   * @param {Object} [options={}] - Query options
   * @returns {Promise<Object|null>} Found document or null
   */
  async findOne(collectionName, query, options = {}) {
    const start = Date.now();
    const collection = await this.getCollection(collectionName);
    
    try {
      this.logger.debug('Executing MongoDB findOne', {
        collection: collectionName,
        query,
        options
      });
      
      const result = await collection.findOne(query, options);
      
      const duration = Date.now() - start;
      this.logger.debug('MongoDB findOne completed', {
        collection: collectionName,
        duration,
        found: result !== null
      });
      
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      this.logger.error('Error executing MongoDB findOne', {
        collection: collectionName,
        query,
        options,
        duration,
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }
  
  /**
   * Find a document by ID
   * @param {string} collectionName - Collection name
   * @param {string|ObjectId} id - Document ID
   * @param {Object} [options={}] - Query options
   * @returns {Promise<Object|null>} Found document or null
   */
  async findById(collectionName, id, options = {}) {
    const objectId = typeof id === 'string' ? this.createObjectId(id) : id;
    return this.findOne(collectionName, { _id: objectId }, options);
  }
  
  /**
   * Insert a document into a collection
   * @param {string} collectionName - Collection name
   * @param {Object} document - Document to insert
   * @returns {Promise<Object>} Inserted document
   */
  async insertOne(collectionName, document) {
    const start = Date.now();
    const collection = await this.getCollection(collectionName);
    
    try {
      this.logger.debug('Executing MongoDB insertOne', {
        collection: collectionName
      });
      
      const result = await collection.insertOne(document);
      
      const duration = Date.now() - start;
      this.logger.debug('MongoDB insertOne completed', {
        collection: collectionName,
        duration,
        id: result.insertedId
      });
      
      // Return the document with _id
      return { ...document, _id: result.insertedId };
    } catch (err) {
      const duration = Date.now() - start;
      this.logger.error('Error executing MongoDB insertOne', {
        collection: collectionName,
        duration,
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }
  
  /**
   * Insert multiple documents into a collection
   * @param {string} collectionName - Collection name
   * @param {Array<Object>} documents - Documents to insert
   * @returns {Promise<Array<Object>>} Inserted documents
   */
  async insertMany(collectionName, documents) {
    const start = Date.now();
    const collection = await this.getCollection(collectionName);
    
    try {
      this.logger.debug('Executing MongoDB insertMany', {
        collection: collectionName,
        count: documents.length
      });
      
      const result = await collection.insertMany(documents);
      
      const duration = Date.now() - start;
      this.logger.debug('MongoDB insertMany completed', {
        collection: collectionName,
        duration,
        count: result.insertedCount
      });
      
      // Return the documents with _id assigned
      return documents.map((doc, i) => ({ ...doc, _id: result.insertedIds[i] }));
    } catch (err) {
      const duration = Date.now() - start;
      this.logger.error('Error executing MongoDB insertMany', {
        collection: collectionName,
        count: documents.length,
        duration,
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }
  
  /**
   * Update a document in a collection
   * @param {string} collectionName - Collection name
   * @param {Object} query - Query filter
   * @param {Object} update - Update operations
   * @param {Object} [options={}] - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateOne(collectionName, query, update, options = {}) {
    const start = Date.now();
    const collection = await this.getCollection(collectionName);
    
    try {
      this.logger.debug('Executing MongoDB updateOne', {
        collection: collectionName,
        query
      });
      
      const result = await collection.updateOne(query, update, options);
      
      const duration = Date.now() - start;
      this.logger.debug('MongoDB updateOne completed', {
        collection: collectionName,
        duration,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });
      
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      this.logger.error('Error executing MongoDB updateOne', {
        collection: collectionName,
        query,
        duration,
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }
  
  /**
   * Update a document by ID
   * @param {string} collectionName - Collection name
   * @param {string|ObjectId} id - Document ID
   * @param {Object} update - Update operations
   * @param {Object} [options={}] - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateById(collectionName, id, update, options = {}) {
    const objectId = typeof id === 'string' ? this.createObjectId(id) : id;
    return this.updateOne(collectionName, { _id: objectId }, update, options);
  }
  
  /**
   * Update multiple documents in a collection
   * @param {string} collectionName - Collection name
   * @param {Object} query - Query filter
   * @param {Object} update - Update operations
   * @param {Object} [options={}] - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateMany(collectionName, query, update, options = {}) {
    const start = Date.now();
    const collection = await this.getCollection(collectionName);
    
    try {
      this.logger.debug('Executing MongoDB updateMany', {
        collection: collectionName,
        query
      });
      
      const result = await collection.updateMany(query, update, options);
      
      const duration = Date.now() - start;
      this.logger.debug('MongoDB updateMany completed', {
        collection: collectionName,
        duration,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });
      
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      this.logger.error('Error executing MongoDB updateMany', {
        collection: collectionName,
        query,
        duration,
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }
  
  /**
   * Delete a document from a collection
   * @param {string} collectionName - Collection name
   * @param {Object} query - Query filter
   * @param {Object} [options={}] - Delete options
   * @returns {Promise<Object>} Delete result
   */
  async deleteOne(collectionName, query, options = {}) {
    const start = Date.now();
    const collection = await this.getCollection(collectionName);
    
    try {
      this.logger.debug('Executing MongoDB deleteOne', {
        collection: collectionName,
        query
      });
      
      const result = await collection.deleteOne(query, options);
      
      const duration = Date.now() - start;
      this.logger.debug('MongoDB deleteOne completed', {
        collection: collectionName,
        duration,
        deletedCount: result.deletedCount
      });
      
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      this.logger.error('Error executing MongoDB deleteOne', {
        collection: collectionName,
        query,
        duration,
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }
  
  /**
   * Delete a document by ID
   * @param {string} collectionName - Collection name
   * @param {string|ObjectId} id - Document ID
   * @param {Object} [options={}] - Delete options
   * @returns {Promise<Object>} Delete result
   */
  async deleteById(collectionName, id, options = {}) {
    const objectId = typeof id === 'string' ? this.createObjectId(id) : id;
    return this.deleteOne(collectionName, { _id: objectId }, options);
  }
  
  /**
   * Delete multiple documents from a collection
   * @param {string} collectionName - Collection name
   * @param {Object} query - Query filter
   * @param {Object} [options={}] - Delete options
   * @returns {Promise<Object>} Delete result
   */
  async deleteMany(collectionName, query, options = {}) {
    const start = Date.now();
    const collection = await this.getCollection(collectionName);
    
    try {
      this.logger.debug('Executing MongoDB deleteMany', {
        collection: collectionName,
        query
      });
      
      const result = await collection.deleteMany(query, options);
      
      const duration = Date.now() - start;
      this.logger.debug('MongoDB deleteMany completed', {
        collection: collectionName,
        duration,
        deletedCount: result.deletedCount
      });
      
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      this.logger.error('Error executing MongoDB deleteMany', {
        collection: collectionName,
        query,
        duration,
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }
  
  /**
   * Count documents in a collection
   * @param {string} collectionName - Collection name
   * @param {Object} query - Query filter
   * @param {Object} [options={}] - Count options
   * @returns {Promise<number>} Document count
   */
  async countDocuments(collectionName, query, options = {}) {
    const start = Date.now();
    const collection = await this.getCollection(collectionName);
    
    try {
      this.logger.debug('Executing MongoDB countDocuments', {
        collection: collectionName,
        query
      });
      
      const count = await collection.countDocuments(query, options);
      
      const duration = Date.now() - start;
      this.logger.debug('MongoDB countDocuments completed', {
        collection: collectionName,
        duration,
        count
      });
      
      return count;
    } catch (err) {
      const duration = Date.now() - start;
      this.logger.error('Error executing MongoDB countDocuments', {
        collection: collectionName,
        query,
        duration,
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }
  
  /**
   * Perform aggregation on a collection
   * @param {string} collectionName - Collection name
   * @param {Array<Object>} pipeline - Aggregation pipeline
   * @param {Object} [options={}] - Aggregation options
   * @returns {Promise<Array<Object>>} Aggregation results
   */
  async aggregate(collectionName, pipeline, options = {}) {
    const start = Date.now();
    const collection = await this.getCollection(collectionName);
    
    try {
      this.logger.debug('Executing MongoDB aggregate', {
        collection: collectionName,
        pipeline
      });
      
      const cursor = collection.aggregate(pipeline, options);
      const result = await cursor.toArray();
      
      const duration = Date.now() - start;
      this.logger.debug('MongoDB aggregate completed', {
        collection: collectionName,
        duration,
        count: result.length
      });
      
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      this.logger.error('Error executing MongoDB aggregate', {
        collection: collectionName,
        pipeline,
        duration,
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }
  
  /**
   * Check if the database connection is healthy
   * @returns {Promise<boolean>} Whether the connection is healthy
   */
  async healthCheck() {
    try {
      const db = await this.getDb();
      const result = await db.command({ ping: 1 });
      return result && result.ok === 1;
    } catch (err) {
      this.logger.error('MongoDB health check failed', {
        error: err.message
      });
      return false;
    }
  }
  
  /**
   * Close the MongoDB client
   * @returns {Promise<void>}
   */
  async close() {
    if (this.client) {
      this.logger.info('Closing MongoDB client');
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
    }
  }
}

// Create and export default instance along with MongoDB ObjectId
const defaultClient = new MongoDbClient();

module.exports = {
  MongoDbClient,
  defaultClient,
  ObjectId
};
