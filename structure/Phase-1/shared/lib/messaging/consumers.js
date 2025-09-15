/**
 * Потребители сообщений для RabbitMQ
 * Обработка асинхронных задач из очередей
 */

const channelManager = require('./rabbitmq/channelManager');
const logger = require('../logging/logger');
const { incrementCounter } = require('../metrics/counters');

/**
 * Базовый класс для потребителей сообщений
 */
class BaseConsumer {
  constructor(queueName, options = {}) {
    this.queueName = queueName;
    this.options = {
      prefetch: 1,
      noAck: false,
      ...options
    };
    this.handlers = new Map();
  }

  /**
   * Регистрация обработчика для типа сообщения
   * @param {string} messageType - Тип сообщения
   * @param {Function} handler - Функция-обработчик
   */
  registerHandler(messageType, handler) {
    this.handlers.set(messageType, handler);
  }

  /**
   * Начать потребление сообщений
   */
  async start() {
    try {
      const channel = await channelManager.getChannel();
      
      await channel.assertQueue(this.queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': 3600000, // 1 час
          'x-max-length': 10000
        }
      });

      await channel.prefetch(this.options.prefetch);

      logger.info(`Consumer started for queue: ${this.queueName}`);

      await channel.consume(this.queueName, async (msg) => {
        if (!msg) return;

        const startTime = Date.now();
        incrementCounter('messages_received_total', { queue: this.queueName });

        try {
          const content = JSON.parse(msg.content.toString());
          const messageType = content.type || 'default';
          
          logger.debug(`Received message`, {
            queue: this.queueName,
            messageType,
            messageId: content.id
          });

          const handler = this.handlers.get(messageType) || this.handlers.get('default');
          
          if (!handler) {
            throw new Error(`No handler registered for message type: ${messageType}`);
          }

          await handler(content);
          
          if (!this.options.noAck) {
            await channel.ack(msg);
          }

          incrementCounter('messages_processed_total', { 
            queue: this.queueName, 
            status: 'success' 
          });

          const processingTime = Date.now() - startTime;
          logger.info(`Message processed successfully`, {
            queue: this.queueName,
            messageType,
            processingTime
          });

        } catch (error) {
          logger.error(`Error processing message`, {
            queue: this.queueName,
            error: error.message,
            stack: error.stack
          });

          incrementCounter('messages_processed_total', { 
            queue: this.queueName, 
            status: 'error' 
          });

          // Обработка ошибок с повторными попытками
          const retries = (msg.properties.headers['x-retries'] || 0) + 1;
          
          if (retries < 3) {
            // Повторная отправка с задержкой
            await this.requeueWithDelay(channel, msg, retries);
          } else {
            // Отправка в dead letter queue
            await this.sendToDeadLetter(channel, msg, error);
            
            if (!this.options.noAck) {
              await channel.nack(msg, false, false);
            }
          }
        }
      });

    } catch (error) {
      logger.error(`Failed to start consumer for queue: ${this.queueName}`, error);
      throw error;
    }
  }

  /**
   * Повторная отправка сообщения с задержкой
   */
  async requeueWithDelay(channel, msg, retries) {
    const delayMs = Math.min(1000 * Math.pow(2, retries), 30000); // Экспоненциальная задержка до 30 сек
    
    setTimeout(async () => {
      try {
        const content = JSON.parse(msg.content.toString());
        await channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(content)), {
          persistent: true,
          headers: {
            ...msg.properties.headers,
            'x-retries': retries
          }
        });
        
        if (!this.options.noAck) {
          await channel.ack(msg);
        }
        
        logger.info(`Message requeued with delay`, {
          queue: this.queueName,
          retries,
          delayMs
        });
      } catch (error) {
        logger.error(`Failed to requeue message`, error);
      }
    }, delayMs);
  }

  /**
   * Отправка сообщения в dead letter queue
   */
  async sendToDeadLetter(channel, msg, error) {
    const dlqName = `${this.queueName}.dlq`;
    
    try {
      await channel.assertQueue(dlqName, { durable: true });
      
      const content = JSON.parse(msg.content.toString());
      await channel.sendToQueue(dlqName, Buffer.from(JSON.stringify({
        ...content,
        error: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        },
        originalQueue: this.queueName
      })), {
        persistent: true
      });
      
      logger.warn(`Message sent to dead letter queue`, {
        queue: this.queueName,
        dlq: dlqName
      });
    } catch (dlqError) {
      logger.error(`Failed to send message to dead letter queue`, dlqError);
    }
  }

  /**
   * Остановить потребление сообщений
   */
  async stop() {
    try {
      const channel = await channelManager.getChannel();
      await channel.cancel(this.consumerTag);
      logger.info(`Consumer stopped for queue: ${this.queueName}`);
    } catch (error) {
      logger.error(`Failed to stop consumer for queue: ${this.queueName}`, error);
    }
  }
}

/**
 * Потребитель для задач Claude
 */
class ClaudeTaskConsumer extends BaseConsumer {
  constructor() {
    super('claude.tasks', { prefetch: 2 });
    
    // Регистрируем обработчики для различных типов задач
    this.registerHandler('graph_validation', this.handleGraphValidation.bind(this));
    this.registerHandler('thesis_generation', this.handleThesisGeneration.bind(this));
    this.registerHandler('concept_synthesis', this.handleConceptSynthesis.bind(this));
    this.registerHandler('name_analysis', this.handleNameAnalysis.bind(this));
    this.registerHandler('origin_detection', this.handleOriginDetection.bind(this));
    this.registerHandler('historical_context', this.handleHistoricalContext.bind(this));
    this.registerHandler('practical_application', this.handlePracticalApplication.bind(this));
    this.registerHandler('dialogue_generation', this.handleDialogueGeneration.bind(this));
    this.registerHandler('evolution_analysis', this.handleEvolutionAnalysis.bind(this));
  }

  async handleGraphValidation(message) {
    logger.info('Processing graph validation task', { taskId: message.id });
    // Логика обработки будет реализована в сервисе Claude
    // Здесь только вызов соответствующего сервиса
  }

  async handleThesisGeneration(message) {
    logger.info('Processing thesis generation task', { taskId: message.id });
    // Логика обработки будет реализована в сервисе Claude
  }

  async handleConceptSynthesis(message) {
    logger.info('Processing concept synthesis task', { taskId: message.id });
    // Логика обработки будет реализована в сервисе Claude
  }

  async handleNameAnalysis(message) {
    logger.info('Processing name analysis task', { taskId: message.id });
    // Логика обработки будет реализована в сервисе Claude
  }

  async handleOriginDetection(message) {
    logger.info('Processing origin detection task', { taskId: message.id });
    // Логика обработки будет реализована в сервисе Claude
  }

  async handleHistoricalContext(message) {
    logger.info('Processing historical context task', { taskId: message.id });
    // Логика обработки будет реализована в сервисе Claude
  }

  async handlePracticalApplication(message) {
    logger.info('Processing practical application task', { taskId: message.id });
    // Логика обработки будет реализована в сервисе Claude
  }

  async handleDialogueGeneration(message) {
    logger.info('Processing dialogue generation task', { taskId: message.id });
    // Логика обработки будет реализована в сервисе Claude
  }

  async handleEvolutionAnalysis(message) {
    logger.info('Processing evolution analysis task', { taskId: message.id });
    // Логика обработки будет реализована в сервисе Claude
  }
}

/**
 * Потребитель для событий системы
 */
class EventConsumer extends BaseConsumer {
  constructor() {
    super('system.events', { prefetch: 10 });
    
    this.registerHandler('concept_created', this.handleConceptCreated.bind(this));
    this.registerHandler('graph_updated', this.handleGraphUpdated.bind(this));
    this.registerHandler('thesis_generated', this.handleThesisGenerated.bind(this));
    this.registerHandler('synthesis_completed', this.handleSynthesisCompleted.bind(this));
  }

  async handleConceptCreated(event) {
    logger.info('Processing concept created event', { conceptId: event.conceptId });
    // Логика обработки событий
  }

  async handleGraphUpdated(event) {
    logger.info('Processing graph updated event', { graphId: event.graphId });
    // Логика обработки событий
  }

  async handleThesisGenerated(event) {
    logger.info('Processing thesis generated event', { thesisId: event.thesisId });
    // Логика обработки событий
  }

  async handleSynthesisCompleted(event) {
    logger.info('Processing synthesis completed event', { synthesisId: event.synthesisId });
    // Логика обработки событий
  }
}

/**
 * Потребитель для задач отчетности
 */
class ReportingConsumer extends BaseConsumer {
  constructor() {
    super('reporting.tasks', { prefetch: 5 });
    
    this.registerHandler('usage_report', this.handleUsageReport.bind(this));
    this.registerHandler('activity_report', this.handleActivityReport.bind(this));
    this.registerHandler('analytics_report', this.handleAnalyticsReport.bind(this));
  }

  async handleUsageReport(message) {
    logger.info('Processing usage report task', { reportId: message.id });
    // Логика генерации отчетов
  }

  async handleActivityReport(message) {
    logger.info('Processing activity report task', { reportId: message.id });
    // Логика генерации отчетов
  }

  async handleAnalyticsReport(message) {
    logger.info('Processing analytics report task', { reportId: message.id });
    // Логика генерации отчетов
  }
}

/**
 * Менеджер потребителей
 */
class ConsumerManager {
  constructor() {
    this.consumers = new Map();
  }

  /**
   * Регистрация потребителя
   */
  register(name, consumer) {
    this.consumers.set(name, consumer);
  }

  /**
   * Запуск всех потребителей
   */
  async startAll() {
    const promises = [];
    
    for (const [name, consumer] of this.consumers) {
      logger.info(`Starting consumer: ${name}`);
      promises.push(consumer.start());
    }
    
    await Promise.all(promises);
    logger.info('All consumers started successfully');
  }

  /**
   * Остановка всех потребителей
   */
  async stopAll() {
    const promises = [];
    
    for (const [name, consumer] of this.consumers) {
      logger.info(`Stopping consumer: ${name}`);
      promises.push(consumer.stop());
    }
    
    await Promise.all(promises);
    logger.info('All consumers stopped successfully');
  }

  /**
   * Получение потребителя по имени
   */
  get(name) {
    return this.consumers.get(name);
  }
}

// Создаем и экспортируем экземпляры
const consumerManager = new ConsumerManager();

// Регистрируем потребители
consumerManager.register('claude', new ClaudeTaskConsumer());
consumerManager.register('events', new EventConsumer());
consumerManager.register('reporting', new ReportingConsumer());

module.exports = {
  BaseConsumer,
  ClaudeTaskConsumer,
  EventConsumer,
  ReportingConsumer,
  consumerManager
};