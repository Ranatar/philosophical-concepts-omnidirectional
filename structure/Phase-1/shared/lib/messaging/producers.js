/**
 * Message Producers
 * Продюсеры для отправки сообщений в RabbitMQ
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../logging/logger');
const { incrementCounter, observeHistogram } = require('../metrics/counters');
const { getChannelManager } = require('./rabbitmq/channelManager');
const { AppError } = require('../errors/AppError');

class MessageProducer {
  constructor(options = {}) {
    this.channelManager = options.channelManager || getChannelManager();
    this.defaultExchange = options.defaultExchange || '';
    this.defaultOptions = {
      persistent: true,
      contentType: 'application/json',
      ...options.defaultOptions
    };
    
    this.confirmTimeout = options.confirmTimeout || 5000;
    this.retryOptions = {
      maxRetries: 3,
      initialDelay: 1000,
      multiplier: 2,
      ...options.retryOptions
    };
  }

  /**
   * Отправка сообщения в очередь
   */
  async sendToQueue(queue, message, options = {}) {
    const startTime = Date.now();
    const messageId = options.messageId || uuidv4();
    
    try {
      const messageOptions = {
        ...this.defaultOptions,
        ...options,
        messageId,
        timestamp: Date.now(),
        headers: {
          ...this.defaultOptions.headers,
          ...options.headers,
          'x-message-id': messageId,
          'x-timestamp': new Date().toISOString()
        }
      };

      // Сериализуем сообщение
      const content = Buffer.from(JSON.stringify(message));
      
      // Отправляем с retry логикой
      await this._sendWithRetry(
        async (channel) => {
          await this._assertQueue(channel, queue, options.queueOptions);
          return channel.sendToQueue(queue, content, messageOptions);
        },
        'sendToQueue',
        { queue, messageId }
      );
      
      const duration = Date.now() - startTime;
      observeHistogram('message_send_duration_ms', duration, { 
        operation: 'sendToQueue',
        queue 
      });
      
      incrementCounter('messages_sent_total', { queue });
      
      logger.debug('Message sent to queue', {
        queue,
        messageId,
        size: content.length,
        duration
      });
      
      return messageId;
    } catch (error) {
      incrementCounter('message_send_errors_total', { 
        queue,
        errorType: error.name 
      });
      
      logger.error('Failed to send message to queue', {
        queue,
        messageId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Публикация сообщения в exchange
   */
  async publish(exchange, routingKey, message, options = {}) {
    const startTime = Date.now();
    const messageId = options.messageId || uuidv4();
    
    try {
      const messageOptions = {
        ...this.defaultOptions,
        ...options,
        messageId,
        timestamp: Date.now(),
        headers: {
          ...this.defaultOptions.headers,
          ...options.headers,
          'x-message-id': messageId,
          'x-routing-key': routingKey,
          'x-timestamp': new Date().toISOString()
        }
      };

      // Сериализуем сообщение
      const content = Buffer.from(JSON.stringify(message));
      
      // Публикуем с retry логикой
      await this._sendWithRetry(
        async (channel) => {
          await this._assertExchange(channel, exchange, options.exchangeOptions);
          return channel.publish(exchange, routingKey, content, messageOptions);
        },
        'publish',
        { exchange, routingKey, messageId }
      );
      
      const duration = Date.now() - startTime;
      observeHistogram('message_send_duration_ms', duration, { 
        operation: 'publish',
        exchange,
        routingKey 
      });
      
      incrementCounter('messages_published_total', { exchange, routingKey });
      
      logger.debug('Message published', {
        exchange,
        routingKey,
        messageId,
        size: content.length,
        duration
      });
      
      return messageId;
    } catch (error) {
      incrementCounter('message_publish_errors_total', { 
        exchange,
        routingKey,
        errorType: error.name 
      });
      
      logger.error('Failed to publish message', {
        exchange,
        routingKey,
        messageId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Массовая отправка сообщений
   */
  async sendBatch(messages, options = {}) {
    const startTime = Date.now();
    const results = [];
    const errors = [];
    
    try {
      // Группируем сообщения по назначению
      const grouped = this._groupMessages(messages);
      
      // Отправляем каждую группу
      for (const [destination, group] of grouped) {
        try {
          await this.channelManager.withChannel(async (channel) => {
            for (const msg of group) {
              try {
                const messageId = await this._sendMessage(channel, msg);
                results.push({
                  success: true,
                  messageId,
                  destination: msg.queue || `${msg.exchange}/${msg.routingKey}`
                });
              } catch (error) {
                errors.push({
                  success: false,
                  error: error.message,
                  message: msg
                });
              }
            }
          });
        } catch (error) {
          // Ошибка всей группы
          group.forEach(msg => {
            errors.push({
              success: false,
              error: error.message,
              message: msg
            });
          });
        }
      }
      
      const duration = Date.now() - startTime;
      
      logger.info('Batch send completed', {
        total: messages.length,
        successful: results.length,
        failed: errors.length,
        duration
      });
      
      incrementCounter('batch_sends_total', {
        status: errors.length === 0 ? 'success' : 'partial'
      });
      
      return {
        results,
        errors,
        summary: {
          total: messages.length,
          successful: results.length,
          failed: errors.length,
          duration
        }
      };
    } catch (error) {
      logger.error('Batch send failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Отправка с подтверждением
   */
  async sendWithConfirmation(destination, message, options = {}) {
    const startTime = Date.now();
    const messageId = options.messageId || uuidv4();
    
    try {
      await this.channelManager.withChannel(async (channel) => {
        // Проверяем, что канал в confirm mode
        if (!channel.waitForConfirms) {
          throw new AppError('Channel is not in confirm mode');
        }

        // Отправляем сообщение
        if (destination.queue) {
          await this._assertQueue(channel, destination.queue, options.queueOptions);
          await channel.sendToQueue(
            destination.queue,
            Buffer.from(JSON.stringify(message)),
            { ...this.defaultOptions, ...options, messageId }
          );
        } else if (destination.exchange) {
          await this._assertExchange(channel, destination.exchange, options.exchangeOptions);
          await channel.publish(
            destination.exchange,
            destination.routingKey || '',
            Buffer.from(JSON.stringify(message)),
            { ...this.defaultOptions, ...options, messageId }
          );
        }

        // Ждем подтверждения
        const confirmed = await this._waitForConfirmation(channel);
        
        if (!confirmed) {
          throw new AppError('Message delivery not confirmed');
        }
      });
      
      const duration = Date.now() - startTime;
      
      incrementCounter('confirmed_messages_total');
      observeHistogram('confirmed_message_duration_ms', duration);
      
      logger.debug('Message sent with confirmation', {
        messageId,
        destination,
        duration
      });
      
      return messageId;
    } catch (error) {
      incrementCounter('confirmation_errors_total');
      
      logger.error('Failed to send message with confirmation', {
        destination,
        messageId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Отправка отложенного сообщения
   */
  async sendDelayed(destination, message, delay, options = {}) {
    const messageId = options.messageId || uuidv4();
    
    try {
      // Используем dead letter exchange для реализации задержки
      const delayedQueue = `delayed.${destination.queue || destination.routingKey}.${delay}`;
      const delayedOptions = {
        ...options,
        queueOptions: {
          arguments: {
            'x-message-ttl': delay,
            'x-dead-letter-exchange': destination.exchange || '',
            'x-dead-letter-routing-key': destination.queue || destination.routingKey
          }
        }
      };

      await this.sendToQueue(delayedQueue, message, delayedOptions);
      
      logger.info('Delayed message scheduled', {
        messageId,
        destination,
        delay
      });
      
      incrementCounter('delayed_messages_total', { delay: delay.toString() });
      
      return messageId;
    } catch (error) {
      logger.error('Failed to send delayed message', {
        destination,
        delay,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Отправка приоритетного сообщения
   */
  async sendPriority(destination, message, priority, options = {}) {
    if (priority < 0 || priority > 10) {
      throw new ValidationError('Priority must be between 0 and 10');
    }

    const priorityOptions = {
      ...options,
      priority,
      queueOptions: {
        ...options.queueOptions,
        arguments: {
          ...options.queueOptions?.arguments,
          'x-max-priority': 10
        }
      }
    };

    const messageId = await this._sendToDestination(destination, message, priorityOptions);
    
    incrementCounter('priority_messages_total', { priority: priority.toString() });
    
    return messageId;
  }

  /**
   * RPC-style запрос с ожиданием ответа
   */
  async request(destination, message, options = {}) {
    const correlationId = uuidv4();
    const replyQueue = await this._createReplyQueue();
    const timeout = options.timeout || 30000;
    
    try {
      // Создаем промис для ожидания ответа
      const responsePromise = this._waitForResponse(replyQueue, correlationId, timeout);
      
      // Отправляем запрос
      await this._sendToDestination(destination, message, {
        ...options,
        correlationId,
        replyTo: replyQueue
      });
      
      // Ждем ответ
      const response = await responsePromise;
      
      incrementCounter('rpc_requests_total', { status: 'success' });
      
      return response;
    } catch (error) {
      incrementCounter('rpc_requests_total', { status: 'error' });
      
      logger.error('RPC request failed', {
        destination,
        correlationId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Вспомогательные методы
   */
  
  async _sendWithRetry(operation, operationType, context) {
    let lastError;
    let retries = 0;
    
    while (retries <= this.retryOptions.maxRetries) {
      try {
        return await this.channelManager.withChannel(operation);
      } catch (error) {
        lastError = error;
        
        if (!this._isRetryableError(error) || retries >= this.retryOptions.maxRetries) {
          break;
        }
        
        const delay = this._calculateRetryDelay(retries);
        
        logger.warn('Retrying message send', {
          operationType,
          context,
          attempt: retries + 1,
          delay,
          error: error.message
        });
        
        await this._sleep(delay);
        retries++;
      }
    }
    
    throw lastError;
  }

  _isRetryableError(error) {
    const retryableErrors = [
      'Channel closed',
      'Connection closed',
      'ECONNRESET',
      'ETIMEDOUT'
    ];
    
    return retryableErrors.some(msg => 
      error.message && error.message.includes(msg)
    );
  }

  _calculateRetryDelay(attempt) {
    const { initialDelay, multiplier } = this.retryOptions;
    return initialDelay * Math.pow(multiplier, attempt);
  }

  async _assertQueue(channel, queue, options = {}) {
    const defaultOptions = {
      durable: true,
      ...options
    };
    
    await channel.assertQueue(queue, defaultOptions);
  }

  async _assertExchange(channel, exchange, options = {}) {
    const defaultOptions = {
      durable: true,
      type: 'topic',
      ...options
    };
    
    await channel.assertExchange(exchange, defaultOptions.type, defaultOptions);
  }

  async _waitForConfirmation(channel) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Confirmation timeout'));
      }, this.confirmTimeout);
      
      channel.waitForConfirms((error) => {
        clearTimeout(timeout);
        
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  }

  _groupMessages(messages) {
    const grouped = new Map();
    
    messages.forEach(msg => {
      const key = msg.queue || `${msg.exchange}:${msg.routingKey}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      
      grouped.get(key).push(msg);
    });
    
    return grouped;
  }

  async _sendMessage(channel, message) {
    if (message.queue) {
      await this._assertQueue(channel, message.queue, message.queueOptions);
      const sent = await channel.sendToQueue(
        message.queue,
        Buffer.from(JSON.stringify(message.content)),
        message.options || this.defaultOptions
      );
      
      if (!sent) {
        throw new AppError('Failed to send message - queue full');
      }
      
      return message.messageId || uuidv4();
    } else if (message.exchange) {
      await this._assertExchange(channel, message.exchange, message.exchangeOptions);
      await channel.publish(
        message.exchange,
        message.routingKey || '',
        Buffer.from(JSON.stringify(message.content)),
        message.options || this.defaultOptions
      );
      
      return message.messageId || uuidv4();
    }
    
    throw new AppError('Message must have either queue or exchange specified');
  }

  async _sendToDestination(destination, message, options) {
    if (destination.queue) {
      return this.sendToQueue(destination.queue, message, options);
    } else if (destination.exchange) {
      return this.publish(
        destination.exchange, 
        destination.routingKey || '', 
        message, 
        options
      );
    }
    
    throw new AppError('Destination must have either queue or exchange specified');
  }

  async _createReplyQueue() {
    return this.channelManager.withChannel(async (channel) => {
      const q = await channel.assertQueue('', { exclusive: true });
      return q.queue;
    });
  }

  async _waitForResponse(replyQueue, correlationId, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Response timeout'));
      }, timeout);
      
      this.channelManager.withChannel(async (channel) => {
        await channel.consume(replyQueue, (msg) => {
          if (msg && msg.properties.correlationId === correlationId) {
            clearTimeout(timer);
            channel.ack(msg);
            
            try {
              const response = JSON.parse(msg.content.toString());
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          }
        }, { noAck: false });
      }).catch(reject);
    });
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Создание экземпляров для различных типов сообщений
const defaultProducer = new MessageProducer();

const taskProducer = new MessageProducer({
  defaultExchange: 'tasks',
  defaultOptions: {
    persistent: true,
    priority: 5
  }
});

const eventProducer = new MessageProducer({
  defaultExchange: 'events',
  defaultOptions: {
    persistent: false,
    expiration: '3600000' // 1 час
  }
});

const notificationProducer = new MessageProducer({
  defaultExchange: 'notifications',
  defaultOptions: {
    persistent: true,
    priority: 8
  }
});

module.exports = {
  MessageProducer,
  defaultProducer,
  taskProducer,
  eventProducer,
  notificationProducer
};