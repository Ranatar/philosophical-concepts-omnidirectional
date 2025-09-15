/**
 * PostgreSQL query builder for the Philosophy Service
 * Provides safe and convenient query construction
 */

const { snakeCase } = require('../../formatting/stringFormatters');

/**
 * SQL Query Builder for PostgreSQL
 */
class QueryBuilder {
  constructor(table = null) {
    this.table = table;
    this.selectFields = [];
    this.joinClauses = [];
    this.whereClauses = [];
    this.havingClauses = [];
    this.orderByClauses = [];
    this.groupByFields = [];
    this.limitValue = null;
    this.offsetValue = null;
    this.returningFields = [];
    this.withClauses = [];
    this.params = [];
    this.paramCounter = 0;
  }

  /**
   * Set table for the query
   * @param {string} tableName - Table name
   * @returns {QueryBuilder} This instance for chaining
   */
  from(tableName) {
    this.table = tableName;
    return this;
  }

  /**
   * Add SELECT fields
   * @param {...string} fields - Fields to select
   * @returns {QueryBuilder} This instance for chaining
   */
  select(...fields) {
    if (fields.length === 0) {
      this.selectFields.push('*');
    } else {
      this.selectFields.push(...fields.flat());
    }
    return this;
  }

  /**
   * Add raw SELECT expression
   * @param {string} expression - Raw SQL expression
   * @param {string} alias - Alias for the expression
   * @returns {QueryBuilder} This instance for chaining
   */
  selectRaw(expression, alias = null) {
    const field = alias ? `${expression} AS ${alias}` : expression;
    this.selectFields.push(field);
    return this;
  }

  /**
   * Add WHERE condition
   * @param {string} field - Field name
   * @param {string} operator - Comparison operator
   * @param {any} value - Value to compare
   * @returns {QueryBuilder} This instance for chaining
   */
  where(field, operator, value = undefined) {
    if (value === undefined) {
      // Handle two-argument form: where('field', 'value')
      value = operator;
      operator = '=';
    }

    const paramIndex = this.addParam(value);
    const condition = `${field} ${operator} $${paramIndex}`;
    
    if (this.whereClauses.length === 0) {
      this.whereClauses.push(condition);
    } else {
      this.whereClauses.push(`AND ${condition}`);
    }
    
    return this;
  }

  /**
   * Add OR WHERE condition
   * @param {string} field - Field name
   * @param {string} operator - Comparison operator
   * @param {any} value - Value to compare
   * @returns {QueryBuilder} This instance for chaining
   */
  orWhere(field, operator, value = undefined) {
    if (value === undefined) {
      value = operator;
      operator = '=';
    }

    const paramIndex = this.addParam(value);
    const condition = `${field} ${operator} $${paramIndex}`;
    
    if (this.whereClauses.length === 0) {
      this.whereClauses.push(condition);
    } else {
      this.whereClauses.push(`OR ${condition}`);
    }
    
    return this;
  }

  /**
   * Add WHERE IN condition
   * @param {string} field - Field name
   * @param {Array} values - Array of values
   * @returns {QueryBuilder} This instance for chaining
   */
  whereIn(field, values) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('whereIn requires non-empty array');
    }

    const paramIndices = values.map(v => this.addParam(v));
    const placeholders = paramIndices.map(i => `$${i}`).join(', ');
    const condition = `${field} IN (${placeholders})`;
    
    if (this.whereClauses.length === 0) {
      this.whereClauses.push(condition);
    } else {
      this.whereClauses.push(`AND ${condition}`);
    }
    
    return this;
  }

  /**
   * Add WHERE NOT IN condition
   * @param {string} field - Field name
   * @param {Array} values - Array of values
   * @returns {QueryBuilder} This instance for chaining
   */
  whereNotIn(field, values) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('whereNotIn requires non-empty array');
    }

    const paramIndices = values.map(v => this.addParam(v));
    const placeholders = paramIndices.map(i => `$${i}`).join(', ');
    const condition = `${field} NOT IN (${placeholders})`;
    
    if (this.whereClauses.length === 0) {
      this.whereClauses.push(condition);
    } else {
      this.whereClauses.push(`AND ${condition}`);
    }
    
    return this;
  }

  /**
   * Add WHERE NULL condition
   * @param {string} field - Field name
   * @returns {QueryBuilder} This instance for chaining
   */
  whereNull(field) {
    const condition = `${field} IS NULL`;
    
    if (this.whereClauses.length === 0) {
      this.whereClauses.push(condition);
    } else {
      this.whereClauses.push(`AND ${condition}`);
    }
    
    return this;
  }

  /**
   * Add WHERE NOT NULL condition
   * @param {string} field - Field name
   * @returns {QueryBuilder} This instance for chaining
   */
  whereNotNull(field) {
    const condition = `${field} IS NOT NULL`;
    
    if (this.whereClauses.length === 0) {
      this.whereClauses.push(condition);
    } else {
      this.whereClauses.push(`AND ${condition}`);
    }
    
    return this;
  }

  /**
   * Add WHERE BETWEEN condition
   * @param {string} field - Field name
   * @param {any} start - Start value
   * @param {any} end - End value
   * @returns {QueryBuilder} This instance for chaining
   */
  whereBetween(field, start, end) {
    const startIndex = this.addParam(start);
    const endIndex = this.addParam(end);
    const condition = `${field} BETWEEN $${startIndex} AND $${endIndex}`;
    
    if (this.whereClauses.length === 0) {
      this.whereClauses.push(condition);
    } else {
      this.whereClauses.push(`AND ${condition}`);
    }
    
    return this;
  }

  /**
   * Add WHERE LIKE condition
   * @param {string} field - Field name
   * @param {string} pattern - LIKE pattern
   * @returns {QueryBuilder} This instance for chaining
   */
  whereLike(field, pattern) {
    const paramIndex = this.addParam(pattern);
    const condition = `${field} LIKE $${paramIndex}`;
    
    if (this.whereClauses.length === 0) {
      this.whereClauses.push(condition);
    } else {
      this.whereClauses.push(`AND ${condition}`);
    }
    
    return this;
  }

  /**
   * Add WHERE ILIKE condition (case-insensitive)
   * @param {string} field - Field name
   * @param {string} pattern - ILIKE pattern
   * @returns {QueryBuilder} This instance for chaining
   */
  whereILike(field, pattern) {
    const paramIndex = this.addParam(pattern);
    const condition = `${field} ILIKE $${paramIndex}`;
    
    if (this.whereClauses.length === 0) {
      this.whereClauses.push(condition);
    } else {
      this.whereClauses.push(`AND ${condition}`);
    }
    
    return this;
  }

  /**
   * Add raw WHERE condition
   * @param {string} condition - Raw SQL condition
   * @param {Array} params - Parameters for the condition
   * @returns {QueryBuilder} This instance for chaining
   */
  whereRaw(condition, params = []) {
    const paramIndices = params.map(p => this.addParam(p));
    let finalCondition = condition;
    
    // Replace ? placeholders with $n
    paramIndices.forEach((index, i) => {
      finalCondition = finalCondition.replace('?', `$${index}`);
    });
    
    if (this.whereClauses.length === 0) {
      this.whereClauses.push(finalCondition);
    } else {
      this.whereClauses.push(`AND ${finalCondition}`);
    }
    
    return this;
  }

  /**
   * Add JOIN clause
   * @param {string} table - Table to join
   * @param {string} field1 - First field
   * @param {string} operator - Join operator
   * @param {string} field2 - Second field
   * @returns {QueryBuilder} This instance for chaining
   */
  join(table, field1, operator, field2) {
    this.joinClauses.push(`JOIN ${table} ON ${field1} ${operator} ${field2}`);
    return this;
  }

  /**
   * Add LEFT JOIN clause
   * @param {string} table - Table to join
   * @param {string} field1 - First field
   * @param {string} operator - Join operator
   * @param {string} field2 - Second field
   * @returns {QueryBuilder} This instance for chaining
   */
  leftJoin(table, field1, operator, field2) {
    this.joinClauses.push(`LEFT JOIN ${table} ON ${field1} ${operator} ${field2}`);
    return this;
  }

  /**
   * Add RIGHT JOIN clause
   * @param {string} table - Table to join
   * @param {string} field1 - First field
   * @param {string} operator - Join operator
   * @param {string} field2 - Second field
   * @returns {QueryBuilder} This instance for chaining
   */
  rightJoin(table, field1, operator, field2) {
    this.joinClauses.push(`RIGHT JOIN ${table} ON ${field1} ${operator} ${field2}`);
    return this;
  }

  /**
   * Add GROUP BY clause
   * @param {...string} fields - Fields to group by
   * @returns {QueryBuilder} This instance for chaining
   */
  groupBy(...fields) {
    this.groupByFields.push(...fields.flat());
    return this;
  }

  /**
   * Add HAVING clause
   * @param {string} field - Field name
   * @param {string} operator - Comparison operator
   * @param {any} value - Value to compare
   * @returns {QueryBuilder} This instance for chaining
   */
  having(field, operator, value = undefined) {
    if (value === undefined) {
      value = operator;
      operator = '=';
    }

    const paramIndex = this.addParam(value);
    const condition = `${field} ${operator} $${paramIndex}`;
    
    if (this.havingClauses.length === 0) {
      this.havingClauses.push(condition);
    } else {
      this.havingClauses.push(`AND ${condition}`);
    }
    
    return this;
  }

  /**
   * Add ORDER BY clause
   * @param {string} field - Field to order by
   * @param {string} direction - Sort direction (ASC/DESC)
   * @returns {QueryBuilder} This instance for chaining
   */
  orderBy(field, direction = 'ASC') {
    this.orderByClauses.push(`${field} ${direction.toUpperCase()}`);
    return this;
  }

  /**
   * Set LIMIT clause
   * @param {number} limit - Limit value
   * @returns {QueryBuilder} This instance for chaining
   */
  limit(limit) {
    this.limitValue = limit;
    return this;
  }

  /**
   * Set OFFSET clause
   * @param {number} offset - Offset value
   * @returns {QueryBuilder} This instance for chaining
   */
  offset(offset) {
    this.offsetValue = offset;
    return this;
  }

  /**
   * Add RETURNING clause
   * @param {...string} fields - Fields to return
   * @returns {QueryBuilder} This instance for chaining
   */
  returning(...fields) {
    if (fields.length === 0) {
      this.returningFields.push('*');
    } else {
      this.returningFields.push(...fields.flat());
    }
    return this;
  }

  /**
   * Add WITH clause (CTE)
   * @param {string} name - CTE name
   * @param {QueryBuilder|string} query - CTE query
   * @returns {QueryBuilder} This instance for chaining
   */
  with(name, query) {
    const cteQuery = query instanceof QueryBuilder ? query.toSQL() : query;
    this.withClauses.push(`${name} AS (${cteQuery.text})`);
    if (query instanceof QueryBuilder) {
      this.params.push(...query.params);
    }
    return this;
  }

  /**
   * Build SELECT query
   * @returns {Object} Query object with text and params
   */
  buildSelect() {
    const parts = [];

    // WITH clause
    if (this.withClauses.length > 0) {
      parts.push(`WITH ${this.withClauses.join(', ')}`);
    }

    // SELECT clause
    const selectClause = this.selectFields.length > 0 
      ? this.selectFields.join(', ') 
      : '*';
    parts.push(`SELECT ${selectClause}`);

    // FROM clause
    if (this.table) {
      parts.push(`FROM ${this.table}`);
    }

    // JOIN clauses
    if (this.joinClauses.length > 0) {
      parts.push(...this.joinClauses);
    }

    // WHERE clause
    if (this.whereClauses.length > 0) {
      parts.push(`WHERE ${this.whereClauses.join(' ')}`);
    }

    // GROUP BY clause
    if (this.groupByFields.length > 0) {
      parts.push(`GROUP BY ${this.groupByFields.join(', ')}`);
    }

    // HAVING clause
    if (this.havingClauses.length > 0) {
      parts.push(`HAVING ${this.havingClauses.join(' ')}`);
    }

    // ORDER BY clause
    if (this.orderByClauses.length > 0) {
      parts.push(`ORDER BY ${this.orderByClauses.join(', ')}`);
    }

    // LIMIT clause
    if (this.limitValue !== null) {
      parts.push(`LIMIT ${this.limitValue}`);
    }

    // OFFSET clause
    if (this.offsetValue !== null) {
      parts.push(`OFFSET ${this.offsetValue}`);
    }

    return {
      text: parts.join('\n'),
      params: this.params
    };
  }

  /**
   * Build INSERT query
   * @param {Object} data - Data to insert
   * @returns {Object} Query object with text and params
   */
  buildInsert(data) {
    if (!this.table) {
      throw new Error('Table name is required for INSERT');
    }

    const keys = Object.keys(data);
    const values = Object.values(data);
    const paramIndices = values.map(v => this.addParam(v));
    const placeholders = paramIndices.map(i => `$${i}`).join(', ');

    const parts = [
      `INSERT INTO ${this.table} (${keys.join(', ')})`,
      `VALUES (${placeholders})`
    ];

    if (this.returningFields.length > 0) {
      parts.push(`RETURNING ${this.returningFields.join(', ')}`);
    }

    return {
      text: parts.join('\n'),
      params: this.params
    };
  }

  /**
   * Build UPDATE query
   * @param {Object} data - Data to update
   * @returns {Object} Query object with text and params
   */
  buildUpdate(data) {
    if (!this.table) {
      throw new Error('Table name is required for UPDATE');
    }

    const setClauses = [];
    for (const [key, value] of Object.entries(data)) {
      const paramIndex = this.addParam(value);
      setClauses.push(`${key} = $${paramIndex}`);
    }

    const parts = [
      `UPDATE ${this.table}`,
      `SET ${setClauses.join(', ')}`
    ];

    if (this.whereClauses.length > 0) {
      parts.push(`WHERE ${this.whereClauses.join(' ')}`);
    }

    if (this.returningFields.length > 0) {
      parts.push(`RETURNING ${this.returningFields.join(', ')}`);
    }

    return {
      text: parts.join('\n'),
      params: this.params
    };
  }

  /**
   * Build DELETE query
   * @returns {Object} Query object with text and params
   */
  buildDelete() {
    if (!this.table) {
      throw new Error('Table name is required for DELETE');
    }

    const parts = [`DELETE FROM ${this.table}`];

    if (this.whereClauses.length > 0) {
      parts.push(`WHERE ${this.whereClauses.join(' ')}`);
    }

    if (this.returningFields.length > 0) {
      parts.push(`RETURNING ${this.returningFields.join(', ')}`);
    }

    return {
      text: parts.join('\n'),
      params: this.params
    };
  }

  /**
   * Build COUNT query
   * @param {string} field - Field to count (default: *)
   * @returns {Object} Query object with text and params
   */
  buildCount(field = '*') {
    // Save current select fields
    const savedSelectFields = [...this.selectFields];
    
    // Set count as select field
    this.selectFields = [`COUNT(${field}) AS count`];
    
    // Build query
    const query = this.buildSelect();
    
    // Restore select fields
    this.selectFields = savedSelectFields;
    
    return query;
  }

  /**
   * Add parameter and return its index
   * @param {any} value - Parameter value
   * @returns {number} Parameter index
   */
  addParam(value) {
    this.params.push(value);
    return ++this.paramCounter;
  }

  /**
   * Get SQL query and parameters
   * @returns {Object} Query object with text and params
   */
  toSQL() {
    return this.buildSelect();
  }

  /**
   * Clone the query builder
   * @returns {QueryBuilder} Cloned instance
   */
  clone() {
    const cloned = new QueryBuilder(this.table);
    cloned.selectFields = [...this.selectFields];
    cloned.joinClauses = [...this.joinClauses];
    cloned.whereClauses = [...this.whereClauses];
    cloned.havingClauses = [...this.havingClauses];
    cloned.orderByClauses = [...this.orderByClauses];
    cloned.groupByFields = [...this.groupByFields];
    cloned.limitValue = this.limitValue;
    cloned.offsetValue = this.offsetValue;
    cloned.returningFields = [...this.returningFields];
    cloned.withClauses = [...this.withClauses];
    cloned.params = [...this.params];
    cloned.paramCounter = this.paramCounter;
    return cloned;
  }

  /**
   * Reset the query builder
   * @returns {QueryBuilder} This instance for chaining
   */
  reset() {
    this.selectFields = [];
    this.joinClauses = [];
    this.whereClauses = [];
    this.havingClauses = [];
    this.orderByClauses = [];
    this.groupByFields = [];
    this.limitValue = null;
    this.offsetValue = null;
    this.returningFields = [];
    this.withClauses = [];
    this.params = [];
    this.paramCounter = 0;
    return this;
  }
}

/**
 * Helper function to create a new query builder
 * @param {string} table - Table name
 * @returns {QueryBuilder} New query builder instance
 */
function query(table = null) {
  return new QueryBuilder(table);
}

/**
 * Helper to safely format identifiers
 * @param {string} identifier - Identifier to format
 * @returns {string} Formatted identifier
 */
function identifier(identifier) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Helper to create CASE expression
 * @param {Array<Object>} conditions - Array of {when, then} objects
 * @param {any} elseValue - ELSE value
 * @returns {string} CASE expression
 */
function caseExpression(conditions, elseValue = null) {
  const parts = ['CASE'];
  
  conditions.forEach(({ when, then }) => {
    parts.push(`WHEN ${when} THEN ${then}`);
  });
  
  if (elseValue !== null) {
    parts.push(`ELSE ${elseValue}`);
  }
  
  parts.push('END');
  
  return parts.join(' ');
}

module.exports = {
  QueryBuilder,
  query,
  identifier,
  caseExpression
};