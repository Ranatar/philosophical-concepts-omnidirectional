/**
 * Message producers for RabbitMQ
 * Provides standardized message producers for different services
 */

const { v4: uuidv4 } = require('uuid');
const { defaultChannelManager } = require('./rabbitmq/channelManager');
const { defaultLogger } = require('../logging/logger');

/**
 * Base message producer class
 */
class BaseProducer {
  /**
   * Create a new base producer
   * @param {Object} options - Producer options
   * @param {string} options.exchange - Exchange name
   * @param {string} options.exchangeType - Exchange type ('direct', 'topic', 'fanout', etc.)
   * @param {Object} [options.exchangeOptions={}] - Exchange options
   * @param {Object} [options.channelManager=defaultChannelManager] - Channel manager instance
   * @param {Object} [options.logger=defaultLogger] - Logger instance
   */
  constructor(options) {
    this.exchange = options.exchange;
    this.exchangeType = options.exchangeType;
    this.exchangeOptions = options.exchangeOptions || { durable: true };
    this.channelManager = options.channelManager || defaultChannelManager;
    this.logger = options.logger || defaultLogger;
    this.initialized = false;
  }
  
  /**
   * Initialize the producer
   * @returns {Promise<void>} Promise that resolves when initialized
   */
  async initialize() {
    if (this.initialized) {
      return;
    }
    
    try {
      await this.channelManager.assertExchange(
        this.exchange,
        this.exchangeType,
        this.exchangeOptions
      );
      
      this.initialized = true;
      this.logger.info(`Producer for exchange ${this.exchange} initialized`);
    } catch (err) {
      this.logger.error(`Failed to initialize producer for exchange ${this.exchange}: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Send a message to the exchange
   * @param {string} routingKey - Routing key
   * @param {Object} message - Message to send
   * @param {Object} [options={}] - Message options
   * @returns {Promise<boolean>} Promise that resolves to whether the message was sent
   */
  async send(routingKey, message, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Add default message properties
      const enrichedMessage = this.enrichMessage(message);
      
      const defaultOptions = {
        persistent: true,
        contentType: 'application/json',
        messageId: enrichedMessage.messageId,
        timestamp: enrichedMessage.timestamp
      };
      
      const messageOptions = { ...defaultOptions, ...options };
      
      const result = await this.channelManager.publish(
        this.exchange,
        routingKey,
        enrichedMessage,
        messageOptions
      );
      
      if (result) {
        this.logger.debug(
          `Message ${enrichedMessage.messageId} sent to exchange ${this.exchange} with routing key ${routingKey}`
        );
      } else {
        this.logger.warn(
          `Failed to send message ${enrichedMessage.messageId} to exchange ${this.exchange} with routing key ${routingKey}`
        );
      }
      
      return result;
    } catch (err) {
      this.logger.error(`Error sending message to exchange ${this.exchange}: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Enrich a message with standard properties
   * @param {Object} message - Message to enrich
   * @returns {Object} Enriched message
   * @private
   */
  enrichMessage(message) {
    const now = new Date();
    
    return {
      ...message,
      messageId: message.messageId || uuidv4(),
      timestamp: message.timestamp || now.getTime(),
      datetime: message.datetime || now.toISOString()
    };
  }
}

/**
 * Task producer for sending tasks to workers
 */
class TaskProducer extends BaseProducer {
  /**
   * Create a new task producer
   * @param {Object} [options={}] - Task producer options
   * @param {string} [options.exchange='tasks'] - Exchange name
   * @param {Object} [options.channelManager=defaultChannelManager] - Channel manager instance
   * @param {Object} [options.logger=defaultLogger] - Logger instance
   */
  constructor(options = {}) {
    super({
      exchange: options.exchange || 'tasks',
      exchangeType: 'direct',
      exchangeOptions: { durable: true },
      channelManager: options.channelManager,
      logger: options.logger
    });
  }
  
  /**
   * Send a task for processing
   * @param {string} taskType - Task type (used as routing key)
   * @param {Object} taskData - Task data
   * @param {Object} [options={}] - Task options
   * @param {string} [options.priority] - Task priority
   * @param {number} [options.delay] - Delay in milliseconds
   * @returns {Promise<string>} Promise that resolves to task ID
   */
  async sendTask(taskType, taskData, options = {}) {
    const taskId = options.taskId || uuidv4();
    
    const task = {
      taskId,
      taskType,
      data: taskData,
      priority: options.priority || 'normal',
      createdAt: new Date().toISOString()
    };
    
    // Apply delay if specified (using message TTL and dead letter exchange)
    const messageOptions = {};
    
    if (options.delay && options.delay > 0) {
      messageOptions.expiration = options.delay.toString();
      messageOptions.headers = {
        'x-delay': options.delay
      };
    }
    
    if (options.priority) {
      switch (options.priority) {
        case 'high':
          messageOptions.priority = 10;
          break;
        case 'normal':
          messageOptions.priority = 5;
          break;
        case 'low':
          messageOptions.priority = 1;
          break;
        default:
          if (typeof options.priority === 'number') {
            messageOptions.priority = options.priority;
          }
      }
    }
    
    const result = await this.send(taskType, task, messageOptions);
    
    if (result) {
      return taskId;
    } else {
      throw new Error(`Failed to send task ${taskId}`);
    }
  }
}

/**
 * Event producer for publishing events
 */
class EventProducer extends BaseProducer {
  /**
   * Create a new event producer
   * @param {Object} [options={}] - Event producer options
   * @param {string} [options.exchange='events'] - Exchange name
   * @param {Object} [options.channelManager=defaultChannelManager] - Channel manager instance
   * @param {Object} [options.logger=defaultLogger] - Logger instance
   */
  constructor(options = {}) {
    super({
      exchange: options.exchange || 'events',
      exchangeType: 'topic',
      exchangeOptions: { durable: true },
      channelManager: options.channelManager,
      logger: options.logger
    });
  }
  
  /**
   * Publish an event
   * @param {string} eventType - Event type
   * @param {string} subType - Event sub-type
   * @param {Object} eventData - Event data
   * @param {Object} [options={}] - Event options
   * @returns {Promise<string>} Promise that resolves to event ID
   */
  async publishEvent(eventType, subType, eventData, options = {}) {
    const eventId = options.eventId || uuidv4();
    const routingKey = `${eventType}.${subType}`;
    
    const event = {
      eventId,
      eventType,
      subType,
      data: eventData,
      source: options.source || 'unknown',
      createdAt: new Date().toISOString()
    };
    
    const result = await this.send(routingKey, event, options);
    
    if (result) {
      return eventId;
    } else {
      throw new Error(`Failed to publish event ${eventId}`);
    }
  }
  
  /**
   * Publish a domain event
   * @param {string} entity - Entity type
   * @param {string} action - Action type
   * @param {Object} data - Event data
   * @param {Object} [options={}] - Event options
   * @returns {Promise<string>} Promise that resolves to event ID
   */
  async publishDomainEvent(entity, action, data, options = {}) {
    return this.publishEvent('domain', `${entity}.${action}`, data, options);
  }
  
  /**
   * Publish a system event
   * @param {string} component - System component
   * @param {string} action - Action type
   * @param {Object} data - Event data
   * @param {Object} [options={}] - Event options
   * @returns {Promise<string>} Promise that resolves to event ID
   */
  async publishSystemEvent(component, action, data, options = {}) {
    return this.publishEvent('system', `${component}.${action}`, data, options);
  }
}

/**
 * Notification producer for sending notifications
 */
class NotificationProducer extends BaseProducer {
  /**
   * Create a new notification producer
   * @param {Object} [options={}] - Notification producer options
   * @param {string} [options.exchange='notifications'] - Exchange name
   * @param {Object} [options.channelManager=defaultChannelManager] - Channel manager instance
   * @param {Object} [options.logger=defaultLogger] - Logger instance
   */
  constructor(options = {}) {
    super({
      exchange: options.exchange || 'notifications',
      exchangeType: 'topic',
      exchangeOptions: { durable: true },
      channelManager: options.channelManager,
      logger: options.logger
    });
  }
  
  /**
   * Send a notification
   * @param {string} channel - Notification channel (email, sms, push, etc.)
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {string|Array<string>} recipients - Recipient(s)
   * @param {Object} [options={}] - Notification options
   * @returns {Promise<string>} Promise that resolves to notification ID
   */
  async sendNotification(channel, type, data, recipients, options = {}) {
    const notificationId = options.notificationId || uuidv4();
    const routingKey = `${channel}.${type}`;
    
    // Convert single recipient to array
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];
    
    const notification = {
      notificationId,
      channel,
      type,
      data,
      recipients: recipientList,
      priority: options.priority || 'normal',
      createdAt: new Date().toISOString()
    };
    
    // Add optional properties
    if (options.subject) {
      notification.subject = options.subject;
    }
    
    if (options.template) {
      notification.template = options.template;
    }
    
    if (options.sender) {
      notification.sender = options.sender;
    }
    
    if (options.expiresAt) {
      notification.expiresAt = options.expiresAt;
    }
    
    const result = await this.send(routingKey, notification, options);
    
    if (result) {
      return notificationId;
    } else {
      throw new Error(`Failed to send notification ${notificationId}`);
    }
  }
  
  /**
   * Send an email notification
   * @param {Object} emailData - Email data
   * @param {string} emailData.subject - Email subject
   * @param {string} [emailData.body] - Email body
   * @param {string} [emailData.template] - Email template
   * @param {Object} [emailData.templateData] - Template data
   * @param {string|Array<string>} recipients - Recipient(s)
   * @param {Object} [options={}] - Email options
   * @returns {Promise<string>} Promise that resolves to notification ID
   */
  async sendEmail(emailData, recipients, options = {}) {
    return this.sendNotification('email', options.type || 'general', emailData, recipients, {
      ...options,
      subject: emailData.subject
    });
  }
  
  /**
   * Send an in-app notification
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {string|Array<string>} recipients - Recipient(s)
   * @param {Object} [options={}] - Notification options
   * @returns {Promise<string>} Promise that resolves to notification ID
   */
  async sendInApp(type, data, recipients, options = {}) {
    return this.sendNotification('in-app', type, data, recipients, options);
  }
}

// Create default instances of producers
const defaultTaskProducer = new TaskProducer();
const defaultEventProducer = new EventProducer();
const defaultNotificationProducer = new NotificationProducer();

module.exports = {
  BaseProducer,
  TaskProducer,
  EventProducer,
  NotificationProducer,
  defaultTaskProducer,
  defaultEventProducer,
  defaultNotificationProducer
};
