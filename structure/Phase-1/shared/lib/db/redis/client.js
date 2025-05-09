/**
 * Redis client for the philosophy service
 * Provides a configured client instance and utility methods for caching
 */

const redis = require('redis');
const { promisify } = require('util');
const { defaultLogger } = require('../../logging/logger');

// Default configuration
const DEFAULT_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
  prefix: process.env.REDIS_PREFIX || 'philosophy:',
  // Connection options
  connect_timeout: 10000,
  retry_strategy: function(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End reconnecting on a specific error and flush all commands with
      // a individual error
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands
      // with a individual error
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
};

/**
 * Redis client class
 */
class RedisClient {
  /**
   * Create a new Redis client
   * @param {Object} [config] - Configuration options
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(config = {}, logger = defaultLogger) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = logger;
    this.client = null;
    this.isConnected = false;
    this.asyncMethods = {};
  }
  
  /**
   * Initialize the Redis client
   * @returns {redis.RedisClient} The Redis client instance
   */
  initialize() {
    if (!this.client) {
      this.logger.info('Initializing Redis client', {
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
        prefix: this.config.prefix
      });
      
      try {
        this.client = redis.createClient(this.config);
        
        // Promisify Redis methods
        this.asyncMethods = {
          get: promisify(this.client.get).bind(this.client),
          set: promisify(this.client.set).bind(this.client),
          setex: promisify(this.client.setex).bind(this.client),
          del: promisify(this.client.del).bind(this.client),
          exists: promisify(this.client.exists).bind(this.client),
          expire: promisify(this.client.expire).bind(this.client),
          ttl: promisify(this.client.ttl).bind(this.client),
          incr: promisify(this.client.incr).bind(this.client),
          decr: promisify(this.client.decr).bind(this.client),
          incrby: promisify(this.client.incrby).bind(this.client),
          decrby: promisify(this.client.decrby).bind(this.client),
          hget: promisify(this.client.hget).bind(this.client),
          hgetall: promisify(this.client.hgetall).bind(this.client),
          hmget: promisify(this.client.hmget).bind(this.client),
          hset: promisify(this.client.hset).bind(this.client),
          hmset: promisify(this.client.hmset).bind(this.client),
          hdel: promisify(this.client.hdel).bind(this.client),
          hkeys: promisify(this.client.hkeys).bind(this.client),
          hvals: promisify(this.client.hvals).bind(this.client),
          hexists: promisify(this.client.hexists).bind(this.client),
          lpush: promisify(this.client.lpush).bind(this.client),
          rpush: promisify(this.client.rpush).bind(this.client),
          lpop: promisify(this.client.lpop).bind(this.client),
          rpop: promisify(this.client.rpop).bind(this.client),
          llen: promisify(this.client.llen).bind(this.client),
          lrange: promisify(this.client.lrange).bind(this.client),
          ltrim: promisify(this.client.ltrim).bind(this.client),
          sadd: promisify(this.client.sadd).bind(this.client),
          srem: promisify(this.client.srem).bind(this.client),
          smembers: promisify(this.client.smembers).bind(this.client),
          sismember: promisify(this.client.sismember).bind(this.client),
          scard: promisify(this.client.scard).bind(this.client),
          zadd: promisify(this.client.zadd).bind(this.client),
          zrange: promisify(this.client.zrange).bind(this.client),
          zrevrange: promisify(this.client.zrevrange).bind(this.client),
          zrangebyscore: promisify(this.client.zrangebyscore).bind(this.client),
          zrevrangebyscore: promisify(this.client.zrevrangebyscore).bind(this.client),
          zrem: promisify(this.client.zrem).bind(this.client),
          zcard: promisify(this.client.zcard).bind(this.client),
          zscore: promisify(this.client.zscore).bind(this.client),
          keys: promisify(this.client.keys).bind(this.client),
          scan: promisify(this.client.scan).bind(this.client),
          flushdb: promisify(this.client.flushdb).bind(this.client),
          flushall: promisify(this.client.flushall).bind(this.client),
          publish: promisify(this.client.publish).bind(this.client),
          subscribe: this.client.subscribe.bind(this.client),
          unsubscribe: this.client.unsubscribe.bind(this.client),
          multi: this.client.multi.bind(this.client),
          exec: promisify(this.client.exec).bind(this.client)
        };
        
        // Set up event listeners
        this.client.on('connect', () => {
          this.isConnected = true;
          this.logger.info('Redis client connected');
        });
        
        this.client.on('error', (err) => {
          this.logger.error('Redis client error', {
            error: err.message,
            stack: err.stack
          });
        });
        
        this.client.on('end', () => {
          this.isConnected = false;
          this.logger.info('Redis client connection closed');
        });
        
        this.client.on('reconnecting', (info) => {
          this.logger.info('Redis client reconnecting', {
            attempt: info.attempt,
            delay: info.delay
          });
        });
      } catch (err) {
        this.logger.error('Failed to initialize Redis client', {
          error: err.message,
          stack: err.stack
        });
        throw err;
      }
    }
    
    return this.client;
  }
  
  /**
   * Get the Redis client instance
   * @returns {redis.RedisClient} The Redis client instance
   */
  getClient() {
    if (!this.client) {
      return this.initialize();
    }
    return this.client;
  }
  
  /**
   * Get a value from Redis
   * @param {string} key - Key to get
   * @returns {Promise<string|null>} Value or null if not found
   */
  async get(key) {
    try {
      this.getClient();
      const result = await this.asyncMethods.get(key);
      return result;
    } catch (err) {
      this.logger.error('Redis get error', {
        key,
        error: err.message
      });
      return null;
    }
  }
  
  /**
   * Get a JSON value from Redis
   * @param {string} key - Key to get
   * @returns {Promise<Object|null>} Parsed JSON or null
   */
  async getJson(key) {
    try {
      const value = await this.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (err) {
      this.logger.error('Redis getJson error', {
        key,
        error: err.message
      });
      return null;
    }
  }
  
  /**
   * Set a value in Redis
   * @param {string} key - Key to set
   * @param {string} value - Value to set
   * @param {number} [ttl] - Time to live in seconds
   * @returns {Promise<boolean>} Whether the operation succeeded
   */
  async set(key, value, ttl) {
    try {
      this.getClient();
      if (ttl) {
        await this.asyncMethods.setex(key, ttl, value);
      } else {
        await this.asyncMethods.set(key, value);
      }
      return true;
    } catch (err) {
      this.logger.error('Redis set error', {
        key,
        error: err.message
      });
      return false;
    }
  }
  
  /**
   * Set a JSON value in Redis
   * @param {string} key - Key to set
   * @param {Object} value - Value to set (will be JSON-stringified)
   * @param {number} [ttl] - Time to live in seconds
   * @returns {Promise<boolean>} Whether the operation succeeded
   */
  async setJson(key, value, ttl) {
    try {
      const jsonValue = JSON.stringify(value);
      return this.set(key, jsonValue, ttl);
    } catch (err) {
      this.logger.error('Redis setJson error', {
        key,
        error: err.message
      });
      return false;
    }
  }
  
  /**
   * Delete a key from Redis
   * @param {string|Array<string>} keys - Key(s) to delete
   * @returns {Promise<number>} Number of keys deleted
   */
  async del(keys) {
    try {
      this.getClient();
      const result = await this.asyncMethods.del(keys);
      return result;
    } catch (err) {
      this.logger.error('Redis del error', {
        keys,
        error: err.message
      });
      return 0;
    }
  }
  
  /**
   * Check if a key exists in Redis
   * @param {string} key - Key to check
   * @returns {Promise<boolean>} Whether the key exists
   */
  async exists(key) {
    try {
      this.getClient();
      const result = await this.asyncMethods.exists(key);
      return result === 1;
    } catch (err) {
      this.logger.error('Redis exists error', {
        key,
        error: err.message
      });
      return false;
    }
  }
  
  /**
   * Set a key's time to live
   * @param {string} key - Key to set TTL
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Whether the operation succeeded
   */
  async expire(key, ttl) {
    try {
      this.getClient();
      const result = await this.asyncMethods.expire(key, ttl);
      return result === 1;
    } catch (err) {
      this.logger.error('Redis expire error', {
        key,
        ttl,
        error: err.message
      });
      return false;
    }
  }
  
  /**
   * Get a key's remaining time to live
   * @param {string} key - Key to get TTL
   * @returns {Promise<number>} TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key) {
    try {
      this.getClient();
      const result = await this.asyncMethods.ttl(key);
      return result;
    } catch (err) {
      this.logger.error('Redis ttl error', {
        key,
        error: err.message
      });
      return -2;
    }
  }
  
  /**
   * Increment a key's value
   * @param {string} key - Key to increment
   * @returns {Promise<number>} New value
   */
  async incr(key) {
    try {
      this.getClient();
      const result = await this.asyncMethods.incr(key);
      return result;
    } catch (err) {
      this.logger.error('Redis incr error', {
        key,
        error: err.message
      });
      return null;
    }
  }
  
  /**
   * Increment a key's value by a specific amount
   * @param {string} key - Key to increment
   * @param {number} amount - Amount to increment by
   * @returns {Promise<number>} New value
   */
  async incrby(key, amount) {
    try {
      this.getClient();
      const result = await this.asyncMethods.incrby(key, amount);
      return result;
    } catch (err) {
      this.logger.error('Redis incrby error', {
        key,
        amount,
        error: err.message
      });
      return null;
    }
  }
  
  /**
   * Decrement a key's value
   * @param {string} key - Key to decrement
   * @returns {Promise<number>} New value
   */
  async decr(key) {
    try {
      this.getClient();
      const result = await this.asyncMethods.decr(key);
      return result;
    } catch (err) {
      this.logger.error('Redis decr error', {
        key,
        error: err.message
      });
      return null;
    }
  }
  
  /**
   * Decrement a key's value by a specific amount
   * @param {string} key - Key to decrement
   * @param {number} amount - Amount to decrement by
   * @returns {Promise<number>} New value
   */
  async decrby(key, amount) {
    try {
      this.getClient();
      const result = await this.asyncMethods.decrby(key, amount);
      return result;
    } catch (err) {
      this.logger.error('Redis decrby error', {
        key,
        amount,
        error: err.message
      });
      return null;
    }
  }
  
  /**
   * Get a field from a hash
   * @param {string} key - Hash key
   * @param {string} field - Field to get
   * @returns {Promise<string|null>} Field value or null
   */
  async hget(key, field) {
    try {
      this.getClient();
      const result = await this.asyncMethods.hget(key, field);
      return result;
    } catch (err) {
      this.logger.error('Redis hget error', {
        key,
        field,
        error: err.message
      });
      return null;
    }
  }
  
  /**
   * Get all fields from a hash
   * @param {string} key - Hash key
   * @returns {Promise<Object|null>} Hash fields or null
   */
  async hgetall(key) {
    try {
      this.getClient();
      const result = await this.asyncMethods.hgetall(key);
      return result || null;
    } catch (err) {
      this.logger.error('Redis hgetall error', {
        key,
        error: err.message
      });
      return null;
    }
  }
  
  /**
   * Set a field in a hash
   * @param {string} key - Hash key
   * @param {string} field - Field to set
   * @param {string} value - Value to set
   * @returns {Promise<boolean>} Whether the operation succeeded
   */
  async hset(key, field, value) {
    try {
      this.getClient();
      const result = await this.asyncMethods.hset(key, field, value);
      return result === 1;
    } catch (err) {
      this.logger.error('Redis hset error', {
        key,
        field,
        error: err.message
      });
      return false;
    }
  }
  
  /**
   * Set multiple fields in a hash
   * @param {string} key - Hash key
   * @param {Object} fields - Field-value pairs
   * @returns {Promise<boolean>} Whether the operation succeeded
   */
  async hmset(key, fields) {
    try {
      this.getClient();
      await this.asyncMethods.hmset(key, fields);
      return true;
    } catch (err) {
      this.logger.error('Redis hmset error', {
        key,
        error: err.message
      });
      return false;
    }
  }
  
  /**
   * Set a JSON field in a hash
   * @param {string} key - Hash key
   * @param {string} field - Field to set
   * @param {Object} value - Value to set (will be JSON-stringified)
   * @returns {Promise<boolean>} Whether the operation succeeded
   */
  async hsetJson(key, field, value) {
    try {
      const jsonValue = JSON.stringify(value);
      return this.hset(key, field, jsonValue);
    } catch (err) {
      this.logger.error('Redis hsetJson error', {
        key,
        field,
        error: err.message
      });
      return false;
    }
  }
  
  /**
   * Get a JSON field from a hash
   * @param {string} key - Hash key
   * @param {string} field - Field to get
   * @returns {Promise<Object|null>} Parsed JSON or null
   */
  async hgetJson(key, field) {
    try {
      const value = await this.hget(key, field);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (err) {
      this.logger.error('Redis hgetJson error', {
        key,
        field,
        error: err.message
      });
      return null;
    }
  }
  
  /**
   * Delete fields from a hash
   * @param {string} key - Hash key
   * @param {string|Array<string>} fields - Field(s) to delete
   * @returns {Promise<number>} Number of fields deleted
   */
  async hdel(key, fields) {
    try {
      this.getClient();
      
      if (!Array.isArray(fields)) {
        fields = [fields];
      }
      
      const result = await this.asyncMethods.hdel(key, ...fields);
      return result;
    } catch (err) {
      this.logger.error('Redis hdel error', {
        key,
        fields,
        error: err.message
      });
      return 0;
    }
  }
  
  /**
   * Check if the database connection is healthy
   * @returns {Promise<boolean>} Whether the connection is healthy
   */
  async healthCheck() {
    try {
      this.getClient();
      
      if (!this.isConnected) {
        return false;
      }
      
      // Try to ping the server
      return new Promise((resolve) => {
        this.client.ping((err, result) => {
          if (err || result !== 'PONG') {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } catch (err) {
      this.logger.error('Redis health check failed', {
        error: err.message
      });
      return false;
    }
  }
  
  /**
   * Close the Redis client
   * @returns {Promise<void>}
   */
  async close() {
    if (this.client) {
      this.logger.info('Closing Redis client');
      
      return new Promise((resolve) => {
        this.client.quit((err, res) => {
          this.client = null;
          this.isConnected = false;
          resolve();
        });
      });
    }
  }
}

// Create and export default instance
const defaultClient = new RedisClient();

module.exports = {
  RedisClient,
  defaultClient
};
