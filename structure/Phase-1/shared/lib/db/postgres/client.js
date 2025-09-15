/**
 * PostgreSQL client configuration for the Philosophy Service
 * Provides connection pooling and query utilities
 */

const { Pool } = require('pg');
const { logger } = require('../../logging/logger');
const { DatabaseMetrics } = require('../../metrics/prometheus');

// PostgreSQL connection configuration
const defaultConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'philosophy_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  
  // Pool configuration
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,
  
  // Statement timeout to prevent long-running queries
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
  
  // Application name for pg_stat_activity
  application_name: process.env.SERVICE_NAME || 'philosophy-service'
};

/**
 * PostgreSQL client wrapper with enhanced functionality
 */
class PostgresClient {
  constructor(config = {}, serviceName = 'unknown') {
    this.config = { ...defaultConfig, ...config };
    this.serviceName = serviceName;
    this.pool = null;
    this.metrics = new DatabaseMetrics('postgres', serviceName);
    this.isConnected = false;
  }

  /**
   * Initialize the connection pool
   */
  async connect() {
    if (this.pool) {
      logger.warn('PostgreSQL pool already initialized');
      return;
    }

    try {
      this.pool = new Pool(this.config);
      
      // Error handling
      this.pool.on('error', (err, client) => {
        logger.error('Unexpected PostgreSQL error on idle client', { 
          error: err,
          service: this.serviceName 
        });
      });

      // Connection event logging
      this.pool.on('connect', (client) => {
        logger.debug('New PostgreSQL client connected', { 
          service: this.serviceName 
        });
      });

      // Test the connection
      await this.pool.query('SELECT NOW()');
      this.isConnected = true;
      
      logger.info('PostgreSQL connection pool initialized', {
        service: this.serviceName,
        database: this.config.database,
        host: this.config.host,
        poolSize: this.config.max
      });

      // Start metrics collection
      this.startMetricsCollection();
      
    } catch (error) {
      logger.error('Failed to initialize PostgreSQL connection', {
        error,
        service: this.serviceName,
        config: {
          host: this.config.host,
          database: this.config.database
        }
      });
      throw error;
    }
  }

  /**
   * Execute a query with automatic retries and metrics
   * @param {string} text - SQL query
   * @param {Array} params - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result
   */
  async query(text, params = [], options = {}) {
    const {
      retries = 2,
      retryDelay = 100,
      timeout = this.config.statement_timeout
    } = options;

    if (!this.pool) {
      throw new Error('PostgreSQL client not connected');
    }

    const start = Date.now();
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Set statement timeout for this query
        const queryConfig = timeout ? {
          text: `SET statement_timeout = ${timeout}; ${text}`,
          values: params
        } : { text, values: params };

        const result = await this.pool.query(queryConfig);
        
        // Record metrics
        const duration = Date.now() - start;
        this.metrics.recordQuery('query', this.extractTableName(text), duration, true);
        
        // Log slow queries
        if (duration > 1000) {
          logger.warn('Slow PostgreSQL query detected', {
            query: text.substring(0, 200),
            duration,
            service: this.serviceName
          });
        }

        return result;
        
      } catch (error) {
        lastError = error;
        
        // Record failed query metric
        this.metrics.recordQuery('query', this.extractTableName(text), Date.now() - start, false);
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        if (attempt < retries) {
          logger.warn('PostgreSQL query failed, retrying', {
            attempt: attempt + 1,
            error: error.message,
            service: this.serviceName
          });
          await this.delay(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * Execute a query and return first row
   * @param {string} text - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|null>} First row or null
   */
  async queryOne(text, params = []) {
    const result = await this.query(text, params);
    return result.rows[0] || null;
  }

  /**
   * Execute a query and return single value
   * @param {string} text - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<any>} Single value
   */
  async queryScalar(text, params = []) {
    const row = await this.queryOne(text, params);
    return row ? Object.values(row)[0] : null;
  }

  /**
   * Execute multiple queries in a transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<any>} Transaction result
   */
  async transaction(callback) {
    const client = await this.pool.connect();
    const start = Date.now();
    
    try {
      await client.query('BEGIN');
      
      // Create a wrapped client with metrics
      const wrappedClient = {
        query: async (text, params) => {
          const queryStart = Date.now();
          try {
            const result = await client.query(text, params);
            this.metrics.recordQuery('query', this.extractTableName(text), Date.now() - queryStart, true);
            return result;
          } catch (error) {
            this.metrics.recordQuery('query', this.extractTableName(text), Date.now() - queryStart, false);
            throw error;
          }
        },
        queryOne: async (text, params) => {
          const result = await wrappedClient.query(text, params);
          return result.rows[0] || null;
        },
        queryScalar: async (text, params) => {
          const row = await wrappedClient.queryOne(text, params);
          return row ? Object.values(row)[0] : null;
        }
      };
      
      const result = await callback(wrappedClient);
      
      await client.query('COMMIT');
      
      this.metrics.recordQuery('transaction', 'transaction', Date.now() - start, true);
      
      return result;
      
    } catch (error) {
      await client.query('ROLLBACK');
      
      this.metrics.recordQuery('transaction', 'transaction', Date.now() - start, false);
      
      logger.error('PostgreSQL transaction failed', {
        error,
        service: this.serviceName
      });
      
      throw error;
      
    } finally {
      client.release();
    }
  }

  /**
   * Execute INSERT query with RETURNING clause
   * @param {string} table - Table name
   * @param {Object} data - Data to insert
   * @param {string} returning - RETURNING clause
   * @returns {Promise<Object>} Inserted row
   */
  async insert(table, data, returning = '*') {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING ${returning}
    `;
    
    return this.queryOne(query, values);
  }

  /**
   * Execute UPDATE query with RETURNING clause
   * @param {string} table - Table name
   * @param {Object} data - Data to update
   * @param {Object} where - WHERE conditions
   * @param {string} returning - RETURNING clause
   * @returns {Promise<Object[]>} Updated rows
   */
  async update(table, data, where, returning = '*') {
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data);
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);
    
    const setClauses = dataKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const whereClauses = whereKeys.map((key, i) => `${key} = $${dataKeys.length + i + 1}`).join(' AND ');
    
    const query = `
      UPDATE ${table}
      SET ${setClauses}
      WHERE ${whereClauses}
      RETURNING ${returning}
    `;
    
    const result = await this.query(query, [...dataValues, ...whereValues]);
    return result.rows;
  }

  /**
   * Execute DELETE query with RETURNING clause
   * @param {string} table - Table name
   * @param {Object} where - WHERE conditions
   * @param {string} returning - RETURNING clause
   * @returns {Promise<Object[]>} Deleted rows
   */
  async delete(table, where, returning = '*') {
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);
    const whereClauses = whereKeys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    
    const query = `
      DELETE FROM ${table}
      WHERE ${whereClauses}
      RETURNING ${returning}
    `;
    
    const result = await this.query(query, whereValues);
    return result.rows;
  }

  /**
   * Bulk insert with efficient COPY or multi-value INSERT
   * @param {string} table - Table name
   * @param {Array<Object>} records - Records to insert
   * @param {Object} options - Insert options
   * @returns {Promise<number>} Number of inserted rows
   */
  async bulkInsert(table, records, options = {}) {
    if (!records || records.length === 0) {
      return 0;
    }

    const { 
      batchSize = 1000,
      onConflict = null,
      returning = false 
    } = options;

    const keys = Object.keys(records[0]);
    let totalInserted = 0;

    // Process in batches
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const values = [];
      const placeholders = [];

      batch.forEach((record, recordIndex) => {
        const recordPlaceholders = keys.map((key, keyIndex) => {
          const paramIndex = recordIndex * keys.length + keyIndex + 1;
          values.push(record[key]);
          return `$${paramIndex}`;
        });
        placeholders.push(`(${recordPlaceholders.join(', ')})`);
      });

      let query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES ${placeholders.join(', ')}`;
      
      if (onConflict) {
        query += ` ON CONFLICT ${onConflict}`;
      }
      
      if (returning) {
        query += ` RETURNING *`;
      }

      const result = await this.query(query, values);
      totalInserted += result.rowCount;
    }

    return totalInserted;
  }

  /**
   * Start collecting pool metrics
   */
  startMetricsCollection() {
    if (!this.pool) return;

    setInterval(() => {
      const poolStats = {
        total: this.pool.totalCount,
        idle: this.pool.idleCount,
        waiting: this.pool.waitingCount
      };
      
      this.metrics.updateConnectionPool(
        poolStats.total - poolStats.idle,
        poolStats.idle,
        poolStats.waiting
      );
    }, 5000);
  }

  /**
   * Extract table name from query (for metrics)
   * @param {string} query - SQL query
   * @returns {string} Table name or 'unknown'
   */
  extractTableName(query) {
    const patterns = [
      /FROM\s+(\w+)/i,
      /INSERT\s+INTO\s+(\w+)/i,
      /UPDATE\s+(\w+)/i,
      /DELETE\s+FROM\s+(\w+)/i
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    return 'unknown';
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is retryable
   */
  isNonRetryableError(error) {
    const nonRetryableCodes = [
      '23505', // unique_violation
      '23503', // foreign_key_violation
      '23502', // not_null_violation
      '23514', // check_violation
      '42P01', // undefined_table
      '42703'  // undefined_column
    ];

    return nonRetryableCodes.includes(error.code);
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close the connection pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('PostgreSQL connection pool closed', {
        service: this.serviceName
      });
    }
  }

  /**
   * Get pool statistics
   * @returns {Object} Pool statistics
   */
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount
    };
  }
}

// Create singleton instance for default connection
let defaultClient = null;

/**
 * Get default PostgreSQL client
 * @param {string} serviceName - Service name for metrics
 * @returns {PostgresClient} Default client instance
 */
function getDefaultClient(serviceName = 'default') {
  if (!defaultClient) {
    defaultClient = new PostgresClient({}, serviceName);
  }
  return defaultClient;
}

module.exports = {
  PostgresClient,
  getDefaultClient,
  
  // Re-export pg types for convenience
  types: require('pg').types
};