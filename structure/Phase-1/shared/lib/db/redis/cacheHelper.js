/**
 * Cache helper utilities for Redis
 * Provides common caching patterns and helpers
 */

const { defaultClient } = require('./client');
const { defaultLogger } = require('../../logging/logger');

/**
 * Default cache TTL (time to live) in seconds
 * @type {number}
 */
const DEFAULT_TTL = 3600; // 1 hour

/**
 * Generate a cache key with the configured prefix
 * @param {string} service - Service name
 * @param {string} entity - Entity type
 * @param {string|number} id - Entity ID
 * @param {string} [suffix] - Optional key suffix
 * @returns {string} Generated cache key
 */
function generateCacheKey(service, entity, id, suffix) {
  let key = `${service}:${entity}:${id}`;
  
  if (suffix) {
    key += `:${suffix}`;
  }
  
  return key;
}

/**
 * Normalize a cache key to handle edge cases (e.g., null values, arrays)
 * @param {*} key - Key to normalize
 * @returns {string} Normalized key
 */
function normalizeCacheKey(key) {
  if (key === null || key === undefined) {
    return 'null';
  }
  
  if (Array.isArray(key)) {
    return key.map(k => normalizeCacheKey(k)).join(':');
  }
  
  if (typeof key === 'object') {
    try {
      const sortedKeys = Object.keys(key).sort();
      const normalizedObj = {};
      
      for (const k of sortedKeys) {
        normalizedObj[k] = key[k];
      }
      
      return JSON.stringify(normalizedObj);
    } catch (err) {
      return String(key);
    }
  }
  
  return String(key);
}

/**
 * Generate a hash key for caching query results
 * @param {string} service - Service name
 * @param {string} entity - Entity type
 * @param {string} action - Query action
 * @param {Object} params - Query parameters
 * @returns {string} Generated cache key
 */
function generateQueryCacheKey(service, entity, action, params) {
  const normalizedParams = normalizeCacheKey(params);
  return `${service}:${entity}:${action}:${normalizedParams}`;
}

/**
 * Cache item by ID
 * @param {string} service - Service name
 * @param {string} entity - Entity type
 * @param {string|number} id - Entity ID
 * @param {Object} data - Data to cache
 * @param {number} [ttl=DEFAULT_TTL] - Cache TTL in seconds
 * @param {Object} [options={}] - Additional options
 * @returns {Promise<boolean>} Whether the operation succeeded
 */
async function cacheItem(service, entity, id, data, ttl = DEFAULT_TTL, options = {}) {
  const key = generateCacheKey(service, entity, id);
  
  try {
    const { client = defaultClient, logger = defaultLogger } = options;
    
    const result = await client.setJson(key, data, ttl);
    
    if (result) {
      logger.debug('Item cached successfully', {
        service,
        entity,
        id,
        ttl
      });
    }
    
    return result;
  } catch (err) {
    options.logger?.error('Error caching item', {
      service,
      entity,
      id,
      error: err.message
    });
    
    return false;
  }
}

/**
 * Cache multiple items by ID
 * @param {string} service - Service name
 * @param {string} entity - Entity type
 * @param {Array<Object>} items - Items to cache
 * @param {string} idField - Field name for the ID
 * @param {number} [ttl=DEFAULT_TTL] - Cache TTL in seconds
 * @param {Object} [options={}] - Additional options
 * @returns {Promise<number>} Number of successfully cached items
 */
async function cacheItems(service, entity, items, idField, ttl = DEFAULT_TTL, options = {}) {
  try {
    const { client = defaultClient, logger = defaultLogger } = options;
    
    let successCount = 0;
    
    for (const item of items) {
      const id = item[idField];
      
      if (id) {
        const key = generateCacheKey(service, entity, id);
        const result = await client.setJson(key, item, ttl);
        
        if (result) {
          successCount++;
        }
      }
    }
    
    logger.debug('Multiple items cached', {
      service,
      entity,
      total: items.length,
      success: successCount,
      ttl
    });
    
    return successCount;
  } catch (err) {
    options.logger?.error('Error caching multiple items', {
      service,
      entity,
      error: err.message
    });
    
    return 0;
  }
}

/**
 * Cache query results
 * @param {string} service - Service name
 * @param {string} entity - Entity type
 * @param {string} action - Query action
 * @param {Object} params - Query parameters
 * @param {Object} data - Query results to cache
 * @param {number} [ttl=DEFAULT_TTL] - Cache TTL in seconds
 * @param {Object} [options={}] - Additional options
 * @returns {Promise<boolean>} Whether the operation succeeded
 */
async function cacheQuery(service, entity, action, params, data, ttl = DEFAULT_TTL, options = {}) {
  const key = generateQueryCacheKey(service, entity, action, params);
  
  try {
    const { client = defaultClient, logger = defaultLogger } = options;
    
    const result = await client.setJson(key, data, ttl);
    
    if (result) {
      logger.debug('Query results cached successfully', {
        service,
        entity,
        action,
        ttl
      });
    }
    
    return result;
  } catch (err) {
    options.logger?.error('Error caching query results', {
      service,
      entity,
      action,
      error: err.message
    });
    
    return false;
  }
}

/**
 * Get a cached item by ID
 * @param {string} service - Service name
 * @param {string} entity - Entity type
 * @param {string|number} id - Entity ID
 * @param {Object} [options={}] - Additional options
 * @returns {Promise<Object|null>} Cached item or null if not found
 */
async function getCachedItem(service, entity, id, options = {}) {
  const key = generateCacheKey(service, entity, id);
  
  try {
    const { client = defaultClient, logger = defaultLogger } = options;
    
    const data = await client.getJson(key);
    
    if (data) {
      logger.debug('Cache hit for item', {
        service,
        entity,
        id
      });
    } else {
      logger.debug('Cache miss for item', {
        service,
        entity,
        id
      });
    }
    
    return data;
  } catch (err) {
    options.logger?.error('Error getting cached item', {
      service,
      entity,
      id,
      error: err.message
    });
    
    return null;
  }
}

/**
 * Get cached query results
 * @param {string} service - Service name
 * @param {string} entity - Entity type
 * @param {string} action - Query action
 * @param {Object} params - Query parameters
 * @param {Object} [options={}] - Additional options
 * @returns {Promise<Object|null>} Cached query results or null if not found
 */
async function getCachedQuery(service, entity, action, params, options = {}) {
  const key = generateQueryCacheKey(service, entity, action, params);
  
  try {
    const { client = defaultClient, logger = defaultLogger } = options;
    
    const data = await client.getJson(key);
    
    if (data) {
      logger.debug('Cache hit for query', {
        service,
        entity,
        action
      });
    } else {
      logger.debug('Cache miss for query', {
        service,
        entity,
        action
      });
    }
    
    return data;
  } catch (err) {
    options.logger?.error('Error getting cached query results', {
      service,
      entity,
      action,
      error: err.message
    });
    
    return null;
  }
}

/**
 * Invalidate a cached item by ID
 * @param {string} service - Service name
 * @param {string} entity - Entity type
 * @param {string|number} id - Entity ID
 * @param {Object} [options={}] - Additional options
 * @returns {Promise<boolean>} Whether the operation succeeded
 */
async function invalidateCachedItem(service, entity, id, options = {}) {
  const key = generateCacheKey(service, entity, id);
  
  try {
    const { client = defaultClient, logger = defaultLogger } = options;
    
    const result = await client.del(key);
    
    logger.debug('Cache invalidated for item', {
      service,
      entity,
      id,
      success: result > 0
    });
    
    return result > 0;
  } catch (err) {
    options.logger?.error('Error invalidating cached item', {
      service,
      entity,
      id,
      error: err.message
    });
    
    return false;
  }
}

/**
 * Invalidate cached query results
 * @param {string} service - Service name
 * @param {string} entity - Entity type
 * @param {string} action - Query action
 * @param {Object} params - Query parameters
 * @param {Object} [options={}] - Additional options
 * @returns {Promise<boolean>} Whether the operation succeeded
 */
async function invalidateCachedQuery(service, entity, action, params, options = {}) {
  const key = generateQueryCacheKey(service, entity, action, params);
  
  try {
    const { client = defaultClient, logger = defaultLogger } = options;
    
    const result = await client.del(key);
    
    logger.debug('Cache invalidated for query', {
      service,
      entity,
      action,
      success: result > 0
    });
    
    return result > 0;
  } catch (err) {
    options.logger?.error('Error invalidating cached query', {
      service,
      entity,
      action,
      error: err.message
    });
    
    return false;
  }
}

/**
 * Invalidate all cached queries for an entity
 * @param {string} service - Service name
 * @param {string} entity - Entity type
 * @param {Object} [options={}] - Additional options
 * @returns {Promise<boolean>} Whether the operation succeeded
 */
async function invalidateEntityQueries(service, entity, options = {}) {
  try {
    const { client = defaultClient, logger = defaultLogger } = options;
    
    const pattern = `${service}:${entity}:*`;
    let cursor = '0';
    let keys = [];
    
    // Scan for all keys matching the pattern
    do {
      const result = await client.asyncMethods.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
      cursor = result[0];
      keys = keys.concat(result[1]);
    } while (cursor !== '0');
    
    if (keys.length > 0) {
      const result = await client.del(keys);
      
      logger.debug('Cache invalidated for entity queries', {
        service,
        entity,
        keysFound: keys.length,
        keysDeleted: result
      });
      
      return result > 0;
    }
    
    return true;
  } catch (err) {
    options.logger?.error('Error invalidating entity queries', {
      service,
      entity,
      error: err.message
    });
    
    return false;
  }
}

/**
 * Cache function with automatic key generation
 * @param {function} fn - Function to cache
 * @param {Object} cacheOptions - Cache options
 * @param {string} cacheOptions.service - Service name
 * @param {string} cacheOptions.entity - Entity type
 * @param {string} cacheOptions.action - Action name
 * @param {number} [cacheOptions.ttl=DEFAULT_TTL] - Cache TTL in seconds
 * @param {function} [cacheOptions.keyGenerator] - Custom key generator function
 * @returns {function} Wrapped function with caching
 */
function cachify(fn, cacheOptions) {
  const {
    service,
    entity,
    action,
    ttl = DEFAULT_TTL,
    keyGenerator = generateQueryCacheKey,
    client = defaultClient,
    logger = defaultLogger
  } = cacheOptions;
  
  return async function(...args) {
    try {
      // Generate cache key
      const key = typeof keyGenerator === 'function'
        ? keyGenerator(service, entity, action, args)
        : generateQueryCacheKey(service, entity, action, args);
      
      // Try to get from cache
      const cachedResult = await client.getJson(key);
      
      if (cachedResult !== null) {
        logger.debug('Cache hit', {
          service,
          entity,
          action,
          key
        });
        
        return cachedResult;
      }
      
      logger.debug('Cache miss', {
        service,
        entity,
        action,
        key
      });
      
      // Execute the function
      const result = await fn(...args);
      
      // Cache the result
      if (result !== null && result !== undefined) {
        await client.setJson(key, result, ttl);
        
        logger.debug('Cached function result', {
          service,
          entity,
          action,
          key,
          ttl
        });
      }
      
      return result;
    } catch (err) {
      logger.error('Error in cachify', {
        service,
        entity,
        action,
        error: err.message
      });
      
      // Fall back to the original function
      return fn(...args);
    }
  };
}

module.exports = {
  DEFAULT_TTL,
  generateCacheKey,
  normalizeCacheKey,
  generateQueryCacheKey,
  cacheItem,
  cacheItems,
  cacheQuery,
  getCachedItem,
  getCachedQuery,
  invalidateCachedItem,
  invalidateCachedQuery,
  invalidateEntityQueries,
  cachify
};
