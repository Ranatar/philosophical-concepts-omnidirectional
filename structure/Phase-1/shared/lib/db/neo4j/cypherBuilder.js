/**
 * Cypher query builder for Neo4j
 * Provides a fluent API for building Cypher queries
 */

/**
 * Represents a query pattern (node, relationship, path)
 * @typedef {Object} Pattern
 * @property {string} pattern - Pattern string
 * @property {Array<string>} identifiers - Identifiers used in the pattern
 */

/**
 * Base class for Cypher query builder
 */
class CypherBuilder {
  /**
   * Create a new Cypher query builder
   */
  constructor() {
    this.matchPatterns = [];
    this.optionalMatchPatterns = [];
    this.whereConditions = [];
    this.returnItems = [];
    this.orderByItems = [];
    this.skipValue = null;
    this.limitValue = null;
    this.createPatterns = [];
    this.mergePatterns = [];
    this.setItems = [];
    this.deleteItems = [];
    this.withItems = [];
    this.unwindItems = [];
    this.params = {};
    this.paramCount = 0;
  }
  
  /**
   * Generate a unique parameter name
   * @param {string} [prefix='param'] - Parameter name prefix
   * @returns {string} Unique parameter name
   */
  generateParamName(prefix = 'param') {
    return `${prefix}${++this.paramCount}`;
  }
  
  /**
   * Add a parameter to the query
   * @param {*} value - Parameter value
   * @param {string} [prefix='param'] - Parameter name prefix
   * @returns {string} Parameter name
   */
  addParam(value, prefix = 'param') {
    const paramName = this.generateParamName(prefix);
    this.params[paramName] = value;
    return paramName;
  }
  
  /**
   * Create a node pattern
   * @param {string} [identifier] - Node identifier
   * @param {Array<string>} [labels=[]] - Node labels
   * @param {Object} [properties={}] - Node properties
   * @returns {Pattern} Node pattern
   */
  node(identifier, labels = [], properties = {}) {
    let pattern = '(';
    
    // Add identifier if specified
    if (identifier) {
      pattern += identifier;
    }
    
    // Add labels if specified
    if (labels && labels.length > 0) {
      for (const label of labels) {
        pattern += `:${label}`;
      }
    }
    
    // Add properties if specified
    if (properties && Object.keys(properties).length > 0) {
      const paramName = this.addParam(properties, 'props');
      pattern += ` {${paramName}}`;
    }
    
    pattern += ')';
    
    return {
      pattern,
      identifiers: identifier ? [identifier] : []
    };
  }
  
  /**
   * Create a relationship pattern
   * @param {string} [identifier] - Relationship identifier
   * @param {string} [type] - Relationship type
   * @param {Object} [properties={}] - Relationship properties
   * @param {string} [direction='->'] - Relationship direction ('->', '<-', or '-')
   * @returns {Pattern} Relationship pattern
   */
  relationship(identifier, type, properties = {}, direction = '->') {
    let startArrow = '', endArrow = '';
    
    if (direction === '->') {
      endArrow = '>';
    } else if (direction === '<-') {
      startArrow = '<';
    }
    
    let pattern = `-[`;
    
    // Add identifier if specified
    if (identifier) {
      pattern += identifier;
    }
    
    // Add type if specified
    if (type) {
      pattern += `:${type}`;
    }
    
    // Add properties if specified
    if (properties && Object.keys(properties).length > 0) {
      const paramName = this.addParam(properties, 'relProps');
      pattern += ` {${paramName}}`;
    }
    
    pattern += `]${endArrow}`;
    
    return {
      pattern: `${startArrow}${pattern}`,
      identifiers: identifier ? [identifier] : []
    };
  }
  
  /**
   * Create a path pattern
   * @param {Array<Pattern>} patterns - Patterns to combine
   * @returns {Pattern} Path pattern
   */
  path(patterns) {
    let patternString = '';
    const identifiers = [];
    
    for (const pattern of patterns) {
      patternString += pattern.pattern;
      identifiers.push(...pattern.identifiers);
    }
    
    return {
      pattern: patternString,
      identifiers
    };
  }
  
  /**
   * Add a MATCH clause
   * @param {Pattern|string} pattern - Pattern to match
   * @returns {CypherBuilder} This builder instance
   */
  match(pattern) {
    if (typeof pattern === 'string') {
      this.matchPatterns.push({ pattern, identifiers: [] });
    } else {
      this.matchPatterns.push(pattern);
    }
    return this;
  }
  
  /**
   * Add an OPTIONAL MATCH clause
   * @param {Pattern|string} pattern - Pattern to match
   * @returns {CypherBuilder} This builder instance
   */
  optionalMatch(pattern) {
    if (typeof pattern === 'string') {
      this.optionalMatchPatterns.push({ pattern, identifiers: [] });
    } else {
      this.optionalMatchPatterns.push(pattern);
    }
    return this;
  }
  
  /**
   * Add a WHERE condition
   * @param {string} condition - Condition string
   * @returns {CypherBuilder} This builder instance
   */
  where(condition) {
    this.whereConditions.push(condition);
    return this;
  }
  
  /**
   * Add a property equality condition to WHERE
   * @param {string} identifier - Node or relationship identifier
   * @param {string} property - Property name
   * @param {*} value - Value to compare against
   * @returns {CypherBuilder} This builder instance
   */
  whereEquals(identifier, property, value) {
    const paramName = this.addParam(value);
    return this.where(`${identifier}.${property} = $${paramName}`);
  }
  
  /**
   * Add a property IN condition to WHERE
   * @param {string} identifier - Node or relationship identifier
   * @param {string} property - Property name
   * @param {Array} values - Values to check against
   * @returns {CypherBuilder} This builder instance
   */
  whereIn(identifier, property, values) {
    const paramName = this.addParam(values);
    return this.where(`${identifier}.${property} IN $${paramName}`);
  }
  
  /**
   * Add a RETURN clause
   * @param {...string} items - Items to return
   * @returns {CypherBuilder} This builder instance
   */
  return(...items) {
    this.returnItems.push(...items);
    return this;
  }
  
  /**
   * Add an ORDER BY clause
   * @param {string} item - Item to sort by
   * @param {string} [direction='ASC'] - Sort direction
   * @returns {CypherBuilder} This builder instance
   */
  orderBy(item, direction = 'ASC') {
    this.orderByItems.push(`${item} ${direction}`);
    return this;
  }
  
  /**
   * Add a SKIP clause
   * @param {number} count - Number of results to skip
   * @returns {CypherBuilder} This builder instance
   */
  skip(count) {
    this.skipValue = count;
    return this;
  }
  
  /**
   * Add a LIMIT clause
   * @param {number} count - Maximum number of results
   * @returns {CypherBuilder} This builder instance
   */
  limit(count) {
    this.limitValue = count;
    return this;
  }
  
  /**
   * Add a CREATE clause
   * @param {Pattern|string} pattern - Pattern to create
   * @returns {CypherBuilder} This builder instance
   */
  create(pattern) {
    if (typeof pattern === 'string') {
      this.createPatterns.push({ pattern, identifiers: [] });
    } else {
      this.createPatterns.push(pattern);
    }
    return this;
  }
  
  /**
   * Add a MERGE clause
   * @param {Pattern|string} pattern - Pattern to merge
   * @returns {CypherBuilder} This builder instance
   */
  merge(pattern) {
    if (typeof pattern === 'string') {
      this.mergePatterns.push({ pattern, identifiers: [] });
    } else {
      this.mergePatterns.push(pattern);
    }
    return this;
  }
  
  /**
   * Add a SET clause
   * @param {string} item - Item to set
   * @returns {CypherBuilder} This builder instance
   */
  set(item) {
    this.setItems.push(item);
    return this;
  }
  
  /**
   * Set a property value
   * @param {string} identifier - Node or relationship identifier
   * @param {string} property - Property name
   * @param {*} value - Property value
   * @returns {CypherBuilder} This builder instance
   */
  setProperty(identifier, property, value) {
    const paramName = this.addParam(value);
    return this.set(`${identifier}.${property} = $${paramName}`);
  }
  
  /**
   * Set multiple properties
   * @param {string} identifier - Node or relationship identifier
   * @param {Object} properties - Properties to set
   * @returns {CypherBuilder} This builder instance
   */
  setProperties(identifier, properties) {
    const paramName = this.addParam(properties);
    return this.set(`${identifier} += $${paramName}`);
  }
  
  /**
   * Add a DELETE clause
   * @param {...string} items - Items to delete
   * @returns {CypherBuilder} This builder instance
   */
  delete(...items) {
    this.deleteItems.push(...items);
    return this;
  }
  
  /**
   * Add a DETACH DELETE clause
   * @param {...string} items - Items to delete
   * @returns {CypherBuilder} This builder instance
   */
  detachDelete(...items) {
    // Use a special marker to indicate DETACH DELETE
    items.forEach(item => this.deleteItems.push(`DETACH:${item}`));
    return this;
  }
  
  /**
   * Add a WITH clause
   * @param {...string} items - Items to include
   * @returns {CypherBuilder} This builder instance
   */
  with(...items) {
    this.withItems.push(...items);
    return this;
  }
  
  /**
   * Add an UNWIND clause
   * @param {Array|string} list - List to unwind (array or parameter)
   * @param {string} identifier - Identifier for unwound items
   * @returns {CypherBuilder} This builder instance
   */
  unwind(list, identifier) {
    let paramName;
    
    if (typeof list === 'string') {
      paramName = list;
    } else {
      paramName = `$${this.addParam(list)}`;
    }
    
    this.unwindItems.push({
      list: paramName,
      identifier
    });
    
    return this;
  }
  
  /**
   * Build the Cypher query
   * @returns {Object} Object with query and params properties
   */
  build() {
    const parts = [];
    
    // Add MATCH clauses
    if (this.matchPatterns.length > 0) {
      for (let i = 0; i < this.matchPatterns.length; i++) {
        if (i === 0) {
          parts.push(`MATCH ${this.matchPatterns[i].pattern}`);
        } else {
          parts.push(`MATCH ${this.matchPatterns[i].pattern}`);
        }
      }
    }
    
    // Add OPTIONAL MATCH clauses
    if (this.optionalMatchPatterns.length > 0) {
      for (const pattern of this.optionalMatchPatterns) {
        parts.push(`OPTIONAL MATCH ${pattern.pattern}`);
      }
    }
    
    // Add UNWIND clauses
    if (this.unwindItems.length > 0) {
      for (const item of this.unwindItems) {
        parts.push(`UNWIND ${item.list} AS ${item.identifier}`);
      }
    }
    
    // Add WHERE conditions
    if (this.whereConditions.length > 0) {
      parts.push(`WHERE ${this.whereConditions.join(' AND ')}`);
    }
    
    // Add WITH clause
    if (this.withItems.length > 0) {
      parts.push(`WITH ${this.withItems.join(', ')}`);
    }
    
    // Add CREATE clauses
    if (this.createPatterns.length > 0) {
      for (const pattern of this.createPatterns) {
        parts.push(`CREATE ${pattern.pattern}`);
      }
    }
    
    // Add MERGE clauses
    if (this.mergePatterns.length > 0) {
      for (const pattern of this.mergePatterns) {
        parts.push(`MERGE ${pattern.pattern}`);
      }
    }
    
    // Add SET clauses
    if (this.setItems.length > 0) {
      parts.push(`SET ${this.setItems.join(', ')}`);
    }
    
    // Add DELETE clause
    if (this.deleteItems.length > 0) {
      const detachItems = [];
      const normalItems = [];
      
      for (const item of this.deleteItems) {
        if (item.startsWith('DETACH:')) {
          detachItems.push(item.substring(7));
        } else {
          normalItems.push(item);
        }
      }
      
      if (detachItems.length > 0) {
        parts.push(`DETACH DELETE ${detachItems.join(', ')}`);
      }
      
      if (normalItems.length > 0) {
        parts.push(`DELETE ${normalItems.join(', ')}`);
      }
    }
    
    // Add RETURN clause
    if (this.returnItems.length > 0) {
      parts.push(`RETURN ${this.returnItems.join(', ')}`);
    }
    
    // Add ORDER BY clause
    if (this.orderByItems.length > 0) {
      parts.push(`ORDER BY ${this.orderByItems.join(', ')}`);
    }
    
    // Add SKIP clause
    if (this.skipValue !== null) {
      parts.push(`SKIP ${this.skipValue}`);
    }
    
    // Add LIMIT clause
    if (this.limitValue !== null) {
      parts.push(`LIMIT ${this.limitValue}`);
    }
    
    return {
      query: parts.join('\n'),
      params: this.params
    };
  }
}

/**
 * Create a new Cypher query builder
 * @returns {CypherBuilder} New Cypher query builder
 */
function cypher() {
  return new CypherBuilder();
}

/**
 * Build a node-finding query
 * @param {string} label - Node label
 * @param {Object} [properties={}] - Properties to match
 * @returns {Object} Object with query and params properties
 */
function findNode(label, properties = {}) {
  const builder = new CypherBuilder();
  const node = builder.node('n', [label], properties);
  
  return builder
    .match(node)
    .return('n')
    .build();
}

/**
 * Build a node-creation query
 * @param {string} label - Node label
 * @param {Object} properties - Node properties
 * @returns {Object} Object with query and params properties
 */
function createNode(label, properties) {
  const builder = new CypherBuilder();
  const node = builder.node('n', [label], properties);
  
  return builder
    .create(node)
    .return('n')
    .build();
}

/**
 * Build a node-update query
 * @param {string} label - Node label
 * @param {string} idProperty - ID property name
 * @param {string|number} id - ID value
 * @param {Object} properties - Properties to update
 * @returns {Object} Object with query and params properties
 */
function updateNode(label, idProperty, id, properties) {
  const builder = new CypherBuilder();
  const matchProperties = {};
  matchProperties[idProperty] = id;
  
  const node = builder.node('n', [label], matchProperties);
  
  builder.match(node);
  
  if (Object.keys(properties).length > 0) {
    builder.setProperties('n', properties);
  }
  
  return builder
    .return('n')
    .build();
}

/**
 * Build a node-deletion query
 * @param {string} label - Node label
 * @param {string} idProperty - ID property name
 * @param {string|number} id - ID value
 * @param {boolean} [detach=false] - Whether to detach delete
 * @returns {Object} Object with query and params properties
 */
function deleteNode(label, idProperty, id, detach = false) {
  const builder = new CypherBuilder();
  const matchProperties = {};
  matchProperties[idProperty] = id;
  
  const node = builder.node('n', [label], matchProperties);
  
  builder.match(node);
  
  if (detach) {
    builder.detachDelete('n');
  } else {
    builder.delete('n');
  }
  
  return builder.build();
}

/**
 * Build a relationship-creation query
 * @param {string} startLabel - Start node label
 * @param {string} startIdProperty - Start node ID property name
 * @param {string|number} startId - Start node ID value
 * @param {string} endLabel - End node label
 * @param {string} endIdProperty - End node ID property name
 * @param {string|number} endId - End node ID value
 * @param {string} relType - Relationship type
 * @param {Object} [relProperties={}] - Relationship properties
 * @returns {Object} Object with query and params properties
 */
function createRelationship(startLabel, startIdProperty, startId, endLabel, endIdProperty, endId, relType, relProperties = {}) {
  const builder = new CypherBuilder();
  
  const startMatchProperties = {};
  startMatchProperties[startIdProperty] = startId;
  
  const endMatchProperties = {};
  endMatchProperties[endIdProperty] = endId;
  
  const startNode = builder.node('start', [startLabel], startMatchProperties);
  const endNode = builder.node('end', [endLabel], endMatchProperties);
  const relationship = builder.relationship('r', relType, relProperties);
  
  builder.match(startNode);
  builder.match(endNode);
  
  const relPath = builder.path([startNode, relationship, endNode]);
  
  return builder
    .create(relPath)
    .return('r')
    .build();
}

module.exports = {
  cypher,
  CypherBuilder,
  findNode,
  createNode,
  updateNode,
  deleteNode,
  createRelationship
};
