/**
 * Cache Helper
 * Утилиты для работы с кэшем, включая стратегии кэширования,
 * автоматическую сериализацию/десериализацию и паттерны кэширования
 */

const redisClient = require('./client');
const logger = require('../../logging/logger');
const { incrementCounter, observeHistogram } = require('../../metrics/counters');

class CacheHelper {
  constructor(options = {}) {
    this.defaultTTL = options.defaultTTL || 3600; // 1 час по умолчанию
    this.keyPrefix = options.keyPrefix || 'cache:';
    this.enableCompression = options.enableCompression || false;
    this.compressionThreshold = options.compressionThreshold || 1024; // 1KB
  }

  /**
   * Генерация ключа с префиксом
   */
  generateKey(namespace, identifier) {
    const parts = [this.keyPrefix, namespace];
    
    if (identifier !== undefined) {
      if (typeof identifier === 'object') {
        parts.push(this._hashObject(identifier));
      } else {
        parts.push(identifier);
      }
    }
    
    return parts.join(':');
  }

  /**
   * Кэширование с автоматической сериализацией
   */
  async set(key, value, options = {}) {
    const startTime = Date.now();
    
    try {
      const ttl = options.ttl || this.defaultTTL;
      const fullKey = options.raw ? key : this.generateKey(options.namespace || 'default', key);
      
      // Сериализация значения
      let serialized = JSON.stringify(value);
      
      // Сжатие, если включено и размер превышает порог
      if (this.enableCompression && serialized.length > this.compressionThreshold) {
        serialized = await this._compress(serialized);
      }
      
      await redisClient.set(fullKey, serialized, ttl);
      
      const duration = Date.now() - startTime;
      observeHistogram('cache_operation_duration_ms', duration, { operation: 'set' });
      incrementCounter('cache_sets_total');
      
      logger.debug('Cache set', { key: fullKey, ttl, size: serialized.length });
      
      return true;
    } catch (error) {
      incrementCounter('cache_errors_total', { operation: 'set' });
      logger.error('Cache set error', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Получение из кэша с автоматической десериализацией
   */
  async get(key, options = {}) {
    const startTime = Date.now();
    
    try {
      const fullKey = options.raw ? key : this.generateKey(options.namespace || 'default', key);
      const cached = await redisClient.get(fullKey);
      
      const duration = Date.now() - startTime;
      observeHistogram('cache_operation_duration_ms', duration, { operation: 'get' });
      
      if (cached === null) {
        incrementCounter('cache_misses_total');
        return null;
      }
      
      incrementCounter('cache_hits_total');
      
      // Декомпрессия, если необходимо
      let decompressed = cached;
      if (this._isCompressed(cached)) {
        decompressed = await this._decompress(cached);
      }
      
      // Десериализация
      try {
        return JSON.parse(decompressed);
      } catch (parseError) {
        // Если не удалось распарсить, возвращаем как есть
        logger.warn('Cache parse error, returning raw value', { key: fullKey });
        return decompressed;
      }
    } catch (error) {
      incrementCounter('cache_errors_total', { operation: 'get' });
      logger.error('Cache get error', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Получение нескольких значений
   */
  async mget(keys, options = {}) {
    const startTime = Date.now();
    
    try {
      const namespace = options.namespace || 'default';
      const fullKeys = keys.map(key => 
        options.raw ? key : this.generateKey(namespace, key)
      );
      
      const client = await redisClient.getClient();
      const values = await client.mget(...fullKeys);
      
      const duration = Date.now() - startTime;
      observeHistogram('cache_operation_duration_ms', duration, { operation: 'mget' });
      
      const results = {};
      keys.forEach((key, index) => {
        const value = values[index];
        if (value !== null) {
          try {
            let decompressed = value;
            if (this._isCompressed(value)) {
              decompressed = this._decompress(value);
            }
            results[key] = JSON.parse(decompressed);
            incrementCounter('cache_hits_total');
          } catch (error) {
            logger.warn('Cache parse error in mget', { key, error: error.message });
            results[key] = null;
            incrementCounter('cache_misses_total');
          }
        } else {
          results[key] = null;
          incrementCounter('cache_misses_total');
        }
      });
      
      return results;
    } catch (error) {
      incrementCounter('cache_errors_total', { operation: 'mget' });
      logger.error('Cache mget error', { keys, error: error.message });
      throw error;
    }
  }

  /**
   * Удаление из кэша
   */
  async del(key, options = {}) {
    try {
      const fullKey = options.raw ? key : this.generateKey(options.namespace || 'default', key);
      const result = await redisClient.del(fullKey);
      
      incrementCounter('cache_deletes_total');
      logger.debug('Cache delete', { key: fullKey, deleted: result > 0 });
      
      return result > 0;
    } catch (error) {
      incrementCounter('cache_errors_total', { operation: 'del' });
      logger.error('Cache delete error', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Очистка кэша по паттерну
   */
  async clear(pattern, options = {}) {
    try {
      const namespace = options.namespace || 'default';
      const searchPattern = pattern 
        ? this.generateKey(namespace, pattern)
        : this.generateKey(namespace, '*');
      
      const client = await redisClient.getClient();
      const stream = client.scanStream({
        match: searchPattern,
        count: 100
      });
      
      let deletedCount = 0;
      
      stream.on('data', async (keys) => {
        if (keys.length) {
          const deleted = await client.del(...keys);
          deletedCount += deleted;
        }
      });
      
      return new Promise((resolve, reject) => {
        stream.on('end', () => {
          incrementCounter('cache_clears_total', { count: deletedCount });
          logger.info('Cache cleared', { pattern: searchPattern, deletedCount });
          resolve(deletedCount);
        });
        
        stream.on('error', (error) => {
          incrementCounter('cache_errors_total', { operation: 'clear' });
          logger.error('Cache clear error', { pattern, error: error.message });
          reject(error);
        });
      });
    } catch (error) {
      incrementCounter('cache_errors_total', { operation: 'clear' });
      logger.error('Cache clear error', { pattern, error: error.message });
      throw error;
    }
  }

  /**
   * Кэширование с автоматическим обновлением (cache-aside pattern)
   */
  async getOrSet(key, fetchFunction, options = {}) {
    const startTime = Date.now();
    
    try {
      // Пытаемся получить из кэша
      const cached = await this.get(key, options);
      if (cached !== null) {
        return cached;
      }
      
      // Если не найдено, вызываем функцию получения данных
      const freshData = await fetchFunction();
      
      // Сохраняем в кэш
      if (freshData !== null && freshData !== undefined) {
        await this.set(key, freshData, options);
      }
      
      const duration = Date.now() - startTime;
      observeHistogram('cache_fetch_duration_ms', duration);
      
      return freshData;
    } catch (error) {
      logger.error('Cache getOrSet error', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Кэширование с блокировкой для предотвращения cache stampede
   */
  async getOrSetWithLock(key, fetchFunction, options = {}) {
    const lockKey = `lock:${key}`;
    const lockTTL = options.lockTTL || 10; // 10 секунд по умолчанию
    const lockRetryDelay = options.lockRetryDelay || 100; // 100ms
    const maxLockRetries = options.maxLockRetries || 50; // 5 секунд максимум
    
    try {
      // Пытаемся получить из кэша
      const cached = await this.get(key, options);
      if (cached !== null) {
        return cached;
      }
      
      // Пытаемся получить блокировку
      let lockAcquired = false;
      let retries = 0;
      
      while (!lockAcquired && retries < maxLockRetries) {
        lockAcquired = await redisClient.setWithOptions(lockKey, '1', {
          ttl: lockTTL,
          onlyIfNotExists: true
        });
        
        if (!lockAcquired) {
          // Ждем и проверяем кэш снова
          await this._sleep(lockRetryDelay);
          
          const cachedAfterWait = await this.get(key, options);
          if (cachedAfterWait !== null) {
            return cachedAfterWait;
          }
          
          retries++;
        }
      }
      
      if (!lockAcquired) {
        throw new Error('Failed to acquire cache lock');
      }
      
      try {
        // Двойная проверка после получения блокировки
        const cachedAfterLock = await this.get(key, options);
        if (cachedAfterLock !== null) {
          return cachedAfterLock;
        }
        
        // Получаем свежие данные
        const freshData = await fetchFunction();
        
        // Сохраняем в кэш
        if (freshData !== null && freshData !== undefined) {
          await this.set(key, freshData, options);
        }
        
        return freshData;
      } finally {
        // Освобождаем блокировку
        await redisClient.del(lockKey);
      }
    } catch (error) {
      logger.error('Cache getOrSetWithLock error', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Инвалидация кэша с тегами
   */
  async tag(tags, key) {
    if (!Array.isArray(tags)) {
      tags = [tags];
    }
    
    try {
      const promises = tags.map(tag => 
        redisClient.sadd(`tag:${tag}`, key)
      );
      
      await Promise.all(promises);
      incrementCounter('cache_tags_added_total', { count: tags.length });
    } catch (error) {
      logger.error('Cache tagging error', { tags, key, error: error.message });
      throw error;
    }
  }

  /**
   * Инвалидация по тегу
   */
  async invalidateByTag(tag) {
    try {
      const keys = await redisClient.smembers(`tag:${tag}`);
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
        await redisClient.del(`tag:${tag}`);
        
        incrementCounter('cache_tag_invalidations_total', { tag, count: keys.length });
        logger.info('Cache invalidated by tag', { tag, count: keys.length });
      }
      
      return keys.length;
    } catch (error) {
      logger.error('Cache tag invalidation error', { tag, error: error.message });
      throw error;
    }
  }

  /**
   * Прогрев кэша
   */
  async warmUp(items, fetchFunction, options = {}) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    const startTime = Date.now();
    
    for (const item of items) {
      try {
        const key = typeof item === 'object' ? item.key : item;
        const fetchOptions = typeof item === 'object' ? item.options : {};
        
        const data = await fetchFunction(key, fetchOptions);
        
        if (data !== null && data !== undefined) {
          await this.set(key, data, { ...options, ...fetchOptions });
          results.success++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          item,
          error: error.message
        });
        logger.error('Cache warm-up error', { item, error: error.message });
      }
    }
    
    const duration = Date.now() - startTime;
    logger.info('Cache warm-up completed', { 
      ...results, 
      duration,
      totalItems: items.length 
    });
    
    return results;
  }

  /**
   * Получение статистики кэша
   */
  async getStats(namespace = null) {
    try {
      const pattern = namespace 
        ? this.generateKey(namespace, '*')
        : this.generateKey('*', '*');
      
      const client = await redisClient.getClient();
      let keyCount = 0;
      let totalSize = 0;
      const typeCounts = {};
      
      const stream = client.scanStream({
        match: pattern,
        count: 100
      });
      
      return new Promise((resolve, reject) => {
        stream.on('data', async (keys) => {
          keyCount += keys.length;
          
          for (const key of keys) {
            try {
              const type = await client.type(key);
              typeCounts[type] = (typeCounts[type] || 0) + 1;
              
              // Примерный подсчет размера для строковых ключей
              if (type === 'string') {
                const value = await client.get(key);
                if (value) {
                  totalSize += Buffer.byteLength(value);
                }
              }
            } catch (error) {
              logger.warn('Error getting stats for key', { key, error: error.message });
            }
          }
        });
        
        stream.on('end', () => {
          const stats = {
            namespace,
            keyCount,
            totalSize,
            avgSize: keyCount > 0 ? Math.round(totalSize / keyCount) : 0,
            typeCounts,
            pattern
          };
          
          logger.debug('Cache stats retrieved', stats);
          resolve(stats);
        });
        
        stream.on('error', reject);
      });
    } catch (error) {
      logger.error('Cache stats error', { namespace, error: error.message });
      throw error;
    }
  }

  /**
   * Хеширование объекта для использования в качестве ключа
   */
  _hashObject(obj) {
    const crypto = require('crypto');
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * Проверка, сжаты ли данные
   */
  _isCompressed(data) {
    // Простая проверка по префиксу
    return data && data.startsWith('COMPRESSED:');
  }

  /**
   * Сжатие данных
   */
  async _compress(data) {
    const zlib = require('zlib');
    const compressed = await new Promise((resolve, reject) => {
      zlib.deflate(data, (err, buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });
    
    return 'COMPRESSED:' + compressed.toString('base64');
  }

  /**
   * Распаковка данных
   */
  async _decompress(data) {
    const zlib = require('zlib');
    const compressed = data.replace('COMPRESSED:', '');
    const buffer = Buffer.from(compressed, 'base64');
    
    const decompressed = await new Promise((resolve, reject) => {
      zlib.inflate(buffer, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    
    return decompressed.toString();
  }

  /**
   * Утилита для ожидания
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Создание экземпляра с настройками по умолчанию
const cacheHelper = new CacheHelper();

module.exports = cacheHelper;

// Экспорт класса для создания дополнительных экземпляров
module.exports.CacheHelper = CacheHelper;