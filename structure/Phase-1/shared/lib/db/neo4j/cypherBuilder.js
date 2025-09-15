/**
 * Cypher query builder for Neo4j
 * Provides safe and convenient query construction for graph operations
 */

/**
 * Cypher Query Builder for Neo4j
 */
class CypherBuilder {
  constructor() {
    this.matchClauses = [];
    this.createClauses = [];
    this.mergeClauses = [];
    this.whereClauses = [];
    this.setClauses = [];
    this.removeClauses = [];
    this.deleteClauses = [];
    this.returnClauses = [];
    this.orderByClauses = [];
    this.withClauses = [];
    this.unionClauses = [];
    this.limitValue = null;
    this.skipValue = null;
    this.params = {};
    this.paramCounter = 0;
  }

  /**
   * Add MATCH clause
   * @param {string} pattern - Node/relationship pattern
   * @returns {CypherBuilder} This instance for chaining
   */
  match(pattern) {
    this.matchClauses.push(`MATCH ${pattern}`);
    return this;
  }

  /**
   * Add OPTIONAL MATCH clause
   * @param {string} pattern - Node/relationship pattern
   * @returns {CypherBuilder} This instance for chaining
   */
  optionalMatch(pattern) {
    this.matchClauses.push(`OPTIONAL MATCH ${pattern}`);
    return this;
  }

  /**
   * Add CREATE clause
   * @param {string} pattern - Node/relationship pattern
   * @returns {CypherBuilder} This instance for chaining
   */
  create(pattern) {
    this.createClauses.push(`CREATE ${pattern}`);
    return this;
  }

  /**
   * Add MERGE clause
   * @param {string} pattern - Node/relationship pattern
   * @returns {CypherBuilder} This instance for chaining
   */
  merge(pattern) {
    this.mergeClauses.push(`MERGE ${pattern}`);
    return this;
  }

  /**
   * Add ON CREATE SET clause
   * @param {string} variable - Variable name
   * @param {Object} properties - Properties to set
   * @returns {CypherBuilder} This instance for chaining
   */
  onCreate(variable, properties) {
    const sets = this.buildSetExpressions(variable, properties);
    if (sets.length > 0) {
      this.mergeClauses.push(`ON CREATE SET ${sets.join(', ')}`);
    }
    return this;
  }

  /**
   * Add ON MATCH SET clause
   * @param {string} variable - Variable name
   * @param {Object} properties - Properties to set
   * @returns {CypherBuilder} This instance for chaining
   */
  onMatch(variable, properties) {
    const sets = this.buildSetExpressions(variable, properties);
    if (sets.length > 0) {
      this.mergeClauses.push(`ON MATCH SET ${sets.join(', ')}`);
    }
    return this;
  }

  /**
   * Add WHERE condition
   * @param {string} condition - WHERE condition
   * @param {Object} params - Parameters for the condition
   * @returns {CypherBuilder} This instance for chaining
   */
  where(condition, params = {}) {
    // Replace parameter placeholders
    let processedCondition = condition;
    Object.entries(params).forEach(([key, value]) => {
      const paramName = this.addParam(value);
      processedCondition = processedCondition.replace(new RegExp(`\\$${key}`, 'g'), `$${paramName}`);
    });

    if (this.whereClauses.length === 0) {
      this.whereClauses.push(processedCondition);
    } else {
      this.whereClauses.push(`AND ${processedCondition}`);
    }
    return this;
  }

  /**
   * Add OR WHERE condition
   * @param {string} condition - WHERE condition
   * @param {Object} params - Parameters for the condition
   * @returns {CypherBuilder} This instance for chaining
   */
  orWhere(condition, params = {}) {
    // Replace parameter placeholders
    let processedCondition = condition;
    Object.entries(params).forEach(([key, value]) => {
      const paramName = this.addParam(value);
      processedCondition = processedCondition.replace(new RegExp(`\\$${key}`, 'g'), `$${paramName}`);
    });

    if (this.whereClauses.length === 0) {
      this.whereClauses.push(processedCondition);
    } else {
      this.whereClauses.push(`OR ${processedCondition}`);
    }
    return this;
  }

  /**
   * Add WHERE ID condition
   * @param {string} variable - Variable name
   * @param {number|Array<number>} ids - Node ID(s)
   * @returns {CypherBuilder} This instance for chaining
   */
  whereId(variable, ids) {
    if (Array.isArray(ids)) {
      const paramName = this.addParam(ids);
      return this.where(`id(${variable}) IN $${paramName}`);
    } else {
      const paramName = this.addParam(ids);
      return this.where(`id(${variable}) = $${paramName}`);
    }
  }

  /**
   * Add WHERE property condition
   * @param {string} variable - Variable name
   * @param {string} property - Property name
   * @param {string} operator - Comparison operator
   * @param {any} value - Value to compare
   * @returns {CypherBuilder} This instance for chaining
   */
  whereProperty(variable, property, operator, value = undefined) {
    if (value === undefined) {
      // Two-argument form: whereProperty('n', 'name', 'value')
      value = operator;
      operator = '=';
    }

    const paramName = this.addParam(value);
    return this.where(`${variable}.${property} ${operator} $${paramName}`);
  }

  /**
   * Add WHERE IN condition
   * @param {string} variable - Variable name
   * @param {string} property - Property name
   * @param {Array} values - Array of values
   * @returns {CypherBuilder} This instance for chaining
   */
  whereIn(variable, property, values) {
    const paramName = this.addParam(values);
    return this.where(`${variable}.${property} IN $${paramName}`);
  }

  /**
   * Add WHERE NOT IN condition
   * @param {string} variable - Variable name
   * @param {string} property - Property name
   * @param {Array} values - Array of values
   * @returns {CypherBuilder} This instance for chaining
   */
  whereNotIn(variable, property, values) {
    const paramName = this.addParam(values);
    return this.where(`${variable}.${property} NOT IN $${paramName}`);
  }

  /**
   * Add WHERE NULL condition
   * @param {string} variable - Variable name
   * @param {string} property - Property name
   * @returns {CypherBuilder} This instance for chaining
   */
  whereNull(variable, property) {
    return this.where(`${variable}.${property} IS NULL`);
  }

  /**
   * Add WHERE NOT NULL condition
   * @param {string} variable - Variable name
   * @param {string} property - Property name
   * @returns {CypherBuilder} This instance for chaining
   */
  whereNotNull(variable, property) {
    return this.where(`${variable}.${property} IS NOT NULL`);
  }

  /**
   * Add WHERE EXISTS pattern
   * @param {string} pattern - Pattern to check existence
   * @returns {CypherBuilder} This instance for chaining
   */
  whereExists(pattern) {
    return this.where(`EXISTS ${pattern}`);
  }

  /**
   * Add WHERE NOT EXISTS pattern
   * @param {string} pattern - Pattern to check non-existence
   * @returns {CypherBuilder} This instance for chaining
   */
  whereNotExists(pattern) {
    return this.where(`NOT EXISTS ${pattern}`);
  }

  /**
   * Add SET clause
   * @param {string} variable - Variable name
   * @param {Object} properties - Properties to set
   * @returns {CypherBuilder} This instance for chaining
   */
  set(variable, properties) {
    const sets = this.buildSetExpressions(variable, properties);
    this.setClauses.push(...sets);
    return this;
  }

  /**
   * Add SET with += (add properties)
   * @param {string} variable - Variable name
   * @param {Object} properties - Properties to add
   * @returns {CypherBuilder} This instance for chaining
   */
  setAdd(variable, properties) {
    const paramName = this.addParam(properties);
    this.setClauses.push(`${variable} += $${paramName}`);
    return this;
  }

  /**
   * Add REMOVE clause
   * @param {string} variable - Variable name
   * @param {string|Array<string>} properties - Properties to remove
   * @returns {CypherBuilder} This instance for chaining
   */
  remove(variable, properties) {
    const props = Array.isArray(properties) ? properties : [properties];
    props.forEach(prop => {
      this.removeClauses.push(`${variable}.${prop}`);
    });
    return this;
  }

  /**
   * Add DELETE clause
   * @param {string|Array<string>} variables - Variables to delete
   * @returns {CypherBuilder} This instance for chaining
   */
  delete(...variables) {
    this.deleteClauses.push(...variables.flat());
    return this;
  }

  /**
   * Add DETACH DELETE clause
   * @param {string|Array<string>} variables - Variables to detach delete
   * @returns {CypherBuilder} This instance for chaining
   */
  detachDelete(...variables) {
    variables.flat().forEach(variable => {
      this.deleteClauses.push(`DETACH DELETE ${variable}`);
    });
    return this;
  }

  /**
   * Add RETURN clause
   * @param {...string} expressions - Expressions to return
   * @returns {CypherBuilder} This instance for chaining
   */
  return(...expressions) {
    this.returnClauses.push(...expressions.flat());
    return this;
  }

  /**
   * Add RETURN DISTINCT clause
   * @param {...string} expressions - Expressions to return distinct
   * @returns {CypherBuilder} This instance for chaining
   */
  returnDistinct(...expressions) {
    this.returnClauses.push(`DISTINCT ${expressions.flat().join(', ')}`);
    return this;
  }

  /**
   * Add aggregation to RETURN
   * @param {string} function - Aggregation function
   * @param {string} expression - Expression to aggregate
   * @param {string} alias - Alias for the result
   * @returns {CypherBuilder} This instance for chaining
   */
  returnAggregation(func, expression, alias) {
    const aggregation = `${func}(${expression})`;
    const returnExpr = alias ? `${aggregation} AS ${alias}` : aggregation;
    this.returnClauses.push(returnExpr);
    return this;
  }

  /**
   * Add ORDER BY clause
   * @param {string} expression - Expression to order by
   * @param {string} direction - Sort direction (ASC/DESC)
   * @returns {CypherBuilder} This instance for chaining
   */
  orderBy(expression, direction = 'ASC') {
    this.orderByClauses.push(`${expression} ${direction.toUpperCase()}`);
    return this;
  }

  /**
   * Set LIMIT clause
   * @param {number} limit - Limit value
   * @returns {CypherBuilder} This instance for chaining
   */
  limit(limit) {
    this.limitValue = limit;
    return this;
  }

  /**
   * Set SKIP clause
   * @param {number} skip - Skip value
   * @returns {CypherBuilder} This instance for chaining
   */
  skip(skip) {
    this.skipValue = skip;
    return this;
  }

  /**
   * Add WITH clause
   * @param {...string} expressions - Expressions for WITH
   * @returns {CypherBuilder} This instance for chaining
   */
  with(...expressions) {
    this.withClauses.push(expressions.flat().join(', '));
    return this;
  }

  /**
   * Add UNION clause
   * @param {CypherBuilder|string} query - Query to union
   * @param {boolean} all - Whether to use UNION ALL
   * @returns {CypherBuilder} This instance for chaining
   */
  union(query, all = false) {
    const unionType = all ? 'UNION ALL' : 'UNION';
    const queryString = query instanceof CypherBuilder ? query.build().query : query;
    
    if (query instanceof CypherBuilder) {
      // Merge parameters from the other query
      Object.assign(this.params, query.params);
    }
    
    this.unionClauses.push(`${unionType}\n${queryString}`);
    return this;
  }

  /**
   * Build node pattern
   * @param {string} variable - Variable name
   * @param {string|Array<string>} labels - Node labels
   * @param {Object} properties - Node properties
   * @returns {string} Node pattern
   */
  static node(variable, labels = null, properties = null) {
    let pattern = variable || '';
    
    if (labels) {
      const labelString = Array.isArray(labels) ? labels.map(l => `:${l}`).join('') : `:${labels}`;
      pattern += labelString;
    }
    
    if (properties && Object.keys(properties).length > 0) {
      const propString = Object.entries(properties)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ');
      pattern += ` {${propString}}`;
    }
    
    return `(${pattern})`;
  }

  /**
   * Build relationship pattern
   * @param {string} variable - Variable name
   * @param {string} type - Relationship type
   * @param {Object} properties - Relationship properties
   * @param {string} direction - Relationship direction ('>', '<', '')
   * @returns {string} Relationship pattern
   */
  static relationship(variable = null, type = null, properties = null, direction = '>') {
    let pattern = variable || '';
    
    if (type) {
      pattern += pattern ? `:${type}` : `:${type}`;
    }
    
    if (properties && Object.keys(properties).length > 0) {
      const propString = Object.entries(properties)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ');
      pattern += ` {${propString}}`;
    }
    
    if (direction === '>') {
      return `-[${pattern}]->`;
    } else if (direction === '<') {
      return `<-[${pattern}]-`;
    } else {
      return `-[${pattern}]-`;
    }
  }

  /**
   * Build path pattern
   * @param {string} startNode - Start node pattern
   * @param {string} relationship - Relationship pattern
   * @param {string} endNode - End node pattern
   * @returns {string} Path pattern
   */
  static path(startNode, relationship, endNode) {
    return `${startNode}${relationship}${endNode}`;
  }

  /**
   * Add parameter and return its name
   * @param {any} value - Parameter value
   * @returns {string} Parameter name
   */
  addParam(value) {
    const paramName = `param${++this.paramCounter}`;
    this.params[paramName] = value;
    return paramName;
  }

  /**
   * Build SET expressions
   * @param {string} variable - Variable name
   * @param {Object} properties - Properties to set
   * @returns {Array<string>} SET expressions
   */
  buildSetExpressions(variable, properties) {
    const expressions = [];
    
    Object.entries(properties).forEach(([key, value]) => {
      const paramName = this.addParam(value);
      expressions.push(`${variable}.${key} = $${paramName}`);
    });
    
    return expressions;
  }

  /**
   * Build the complete Cypher query
   * @returns {Object} Query object with query string and parameters
   */
  build() {
    const parts = [];

    // WITH clauses (can appear multiple times)
    this.withClauses.forEach((withClause, index) => {
      if (index > 0 || parts.length > 0) {
        parts.push(`WITH ${withClause}`);
      }
    });

    // MATCH clauses
    if (this.matchClauses.length > 0) {
      parts.push(...this.matchClauses);
    }

    // CREATE clauses
    if (this.createClauses.length > 0) {
      parts.push(...this.createClauses);
    }

    // MERGE clauses
    if (this.mergeClauses.length > 0) {
      parts.push(...this.mergeClauses);
    }

    // WHERE clause
    if (this.whereClauses.length > 0) {
      parts.push(`WHERE ${this.whereClauses.join(' ')}`);
    }

    // SET clauses
    if (this.setClauses.length > 0) {
      parts.push(`SET ${this.setClauses.join(', ')}`);
    }

    // REMOVE clauses
    if (this.removeClauses.length > 0) {
      parts.push(`REMOVE ${this.removeClauses.join(', ')}`);
    }

    // DELETE clauses
    if (this.deleteClauses.length > 0) {
      const deleteClause = this.deleteClauses.some(d => d.startsWith('DETACH')) 
        ? this.deleteClauses.join('\n')
        : `DELETE ${this.deleteClauses.join(', ')}`;
      parts.push(deleteClause);
    }

    // RETURN clause
    if (this.returnClauses.length > 0) {
      parts.push(`RETURN ${this.returnClauses.join(', ')}`);
    }

    // ORDER BY clause
    if (this.orderByClauses.length > 0) {
      parts.push(`ORDER BY ${this.orderByClauses.join(', ')}`);
    }

    // SKIP clause
    if (this.skipValue !== null) {
      parts.push(`SKIP ${this.skipValue}`);
    }

    // LIMIT clause
    if (this.limitValue !== null) {
      parts.push(`LIMIT ${this.limitValue}`);
    }

    // UNION clauses
    if (this.unionClauses.length > 0) {
      parts.push(...this.unionClauses);
    }

    return {
      query: parts.join('\n'),
      params: this.params
    };
  }

  /**
   * Get Cypher query string
   * @returns {string} Cypher query
   */
  toString() {
    return this.build().query;
  }

  /**
   * Clone the query builder
   * @returns {CypherBuilder} Cloned instance
   */
  clone() {
    const cloned = new CypherBuilder();
    cloned.matchClauses = [...this.matchClauses];
    cloned.createClauses = [...this.createClauses];
    cloned.mergeClauses = [...this.mergeClauses];
    cloned.whereClauses = [...this.whereClauses];
    cloned.setClauses = [...this.setClauses];
    cloned.removeClauses = [...this.removeClauses];
    cloned.deleteClauses = [...this.deleteClauses];
    cloned.returnClauses = [...this.returnClauses];
    cloned.orderByClauses = [...this.orderByClauses];
    cloned.withClauses = [...this.withClauses];
    cloned.unionClauses = [...this.unionClauses];
    cloned.limitValue = this.limitValue;
    cloned.skipValue = this.skipValue;
    cloned.params = { ...this.params };
    cloned.paramCounter = this.paramCounter;
    return cloned;
  }

  /**
   * Reset the query builder
   * @returns {CypherBuilder} This instance for chaining
   */
  reset() {
    this.matchClauses = [];
    this.createClauses = [];
    this.mergeClauses = [];
    this.whereClauses = [];
    this.setClauses = [];
    this.removeClauses = [];
    this.deleteClauses = [];
    this.returnClauses = [];
    this.orderByClauses = [];
    this.withClauses = [];
    this.unionClauses = [];
    this.limitValue = null;
    this.skipValue = null;
    this.params = {};
    this.paramCounter = 0;
    return this;
  }
}

/**
 * Helper function to create a new Cypher builder
 * @returns {CypherBuilder} New Cypher builder instance
 */
function cypher() {
  return new CypherBuilder();
}

/**
 * Helper function to escape string for Cypher
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeString(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
}

/**
 * Helper function to format label
 * @param {string} label - Label to format
 * @returns {string} Formatted label
 */
function formatLabel(label) {
  // Remove special characters and ensure valid label format
  return label.replace(/[^a-zA-Z0-9_]/g, '_');
}

module.exports = {
  CypherBuilder,
  cypher,
  escapeString,
  formatLabel,
  
  // Static helpers
  node: CypherBuilder.node,
  relationship: CypherBuilder.relationship,
  path: CypherBuilder.path
};