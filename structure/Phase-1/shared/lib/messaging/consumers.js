/**
 * Message consumers for RabbitMQ
 * Provides standardized message consumers for different services
 */

const { defaultChannelManager } = require('./rabbitmq/channelManager');
const { defaultLogger } = require('../logging/logger');

/**
 * Base message consumer class
 */
class BaseConsumer {
  /**
   * Create a new base consumer
   * @param {Object} options - Consumer options
   * @param {string} options.queue - Queue name
   * @param {string} [options.exchange] - Exchange name (if binding is needed)
   * @param {string} [options.routingKey] - Routing key (if binding is needed)
   * @param {Object} [options.queueOptions={}] - Queue options
   * @param {Object} [options.consumeOptions={}] - Consume options
   * @param {Object} [options.channelManager=defaultChannelManager] - Channel manager instance
   * @param {Object} [options.logger=defaultLogger] - Logger instance
   */
  constructor(options) {
    this.queue = options.queue;
    this.exchange = options.exchange;
    this.routingKey = options.routingKey;
    this.queueOptions = options.queueOptions || { durable: true };
    this.consumeOptions = options.consumeOptions || { noAck: false };
    this.channelManager = options.channelManager || defaultChannelManager;
    this.logger = options.logger || defaultLogger;
    this.initialized = false;
    this.consumerTag = null;
    this.handlers = new Map();
  }
  
  /**
   * Initialize the consumer
   * @returns {Promise<void>} Promise that resolves when initialized
   */
  async initialize() {
    if (this.initialized) {
      return;
    }
    
    try {
      // Assert the queue
      await this.channelManager.assertQueue(this.queue, this.queueOptions);
      
      // If exchange and routing key are provided, bind the queue
      if (this.exchange && this.routingKey) {
        await this.channelManager.bindQueue(this.queue, this.exchange, this.routingKey);
      }
      
      this.initialized = true;
      this.logger.info(`Consumer for queue ${this.queue} initialized`);
    } catch (err) {
      this.logger.error(`Failed to initialize consumer for queue ${this.queue}: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Start consuming messages
   * @returns {Promise<void>} Promise that resolves when consumption starts
   */
  async start() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (this.consumerTag) {
      this.logger.warn(`Consumer for queue ${this.queue} is already running`);
      return;
    }
    
    try {
      const consumerInfo = await this.channelManager.consume(
        this.queue,
        (content, msg, channel) => this.handleMessage(content, msg, channel),
        this.consumeOptions
      );
      
      this.consumerTag = consumerInfo.consumerTag;
      this.logger.info(`Started consuming from queue ${this.queue}, consumer tag: ${this.consumerTag}`);
    } catch (err) {
      this.logger.error(`Failed to start consumer for queue ${this.queue}: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Stop consuming messages
   * @returns {Promise<void>} Promise that resolves when consumption stops
   */
  async stop() {
    if (!this.consumerTag) {
      this.logger.warn(`Consumer for queue ${this.queue} is not running`);
      return;
    }
    
    try {
      await this.channelManager.cancelConsumer(this.consumerTag);
      this.consumerTag = null;
      this.logger.info(`Stopped consuming from queue ${this.queue}`);
    } catch (err) {
      this.logger.error(`Failed to stop consumer for queue ${this.queue}: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Register a message handler
   * @param {string} type - Message type
   * @param {function} handler - Handler function
   * @returns {BaseConsumer} This consumer instance
   */
  registerHandler(type, handler) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for type ${type} must be a function`);
    }
    
    this.handlers.set(type, handler);
    this.logger.debug(`Registered handler for message type ${type}`);
    
    return this;
  }
  
  /**
   * Handle a message
   * @param {Object} content - Message content
   * @param {Object} msg - RabbitMQ message
   * @param {Object} channel - RabbitMQ channel
   * @returns {Promise<void>} Promise that resolves when the message is handled
   * @private
   */
  async handleMessage(content, msg, channel) {
    try {
      // Get the message type
      const messageType = this.getMessageType(content, msg);
      
      // Find the handler for this message type
      const handler = this.handlers.get(messageType) || this.handlers.get('*');
      
      if (!handler) {
        this.logger.warn(`No handler found for message type ${messageType}`);
        
        if (!this.consumeOptions.noAck) {
          // Reject the message if we don't have a handler
          channel.reject(msg, false); // Don't requeue
        }
        
        return;
      }
      
      // Process the message
      this.logger.debug(`Processing message of type ${messageType}`);
      await handler(content, msg, channel);
      
      // Acknowledge the message if auto-ack is not enabled
      if (!this.consumeOptions.noAck) {
        channel.ack(msg);
      }
    } catch (err) {
      this.logger.error(`Error handling message: ${err.message}`);
      
      // Reject the message if auto-ack is not enabled
      if (!this.consumeOptions.noAck) {
        // Determine if we should requeue based on the error
        const shouldRequeue = this.shouldRequeueOnError(err);
        channel.reject(msg, shouldRequeue);
      }
    }
  }
  
  /**
   * Get the message type from a message
   * @param {Object} content - Message content
   * @param {Object} msg - RabbitMQ message
   * @returns {string} Message type
   * @private
   */
  getMessageType(content, msg) {
    // Default implementation - override in subclasses if needed
    return content.type || content.taskType || content.eventType || 'unknown';
  }
  
  /**
   * Determine if a message should be requeued on error
   * @param {Error} error - The error that occurred
   * @returns {boolean} Whether to requeue the message
   * @private
   */
  shouldRequeueOnError(error) {
    // Default implementation - override in subclasses if needed
    
    // Don't requeue if the error indicates the message can't be processed
    if (error.permanent || error.code === 'VALIDATION_ERROR') {
      return false;
    }
    
    // Requeue for other errors (network issues, temporary failures, etc.)
    return true;
  }
}

/**
 * Task consumer for processing tasks
 */
class TaskConsumer extends BaseConsumer {
  /**
   * Create a new task consumer
   * @param {Object} options - Task consumer options
   * @param {string} options.queue - Queue name
   * @param {string} [options.exchange='tasks'] - Exchange name
   * @param {string} [options.routingKey] - Routing key (task type)
   * @param {Object} [options.queueOptions={}] - Queue options
   * @param {Object} [options.consumeOptions={}] - Consume options
   * @param {Object} [options.channelManager=defaultChannelManager] - Channel manager instance
   * @param {Object} [options.logger=defaultLogger] - Logger instance
   */
  constructor(options) {
    super({
      queue: options.queue,
      exchange: options.exchange || 'tasks',
      routingKey: options.routingKey,
      queueOptions: options.queueOptions || { durable: true },
      consumeOptions: options.consumeOptions || { 
        noAck: false,
        prefetch: options.prefetch || 10
      },
      channelManager: options.channelManager,
      logger: options.logger
    });
  }
  
  /**
   * Get the task type from a message
   * @param {Object} content - Message content
   * @param {Object} msg - RabbitMQ message
   * @returns {string} Task type
   * @private
   */
  getMessageType(content, msg) {
    return content.taskType || 'unknown';
  }
  
  /**
   * Register a task handler
   * @param {string} taskType - Task type
   * @param {function} handler - Handler function
   * @returns {TaskConsumer} This consumer instance
   */
  registerTaskHandler(taskType, handler) {
    return this.registerHandler(taskType, handler);
  }
  
  /**
   * Handle dead letter tasks
   * @param {function} handler - Handler function for dead letter tasks
   * @returns {TaskConsumer} This consumer instance
   */
  handleDeadLetters(handler) {
    return this.registerHandler('dead-letter', handler);
  }
}

/**
 * Event consumer for processing events
 */
class EventConsumer extends BaseConsumer {
  /**
   * Create a new event consumer
   * @param {Object} options - Event consumer options
   * @param {string} options.queue - Queue name
   * @param {string} [options.exchange='events'] - Exchange name
   * @param {string} [options.routingKey] - Routing key pattern
   * @param {Object} [options.queueOptions={}] - Queue options
   * @param {Object} [options.consumeOptions={}] - Consume options
   * @param {Object} [options.channelManager=defaultChannelManager] - Channel manager instance
   * @param {Object} [options.logger=defaultLogger] - Logger instance
   */
  constructor(options) {
    super({
      queue: options.queue,
      exchange: options.exchange || 'events',
      routingKey: options.routingKey || '#',
      queueOptions: options.queueOptions || { durable: true },
      consumeOptions: options.consumeOptions || { 
        noAck: false,
        prefetch: options.prefetch || 10
      },
      channelManager: options.channelManager,
      logger: options.logger
    });
    
    // Create a map for event handlers
    this.eventHandlers = new Map();
  }
  
  /**
   * Get the event type from a message
   * @param {Object} content - Message content
   * @param {Object} msg - RabbitMQ message
   * @returns {string} Event type
   * @private
   */
  getMessageType(content, msg) {
    if (content.eventType && content.subType) {
      return `${content.eventType}.${content.subType}`;
    }
    
    return content.eventType || msg.fields.routingKey || 'unknown';
  }
  
  /**
   * Register an event handler
   * @param {string} eventType - Event type
   * @param {string} [subType] - Event sub-type
   * @param {function} handler - Handler function
   * @returns {EventConsumer} This consumer instance
   */
  registerEventHandler(eventType, subType, handler) {
    // Handle case where subType is omitted
    if (typeof subType === 'function') {
      handler = subType;
      subType = '*';
    }
    
    const fullType = `${eventType}.${subType}`;
    return this.registerHandler(fullType, handler);
  }
  
  /**
   * Register a domain event handler
   * @param {string} entity - Entity type
   * @param {string} action - Action type
   * @param {function} handler - Handler function
   * @returns {EventConsumer} This consumer instance
   */
  registerDomainEventHandler(entity, action, handler) {
    return this.registerEventHandler('domain', `${entity}.${action}`, handler);
  }
  
  /**
   * Register a system event handler
   * @param {string} component - System component
   * @param {string} action - Action type
   * @param {function} handler - Handler function
   * @returns {EventConsumer} This consumer instance
   */
  registerSystemEventHandler(component, action, handler) {
    return this.registerEventHandler('system', `${component}.${action}`, handler);
  }
}

/**
 * Notification consumer for processing notifications
 */
class NotificationConsumer extends BaseConsumer {
  /**
   * Create a new notification consumer
   * @param {Object} options - Notification consumer options
   * @param {string} options.queue - Queue name
   * @param {string} [options.exchange='notifications'] - Exchange name
   * @param {string} [options.routingKey] - Routing key pattern
   * @param {Object} [options.queueOptions={}] - Queue options
   * @param {Object} [options.consumeOptions={}] - Consume options
   * @param {Object} [options.channelManager=defaultChannelManager] - Channel manager instance
   * @param {Object} [options.logger=defaultLogger] - Logger instance
   */
  constructor(options) {
    super({
      queue: options.queue,
      exchange: options.exchange || 'notifications',
      routingKey: options.routingKey || '#',
      queueOptions: options.queueOptions || { durable: true },
      consumeOptions: options.consumeOptions || { 
        noAck: false,
        prefetch: options.prefetch || 10
      },
      channelManager: options.channelManager,
      logger: options.logger
    });
  }
  
  /**
   * Get the notification type from a message
   * @param {Object} content - Message content
   * @param {Object} msg - RabbitMQ message
   * @returns {string} Notification type
   * @private
   */
  getMessageType(content, msg) {
    if (content.channel && content.type) {
      return `${content.channel}.${content.type}`;
    }
    
    return msg.fields.routingKey || 'unknown';
  }
  
  /**
   * Register a notification handler
   * @param {string} channel - Notification channel
   * @param {string} type - Notification type
   * @param {function} handler - Handler function
   * @returns {NotificationConsumer} This consumer instance
   */
  registerNotificationHandler(channel, type, handler) {
    return this.registerHandler(`${channel}.${type}`, handler);
  }
  
  /**
   * Register an email notification handler
   * @param {string} type - Email type
   * @param {function} handler - Handler function
   * @returns {NotificationConsumer} This consumer instance
   */
  registerEmailHandler(type, handler) {
    return this.registerNotificationHandler('email', type, handler);
  }
  
  /**
   * Register an in-app notification handler
   * @param {string} type - Notification type
   * @param {function} handler - Handler function
   * @returns {NotificationConsumer} This consumer instance
   */
  registerInAppHandler(type, handler) {
    return this.registerNotificationHandler('in-app', type, handler);
  }
}

module.exports = {
  BaseConsumer,
  TaskConsumer,
  EventConsumer,
  NotificationConsumer
};
