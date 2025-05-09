/**
 * Query builder for MongoDB
 * Provides a fluent API for building MongoDB queries
 */

const { ObjectId } = require('mongodb');

/**
 * Base query builder class
 */
class QueryBuilder {
  /**
   * Create a new query builder
   */
  constructor() {
    this.query = {};
    this.options = {};
  }
  
  /**
   * Convert an ID string to ObjectId if needed
   * @param {string|ObjectId} id - ID to convert
   * @returns {ObjectId|string} Converted ID
   */
  convertId(id) {
    if (typeof id === 'string' && ObjectId.isValid(id)) {
      return new ObjectId(id);
    }
    return id;
  }
  
  /**
   * Build the query and options
   * @returns {Object} Object with query and options
   */
  build() {
    return {
      query: this.query,
      options: this.options
    };
  }
}

/**
 * Query builder for MongoDB find operations
 */
class FindQueryBuilder extends QueryBuilder {
  /**
   * Create a new find query builder
   */
  constructor() {
    super();
    this.options = {
      projection: null,
      sort: null,
      skip: null,
      limit: null
    };
  }
  
  /**
   * Add equality condition
   * @param {string} field - Field name
   * @param {*} value - Value to compare
   * @returns {FindQueryBuilder} This builder instance
   */
  equals(field, value) {
    if (field === '_id') {
      value = this.convertId(value);
    }
    this.query[field] = value;
    return this;
  }
  
  /**
   * Add not-equals condition
   * @param {string} field - Field name
   * @param {*} value - Value to compare
   * @returns {FindQueryBuilder} This builder instance
   */
  notEquals(field, value) {
    if (field === '_id') {
      value = this.convertId(value);
    }
    this.query[field] = { $ne: value };
    return this;
  }
  
  /**
   * Add greater-than condition
   * @param {string} field - Field name
   * @param {*} value - Value to compare
   * @returns {FindQueryBuilder} This builder instance
   */
  greaterThan(field, value) {
    this.query[field] = { ...this.query[field], $gt: value };
    return this;
  }
  
  /**
   * Add greater-than-or-equal condition
   * @param {string} field - Field name
   * @param {*} value - Value to compare
   * @returns {FindQueryBuilder} This builder instance
   */
  greaterThanOrEqual(field, value) {
    this.query[field] = { ...this.query[field], $gte: value };
    return this;
  }
  
  /**
   * Add less-than condition
   * @param {string} field - Field name
   * @param {*} value - Value to compare
   * @returns {FindQueryBuilder} This builder instance
   */
  lessThan(field, value) {
    this.query[field] = { ...this.query[field], $lt: value };
    return this;
  }
  
  /**
   * Add less-than-or-equal condition
   * @param {string} field - Field name
   * @param {*} value - Value to compare
   * @returns {FindQueryBuilder} This builder instance
   */
  lessThanOrEqual(field, value) {
    this.query[field] = { ...this.query[field], $lte: value };
    return this;
  }
  
  /**
   * Add in-array condition
   * @param {string} field - Field name
   * @param {Array} values - Values to check
   * @returns {FindQueryBuilder} This builder instance
   */
  in(field, values) {
    if (field === '_id') {
      values = values.map(id => this.convertId(id));
    }
    this.query[field] = { $in: values };
    return this;
  }
  
  /**
   * Add not-in-array condition
   * @param {string} field - Field name
   * @param {Array} values - Values to check
   * @returns {FindQueryBuilder} This builder instance
   */
  notIn(field, values) {
    if (field === '_id') {
      values = values.map(id => this.convertId(id));
    }
    this.query[field] = { $nin: values };
    return this;
  }
  
  /**
   * Add exists condition
   * @param {string} field - Field name
   * @param {boolean} [exists=true] - Whether the field should exist
   * @returns {FindQueryBuilder} This builder instance
   */
  exists(field, exists = true) {
    this.query[field] = { $exists: exists };
    return this;
  }
  
  /**
   * Add regex match condition
   * @param {string} field - Field name
   * @param {string|RegExp} pattern - Regex pattern
   * @param {string} [options] - Regex options
   * @returns {FindQueryBuilder} This builder instance
   */
  regex(field, pattern, options) {
    if (typeof pattern === 'string') {
      this.query[field] = { $regex: pattern, $options: options };
    } else {
      this.query[field] = { $regex: pattern };
    }
    return this;
  }
  
  /**
   * Add case-insensitive text match condition (simplified)
   * @param {string} field - Field name
   * @param {string} text - Text to match
   * @returns {FindQueryBuilder} This builder instance
   */
  like(field, text) {
    return this.regex(field, text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
  }
  
  /**
   * Add array element match condition
   * @param {string} field - Field name
   * @param {Object} condition - Element match condition
   * @returns {FindQueryBuilder} This builder instance
   */
  elemMatch(field, condition) {
    this.query[field] = { $elemMatch: condition };
    return this;
  }
  
  /**
   * Add logical AND condition
   * @param {Array<Object>} conditions - Array of conditions
   * @returns {FindQueryBuilder} This builder instance
   */
  and(conditions) {
    if (!this.query.$and) {
      this.query.$and = [];
    }
    this.query.$and.push(...conditions);
    return this;
  }
  
  /**
   * Add logical OR condition
   * @param {Array<Object>} conditions - Array of conditions
   * @returns {FindQueryBuilder} This builder instance
   */
  or(conditions) {
    if (!this.query.$or) {
      this.query.$or = [];
    }
    this.query.$or.push(...conditions);
    return this;
  }
  
  /**
   * Add logical NOR condition
   * @param {Array<Object>} conditions - Array of conditions
   * @returns {FindQueryBuilder} This builder instance
   */
  nor(conditions) {
    if (!this.query.$nor) {
      this.query.$nor = [];
    }
    this.query.$nor.push(...conditions);
    return this;
  }
  
  /**
   * Add fields to include/exclude in the result
   * @param {Object} projection - Field projection
   * @returns {FindQueryBuilder} This builder instance
   */
  project(projection) {
    this.options.projection = projection;
    return this;
  }
  
  /**
   * Add sort specification
   * @param {Object} sort - Sort specification
   * @returns {FindQueryBuilder} This builder instance
   */
  sort(sort) {
    this.options.sort = sort;
    return this;
  }
  
  /**
   * Add sort by field in ascending order
   * @param {string} field - Field to sort by
   * @returns {FindQueryBuilder} This builder instance
   */
  sortAsc(field) {
    this.options.sort = { ...this.options.sort, [field]: 1 };
    return this;
  }
  
  /**
   * Add sort by field in descending order
   * @param {string} field - Field to sort by
   * @returns {FindQueryBuilder} This builder instance
   */
  sortDesc(field) {
    this.options.sort = { ...this.options.sort, [field]: -1 };
    return this;
  }
  
  /**
   * Add skip value
   * @param {number} skip - Number of documents to skip
   * @returns {FindQueryBuilder} This builder instance
   */
  skip(skip) {
    this.options.skip = skip;
    return this;
  }
  
  /**
   * Add limit value
   * @param {number} limit - Maximum number of documents to return
   * @returns {FindQueryBuilder} This builder instance
   */
  limit(limit) {
    this.options.limit = limit;
    return this;
  }
  
  /**
   * Add pagination
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Page size
   * @returns {FindQueryBuilder} This builder instance
   */
  paginate(page, pageSize) {
    const skip = (page - 1) * pageSize;
    this.options.skip = skip;
    this.options.limit = pageSize;
    return this;
  }
}

/**
 * Query builder for MongoDB update operations
 */
class UpdateQueryBuilder extends QueryBuilder {
  /**
   * Create a new update query builder
   */
  constructor() {
    super();
    this.update = {};
    this.options = {
      upsert: false,
      multi: false
    };
  }
  
  /**
   * Add equal condition for query
   * @param {string} field - Field name
   * @param {*} value - Value to compare
   * @returns {UpdateQueryBuilder} This builder instance
   */
  whereEquals(field, value) {
    if (field === '_id') {
      value = this.convertId(value);
    }
    this.query[field] = value;
    return this;
  }
  
  /**
   * Set a field value
   * @param {string} field - Field name
   * @param {*} value - Value to set
   * @returns {UpdateQueryBuilder} This builder instance
   */
  set(field, value) {
    if (!this.update.$set) {
      this.update.$set = {};
    }
    this.update.$set[field] = value;
    return this;
  }
  
  /**
   * Set multiple field values
   * @param {Object} fields - Field-value pairs
   * @returns {UpdateQueryBuilder} This builder instance
   */
  setAll(fields) {
    if (!this.update.$set) {
      this.update.$set = {};
    }
    Object.assign(this.update.$set, fields);
    return this;
  }
  
  /**
   * Unset a field
   * @param {string} field - Field name
   * @returns {UpdateQueryBuilder} This builder instance
   */
  unset(field) {
    if (!this.update.$unset) {
      this.update.$unset = {};
    }
    this.update.$unset[field] = '';
    return this;
  }
  
  /**
   * Increment a field value
   * @param {string} field - Field name
   * @param {number} [amount=1] - Amount to increment
   * @returns {UpdateQueryBuilder} This builder instance
   */
  inc(field, amount = 1) {
    if (!this.update.$inc) {
      this.update.$inc = {};
    }
    this.update.$inc[field] = amount;
    return this;
  }
  
  /**
   * Multiply a field value
   * @param {string} field - Field name
   * @param {number} amount - Factor to multiply by
   * @returns {UpdateQueryBuilder} This builder instance
   */
  mul(field, amount) {
    if (!this.update.$mul) {
      this.update.$mul = {};
    }
    this.update.$mul[field] = amount;
    return this;
  }
  
  /**
   * Set a field value if it's greater than the current value
   * @param {string} field - Field name
   * @param {*} value - Value to set
   * @returns {UpdateQueryBuilder} This builder instance
   */
  max(field, value) {
    if (!this.update.$max) {
      this.update.$max = {};
    }
    this.update.$max[field] = value;
    return this;
  }
  
  /**
   * Set a field value if it's less than the current value
   * @param {string} field - Field name
   * @param {*} value - Value to set
   * @returns {UpdateQueryBuilder} This builder instance
   */
  min(field, value) {
    if (!this.update.$min) {
      this.update.$min = {};
    }
    this.update.$min[field] = value;
    return this;
  }
  
  /**
   * Add an item to an array
   * @param {string} field - Field name
   * @param {*} value - Value to add
   * @returns {UpdateQueryBuilder} This builder instance
   */
  push(field, value) {
    if (!this.update.$push) {
      this.update.$push = {};
    }
    this.update.$push[field] = value;
    return this;
  }
  
  /**
   * Add multiple items to an array
   * @param {string} field - Field name
   * @param {Array} values - Values to add
   * @param {Object} [options={}] - Options for the operation
   * @returns {UpdateQueryBuilder} This builder instance
   */
  pushAll(field, values, options = {}) {
    if (!this.update.$push) {
      this.update.$push = {};
    }
    this.update.$push[field] = {
      $each: values,
      ...options
    };
    return this;
  }
  
  /**
   * Remove items from an array
   * @param {string} field - Field name
   * @param {*} value - Value to remove
   * @returns {UpdateQueryBuilder} This builder instance
   */
  pull(field, value) {
    if (!this.update.$pull) {
      this.update.$pull = {};
    }
    this.update.$pull[field] = value;
    return this;
  }
  
  /**
   * Remove all matching items from an array
   * @param {string} field - Field name
   * @param {Object} condition - Condition to match
   * @returns {UpdateQueryBuilder} This builder instance
   */
  pullAll(field, condition) {
    if (!this.update.$pull) {
      this.update.$pull = {};
    }
    this.update.$pull[field] = condition;
    return this;
  }
  
  /**
   * Add items to an array if they don't exist
   * @param {string} field - Field name
   * @param {*} value - Value to add
   * @returns {UpdateQueryBuilder} This builder instance
   */
  addToSet(field, value) {
    if (!this.update.$addToSet) {
      this.update.$addToSet = {};
    }
    this.update.$addToSet[field] = value;
    return this;
  }
  
  /**
   * Add multiple items to an array if they don't exist
   * @param {string} field - Field name
   * @param {Array} values - Values to add
   * @returns {UpdateQueryBuilder} This builder instance
   */
  addToSetAll(field, values) {
    if (!this.update.$addToSet) {
      this.update.$addToSet = {};
    }
    this.update.$addToSet[field] = { $each: values };
    return this;
  }
  
  /**
   * Set update options
   * @param {Object} options - Update options
   * @returns {UpdateQueryBuilder} This builder instance
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }
  
  /**
   * Set upsert option
   * @param {boolean} [value=true] - Whether to perform an upsert
   * @returns {UpdateQueryBuilder} This builder instance
   */
  upsert(value = true) {
    this.options.upsert = value;
    return this;
  }
  
  /**
   * Set multi-update option
   * @param {boolean} [value=true] - Whether to update multiple documents
   * @returns {UpdateQueryBuilder} This builder instance
   */
  multi(value = true) {
    this.options.multi = value;
    return this;
  }
  
  /**
   * Build the query, update, and options
   * @returns {Object} Object with query, update, and options
   */
  build() {
    return {
      query: this.query,
      update: this.update,
      options: this.options
    };
  }
}

/**
 * Query builder for MongoDB aggregation operations
 */
class AggregateQueryBuilder {
  /**
   * Create a new aggregate query builder
   */
  constructor() {
    this.pipeline = [];
    this.options = {};
  }
  
  /**
   * Add a stage to the pipeline
   * @param {Object} stage - Pipeline stage
   * @returns {AggregateQueryBuilder} This builder instance
   */
  addStage(stage) {
    this.pipeline.push(stage);
    return this;
  }
  
  /**
   * Add a $match stage
   * @param {Object} query - Match criteria
   * @returns {AggregateQueryBuilder} This builder instance
   */
  match(query) {
    return this.addStage({ $match: query });
  }
  
  /**
   * Add a $project stage
   * @param {Object} projection - Projection specification
   * @returns {AggregateQueryBuilder} This builder instance
   */
  project(projection) {
    return this.addStage({ $project: projection });
  }
  
  /**
   * Add a $group stage
   * @param {Object} group - Group specification
   * @returns {AggregateQueryBuilder} This builder instance
   */
  group(group) {
    return this.addStage({ $group: group });
  }
  
  /**
   * Add a $sort stage
   * @param {Object} sort - Sort specification
   * @returns {AggregateQueryBuilder} This builder instance
   */
  sort(sort) {
    return this.addStage({ $sort: sort });
  }
  
  /**
   * Add a $skip stage
   * @param {number} skip - Number of documents to skip
   * @returns {AggregateQueryBuilder} This builder instance
   */
  skip(skip) {
    return this.addStage({ $skip: skip });
  }
  
  /**
   * Add a $limit stage
   * @param {number} limit - Maximum number of documents to return
   * @returns {AggregateQueryBuilder} This builder instance
   */
  limit(limit) {
    return this.addStage({ $limit: limit });
  }
  
  /**
   * Add a $unwind stage
   * @param {string|Object} path - Path to array field or unwind specification
   * @returns {AggregateQueryBuilder} This builder instance
   */
  unwind(path) {
    if (typeof path === 'string') {
      return this.addStage({ $unwind: path });
    }
    return this.addStage({ $unwind: path });
  }
  
  /**
   * Add a $lookup stage
   * @param {Object} lookup - Lookup specification
   * @returns {AggregateQueryBuilder} This builder instance
   */
  lookup(lookup) {
    return this.addStage({ $lookup: lookup });
  }
  
  /**
   * Add a simplified $lookup stage
   * @param {string} from - Collection to join
   * @param {string} localField - Field from the input documents
   * @param {string} foreignField - Field from the documents of the from collection
   * @param {string} as - Output array field
   * @returns {AggregateQueryBuilder} This builder instance
   */
  simpleLookup(from, localField, foreignField, as) {
    return this.lookup({
      from,
      localField,
      foreignField,
      as
    });
  }
  
  /**
   * Add a $facet stage
   * @param {Object} facet - Facet specification
   * @returns {AggregateQueryBuilder} This builder instance
   */
  facet(facet) {
    return this.addStage({ $facet: facet });
  }
  
  /**
   * Add a $count stage
   * @param {string} countField - Name of the output field
   * @returns {AggregateQueryBuilder} This builder instance
   */
  count(countField) {
    return this.addStage({ $count: countField });
  }
  
  /**
   * Add a pagination facet (metadata + data)
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Page size
   * @returns {AggregateQueryBuilder} This builder instance
   */
  paginate(page, pageSize) {
    const skip = (page - 1) * pageSize;
    
    return this.facet({
      metadata: [
        { $count: 'total' },
        {
          $addFields: {
            page,
            pageSize,
            pageCount: { $ceil: { $divide: ['$total', pageSize] } }
          }
        }
      ],
      data: [
        { $skip: skip },
        { $limit: pageSize }
      ]
    });
  }
  
  /**
   * Set aggregation options
   * @param {Object} options - Aggregation options
   * @returns {AggregateQueryBuilder} This builder instance
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }
  
  /**
   * Build the pipeline and options
   * @returns {Object} Object with pipeline and options
   */
  build() {
    return {
      pipeline: this.pipeline,
      options: this.options
    };
  }
}

/**
 * Create a new find query builder
 * @returns {FindQueryBuilder} New find query builder
 */
function find() {
  return new FindQueryBuilder();
}

/**
 * Create a new update query builder
 * @returns {UpdateQueryBuilder} New update query builder
 */
function update() {
  return new UpdateQueryBuilder();
}

/**
 * Create a new aggregate query builder
 * @returns {AggregateQueryBuilder} New aggregate query builder
 */
function aggregate() {
  return new AggregateQueryBuilder();
}

module.exports = {
  find,
  update,
  aggregate,
  FindQueryBuilder,
  UpdateQueryBuilder,
  AggregateQueryBuilder,
  ObjectId
};
