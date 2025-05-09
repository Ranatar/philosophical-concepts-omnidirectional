/**
 * SQL query builder for PostgreSQL
 * Provides utilities to build complex queries safely
 */

/**
 * Represents a query condition
 * @typedef {Object} Condition
 * @property {string} field - Field name
 * @property {string} operator - Comparison operator (=, <, >, etc.)
 * @property {*} value - Value to compare against
 */

/**
 * Represents a sort specification
 * @typedef {Object} Sort
 * @property {string} field - Field to sort by
 * @property {string} direction - Sort direction ('ASC' or 'DESC')
 */

/**
 * Represents query pagination
 * @typedef {Object} Pagination
 * @property {number} limit - Maximum number of results
 * @property {number} offset - Number of results to skip
 */

/**
 * Build a SELECT query
 */
class SelectQueryBuilder {
  /**
   * Create a new SELECT query builder
   * @param {string} table - Table name
   * @param {Array<string>} [fields=['*']] - Fields to select
   */
  constructor(table, fields = ['*']) {
    this.table = table;
    this.fields = fields;
    this.conditions = [];
    this.sortFields = [];
    this.limitValue = null;
    this.offsetValue = null;
    this.groupByFields = [];
    this.havingConditions = [];
    this.joins = [];
    this.params = [];
  }
  
  /**
   * Add a WHERE condition
   * @param {string} field - Field name
   * @param {string} operator - Comparison operator
   * @param {*} value - Value to compare against
   * @returns {SelectQueryBuilder} This builder instance
   */
  where(field, operator, value) {
    this.conditions.push({ field, operator, value });
    return this;
  }
  
  /**
   * Add a WHERE equals condition
   * @param {string} field - Field name
   * @param {*} value - Value to compare against
   * @returns {SelectQueryBuilder} This builder instance
   */
  whereEquals(field, value) {
    return this.where(field, '=', value);
  }
  
  /**
   * Add a WHERE IN condition
   * @param {string} field - Field name
   * @param {Array} values - Values to include
   * @returns {SelectQueryBuilder} This builder instance
   */
  whereIn(field, values) {
    if (Array.isArray(values) && values.length > 0) {
      this.conditions.push({ field, operator: 'IN', value: values });
    }
    return this;
  }
  
  /**
   * Add a WHERE NOT IN condition
   * @param {string} field - Field name
   * @param {Array} values - Values to exclude
   * @returns {SelectQueryBuilder} This builder instance
   */
  whereNotIn(field, values) {
    if (Array.isArray(values) && values.length > 0) {
      this.conditions.push({ field, operator: 'NOT IN', value: values });
    }
    return this;
  }
  
  /**
   * Add a WHERE LIKE condition
   * @param {string} field - Field name
   * @param {string} pattern - LIKE pattern
   * @returns {SelectQueryBuilder} This builder instance
   */
  whereLike(field, pattern) {
    return this.where(field, 'LIKE', pattern);
  }
  
  /**
   * Add a WHERE ILIKE condition (case-insensitive)
   * @param {string} field - Field name
   * @param {string} pattern - ILIKE pattern
   * @returns {SelectQueryBuilder} This builder instance
   */
  whereILike(field, pattern) {
    return this.where(field, 'ILIKE', pattern);
  }
  
  /**
   * Add a WHERE NULL condition
   * @param {string} field - Field name
   * @returns {SelectQueryBuilder} This builder instance
   */
  whereNull(field) {
    this.conditions.push({ field, operator: 'IS', value: null });
    return this;
  }
  
  /**
   * Add a WHERE NOT NULL condition
   * @param {string} field - Field name
   * @returns {SelectQueryBuilder} This builder instance
   */
  whereNotNull(field) {
    this.conditions.push({ field, operator: 'IS NOT', value: null });
    return this;
  }
  
  /**
   * Add a raw WHERE condition
   * @param {string} condition - Raw condition string
   * @param {Array} [values=[]] - Parameter values
   * @returns {SelectQueryBuilder} This builder instance
   */
  whereRaw(condition, values = []) {
    this.conditions.push({ raw: condition, values });
    return this;
  }
  
  /**
   * Add an ORDER BY clause
   * @param {string} field - Field to sort by
   * @param {string} [direction='ASC'] - Sort direction
   * @returns {SelectQueryBuilder} This builder instance
   */
  orderBy(field, direction = 'ASC') {
    this.sortFields.push({ field, direction: direction.toUpperCase() });
    return this;
  }
  
  /**
   * Add a LIMIT clause
   * @param {number} limit - Maximum number of results
   * @returns {SelectQueryBuilder} This builder instance
   */
  limit(limit) {
    this.limitValue = limit;
    return this;
  }
  
  /**
   * Add an OFFSET clause
   * @param {number} offset - Number of results to skip
   * @returns {SelectQueryBuilder} This builder instance
   */
  offset(offset) {
    this.offsetValue = offset;
    return this;
  }
  
  /**
   * Add pagination
   * @param {Object} pagination - Pagination options
   * @param {number} pagination.page - Page number (1-based)
   * @param {number} pagination.pageSize - Page size
   * @returns {SelectQueryBuilder} This builder instance
   */
  paginate({ page = 1, pageSize = 10 }) {
    const limit = pageSize;
    const offset = (page - 1) * pageSize;
    this.limit(limit);
    this.offset(offset);
    return this;
  }
  
  /**
   * Add a GROUP BY clause
   * @param {string|Array<string>} fields - Field(s) to group by
   * @returns {SelectQueryBuilder} This builder instance
   */
  groupBy(fields) {
    if (Array.isArray(fields)) {
      this.groupByFields.push(...fields);
    } else {
      this.groupByFields.push(fields);
    }
    return this;
  }
  
  /**
   * Add a HAVING condition
   * @param {string} field - Field name
   * @param {string} operator - Comparison operator
   * @param {*} value - Value to compare against
   * @returns {SelectQueryBuilder} This builder instance
   */
  having(field, operator, value) {
    this.havingConditions.push({ field, operator, value });
    return this;
  }
  
  /**
   * Add a JOIN clause
   * @param {string} table - Table to join
   * @param {string} type - Join type (INNER, LEFT, RIGHT, etc.)
   * @param {string} condition - Join condition
   * @returns {SelectQueryBuilder} This builder instance
   */
  join(table, type, condition) {
    this.joins.push({ table, type: type.toUpperCase(), condition });
    return this;
  }
  
  /**
   * Add an INNER JOIN clause
   * @param {string} table - Table to join
   * @param {string} condition - Join condition
   * @returns {SelectQueryBuilder} This builder instance
   */
  innerJoin(table, condition) {
    return this.join(table, 'INNER', condition);
  }
  
  /**
   * Add a LEFT JOIN clause
   * @param {string} table - Table to join
   * @param {string} condition - Join condition
   * @returns {SelectQueryBuilder} This builder instance
   */
  leftJoin(table, condition) {
    return this.join(table, 'LEFT', condition);
  }
  
  /**
   * Add a RIGHT JOIN clause
   * @param {string} table - Table to join
   * @param {string} condition - Join condition
   * @returns {SelectQueryBuilder} This builder instance
   */
  rightJoin(table, condition) {
    return this.join(table, 'RIGHT', condition);
  }
  
  /**
   * Build the SELECT query
   * @returns {Object} Object with text and params properties
   */
  build() {
    this.params = [];
    let paramIndex = 1;
    
    // Build SELECT clause
    let query = `SELECT ${this.fields.join(', ')} FROM ${this.table}`;
    
    // Add JOINs
    if (this.joins.length > 0) {
      for (const join of this.joins) {
        query += ` ${join.type} JOIN ${join.table} ON ${join.condition}`;
      }
    }
    
    // Add WHERE clause
    if (this.conditions.length > 0) {
      const whereClauses = [];
      
      for (const condition of this.conditions) {
        if (condition.raw) {
          // Handle raw conditions
          whereClauses.push(condition.raw);
          if (condition.values) {
            this.params.push(...condition.values);
            paramIndex += condition.values.length;
          }
        } else if (condition.operator === 'IN' || condition.operator === 'NOT IN') {
          // Handle IN/NOT IN
          const placeholders = [];
          for (const val of condition.value) {
            placeholders.push(`$${paramIndex++}`);
            this.params.push(val);
          }
          whereClauses.push(`${condition.field} ${condition.operator} (${placeholders.join(', ')})`);
        } else {
          // Handle normal conditions
          if (condition.value === null) {
            whereClauses.push(`${condition.field} ${condition.operator} NULL`);
          } else {
            whereClauses.push(`${condition.field} ${condition.operator} $${paramIndex++}`);
            this.params.push(condition.value);
          }
        }
      }
      
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    // Add GROUP BY clause
    if (this.groupByFields.length > 0) {
      query += ` GROUP BY ${this.groupByFields.join(', ')}`;
    }
    
    // Add HAVING clause
    if (this.havingConditions.length > 0) {
      const havingClauses = [];
      
      for (const condition of this.havingConditions) {
        havingClauses.push(`${condition.field} ${condition.operator} $${paramIndex++}`);
        this.params.push(condition.value);
      }
      
      query += ` HAVING ${havingClauses.join(' AND ')}`;
    }
    
    // Add ORDER BY clause
    if (this.sortFields.length > 0) {
      const orderClauses = this.sortFields.map(
        ({ field, direction }) => `${field} ${direction}`
      );
      query += ` ORDER BY ${orderClauses.join(', ')}`;
    }
    
    // Add LIMIT clause
    if (this.limitValue !== null) {
      query += ` LIMIT $${paramIndex++}`;
      this.params.push(this.limitValue);
    }
    
    // Add OFFSET clause
    if (this.offsetValue !== null) {
      query += ` OFFSET $${paramIndex++}`;
      this.params.push(this.offsetValue);
    }
    
    return {
      text: query,
      params: this.params
    };
  }
  
  /**
   * Build and return a COUNT query
   * @returns {Object} Object with text and params properties
   */
  buildCount() {
    const countBuilder = new SelectQueryBuilder(this.table, ['COUNT(*) as total']);
    countBuilder.conditions = [...this.conditions];
    countBuilder.joins = [...this.joins];
    countBuilder.groupByFields = [...this.groupByFields];
    countBuilder.havingConditions = [...this.havingConditions];
    
    return countBuilder.build();
  }
}

/**
 * Build an INSERT query
 */
class InsertQueryBuilder {
  /**
   * Create a new INSERT query builder
   * @param {string} table - Table name
   * @param {Object|Array<Object>} data - Data to insert
   */
  constructor(table, data) {
    this.table = table;
    this.data = Array.isArray(data) ? data : [data];
    this.returningFields = [];
    this.params = [];
  }
  
  /**
   * Add a RETURNING clause
   * @param {string|Array<string>} fields - Field(s) to return
   * @returns {InsertQueryBuilder} This builder instance
   */
  returning(fields) {
    if (Array.isArray(fields)) {
      this.returningFields.push(...fields);
    } else {
      this.returningFields.push(fields);
    }
    return this;
  }
  
  /**
   * Build the INSERT query
   * @returns {Object} Object with text and params properties
   */
  build() {
    this.params = [];
    
    if (this.data.length === 0) {
      throw new Error('No data provided for INSERT');
    }
    
    // Get field names from the first data object
    const fields = Object.keys(this.data[0]);
    
    if (fields.length === 0) {
      throw new Error('No fields provided for INSERT');
    }
    
    // Build query text
    let query = `INSERT INTO ${this.table} (${fields.join(', ')})`;
    
    // Build VALUES clause
    const valueSets = [];
    let paramIndex = 1;
    
    for (const row of this.data) {
      const valuePlaceholders = [];
      
      for (const field of fields) {
        valuePlaceholders.push(`$${paramIndex++}`);
        this.params.push(row[field]);
      }
      
      valueSets.push(`(${valuePlaceholders.join(', ')})`);
    }
    
    query += ` VALUES ${valueSets.join(', ')}`;
    
    // Add RETURNING clause if specified
    if (this.returningFields.length > 0) {
      query += ` RETURNING ${this.returningFields.join(', ')}`;
    }
    
    return {
      text: query,
      params: this.params
    };
  }
}

/**
 * Build an UPDATE query
 */
class UpdateQueryBuilder {
  /**
   * Create a new UPDATE query builder
   * @param {string} table - Table name
   * @param {Object} data - Data to update
   */
  constructor(table, data) {
    this.table = table;
    this.data = data;
    this.conditions = [];
    this.returningFields = [];
    this.params = [];
  }
  
  /**
   * Add a WHERE condition
   * @param {string} field - Field name
   * @param {string} operator - Comparison operator
   * @param {*} value - Value to compare against
   * @returns {UpdateQueryBuilder} This builder instance
   */
  where(field, operator, value) {
    this.conditions.push({ field, operator, value });
    return this;
  }
  
  /**
   * Add a WHERE equals condition
   * @param {string} field - Field name
   * @param {*} value - Value to compare against
   * @returns {UpdateQueryBuilder} This builder instance
   */
  whereEquals(field, value) {
    return this.where(field, '=', value);
  }
  
  /**
   * Add a WHERE IN condition
   * @param {string} field - Field name
   * @param {Array} values - Values to include
   * @returns {UpdateQueryBuilder} This builder instance
   */
  whereIn(field, values) {
    if (Array.isArray(values) && values.length > 0) {
      this.conditions.push({ field, operator: 'IN', value: values });
    }
    return this;
  }
  
  /**
   * Add a WHERE NOT IN condition
   * @param {string} field - Field name
   * @param {Array} values - Values to exclude
   * @returns {UpdateQueryBuilder} This builder instance
   */
  whereNotIn(field, values) {
    if (Array.isArray(values) && values.length > 0) {
      this.conditions.push({ field, operator: 'NOT IN', value: values });
    }
    return this;
  }
  
  /**
   * Add a raw WHERE condition
   * @param {string} condition - Raw condition string
   * @param {Array} [values=[]] - Parameter values
   * @returns {UpdateQueryBuilder} This builder instance
   */
  whereRaw(condition, values = []) {
    this.conditions.push({ raw: condition, values });
    return this;
  }
  
  /**
   * Add a RETURNING clause
   * @param {string|Array<string>} fields - Field(s) to return
   * @returns {UpdateQueryBuilder} This builder instance
   */
  returning(fields) {
    if (Array.isArray(fields)) {
      this.returningFields.push(...fields);
    } else {
      this.returningFields.push(fields);
    }
    return this;
  }
  
  /**
   * Build the UPDATE query
   * @returns {Object} Object with text and params properties
   */
  build() {
    this.params = [];
    let paramIndex = 1;
    
    if (Object.keys(this.data).length === 0) {
      throw new Error('No data provided for UPDATE');
    }
    
    // Build SET clause
    const setParts = [];
    
    for (const [field, value] of Object.entries(this.data)) {
      setParts.push(`${field} = $${paramIndex++}`);
      this.params.push(value);
    }
    
    // Build query text
    let query = `UPDATE ${this.table} SET ${setParts.join(', ')}`;
    
    // Add WHERE clause
    if (this.conditions.length > 0) {
      const whereClauses = [];
      
      for (const condition of this.conditions) {
        if (condition.raw) {
          // Handle raw conditions
          whereClauses.push(condition.raw);
          if (condition.values) {
            this.params.push(...condition.values);
            paramIndex += condition.values.length;
          }
        } else if (condition.operator === 'IN' || condition.operator === 'NOT IN') {
          // Handle IN/NOT IN
          const placeholders = [];
          for (const val of condition.value) {
            placeholders.push(`$${paramIndex++}`);
            this.params.push(val);
          }
          whereClauses.push(`${condition.field} ${condition.operator} (${placeholders.join(', ')})`);
        } else {
          // Handle normal conditions
          if (condition.value === null) {
            whereClauses.push(`${condition.field} ${condition.operator} NULL`);
          } else {
            whereClauses.push(`${condition.field} ${condition.operator} $${paramIndex++}`);
            this.params.push(condition.value);
          }
        }
      }
      
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    // Add RETURNING clause if specified
    if (this.returningFields.length > 0) {
      query += ` RETURNING ${this.returningFields.join(', ')}`;
    }
    
    return {
      text: query,
      params: this.params
    };
  }
}

/**
 * Build a DELETE query
 */
class DeleteQueryBuilder {
  /**
   * Create a new DELETE query builder
   * @param {string} table - Table name
   */
  constructor(table) {
    this.table = table;
    this.conditions = [];
    this.returningFields = [];
    this.params = [];
  }
  
  /**
   * Add a WHERE condition
   * @param {string} field - Field name
   * @param {string} operator - Comparison operator
   * @param {*} value - Value to compare against
   * @returns {DeleteQueryBuilder} This builder instance
   */
  where(field, operator, value) {
    this.conditions.push({ field, operator, value });
    return this;
  }
  
  /**
   * Add a WHERE equals condition
   * @param {string} field - Field name
   * @param {*} value - Value to compare against
   * @returns {DeleteQueryBuilder} This builder instance
   */
  whereEquals(field, value) {
    return this.where(field, '=', value);
  }
  
  /**
   * Add a WHERE IN condition
   * @param {string} field - Field name
   * @param {Array} values - Values to include
   * @returns {DeleteQueryBuilder} This builder instance
   */
  whereIn(field, values) {
    if (Array.isArray(values) && values.length > 0) {
      this.conditions.push({ field, operator: 'IN', value: values });
    }
    return this;
  }
  
  /**
   * Add a WHERE NOT IN condition
   * @param {string} field - Field name
   * @param {Array} values - Values to exclude
   * @returns {DeleteQueryBuilder} This builder instance
   */
  whereNotIn(field, values) {
    if (Array.isArray(values) && values.length > 0) {
      this.conditions.push({ field, operator: 'NOT IN', value: values });
    }
    return this;
  }
  
  /**
   * Add a raw WHERE condition
   * @param {string} condition - Raw condition string
   * @param {Array} [values=[]] - Parameter values
   * @returns {DeleteQueryBuilder} This builder instance
   */
  whereRaw(condition, values = []) {
    this.conditions.push({ raw: condition, values });
    return this;
  }
  
  /**
   * Add a RETURNING clause
   * @param {string|Array<string>} fields - Field(s) to return
   * @returns {DeleteQueryBuilder} This builder instance
   */
  returning(fields) {
    if (Array.isArray(fields)) {
      this.returningFields.push(...fields);
    } else {
      this.returningFields.push(fields);
    }
    return this;
  }
  
  /**
   * Build the DELETE query
   * @returns {Object} Object with text and params properties
   */
  build() {
    this.params = [];
    let paramIndex = 1;
    
    // Build query text
    let query = `DELETE FROM ${this.table}`;
    
    // Add WHERE clause
    if (this.conditions.length > 0) {
      const whereClauses = [];
      
      for (const condition of this.conditions) {
        if (condition.raw) {
          // Handle raw conditions
          whereClauses.push(condition.raw);
          if (condition.values) {
            this.params.push(...condition.values);
            paramIndex += condition.values.length;
          }
        } else if (condition.operator === 'IN' || condition.operator === 'NOT IN') {
          // Handle IN/NOT IN
          const placeholders = [];
          for (const val of condition.value) {
            placeholders.push(`$${paramIndex++}`);
            this.params.push(val);
          }
          whereClauses.push(`${condition.field} ${condition.operator} (${placeholders.join(', ')})`);
        } else {
          // Handle normal conditions
          if (condition.value === null) {
            whereClauses.push(`${condition.field} ${condition.operator} NULL`);
          } else {
            whereClauses.push(`${condition.field} ${condition.operator} $${paramIndex++}`);
            this.params.push(condition.value);
          }
        }
      }
      
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    // Add RETURNING clause if specified
    if (this.returningFields.length > 0) {
      query += ` RETURNING ${this.returningFields.join(', ')}`;
    }
    
    return {
      text: query,
      params: this.params
    };
  }
}

/**
 * Create a new SELECT query builder
 * @param {string} table - Table name
 * @param {Array<string>} [fields=['*']] - Fields to select
 * @returns {SelectQueryBuilder} New SELECT query builder
 */
function select(table, fields = ['*']) {
  return new SelectQueryBuilder(table, fields);
}

/**
 * Create a new INSERT query builder
 * @param {string} table - Table name
 * @param {Object|Array<Object>} data - Data to insert
 * @returns {InsertQueryBuilder} New INSERT query builder
 */
function insert(table, data) {
  return new InsertQueryBuilder(table, data);
}

/**
 * Create a new UPDATE query builder
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @returns {UpdateQueryBuilder} New UPDATE query builder
 */
function update(table, data) {
  return new UpdateQueryBuilder(table, data);
}

/**
 * Create a new DELETE query builder
 * @param {string} table - Table name
 * @returns {DeleteQueryBuilder} New DELETE query builder
 */
function del(table) {
  return new DeleteQueryBuilder(table);
}

/**
 * Create raw SQL
 * @param {string} sql - Raw SQL string
 * @param {Array} [params=[]] - Query parameters
 * @returns {Object} Object with text and params properties
 */
function raw(sql, params = []) {
  return {
    text: sql,
    params
  };
}

module.exports = {
  select,
  insert,
  update,
  delete: del,
  raw,
  SelectQueryBuilder,
  InsertQueryBuilder,
  UpdateQueryBuilder,
  DeleteQueryBuilder
};
