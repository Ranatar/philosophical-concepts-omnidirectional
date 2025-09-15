/**
 * Redis Client
 * Централизованный клиент для работы с Redis
 * Поддерживает connection pooling, автоматическое переподключение и метрики
 */

const Redis = require('ioredis');
const logger = require('../../logging/logger');
const { incrementCounter } = require('../../metrics/counters');
const config = require('./config');

class RedisClient {
  constructor(options = {}) {
    this.options = {
      ...config.redis,
      ...options,
      retryStrategy: this._retryStrategy.bind(this),
      reconnectOnError: this._reconnectOnError.bind(this)
    };
    
    this.client = null;
    this.isConnected = false;
    this.connectionPromise = null;
  }

  /**
   * Инициализация подключения к Redis
   */
  async connect() {
    if (this.isConnected) {
      return this.client;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._createConnection();
    
    try {
      this.client = await this.connectionPromise;
      this.isConnected = true;
      this.connectionPromise = null;
      return this.client;
    } catch (error) {
      this.connectionPromise = null;
      throw error;
    }
  }

  /**
   * Создание подключения с обработкой событий
   */
  async _createConnection() {
    return new Promise((resolve, reject) => {
      const client = new Redis(this.options);

      // Таймаут подключения
      const connectionTimeout = setTimeout(() => {
        client.disconnect();
        reject(new Error('Redis connection timeout'));
      }, this.options.connectionTimeout || 10000);

      // Обработчики событий
      client.once('connect', () => {
        clearTimeout(connectionTimeout);
        logger.info('Redis client connected', {
          host: this.options.host,
          port: this.options.port
        });
        incrementCounter('redis_connections_total');
        resolve(client);
      });

      client.on('error', (error) => {
        logger.error('Redis client error', { error: error.message });
        incrementCounter('redis_errors_total');
      });

      client.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      client.on('reconnecting', (delay) => {
        logger.info('Redis reconnecting', { delay });
        incrementCounter('redis_reconnections_total');
      });

      client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });
    });
  }

  /**
   * Стратегия переподключения
   */
  _retryStrategy(times) {
    const maxRetryTime = this.options.maxRetryTime || 60000; // 1 минута
    const baseDelay = this.options.retryDelay || 500;
    
    if (times > this.options.maxRetries || 10) {
      logger.error('Max Redis reconnection attempts reached');
      return null; // Прекратить попытки
    }

    const delay = Math.min(baseDelay * Math.pow(2, times), maxRetryTime);
    logger.info(`Retrying Redis connection in ${delay}ms (attempt ${times})`);
    
    return delay;
  }

  /**
   * Определяет, нужно ли переподключаться при ошибке
   */
  _reconnectOnError(error) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    
    if (targetErrors.some(targetError => error.message.includes(targetError))) {
      logger.warn('Reconnecting due to error', { error: error.message });
      return true;
    }
    
    return false;
  }

  /**
   * Получение значения по ключу
   */
  async get(key) {
    try {
      const client = await this.getClient();
      const value = await client.get(key);
      incrementCounter('redis_operations_total', { operation: 'get' });
      return value;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'get' });
      throw error;
    }
  }

  /**
   * Установка значения
   */
  async set(key, value, ttl = null) {
    try {
      const client = await this.getClient();
      
      if (ttl) {
        await client.setex(key, ttl, value);
      } else {
        await client.set(key, value);
      }
      
      incrementCounter('redis_operations_total', { operation: 'set' });
      return true;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'set' });
      throw error;
    }
  }

  /**
   * Установка значения с опциями
   */
  async setWithOptions(key, value, options = {}) {
    try {
      const client = await this.getClient();
      const args = [key, value];

      if (options.ttl) {
        args.push('EX', options.ttl);
      }
      
      if (options.onlyIfNotExists) {
        args.push('NX');
      } else if (options.onlyIfExists) {
        args.push('XX');
      }

      const result = await client.set(...args);
      incrementCounter('redis_operations_total', { operation: 'set_with_options' });
      
      return result === 'OK';
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'set_with_options' });
      throw error;
    }
  }

  /**
   * Удаление ключей
   */
  async del(...keys) {
    try {
      const client = await this.getClient();
      const result = await client.del(...keys);
      incrementCounter('redis_operations_total', { operation: 'del' });
      return result;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'del' });
      throw error;
    }
  }

  /**
   * Проверка существования ключа
   */
  async exists(key) {
    try {
      const client = await this.getClient();
      const result = await client.exists(key);
      incrementCounter('redis_operations_total', { operation: 'exists' });
      return result === 1;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'exists' });
      throw error;
    }
  }

  /**
   * Установка времени жизни ключа
   */
  async expire(key, seconds) {
    try {
      const client = await this.getClient();
      const result = await client.expire(key, seconds);
      incrementCounter('redis_operations_total', { operation: 'expire' });
      return result === 1;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'expire' });
      throw error;
    }
  }

  /**
   * Работа с хэшами - получение поля
   */
  async hget(key, field) {
    try {
      const client = await this.getClient();
      const value = await client.hget(key, field);
      incrementCounter('redis_operations_total', { operation: 'hget' });
      return value;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'hget' });
      throw error;
    }
  }

  /**
   * Работа с хэшами - установка поля
   */
  async hset(key, field, value) {
    try {
      const client = await this.getClient();
      const result = await client.hset(key, field, value);
      incrementCounter('redis_operations_total', { operation: 'hset' });
      return result;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'hset' });
      throw error;
    }
  }

  /**
   * Работа с хэшами - получение всех полей
   */
  async hgetall(key) {
    try {
      const client = await this.getClient();
      const result = await client.hgetall(key);
      incrementCounter('redis_operations_total', { operation: 'hgetall' });
      return result;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'hgetall' });
      throw error;
    }
  }

  /**
   * Работа со списками - добавление в начало
   */
  async lpush(key, ...values) {
    try {
      const client = await this.getClient();
      const result = await client.lpush(key, ...values);
      incrementCounter('redis_operations_total', { operation: 'lpush' });
      return result;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'lpush' });
      throw error;
    }
  }

  /**
   * Работа со списками - добавление в конец
   */
  async rpush(key, ...values) {
    try {
      const client = await this.getClient();
      const result = await client.rpush(key, ...values);
      incrementCounter('redis_operations_total', { operation: 'rpush' });
      return result;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'rpush' });
      throw error;
    }
  }

  /**
   * Работа со списками - получение диапазона
   */
  async lrange(key, start, stop) {
    try {
      const client = await this.getClient();
      const result = await client.lrange(key, start, stop);
      incrementCounter('redis_operations_total', { operation: 'lrange' });
      return result;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'lrange' });
      throw error;
    }
  }

  /**
   * Работа с множествами - добавление
   */
  async sadd(key, ...members) {
    try {
      const client = await this.getClient();
      const result = await client.sadd(key, ...members);
      incrementCounter('redis_operations_total', { operation: 'sadd' });
      return result;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'sadd' });
      throw error;
    }
  }

  /**
   * Работа с множествами - получение всех элементов
   */
  async smembers(key) {
    try {
      const client = await this.getClient();
      const result = await client.smembers(key);
      incrementCounter('redis_operations_total', { operation: 'smembers' });
      return result;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'smembers' });
      throw error;
    }
  }

  /**
   * Работа с множествами - проверка наличия элемента
   */
  async sismember(key, member) {
    try {
      const client = await this.getClient();
      const result = await client.sismember(key, member);
      incrementCounter('redis_operations_total', { operation: 'sismember' });
      return result === 1;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'sismember' });
      throw error;
    }
  }

  /**
   * Инкремент значения
   */
  async incr(key) {
    try {
      const client = await this.getClient();
      const result = await client.incr(key);
      incrementCounter('redis_operations_total', { operation: 'incr' });
      return result;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'incr' });
      throw error;
    }
  }

  /**
   * Декремент значения
   */
  async decr(key) {
    try {
      const client = await this.getClient();
      const result = await client.decr(key);
      incrementCounter('redis_operations_total', { operation: 'decr' });
      return result;
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'decr' });
      throw error;
    }
  }

  /**
   * Выполнение транзакции
   */
  async transaction(operations) {
    try {
      const client = await this.getClient();
      const pipeline = client.pipeline();
      
      operations.forEach(op => {
        pipeline[op.command](...op.args);
      });
      
      const results = await pipeline.exec();
      incrementCounter('redis_operations_total', { operation: 'transaction' });
      
      return results.map(([err, result]) => {
        if (err) throw err;
        return result;
      });
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'transaction' });
      throw error;
    }
  }

  /**
   * Очистка всех ключей (осторожно!)
   */
  async flushall() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('flushall is not allowed in production');
    }
    
    try {
      const client = await this.getClient();
      await client.flushall();
      incrementCounter('redis_operations_total', { operation: 'flushall' });
      logger.warn('Redis flushall executed');
    } catch (error) {
      incrementCounter('redis_operation_errors_total', { operation: 'flushall' });
      throw error;
    }
  }

  /**
   * Получение информации о сервере
   */
  async info(section = null) {
    try {
      const client = await this.getClient();
      const info = section ? await client.info(section) : await client.info();
      return info;
    } catch (error) {
      logger.error('Failed to get Redis info', { error: error.message });
      throw error;
    }
  }

  /**
   * Ping для проверки соединения
   */
  async ping() {
    try {
      const client = await this.getClient();
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  /**
   * Получение клиента с гарантией подключения
   */
  async getClient() {
    if (!this.isConnected) {
      await this.connect();
    }
    return this.client;
  }

  /**
   * Закрытие соединения
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }

  /**
   * Получение статистики использования
   */
  async getStats() {
    try {
      const client = await this.getClient();
      const info = await client.info('stats');
      const memory = await client.info('memory');
      
      return {
        connected: this.isConnected,
        stats: this._parseInfo(info),
        memory: this._parseInfo(memory)
      };
    } catch (error) {
      logger.error('Failed to get Redis stats', { error: error.message });
      return null;
    }
  }

  /**
   * Парсинг информации Redis
   */
  _parseInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    });
    
    return result;
  }
}

// Создание singleton экземпляра
const redisClient = new RedisClient();

// Обработка завершения процесса
process.on('SIGINT', async () => {
  await redisClient.disconnect();
});

process.on('SIGTERM', async () => {
  await redisClient.disconnect();
});

module.exports = redisClient;

// Экспорт класса для создания дополнительных экземпляров
module.exports.RedisClient = RedisClient;