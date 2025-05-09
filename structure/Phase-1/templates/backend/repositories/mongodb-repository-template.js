/**
 * Template for MongoDB repositories
 * Replace all instances of `Document` with the actual document name
 * Replace all instances of `document` with the lowercase document name
 * Replace all instances of `documents` with the plural lowercase document name
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { client } = require('../../../shared/lib/db/mongodb/client');
const Document = require('../../../shared/models/Document');

/**
 * Repository for Document in MongoDB
 */
class MongoDbDocumentRepository {
  /**
   * Create a new MongoDbDocumentRepository
   * @param {Object} [options={}] - Repository options
   * @param {Object} [options.client] - MongoDB client instance
   * @param {string} [options.database] - Database name
   * @param {string} [options.collection] - Collection name
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(options = {}, logger = defaultLogger) {
    this.client = options.client || client;
    this.database = options.database || process.env.MONGODB_DATABASE || 'philosophy';
    this.collection = options.collection || 'documents';
    this.logger = logger;
  }

  /**
   * Get the MongoDB collection
   * @returns {Collection} MongoDB collection
   * @private
   */
  async _getCollection() {
    const db = this.client.db(this.database);
    return db.collection(this.collection);
  }

  /**
   * Find all documents with pagination and filtering
   * @param {Object} [options={}] - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.pageSize=20] - Page size
   * @param {Object} [options.sort] - Sort criteria
   * @param {Object} [options.filters={}] - Filter criteria
   * @param {Object} [options.projection] - Field projection
   * @returns {Promise<Object>} Promise resolving to { items, total } object
   */
  async findAll(options = {}) {
    try {
      const collection = await this._getCollection();
      
      const { 
        page = 1, 
        pageSize = 20, 
        sort, 
        filters = {},
        projection
      } = options;
      
      // Calculate pagination
      const skip = (page - 1) * pageSize;
      
      // Execute query with pagination
      const [items, totalCount] = await Promise.all([
        collection.find(filters, { projection })
          .sort(sort)
          .skip(skip)
          .limit(pageSize)
          .toArray(),
        collection.countDocuments(filters)
      ]);
      
      // Convert to domain models
      const documentItems = items.map(item => this._documentToModel(item));
      
      return {
        items: documentItems,
        total: totalCount
      };
    } catch (error) {
      this.logger.error(`Error finding documents: ${error.message}`, {
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Find a document by ID
   * @param {string} id - Document ID
   * @param {Object} [options={}] - Query options
   * @param {Object} [options.projection] - Field projection
   * @returns {Promise<Document|null>} Promise resolving to document or null if not found
   */
  async findById(id, options = {}) {
    try {
      const collection = await this._getCollection();
      
      const document = await collection.findOne(
        { document_id: id },
        { projection: options.projection }
      );
      
      if (!document) {
        return null;
      }
      
      return this._documentToModel(document);
    } catch (error) {
      this.logger.error(`Error finding document by ID ${id}: ${error.message}`, {
        id,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Check if a document exists
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} Promise resolving to whether document exists
   */
  async exists(id) {
    try {
      const collection = await this._getCollection();
      
      const count = await collection.countDocuments({ document_id: id }, { limit: 1 });
      
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking if document exists: ${error.message}`, {
        id,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create a new document
   * @param {Document} document - Document to create
   * @returns {Promise<Document>} Promise resolving to created document
   */
  async create(document) {
    try {
      const collection = await this._getCollection();
      
      const documentData = this._modelToDocument(document);
      
      const result = await collection.insertOne(documentData);
      
      if (!result.acknowledged) {
        throw new Error('Failed to create document');
      }
      
      // Get the created document
      const createdDocument = await collection.findOne({ _id: result.insertedId });
      
      return this._documentToModel(createdDocument);
    } catch (error) {
      this.logger.error(`Error creating document: ${error.message}`, {
        document,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update a document
   * @param {string} id - Document ID
   * @param {Document|Object} document - Document with updated values
   * @param {Object} [options={}] - Update options
   * @param {boolean} [options.upsert=false] - Whether to create if not exists
   * @returns {Promise<Document|null>} Promise resolving to updated document or null if not found
   */
  async update(id, document, options = {}) {
    try {
      const collection = await this._getCollection();
      
      // If it's a Document instance, convert to document data
      const documentData = document instanceof Document
        ? this._modelToDocument(document)
        : document;
      
      // Remove _id field if present
      if (documentData._id) {
        delete documentData._id;
      }
      
      // Update and return the document
      const result = await collection.findOneAndUpdate(
        { document_id: id },
        { $set: documentData },
        {
          returnDocument: 'after',
          upsert: options.upsert || false
        }
      );
      
      if (!result.value) {
        return null;
      }
      
      return this._documentToModel(result.value);
    } catch (error) {
      this.logger.error(`Error updating document ${id}: ${error.message}`, {
        id,
        document,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Delete a document
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} Promise resolving to whether the document was deleted
   */
  async delete(id) {
    try {
      const collection = await this._getCollection();
      
      const result = await collection.deleteOne({ document_id: id });
      
      return result.deletedCount > 0;
    } catch (error) {
      this.logger.error(`Error deleting document ${id}: ${error.message}`, {
        id,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Find documents by a field value
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @param {Object} [options={}] - Query options
   * @param {Object} [options.projection] - Field projection
   * @param {Object} [options.sort] - Sort criteria
   * @param {number} [options.limit] - Maximum number of results
   * @returns {Promise<Array<Document>>} Promise resolving to array of documents
   */
  async findByField(field, value, options = {}) {
    try {
      const collection = await this._getCollection();
      
      // Build query
      const query = {};
      query[field] = value;
      
      // Build options
      const findOptions = {};
      if (options.projection) {
        findOptions.projection = options.projection;
      }
      
      // Execute query
      let cursor = collection.find(query, findOptions);
      
      // Apply sort if provided
      if (options.sort) {
        cursor = cursor.sort(options.sort);
      }
      
      // Apply limit if provided
      if (options.limit) {
        cursor = cursor.limit(options.limit);
      }
      
      const documents = await cursor.toArray();
      
      return documents.map(doc => this._documentToModel(doc));
    } catch (error) {
      this.logger.error(`Error finding documents by field ${field}: ${error.message}`, {
        field,
        value,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Find documents matching a query
   * @param {Object} query - MongoDB query
   * @param {Object} [options={}] - Query options
   * @param {Object} [options.projection] - Field projection
   * @param {Object} [options.sort] - Sort criteria
   * @param {number} [options.limit] - Maximum number of results
   * @param {number} [options.skip] - Number of results to skip
   * @returns {Promise<Array<Document>>} Promise resolving to array of documents
   */
  async findByQuery(query, options = {}) {
    try {
      const collection = await this._getCollection();
      
      // Build options
      const findOptions = {};
      if (options.projection) {
        findOptions.projection = options.projection;
      }
      
      // Execute query
      let cursor = collection.find(query, findOptions);
      
      // Apply sort if provided
      if (options.sort) {
        cursor = cursor.sort(options.sort);
      }
      
      // Apply skip if provided
      if (options.skip) {
        cursor = cursor.skip(options.skip);
      }
      
      // Apply limit if provided
      if (options.limit) {
        cursor = cursor.limit(options.limit);
      }
      
      const documents = await cursor.toArray();
      
      return documents.map(doc => this._documentToModel(doc));
    } catch (error) {
      this.logger.error(`Error finding documents by query: ${error.message}`, {
        query,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Find one document matching a query
   * @param {Object} query - MongoDB query
   * @param {Object} [options={}] - Query options
   * @param {Object} [options.projection] - Field projection
   * @param {Object} [options.sort] - Sort criteria
   * @returns {Promise<Document|null>} Promise resolving to document or null if not found
   */
  async findOne(query, options = {}) {
    try {
      const collection = await this._getCollection();
      
      // Build options
      const findOptions = {};
      if (options.projection) {
        findOptions.projection = options.projection;
      }
      if (options.sort) {
        findOptions.sort = options.sort;
      }
      
      const document = await collection.findOne(query, findOptions);
      
      if (!document) {
        return null;
      }
      
      return this._documentToModel(document);
    } catch (error) {
      this.logger.error(`Error finding one document by query: ${error.message}`, {
        query,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Count documents matching a query
   * @param {Object} query - MongoDB query
   * @returns {Promise<number>} Promise resolving to count
   */
  async count(query) {
    try {
      const collection = await this._getCollection();
      
      return await collection.countDocuments(query);
    } catch (error) {
      this.logger.error(`Error counting documents: ${error.message}`, {
        query,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Aggregation pipeline
   * @param {Array<Object>} pipeline - MongoDB aggregation pipeline
   * @param {Object} [options={}] - Aggregation options
   * @returns {Promise<Array<Object>>} Promise resolving to aggregation results
   */
  async aggregate(pipeline, options = {}) {
    try {
      const collection = await this._getCollection();
      
      const results = await collection.aggregate(pipeline, options).toArray();
      
      return results;
    } catch (error) {
      this.logger.error(`Error executing aggregation: ${error.message}`, {
        pipeline,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Bulk write operations
   * @param {Array<Object>} operations - Bulk write operations
   * @param {Object} [options={}] - Bulk write options
   * @returns {Promise<Object>} Promise resolving to bulk write result
   */
  async bulkWrite(operations, options = {}) {
    try {
      const collection = await this._getCollection();
      
      return await collection.bulkWrite(operations, options);
    } catch (error) {
      this.logger.error(`Error executing bulk write: ${error.message}`, {
        operations,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Convert a MongoDB document to a domain model
   * @param {Object} document - MongoDB document
   * @returns {Document} Domain model
   * @private
   */
  _documentToModel(document) {
    // Extract ID from MongoDB document
    const { _id, ...data } = document;
    
    // Map MongoDB document to domain model properties
    return new Document({
      id: data.document_id,
      title: data.title,
      content: data.content,
      // Map other fields as needed
      createdAt: data.created_at instanceof Date 
        ? data.created_at 
        : new Date(data.created_at),
      updatedAt: data.updated_at instanceof Date 
        ? data.updated_at 
        : new Date(data.updated_at)
    });
  }

  /**
   * Convert a domain model to a MongoDB document
   * @param {Document} model - Domain model
   * @returns {Object} MongoDB document
   * @private
   */
  _modelToDocument(model) {
    // Map domain model to MongoDB document
    return {
      document_id: model.id,
      title: model.title,
      content: model.content,
      // Map other fields as needed
      created_at: model.createdAt instanceof Date 
        ? model.createdAt 
        : new Date(model.createdAt),
      updated_at: model.updatedAt instanceof Date 
        ? model.updatedAt 
        : new Date()
    };
  }
}

module.exports = MongoDbDocumentRepository;
