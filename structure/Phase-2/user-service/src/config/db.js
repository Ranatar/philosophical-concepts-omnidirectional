/**
 * Database configuration for User Service
 * Initializes PostgreSQL and Redis connections
 */

const { Pool } = require('pg');
const Redis = require('ioredis');
const { defaultLogger } = require('../../../shared/lib/logging/logger');
const config = require('./index');

let pgPool = null;
let redisClient = null;

/**
 * Initialize PostgreSQL connection pool
 * @returns {Pool} PostgreSQL connection pool
 */
function initializePostgres() {
  if (!pgPool) {
    pgPool = new Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      min: config.db.pool.min,
      max: config.db.pool.max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: config.db.ssl ? { rejectUnauthorized: false } : false
    });

    // Pool event handlers
    pgPool.on('connect', () => {
      defaultLogger.debug('New client connected to PostgreSQL pool');
    });

    pgPool.on('error', (err) => {
      defaultLogger.error('Unexpected error on idle PostgreSQL client', err);
    });

    pgPool.on('remove', () => {
      defaultLogger.debug('Client removed from PostgreSQL pool');
    });
  }

  return pgPool;
}

/**
 * Initialize Redis client
 * @returns {Redis} Redis client instance
 */
function initializeRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    // Redis event handlers
    redisClient.on('connect', () => {
      defaultLogger.info('Connected to Redis');
    });

    redisClient.on('ready', () => {
      defaultLogger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      defaultLogger.error('Redis error', err);
    });

    redisClient.on('close', () => {
      defaultLogger.info('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      defaultLogger.info('Reconnecting to Redis...');
    });
  }

  return redisClient;
}

/**
 * Initialize all database connections
 * @returns {Promise<Object>} Object containing initialized database clients
 */
async function initializeDatabase() {
  try {
    defaultLogger.info('Initializing database connections...');

    // Initialize PostgreSQL
    const postgres = initializePostgres();
    
    // Test PostgreSQL connection
    await postgres.query('SELECT 1');
    defaultLogger.info('PostgreSQL connection established');

    // Initialize Redis
    const redis = initializeRedis();
    
    // Test Redis connection
    await redis.ping();
    defaultLogger.info('Redis connection established');

    return { postgres, redis };
  } catch (error) {
    defaultLogger.error('Failed to initialize database connections', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Close all database connections
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  try {
    defaultLogger.info('Closing database connections...');

    // Close PostgreSQL
    if (pgPool) {
      await pgPool.end();
      pgPool = null;
      defaultLogger.info('PostgreSQL connection closed');
    }

    // Close Redis
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      defaultLogger.info('Redis connection closed');
    }
  } catch (error) {
    defaultLogger.error('Error closing database connections', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Get PostgreSQL pool instance
 * @returns {Pool} PostgreSQL connection pool
 */
function getPostgresPool() {
  if (!pgPool) {
    throw new Error('PostgreSQL pool not initialized. Call initializeDatabase first.');
  }
  return pgPool;
}

/**
 * Get Redis client instance
 * @returns {Redis} Redis client
 */
function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeDatabase first.');
  }
  return redisClient;
}

/**
 * Execute a query with error handling
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params = []) {
  const pool = getPostgresPool();
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    defaultLogger.debug('Executed query', {
      text,
      duration,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    defaultLogger.error('Database query error', {
      text,
      duration,
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

/**
 * Execute a transaction
 * @param {Function} callback - Callback function that receives a client
 * @returns {Promise<*>} Result of the callback
 */
async function transaction(callback) {
  const pool = getPostgresPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check database health
 * @returns {Promise<Object>} Health status
 */
async function checkDatabaseHealth() {
  const health = {
    postgres: false,
    redis: false
  };

  try {
    // Check PostgreSQL
    const pgPool = getPostgresPool();
    await pgPool.query('SELECT 1');
    health.postgres = true;
  } catch (error) {
    defaultLogger.error('PostgreSQL health check failed', { error: error.message });
  }

  try {
    // Check Redis
    const redis = getRedisClient();
    await redis.ping();
    health.redis = true;
  } catch (error) {
    defaultLogger.error('Redis health check failed', { error: error.message });
  }

  return health;
}

module.exports = {
  initializeDatabase,
  closeDatabase,
  getPostgresPool,
  getRedisClient,
  query,
  transaction,
  checkDatabaseHealth
};
