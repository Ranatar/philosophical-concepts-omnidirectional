/**
 * PostgreSQL client for the philosophy service
 * Provides a configured client instance and utility methods for database operations
 */

const { Pool } = require('pg');
const { defaultLogger } = require('../../logging/logger');

// Default configuration
const DEFAULT_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  database: process.env.DB_NAME || 'philosophy',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE, 10) : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Use SSL in production if required
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : undefined
};

/**
 * PostgreSQL client class
 */
class PostgresClient {
  /**
   * Create a new PostgreSQL client
   * @param {Object} [config] - Configuration options
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(config = {}, logger = defaultLogger) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = logger;
    this.pool = null;
    this.isConnected = false;
  }
  
  /**
   * Initialize the database connection pool
   * @returns {Pool} The PostgreSQL connection pool
   */
  initialize() {
    if (!this.pool) {
      this.logger.info('Initializing PostgreSQL connection pool', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        poolSize: this.config.max
      });
      
      this.pool = new Pool(this.config);
      
      // Set up event listeners
      this.pool.on('connect', (client) => {
        this.isConnected = true;
        this.logger.debug('New client connected to PostgreSQL');
      });
      
      this.pool.on('error', (err, client) => {
        this.logger.error('Unexpected error on idle PostgreSQL client', err);
      });
      
      this.pool.on('remove', (client) => {
        this.logger.debug('Client removed from PostgreSQL pool');
      });
    }
    
    return this.pool;
  }
  
  /**
   * Get the connection pool instance
   * @returns {Pool} The PostgreSQL connection pool
   */
  getPool() {
    if (!this.pool) {
      return this.initialize();
    }
    return this.pool;
  }
  
  /**
   * Execute a query on the database
   * @param {string} text - SQL query text
   * @param {Array} [params=[]] - Query parameters
   * @param {Object} [options={}] - Query options
   * @returns {Promise<Object>} Query result
   */
  async query(text, params = [], options = {}) {
    const pool = this.getPool();
    
    const start = Date.now();
    
    try {
      const result = await pool.query(text, params);
      
      const duration = Date.now() - start;
      this.logger.debug('Executed query', {
        text,
        params,
        duration,
        rowCount: result.rowCount
      });
      
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      this.logger.error('Error executing query', {
        text,
        params,
        duration,
        error: err.message,
        stack: err.stack
      });
      
      throw err;
    }
  }
  
  /**
   * Get a client from the pool and execute a callback with it
   * @param {Function} callback - Callback function that receives a client
   * @returns {Promise<*>} Result of the callback
   */
  async withClient(callback) {
    const pool = this.getPool();
    const client = await pool.connect();
    
    try {
      return await callback(client);
    } finally {
      client.release();
    }
  }
  
  /**
   * Execute a transaction
   * @param {Function} callback - Callback function that receives a client
   * @returns {Promise<*>} Result of the callback
   */
  async transaction(callback) {
    return this.withClient(async (client) => {
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    });
  }
  
  /**
   * Check if the database connection is healthy
   * @returns {Promise<boolean>} Whether the connection is healthy
   */
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1');
      return result.rows.length > 0;
    } catch (err) {
      this.logger.error('Database health check failed', {
        error: err.message
      });
      return false;
    }
  }
  
  /**
   * Close the connection pool
   * @returns {Promise<void>}
   */
  async close() {
    if (this.pool) {
      this.logger.info('Closing PostgreSQL connection pool');
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
    }
  }
}

// Create and export default instance
const defaultClient = new PostgresClient();

module.exports = {
  PostgresClient,
  defaultClient
};
