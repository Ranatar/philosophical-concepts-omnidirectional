/**
 * RabbitMQ connection manager
 * Provides a singleton connection to RabbitMQ for the application
 */

const amqp = require('amqplib');
const { defaultLogger } = require('../../logging/logger');

/**
 * RabbitMQ connection manager class
 */
class RabbitMQConnection {
  /**
   * Create a new RabbitMQ connection manager
   * @param {Object} [options={}] - Connection options
   * @param {string} [options.uri] - RabbitMQ URI (defaults to environment variable)
   * @param {Object} [options.socketOptions] - Socket options
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(options = {}, logger = defaultLogger) {
    this.options = {
      uri: options.uri || process.env.RABBITMQ_URI || 'amqp://localhost:5672',
      socketOptions: options.socketOptions || { heartbeat: 60 }
    };
    
    this.logger = logger;
    this.connection = null;
    this.connecting = false;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.reconnectInterval = options.reconnectInterval || 5000;
  }
  
  /**
   * Get the connection to RabbitMQ, creating it if necessary
   * @returns {Promise<amqp.Connection>} RabbitMQ connection
   * @throws {Error} If connection fails
   */
  async getConnection() {
    // Return existing connection if available
    if (this.connection) {
      return this.connection;
    }
    
    // If already connecting, wait for it to complete
    if (this.connecting) {
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.connection) {
            resolve(this.connection);
          } else if (!this.connecting) {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        
        checkConnection();
      });
    }
    
    // Create a new connection
    try {
      this.connecting = true;
      this.logger.info(`Connecting to RabbitMQ: ${this.options.uri}`);
      
      this.connection = await amqp.connect(
        this.options.uri,
        this.options.socketOptions
      );
      
      this.reconnectAttempts = 0;
      this.logger.info('Connected to RabbitMQ');
      
      // Handle connection close events
      this.connection.on('close', (err) => {
        this.logger.warn(`RabbitMQ connection closed: ${err ? err.message : 'No error'}`);
        this.connection = null;
        this.handleConnectionClose();
      });
      
      // Handle connection error events
      this.connection.on('error', (err) => {
        this.logger.error(`RabbitMQ connection error: ${err.message}`);
      });
      
      this.connecting = false;
      return this.connection;
    } catch (err) {
      this.connection = null;
      this.connecting = false;
      this.logger.error(`Failed to connect to RabbitMQ: ${err.message}`);
      
      this.handleConnectionClose();
      throw err;
    }
  }
  
  /**
   * Handle a connection close event by reconnecting
   * @private
   */
  handleConnectionClose() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      this.logger.error(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }
    
    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );
    
    this.logger.info(`Reconnecting to RabbitMQ in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      
      this.getConnection()
        .catch(err => {
          this.logger.error(`Reconnect attempt failed: ${err.message}`);
        });
    }, delay);
  }
  
  /**
   * Close the RabbitMQ connection
   * @returns {Promise<void>} Promise that resolves when the connection is closed
   */
  async close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.connection) {
      this.logger.info('Closing RabbitMQ connection');
      await this.connection.close();
      this.connection = null;
      this.logger.info('RabbitMQ connection closed');
    }
  }
}

// Create and export a singleton instance
const rabbitMQConnection = new RabbitMQConnection();

module.exports = {
  RabbitMQConnection,
  rabbitMQConnection
};
