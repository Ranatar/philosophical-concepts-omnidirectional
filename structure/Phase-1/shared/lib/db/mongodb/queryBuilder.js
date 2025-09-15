/**
 * MongoDB query builder for the Philosophy Service
 * Provides fluent interface for building MongoDB queries
 */

const { ObjectId } = require('mongodb');

/**
 * MongoDB Query Builder
 */
class MongoQueryBuilder {
  constructor() {
    this.filter = {};
    this.updateOperations = {};
    this.aggregationPipeline = [];
    this.options = {};
  }

  /**
   * Add equality condition
   * @param {string} field - Field name
   * @param {any} value - Value to match
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  where(field, value) {
    if (value === undefined) {
      return this;
    }
    
    // Handle ObjectId conversion
    if (field === '_id' && typeof value === 'string') {
      this.filter[field] = new ObjectId(value);
    } else if (field.endsWith('_id') && typeof value === 'string' && ObjectId.isValid(value)) {
      this.filter[field] = new ObjectId(value);
    } else {
      this.filter[field] = value;
    }
    
    return this;
  }

  /**
   * Add $gt condition
   * @param {string} field - Field name
   * @param {any} value - Value to compare
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereGt(field, value) {
    this.addCondition(field, '$gt', value);
    return this;
  }

  /**
   * Add $gte condition
   * @param {string} field - Field name
   * @param {any} value - Value to compare
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereGte(field, value) {
    this.addCondition(field, '$gte', value);
    return this;
  }

  /**
   * Add $lt condition
   * @param {string} field - Field name
   * @param {any} value - Value to compare
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereLt(field, value) {
    this.addCondition(field, '$lt', value);
    return this;
  }

  /**
   * Add $lte condition
   * @param {string} field - Field name
   * @param {any} value - Value to compare
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereLte(field, value) {
    this.addCondition(field, '$lte', value);
    return this;
  }

  /**
   * Add $ne condition
   * @param {string} field - Field name
   * @param {any} value - Value to compare
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereNe(field, value) {
    this.addCondition(field, '$ne', value);
    return this;
  }

  /**
   * Add $in condition
   * @param {string} field - Field name
   * @param {Array} values - Array of values
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereIn(field, values) {
    if (!Array.isArray(values)) {
      throw new Error('whereIn requires an array');
    }
    
    // Handle ObjectId conversion for _id fields
    if (field === '_id' || field.endsWith('_id')) {
      values = values.map(v => typeof v === 'string' && ObjectId.isValid(v) ? new ObjectId(v) : v);
    }
    
    this.addCondition(field, '$in', values);
    return this;
  }

  /**
   * Add $nin condition
   * @param {string} field - Field name
   * @param {Array} values - Array of values
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereNotIn(field, values) {
    if (!Array.isArray(values)) {
      throw new Error('whereNotIn requires an array');
    }
    
    // Handle ObjectId conversion for _id fields
    if (field === '_id' || field.endsWith('_id')) {
      values = values.map(v => typeof v === 'string' && ObjectId.isValid(v) ? new ObjectId(v) : v);
    }
    
    this.addCondition(field, '$nin', values);
    return this;
  }

  /**
   * Add $exists condition
   * @param {string} field - Field name
   * @param {boolean} exists - Whether field should exist
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereExists(field, exists = true) {
    this.addCondition(field, '$exists', exists);
    return this;
  }

  /**
   * Add null check
   * @param {string} field - Field name
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereNull(field) {
    this.filter[field] = null;
    return this;
  }

  /**
   * Add not null check
   * @param {string} field - Field name
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereNotNull(field) {
    this.addCondition(field, '$ne', null);
    return this;
  }

  /**
   * Add $regex condition
   * @param {string} field - Field name
   * @param {string|RegExp} pattern - Regex pattern
   * @param {string} options - Regex options
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereRegex(field, pattern, options = '') {
    if (pattern instanceof RegExp) {
      this.filter[field] = pattern;
    } else {
      this.addCondition(field, '$regex', pattern);
      if (options) {
        this.addCondition(field, '$options', options);
      }
    }
    return this;
  }

  /**
   * Add text search
   * @param {string} text - Text to search
   * @param {Object} options - Text search options
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereText(text, options = {}) {
    this.filter.$text = { $search: text };
    if (options.language) {
      this.filter.$text.$language = options.language;
    }
    if (options.caseSensitive) {
      this.filter.$text.$caseSensitive = options.caseSensitive;
    }
    if (options.diacriticSensitive) {
      this.filter.$text.$diacriticSensitive = options.diacriticSensitive;
    }
    return this;
  }

  /**
   * Add $or condition
   * @param {Array<Object>} conditions - Array of conditions
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  or(conditions) {
    if (!Array.isArray(conditions)) {
      throw new Error('or() requires an array of conditions');
    }
    
    if (!this.filter.$or) {
      this.filter.$or = [];
    }
    
    this.filter.$or.push(...conditions);
    return this;
  }

  /**
   * Add $and condition
   * @param {Array<Object>} conditions - Array of conditions
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  and(conditions) {
    if (!Array.isArray(conditions)) {
      throw new Error('and() requires an array of conditions');
    }
    
    if (!this.filter.$and) {
      this.filter.$and = [];
    }
    
    this.filter.$and.push(...conditions);
    return this;
  }

  /**
   * Add $nor condition
   * @param {Array<Object>} conditions - Array of conditions
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  nor(conditions) {
    if (!Array.isArray(conditions)) {
      throw new Error('nor() requires an array of conditions');
    }
    
    if (!this.filter.$nor) {
      this.filter.$nor = [];
    }
    
    this.filter.$nor.push(...conditions);
    return this;
  }

  /**
   * Add array condition
   * @param {string} field - Field name
   * @param {string} operator - Array operator ($all, $elemMatch, $size)
   * @param {any} value - Value
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereArray(field, operator, value) {
    this.addCondition(field, operator, value);
    return this;
  }

  /**
   * Add geo spatial query
   * @param {string} field - Field name
   * @param {Object} geometry - GeoJSON geometry
   * @param {number} maxDistance - Maximum distance in meters
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereNear(field, geometry, maxDistance = null) {
    const near = {
      $near: {
        $geometry: geometry
      }
    };
    
    if (maxDistance !== null) {
      near.$near.$maxDistance = maxDistance;
    }
    
    this.filter[field] = near;
    return this;
  }

  /**
   * Add geo within query
   * @param {string} field - Field name
   * @param {Object} geometry - GeoJSON geometry
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  whereGeoWithin(field, geometry) {
    this.filter[field] = {
      $geoWithin: {
        $geometry: geometry
      }
    };
    return this;
  }

  /**
   * Set projection
   * @param {Object|Array<string>} fields - Fields to include/exclude
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  select(fields) {
    if (Array.isArray(fields)) {
      this.options.projection = {};
      fields.forEach(field => {
        this.options.projection[field] = 1;
      });
    } else {
      this.options.projection = fields;
    }
    return this;
  }

  /**
   * Set sort order
   * @param {Object|string} field - Field to sort by or sort object
   * @param {number} direction - Sort direction (1 or -1)
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  sort(field, direction = 1) {
    if (typeof field === 'object') {
      this.options.sort = field;
    } else {
      if (!this.options.sort) {
        this.options.sort = {};
      }
      this.options.sort[field] = direction;
    }
    return this;
  }

  /**
   * Set limit
   * @param {number} limit - Number of documents to limit
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  limit(limit) {
    this.options.limit = limit;
    return this;
  }

  /**
   * Set skip
   * @param {number} skip - Number of documents to skip
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  skip(skip) {
    this.options.skip = skip;
    return this;
  }

  /**
   * Add hint
   * @param {Object|string} hint - Index hint
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  hint(hint) {
    this.options.hint = hint;
    return this;
  }

  /**
   * Set collation
   * @param {Object} collation - Collation options
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  collation(collation) {
    this.options.collation = collation;
    return this;
  }

  /**
   * Add $set update operation
   * @param {Object} fields - Fields to set
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  set(fields) {
    if (!this.updateOperations.$set) {
      this.updateOperations.$set = {};
    }
    Object.assign(this.updateOperations.$set, fields);
    return this;
  }

  /**
   * Add $unset update operation
   * @param {string|Array<string>} fields - Fields to unset
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  unset(fields) {
    if (!this.updateOperations.$unset) {
      this.updateOperations.$unset = {};
    }
    
    const fieldsArray = Array.isArray(fields) ? fields : [fields];
    fieldsArray.forEach(field => {
      this.updateOperations.$unset[field] = '';
    });
    
    return this;
  }

  /**
   * Add $inc update operation
   * @param {string} field - Field to increment
   * @param {number} value - Increment value
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  inc(field, value = 1) {
    if (!this.updateOperations.$inc) {
      this.updateOperations.$inc = {};
    }
    this.updateOperations.$inc[field] = value;
    return this;
  }

  /**
   * Add $push update operation
   * @param {string} field - Array field
   * @param {any} value - Value to push
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  push(field, value) {
    if (!this.updateOperations.$push) {
      this.updateOperations.$push = {};
    }
    this.updateOperations.$push[field] = value;
    return this;
  }

  /**
   * Add $pull update operation
   * @param {string} field - Array field
   * @param {any} value - Value or condition to pull
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  pull(field, value) {
    if (!this.updateOperations.$pull) {
      this.updateOperations.$pull = {};
    }
    this.updateOperations.$pull[field] = value;
    return this;
  }

  /**
   * Add $addToSet update operation
   * @param {string} field - Array field
   * @param {any} value - Value to add
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  addToSet(field, value) {
    if (!this.updateOperations.$addToSet) {
      this.updateOperations.$addToSet = {};
    }
    this.updateOperations.$addToSet[field] = value;
    return this;
  }

  /**
   * Add aggregation stage
   * @param {Object} stage - Aggregation stage
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  aggregate(stage) {
    this.aggregationPipeline.push(stage);
    return this;
  }

  /**
   * Add $match stage
   * @param {Object} match - Match conditions
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  match(match) {
    return this.aggregate({ $match: match });
  }

  /**
   * Add $group stage
   * @param {Object} group - Group specification
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  group(group) {
    return this.aggregate({ $group: group });
  }

  /**
   * Add $project stage
   * @param {Object} project - Projection specification
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  project(project) {
    return this.aggregate({ $project: project });
  }

  /**
   * Add $lookup stage
   * @param {Object} lookup - Lookup specification
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  lookup(lookup) {
    return this.aggregate({ $lookup: lookup });
  }

  /**
   * Add $unwind stage
   * @param {string|Object} path - Path to unwind
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  unwind(path) {
    if (typeof path === 'string') {
      return this.aggregate({ $unwind: path });
    }
    return this.aggregate({ $unwind: path });
  }

  /**
   * Add $sort stage
   * @param {Object} sort - Sort specification
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  aggregateSort(sort) {
    return this.aggregate({ $sort: sort });
  }

  /**
   * Add $limit stage
   * @param {number} limit - Limit value
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  aggregateLimit(limit) {
    return this.aggregate({ $limit: limit });
  }

  /**
   * Add $skip stage
   * @param {number} skip - Skip value
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  aggregateSkip(skip) {
    return this.aggregate({ $skip: skip });
  }

  /**
   * Helper to add condition to a field
   * @param {string} field - Field name
   * @param {string} operator - MongoDB operator
   * @param {any} value - Value
   */
  addCondition(field, operator, value) {
    if (!this.filter[field]) {
      this.filter[field] = {};
    }
    
    if (typeof this.filter[field] !== 'object') {
      const currentValue = this.filter[field];
      this.filter[field] = { $eq: currentValue };
    }
    
    this.filter[field][operator] = value;
  }

  /**
   * Build the query filter
   * @returns {Object} Query filter
   */
  buildFilter() {
    return this.filter;
  }

  /**
   * Build update operations
   * @returns {Object} Update operations
   */
  buildUpdate() {
    return this.updateOperations;
  }

  /**
   * Build aggregation pipeline
   * @returns {Array} Aggregation pipeline
   */
  buildAggregation() {
    return this.aggregationPipeline;
  }

  /**
   * Build query options
   * @returns {Object} Query options
   */
  buildOptions() {
    return this.options;
  }

  /**
   * Get all built components
   * @returns {Object} All query components
   */
  build() {
    return {
      filter: this.buildFilter(),
      update: this.buildUpdate(),
      aggregation: this.buildAggregation(),
      options: this.buildOptions()
    };
  }

  /**
   * Clone the query builder
   * @returns {MongoQueryBuilder} Cloned instance
   */
  clone() {
    const cloned = new MongoQueryBuilder();
    cloned.filter = JSON.parse(JSON.stringify(this.filter));
    cloned.updateOperations = JSON.parse(JSON.stringify(this.updateOperations));
    cloned.aggregationPipeline = JSON.parse(JSON.stringify(this.aggregationPipeline));
    cloned.options = JSON.parse(JSON.stringify(this.options));
    return cloned;
  }

  /**
   * Reset the query builder
   * @returns {MongoQueryBuilder} This instance for chaining
   */
  reset() {
    this.filter = {};
    this.updateOperations = {};
    this.aggregationPipeline = [];
    this.options = {};
    return this;
  }
}

/**
 * Helper function to create a new query builder
 * @returns {MongoQueryBuilder} New query builder instance
 */
function query() {
  return new MongoQueryBuilder();
}

/**
 * Helper to create ObjectId
 * @param {string} id - String ID
 * @returns {ObjectId} MongoDB ObjectId
 */
function objectId(id) {
  return new ObjectId(id);
}

/**
 * Helper to check if string is valid ObjectId
 * @param {string} id - String to check
 * @returns {boolean} Whether string is valid ObjectId
 */
function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

module.exports = {
  MongoQueryBuilder,
  query,
  objectId,
  isValidObjectId,
  ObjectId
};