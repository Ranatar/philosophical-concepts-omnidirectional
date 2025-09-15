/**
 * RabbitMQ Connection
 * Управление подключением к RabbitMQ с автоматическим переподключением
 */

const amqp = require('amqplib');
const EventEmitter = require('events');
const logger = require('../../logging/logger');
const { incrementCounter } = require('../../metrics/counters');

class RabbitMQConnection extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.url = options.url || process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    this.options = {
      heartbeat: 60,
      connectionTimeout: 10000,
      ...options.connectionOptions
    };
    
    this.reconnectOptions = {
      enabled: true,
      initialDelay: 1000,
      maxDelay: 30000,
      multiplier: 2,
      maxRetries: null, // null = бесконечные попытки
      ...options.reconnectOptions
    };
    
    this.connection = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.channels = new Map();
    this.connectionPromise = null;
    
    // Привязываем обработчики
    this._handleConnectionClose = this._handleConnectionClose.bind(this);
    this._handleConnectionError = this._handleConnectionError.bind(this);
    this._handleConnectionBlocked = this._handleConnectionBlocked.bind(this);
    this._handleConnectionUnblocked = this._handleConnectionUnblocked.bind(this);
  }

  /**
   * Установка соединения с RabbitMQ
   */
  async connect() {
    if (this.isConnected) {
      return this.connection;
    }

    if (this.isConnecting) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this._createConnection();
    
    try {
      this.connection = await this.connectionPromise;
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.connectionPromise = null;
      
      logger.info('RabbitMQ connection established', { url: this._sanitizeUrl() });
      incrementCounter('rabbitmq_connections_total');
      
      this.emit('connected');
      
      return this.connection;
    } catch (error) {
      this.isConnecting = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  /**
   * Создание подключения с настройкой обработчиков событий
   */
  async _createConnection() {
    try {
      const connection = await amqp.connect(this.url, this.options);
      
      // Настраиваем обработчики событий
      connection.on('close', this._handleConnectionClose);
      connection.on('error', this._handleConnectionError);
      connection.on('blocked', this._handleConnectionBlocked);
      connection.on('unblocked', this._handleConnectionUnblocked);
      
      return connection;
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { 
        error: error.message,
        url: this._sanitizeUrl() 
      });
      
      incrementCounter('rabbitmq_connection_errors_total');
      
      if (this.reconnectOptions.enabled) {
        this._scheduleReconnect();
      }
      
      throw error;
    }
  }

  /**
   * Обработчик закрытия соединения
   */
  _handleConnectionClose(error) {
    this.isConnected = false;
    this.connection = null;
    
    logger.warn('RabbitMQ connection closed', { 
      error: error?.message,
      wasError: !!error 
    });
    
    incrementCounter('rabbitmq_disconnections_total');
    
    // Закрываем все каналы
    this.channels.clear();
    
    this.emit('disconnected', error);
    
    if (this.reconnectOptions.enabled && !this.isConnecting) {
      this._scheduleReconnect();
    }
  }

  /**
   * Обработчик ошибки соединения
   */
  _handleConnectionError(error) {
    logger.error('RabbitMQ connection error', { error: error.message });
    incrementCounter('rabbitmq_errors_total');
    
    this.emit('error', error);
  }

  /**
   * Обработчик блокировки соединения
   */
  _handleConnectionBlocked(reason) {
    logger.warn('RabbitMQ connection blocked', { reason });
    incrementCounter('rabbitmq_blocks_total');
    
    this.emit('blocked', reason);
  }

  /**
   * Обработчик разблокировки соединения
   */
  _handleConnectionUnblocked() {
    logger.info('RabbitMQ connection unblocked');
    
    this.emit('unblocked');
  }

  /**
   * Планирование переподключения
   */
  _scheduleReconnect() {
    if (this.reconnectOptions.maxRetries !== null && 
        this.reconnectAttempts >= this.reconnectOptions.maxRetries) {
      logger.error('Max reconnection attempts reached', {
        attempts: this.reconnectAttempts,
        maxRetries: this.reconnectOptions.maxRetries
      });
      
      this.emit('reconnectFailed');
      return;
    }

    const delay = this._calculateReconnectDelay();
    
    logger.info('Scheduling RabbitMQ reconnection', {
      attempt: this.reconnectAttempts + 1,
      delay,
      maxRetries: this.reconnectOptions.maxRetries
    });
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(error => {
        logger.error('Reconnection attempt failed', {
          attempt: this.reconnectAttempts,
          error: error.message
        });
      });
    }, delay);
  }

  /**
   * Расчет задержки переподключения с экспоненциальным откатом
   */
  _calculateReconnectDelay() {
    const { initialDelay, maxDelay, multiplier } = this.reconnectOptions;
    
    const delay = Math.min(
      initialDelay * Math.pow(multiplier, this.reconnectAttempts),
      maxDelay
    );
    
    // Добавляем случайный jitter для предотвращения thundering herd
    const jitter = Math.random() * 0.3 * delay;
    
    return Math.floor(delay + jitter);
  }

  /**
   * Создание канала
   */
  async createChannel() {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const channel = await this.connection.createChannel();
      
      // Настраиваем обработчики событий канала
      channel.on('close', () => {
        logger.warn('RabbitMQ channel closed');
        incrementCounter('rabbitmq_channel_closes_total');
      });
      
      channel.on('error', (error) => {
        logger.error('RabbitMQ channel error', { error: error.message });
        incrementCounter('rabbitmq_channel_errors_total');
      });
      
      incrementCounter('rabbitmq_channels_created_total');
      
      return channel;
    } catch (error) {
      logger.error('Failed to create channel', { error: error.message });
      throw error;
    }
  }

  /**
   * Создание подтверждающего канала
   */
  async createConfirmChannel() {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const channel = await this.connection.createConfirmChannel();
      
      // Настраиваем обработчики событий канала
      channel.on('close', () => {
        logger.warn('RabbitMQ confirm channel closed');
        incrementCounter('rabbitmq_channel_closes_total');
      });
      
      channel.on('error', (error) => {
        logger.error('RabbitMQ confirm channel error', { error: error.message });
        incrementCounter('rabbitmq_channel_errors_total');
      });
      
      incrementCounter('rabbitmq_channels_created_total');
      
      return channel;
    } catch (error) {
      logger.error('Failed to create confirm channel', { error: error.message });
      throw error;
    }
  }

  /**
   * Закрытие соединения
   */
  async close() {
    if (!this.connection) {
      return;
    }

    try {
      // Отключаем автоматическое переподключение
      this.reconnectOptions.enabled = false;
      
      // Закрываем все каналы
      for (const [channelId, channel] of this.channels) {
        try {
          await channel.close();
        } catch (error) {
          logger.warn('Error closing channel', { 
            channelId, 
            error: error.message 
          });
        }
      }
      
      this.channels.clear();
      
      // Закрываем соединение
      await this.connection.close();
      
      this.connection = null;
      this.isConnected = false;
      
      logger.info('RabbitMQ connection closed gracefully');
      
      this.emit('closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection', { error: error.message });
      throw error;
    }
  }

  /**
   * Проверка состояния соединения
   */
  isAlive() {
    return this.isConnected && this.connection !== null;
  }

  /**
   * Получение информации о состоянии
   */
  getStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      channelCount: this.channels.size,
      url: this._sanitizeUrl()
    };
  }

  /**
   * Ожидание установки соединения
   */
  async waitForConnection(timeout = 30000) {
    const startTime = Date.now();
    
    while (!this.isConnected) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Connection timeout');
      }
      
      if (!this.isConnecting) {
        await this.connect();
      }
      
      await this._sleep(100);
    }
    
    return this.connection;
  }

  /**
   * Проверка health состояния
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          healthy: false,
          error: 'Not connected'
        };
      }

      // Пробуем создать и закрыть канал для проверки
      const channel = await this.createChannel();
      await channel.close();
      
      return {
        healthy: true,
        status: this.getStatus()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        status: this.getStatus()
      };
    }
  }

  /**
   * Вспомогательные методы
   */
  
  _sanitizeUrl() {
    // Скрываем пароль в URL для логирования
    try {
      const urlObj = new URL(this.url);
      if (urlObj.password) {
        urlObj.password = '***';
      }
      return urlObj.toString();
    } catch {
      return 'invalid-url';
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Создание singleton экземпляра
let connectionInstance = null;

function getConnection(options) {
  if (!connectionInstance) {
    connectionInstance = new RabbitMQConnection(options);
    
    // Обработка завершения процесса
    process.on('SIGINT', async () => {
      logger.info('Closing RabbitMQ connection on SIGINT');
      await connectionInstance.close();
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Closing RabbitMQ connection on SIGTERM');
      await connectionInstance.close();
    });
  }
  
  return connectionInstance;
}

module.exports = { 
  getConnection,
  RabbitMQConnection 
};