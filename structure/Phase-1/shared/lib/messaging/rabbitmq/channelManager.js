/**
 * RabbitMQ channel manager
 * Provides utilities for working with RabbitMQ channels
 */

const { rabbitMQConnection } = require('./connection');
const { defaultLogger } = require('../../logging/logger');

/**
 * RabbitMQ channel manager class
 */
class ChannelManager {
  /**
   * Create a new channel manager
   * @param {Object} options - Channel manager options
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(options = {}, logger = defaultLogger) {
    this.options = options;
    this.logger = logger;
    this.channels = new Map();
    this.exchangeCache = new Set();
    this.queueCache = new Set();
  }
  
  /**
   * Get or create a channel
   * @param {string} [channelId='default'] - Channel ID
   * @param {Object} [options] - Channel options
   * @param {boolean} [options.prefetch] - Channel prefetch count
   * @returns {Promise<Channel>} RabbitMQ channel
   */
  async getChannel(channelId = 'default', options = {}) {
    // If we already have this channel, return it
    if (this.channels.has(channelId)) {
      return this.channels.get(channelId);
    }
    
    try {
      const connection = await rabbitMQConnection.getConnection();
      const channel = await connection.createChannel();
      
      if (options.prefetch) {
        await channel.prefetch(options.prefetch);
      }
      
      // Set up error and close handlers
      channel.on('error', (err) => {
        this.logger.error(`Channel ${channelId} error: ${err.message}`);
        this.removeChannel(channelId);
      });
      
      channel.on('close', () => {
        this.logger.warn(`Channel ${channelId} closed`);
        this.removeChannel(channelId);
      });
      
      // Store the channel
      this.channels.set(channelId, channel);
      
      return channel;
    } catch (err) {
      this.logger.error(`Failed to create channel ${channelId}: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Remove a channel from the manager
   * @param {string} channelId - Channel ID
   */
  removeChannel(channelId) {
    this.channels.delete(channelId);
  }
  
  /**
   * Close a specific channel
   * @param {string} channelId - Channel ID
   * @returns {Promise<void>} Promise that resolves when the channel is closed
   */
  async closeChannel(channelId) {
    if (this.channels.has(channelId)) {
      const channel = this.channels.get(channelId);
      
      try {
        await channel.close();
        this.logger.info(`Channel ${channelId} closed`);
      } catch (err) {
        this.logger.warn(`Error closing channel ${channelId}: ${err.message}`);
      }
      
      this.removeChannel(channelId);
    }
  }
  
  /**
   * Close all channels
   * @returns {Promise<void>} Promise that resolves when all channels are closed
   */
  async closeAll() {
    const promises = [];
    
    for (const channelId of this.channels.keys()) {
      promises.push(this.closeChannel(channelId));
    }
    
    await Promise.all(promises);
    this.logger.info('All channels closed');
  }
  
  /**
   * Assert an exchange
   * @param {string} exchangeName - Exchange name
   * @param {string} type - Exchange type ('direct', 'topic', 'fanout', etc.)
   * @param {Object} [options] - Exchange options
   * @param {boolean} [options.durable=true] - Whether the exchange is durable
   * @param {string} [channelId='default'] - Channel ID
   * @returns {Promise<void>} Promise that resolves when the exchange is asserted
   */
  async assertExchange(exchangeName, type, options = {}, channelId = 'default') {
    const cacheKey = `${exchangeName}:${type}:${channelId}`;
    
    // If we've already asserted this exchange on this channel, skip
    if (this.exchangeCache.has(cacheKey)) {
      return;
    }
    
    const channel = await this.getChannel(channelId);
    
    const defaultOptions = {
      durable: true,
      autoDelete: false
    };
    
    const exchangeOptions = { ...defaultOptions, ...options };
    
    await channel.assertExchange(exchangeName, type, exchangeOptions);
    this.exchangeCache.add(cacheKey);
    
    this.logger.debug(`Exchange ${exchangeName} (${type}) asserted on channel ${channelId}`);
  }
  
  /**
   * Assert a queue
   * @param {string} queueName - Queue name
   * @param {Object} [options] - Queue options
   * @param {boolean} [options.durable=true] - Whether the queue is durable
   * @param {string} [channelId='default'] - Channel ID
   * @returns {Promise<Object>} Promise that resolves to queue information
   */
  async assertQueue(queueName, options = {}, channelId = 'default') {
    const cacheKey = `${queueName}:${channelId}`;
    
    // If we've already asserted this queue on this channel, skip
    if (this.queueCache.has(cacheKey)) {
      return { queue: queueName };
    }
    
    const channel = await this.getChannel(channelId);
    
    const defaultOptions = {
      durable: true,
      autoDelete: false
    };
    
    const queueOptions = { ...defaultOptions, ...options };
    
    const queueInfo = await channel.assertQueue(queueName, queueOptions);
    this.queueCache.add(cacheKey);
    
    this.logger.debug(`Queue ${queueName} asserted on channel ${channelId}`);
    
    return queueInfo;
  }
  
  /**
   * Bind a queue to an exchange
   * @param {string} queueName - Queue name
   * @param {string} exchangeName - Exchange name
   * @param {string} routingKey - Routing key
   * @param {string} [channelId='default'] - Channel ID
   * @returns {Promise<void>} Promise that resolves when the binding is created
   */
  async bindQueue(queueName, exchangeName, routingKey, channelId = 'default') {
    const channel = await this.getChannel(channelId);
    
    await channel.bindQueue(queueName, exchangeName, routingKey);
    
    this.logger.debug(
      `Queue ${queueName} bound to exchange ${exchangeName} with routing key ${routingKey}`
    );
  }
  
  /**
   * Publish a message to an exchange
   * @param {string} exchangeName - Exchange name
   * @param {string} routingKey - Routing key
   * @param {Buffer|Object|string} content - Message content
   * @param {Object} [options] - Message options
   * @param {string} [channelId='default'] - Channel ID
   * @returns {Promise<boolean>} Promise that resolves to whether the message was sent
   */
  async publish(exchangeName, routingKey, content, options = {}, channelId = 'default') {
    const channel = await this.getChannel(channelId);
    
    // Convert content to buffer if necessary
    const buffer = this.convertToBuffer(content);
    
    const defaultOptions = {
      persistent: true,
      contentType: 'application/json'
    };
    
    const publishOptions = { ...defaultOptions, ...options };
    
    const result = channel.publish(exchangeName, routingKey, buffer, publishOptions);
    
    if (result) {
      this.logger.debug(
        `Message published to exchange ${exchangeName} with routing key ${routingKey}`
      );
    } else {
      this.logger.warn(
        `Failed to publish message to exchange ${exchangeName} with routing key ${routingKey}`
      );
    }
    
    return result;
  }
  
  /**
   * Send a message directly to a queue
   * @param {string} queueName - Queue name
   * @param {Buffer|Object|string} content - Message content
   * @param {Object} [options] - Message options
   * @param {string} [channelId='default'] - Channel ID
   * @returns {Promise<boolean>} Promise that resolves to whether the message was sent
   */
  async sendToQueue(queueName, content, options = {}, channelId = 'default') {
    const channel = await this.getChannel(channelId);
    
    // Convert content to buffer if necessary
    const buffer = this.convertToBuffer(content);
    
    const defaultOptions = {
      persistent: true,
      contentType: 'application/json'
    };
    
    const sendOptions = { ...defaultOptions, ...options };
    
    const result = channel.sendToQueue(queueName, buffer, sendOptions);
    
    if (result) {
      this.logger.debug(`Message sent to queue ${queueName}`);
    } else {
      this.logger.warn(`Failed to send message to queue ${queueName}`);
    }
    
    return result;
  }
  
  /**
   * Consume messages from a queue
   * @param {string} queueName - Queue name
   * @param {function} callback - Message handler function
   * @param {Object} [options] - Consume options
   * @param {boolean} [options.noAck=false] - Whether to auto-acknowledge
   * @param {string} [channelId='consumer'] - Channel ID
   * @returns {Promise<Object>} Promise that resolves to consumer information
   */
  async consume(queueName, callback, options = {}, channelId = 'consumer') {
    const channel = await this.getChannel(channelId, { prefetch: options.prefetch || 10 });
    
    const defaultOptions = {
      noAck: false
    };
    
    const consumeOptions = { ...defaultOptions, ...options };
    
    // Wrap the callback to handle parsing and errors
    const messageHandler = async (msg) => {
      if (!msg) {
        this.logger.warn(`Consumer for queue ${queueName} was cancelled by server`);
        return;
      }
      
      try {
        // Parse content based on content-type
        const content = this.parseContent(msg);
        
        // Call the provided callback
        await callback(content, msg, channel);
      } catch (err) {
        this.logger.error(`Error processing message from queue ${queueName}: ${err.message}`);
        
        // Reject the message if not auto-acknowledged
        if (!consumeOptions.noAck) {
          channel.reject(msg, options.requeue !== false);
        }
      }
    };
    
    const consumerInfo = await channel.consume(queueName, messageHandler, consumeOptions);
    
    this.logger.info(`Started consuming from queue ${queueName}, consumer tag: ${consumerInfo.consumerTag}`);
    
    return consumerInfo;
  }
  
  /**
   * Cancel a consumer
   * @param {string} consumerTag - Consumer tag
   * @param {string} [channelId='consumer'] - Channel ID
   * @returns {Promise<void>} Promise that resolves when the consumer is cancelled
   */
  async cancelConsumer(consumerTag, channelId = 'consumer') {
    const channel = await this.getChannel(channelId);
    
    await channel.cancel(consumerTag);
    
    this.logger.info(`Cancelled consumer with tag: ${consumerTag}`);
  }
  
  /**
   * Convert content to a Buffer
   * @param {Buffer|Object|string} content - Content to convert
   * @returns {Buffer} Content as a Buffer
   * @private
   */
  convertToBuffer(content) {
    if (Buffer.isBuffer(content)) {
      return content;
    }
    
    if (typeof content === 'object') {
      return Buffer.from(JSON.stringify(content));
    }
    
    return Buffer.from(content.toString());
  }
  
  /**
   * Parse content from a message
   * @param {Object} msg - RabbitMQ message
   * @returns {Object|string|Buffer} Parsed content
   * @private
   */
  parseContent(msg) {
    const contentType = msg.properties.contentType;
    
    if (contentType === 'application/json') {
      try {
        return JSON.parse(msg.content.toString());
      } catch (err) {
        this.logger.warn('Failed to parse JSON content, returning raw buffer');
        return msg.content;
      }
    }
    
    return msg.content;
  }
}

// Create and export a default instance
const defaultChannelManager = new ChannelManager();

module.exports = {
  ChannelManager,
  defaultChannelManager
};
