/**
 * RabbitMQ Channel Manager
 * Управление пулом каналов для оптимальной производительности
 */

const EventEmitter = require('events');
const logger = require('../../logging/logger');
const { incrementCounter, observeHistogram } = require('../../metrics/counters');
const { getConnection } = require('./connection');

class ChannelManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.connection = options.connection || getConnection();
    this.maxChannels = options.maxChannels || 10;
    this.channelIdleTimeout = options.channelIdleTimeout || 60000; // 1 минута
    this.prefetchCount = options.prefetchCount || 100;
    this.confirmMode = options.confirmMode !== false;
    
    this.channels = new Map();
    this.channelUsage = new Map();
    this.reservedChannels = new Map();
    this.isInitialized = false;
    
    // Привязываем обработчики
    this._handleConnectionEvents();
  }

  /**
   * Инициализация менеджера каналов
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.connection.connect();
      this.isInitialized = true;
      
      logger.info('Channel manager initialized', {
        maxChannels: this.maxChannels,
        confirmMode: this.confirmMode
      });
      
      // Запускаем периодическую очистку неиспользуемых каналов
      this._startCleanupInterval();
    } catch (error) {
      logger.error('Failed to initialize channel manager', { error: error.message });
      throw error;
    }
  }

  /**
   * Получение канала из пула
   */
  async getChannel(options = {}) {
    await this.initialize();
    
    const startTime = Date.now();
    
    try {
      // Проверяем зарезервированные каналы
      if (options.channelId && this.reservedChannels.has(options.channelId)) {
        const channel = this.reservedChannels.get(options.channelId);
        this._updateChannelUsage(channel);
        return channel;
      }

      // Ищем свободный канал
      let channel = this._findAvailableChannel();
      
      // Если нет свободных каналов и не достигнут лимит, создаем новый
      if (!channel && this.channels.size < this.maxChannels) {
        channel = await this._createChannel();
      }
      
      // Если все каналы заняты, ждем освобождения
      if (!channel) {
        channel = await this._waitForAvailableChannel(options.timeout || 5000);
      }
      
      this._updateChannelUsage(channel);
      
      const duration = Date.now() - startTime;
      observeHistogram('channel_acquisition_duration_ms', duration);
      
      return channel;
    } catch (error) {
      incrementCounter('channel_acquisition_errors_total');
      logger.error('Failed to get channel', { error: error.message });
      throw error;
    }
  }

  /**
   * Резервирование канала для эксклюзивного использования
   */
  async reserveChannel(channelId, options = {}) {
    await this.initialize();
    
    try {
      if (this.reservedChannels.has(channelId)) {
        throw new Error(`Channel ${channelId} is already reserved`);
      }

      const channel = await this._createChannel(options);
      this.reservedChannels.set(channelId, channel);
      
      logger.info('Channel reserved', { channelId });
      incrementCounter('channels_reserved_total');
      
      return channel;
    } catch (error) {
      logger.error('Failed to reserve channel', { channelId, error: error.message });
      throw error;
    }
  }

  /**
   * Освобождение зарезервированного канала
   */
  async releaseChannel(channelId) {
    try {
      const channel = this.reservedChannels.get(channelId);
      
      if (!channel) {
        logger.warn('Attempted to release non-existent channel', { channelId });
        return;
      }

      await this._closeChannel(channel);
      this.reservedChannels.delete(channelId);
      
      logger.info('Channel released', { channelId });
      incrementCounter('channels_released_total');
    } catch (error) {
      logger.error('Failed to release channel', { channelId, error: error.message });
      throw error;
    }
  }

  /**
   * Выполнение операции с автоматическим управлением каналом
   */
  async withChannel(operation, options = {}) {
    const channel = await this.getChannel(options);
    
    try {
      return await operation(channel);
    } catch (error) {
      // Если произошла ошибка канала, закрываем его
      if (this._isChannelError(error)) {
        await this._removeChannel(channel);
      }
      throw error;
    }
  }

  /**
   * Создание канала
   */
  async _createChannel(options = {}) {
    try {
      const channel = this.confirmMode && !options.noConfirm
        ? await this.connection.createConfirmChannel()
        : await this.connection.createChannel();
      
      // Настраиваем prefetch
      const prefetch = options.prefetch !== undefined ? options.prefetch : this.prefetchCount;
      await channel.prefetch(prefetch);
      
      // Настраиваем обработчики событий
      channel.on('close', () => {
        this._handleChannelClose(channel);
      });
      
      channel.on('error', (error) => {
        this._handleChannelError(channel, error);
      });
      
      // Добавляем канал в пул
      const channelInfo = {
        channel,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        prefetch,
        confirmMode: this.confirmMode && !options.noConfirm
      };
      
      this.channels.set(channel, channelInfo);
      
      logger.info('Channel created', {
        totalChannels: this.channels.size,
        confirmMode: channelInfo.confirmMode,
        prefetch
      });
      
      incrementCounter('channels_created_total');
      
      return channel;
    } catch (error) {
      logger.error('Failed to create channel', { error: error.message });
      throw error;
    }
  }

  /**
   * Поиск доступного канала
   */
  _findAvailableChannel() {
    for (const [channel, info] of this.channels) {
      if (!this._isChannelInUse(channel)) {
        return channel;
      }
    }
    return null;
  }

  /**
   * Ожидание доступного канала
   */
  async _waitForAvailableChannel(timeout) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const channel = this._findAvailableChannel();
      if (channel) {
        return channel;
      }
      
      await this._sleep(50);
    }
    
    throw new Error('No available channels within timeout');
  }

  /**
   * Обновление информации об использовании канала
   */
  _updateChannelUsage(channel) {
    const info = this.channels.get(channel);
    if (info) {
      info.lastUsed = Date.now();
      this.channelUsage.set(channel, (this.channelUsage.get(channel) || 0) + 1);
    }
  }

  /**
   * Проверка, используется ли канал
   */
  _isChannelInUse(channel) {
    // Здесь можно добавить более сложную логику определения занятости канала
    return false; // Простая реализация - каналы всегда доступны
  }

  /**
   * Закрытие канала
   */
  async _closeChannel(channel) {
    try {
      await channel.close();
      this.channels.delete(channel);
      this.channelUsage.delete(channel);
      
      incrementCounter('channels_closed_total');
    } catch (error) {
      logger.warn('Error closing channel', { error: error.message });
    }
  }

  /**
   * Удаление канала из пула
   */
  async _removeChannel(channel) {
    await this._closeChannel(channel);
    
    logger.info('Channel removed from pool', {
      remainingChannels: this.channels.size
    });
  }

  /**
   * Обработчик закрытия канала
   */
  _handleChannelClose(channel) {
    this.channels.delete(channel);
    this.channelUsage.delete(channel);
    
    logger.warn('Channel closed unexpectedly', {
      remainingChannels: this.channels.size
    });
    
    incrementCounter('channels_closed_unexpectedly_total');
    
    this.emit('channelClosed', channel);
  }

  /**
   * Обработчик ошибки канала
   */
  _handleChannelError(channel, error) {
    logger.error('Channel error', { error: error.message });
    
    incrementCounter('channel_errors_total');
    
    this.emit('channelError', { channel, error });
    
    // Удаляем проблемный канал
    this._removeChannel(channel);
  }

  /**
   * Проверка, является ли ошибка ошибкой канала
   */
  _isChannelError(error) {
    const channelErrors = [
      'Channel closed',
      'Channel ended',
      'Connection closed',
      'CHANNEL_ERROR'
    ];
    
    return channelErrors.some(msg => 
      error.message && error.message.includes(msg)
    );
  }

  /**
   * Настройка обработчиков событий соединения
   */
  _handleConnectionEvents() {
    this.connection.on('disconnected', () => {
      // Очищаем все каналы при потере соединения
      this.channels.clear();
      this.channelUsage.clear();
      this.reservedChannels.clear();
      
      logger.warn('All channels cleared due to connection loss');
    });
    
    this.connection.on('connected', () => {
      logger.info('Connection restored, channels can be created');
    });
  }

  /**
   * Периодическая очистка неиспользуемых каналов
   */
  _startCleanupInterval() {
    this.cleanupInterval = setInterval(async () => {
      const now = Date.now();
      const channelsToClose = [];
      
      for (const [channel, info] of this.channels) {
        const idleTime = now - info.lastUsed;
        
        if (idleTime > this.channelIdleTimeout && !this._isChannelInUse(channel)) {
          channelsToClose.push(channel);
        }
      }
      
      for (const channel of channelsToClose) {
        await this._closeChannel(channel);
        logger.debug('Closed idle channel', {
          idleTime: now - this.channels.get(channel)?.lastUsed
        });
      }
      
      if (channelsToClose.length > 0) {
        logger.info('Cleaned up idle channels', {
          closedCount: channelsToClose.length,
          remainingChannels: this.channels.size
        });
      }
    }, this.channelIdleTimeout / 2);
  }

  /**
   * Остановка менеджера каналов
   */
  async shutdown() {
    try {
      // Останавливаем очистку
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }

      // Закрываем все зарезервированные каналы
      for (const [channelId, channel] of this.reservedChannels) {
        await this._closeChannel(channel);
      }
      this.reservedChannels.clear();

      // Закрываем все обычные каналы
      const channels = Array.from(this.channels.keys());
      for (const channel of channels) {
        await this._closeChannel(channel);
      }

      this.isInitialized = false;
      
      logger.info('Channel manager shutdown complete');
    } catch (error) {
      logger.error('Error during channel manager shutdown', { error: error.message });
      throw error;
    }
  }

  /**
   * Получение статистики использования каналов
   */
  getStats() {
    const stats = {
      totalChannels: this.channels.size,
      reservedChannels: this.reservedChannels.size,
      maxChannels: this.maxChannels,
      channelUsage: {},
      averageChannelAge: 0
    };
    
    let totalAge = 0;
    const now = Date.now();
    
    for (const [channel, info] of this.channels) {
      const usage = this.channelUsage.get(channel) || 0;
      const age = now - info.createdAt;
      
      totalAge += age;
      stats.channelUsage[`channel_${info.createdAt}`] = {
        usage,
        age,
        lastUsed: now - info.lastUsed,
        confirmMode: info.confirmMode,
        prefetch: info.prefetch
      };
    }
    
    if (this.channels.size > 0) {
      stats.averageChannelAge = totalAge / this.channels.size;
    }
    
    return stats;
  }

  /**
   * Вспомогательные методы
   */
  
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Создание singleton экземпляра
let managerInstance = null;

function getChannelManager(options) {
  if (!managerInstance) {
    managerInstance = new ChannelManager(options);
    
    // Обработка завершения процесса
    process.on('SIGINT', async () => {
      logger.info('Shutting down channel manager on SIGINT');
      await managerInstance.shutdown();
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Shutting down channel manager on SIGTERM');
      await managerInstance.shutdown();
    });
  }
  
  return managerInstance;
}

module.exports = {
  getChannelManager,
  ChannelManager
};