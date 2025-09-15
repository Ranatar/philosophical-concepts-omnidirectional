/**
 * Шаблон специализированного контроллера
 * Базовый шаблон для создания контроллеров со специфичной бизнес-логикой
 * 
 * Использование:
 * 1. Скопировать файл в нужную директорию
 * 2. Заменить {{ServiceName}} на название сервиса (например, GraphValidation)
 * 3. Заменить {{serviceName}} на название сервиса в camelCase (например, graphValidation)
 * 4. Адаптировать методы под специфику сервиса
 */

const logger = require('../../../shared/lib/logging/logger');
const { ValidationError, NotFoundError } = require('../../../shared/lib/errors');
const { incrementCounter } = require('../../../shared/lib/metrics/counters');
const { publishMessage } = require('../../../shared/lib/messaging/producers');

class {{ServiceName}}Controller {
  constructor({{serviceName}}Service, relatedServices = {}) {
    this.{{serviceName}}Service = {{serviceName}}Service;
    this.relatedServices = relatedServices;
  }

  /**
   * Основной метод обработки
   * POST /{{endpoint}}/process
   */
  async process(req, res, next) {
    try {
      const { 
        entityId,
        options = {},
        async = false 
      } = req.body;
      const userId = req.user?.id;

      logger.info('Processing {{serviceName}} request', {
        entityId,
        userId,
        options,
        async
      });

      // Валидация входных данных
      this.validateProcessRequest({ entityId, options });

      // Проверка прав доступа
      await this.checkAccess(entityId, userId);

      // Асинхронная обработка
      if (async) {
        const taskId = await this.processAsync(entityId, options, userId);
        
        res.status(202).json({
          success: true,
          taskId,
          message: 'Processing started',
          statusUrl: `/{{endpoint}}/status/${taskId}`
        });
        return;
      }

      // Синхронная обработка
      const result = await this.{{serviceName}}Service.process({
        entityId,
        options,
        userId
      });

      incrementCounter('{{serviceName}}_processed_total', {
        status: 'success'
      });

      res.json({
        success: true,
        data: result,
        message: '{{ServiceName}} completed successfully'
      });
    } catch (error) {
      incrementCounter('{{serviceName}}_processed_total', {
        status: 'error'
      });
      next(error);
    }
  }

  /**
   * Анализ данных
   * POST /{{endpoint}}/analyze
   */
  async analyze(req, res, next) {
    try {
      const { 
        entityId,
        analysisType = 'full',
        parameters = {} 
      } = req.body;
      const userId = req.user?.id;

      logger.info('Analyzing {{serviceName}} data', {
        entityId,
        analysisType,
        userId
      });

      // Получаем данные для анализа
      const entity = await this.getEntityForAnalysis(entityId);
      
      if (!entity) {
        throw new NotFoundError('Entity not found');
      }

      // Выполняем анализ
      const analysis = await this.{{serviceName}}Service.analyze({
        entity,
        analysisType,
        parameters,
        userId
      });

      // Сохраняем результаты анализа
      await this.saveAnalysisResults(entityId, analysis);

      incrementCounter('{{serviceName}}_analyzed_total', {
        type: analysisType
      });

      res.json({
        success: true,
        data: analysis,
        metadata: {
          entityId,
          analysisType,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      incrementCounter('{{serviceName}}_analysis_errors_total');
      next(error);
    }
  }

  /**
   * Валидация данных
   * POST /{{endpoint}}/validate
   */
  async validate(req, res, next) {
    try {
      const { data, validationType = 'standard' } = req.body;

      logger.info('Validating {{serviceName}} data', {
        validationType,
        dataSize: JSON.stringify(data).length
      });

      const validationResult = await this.{{serviceName}}Service.validate({
        data,
        validationType
      });

      const isValid = validationResult.errors.length === 0;

      incrementCounter('{{serviceName}}_validated_total', {
        valid: isValid
      });

      res.json({
        success: true,
        valid: isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        suggestions: validationResult.suggestions
      });
    } catch (error) {
      incrementCounter('{{serviceName}}_validation_errors_total');
      next(error);
    }
  }

  /**
   * Преобразование данных
   * POST /{{endpoint}}/transform
   */
  async transform(req, res, next) {
    try {
      const { 
        sourceData,
        targetFormat,
        transformOptions = {} 
      } = req.body;

      logger.info('Transforming {{serviceName}} data', {
        sourceFormat: this.detectFormat(sourceData),
        targetFormat,
        options: transformOptions
      });

      const transformed = await this.{{serviceName}}Service.transform({
        sourceData,
        targetFormat,
        options: transformOptions
      });

      incrementCounter('{{serviceName}}_transformed_total', {
        format: targetFormat
      });

      res.json({
        success: true,
        data: transformed,
        metadata: {
          sourceFormat: this.detectFormat(sourceData),
          targetFormat,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      incrementCounter('{{serviceName}}_transformation_errors_total');
      next(error);
    }
  }

  /**
   * Сравнение данных
   * POST /{{endpoint}}/compare
   */
  async compare(req, res, next) {
    try {
      const { 
        entities,
        comparisonType = 'full',
        options = {} 
      } = req.body;

      if (!Array.isArray(entities) || entities.length < 2) {
        throw new ValidationError('At least 2 entities required for comparison');
      }

      logger.info('Comparing {{serviceName}} entities', {
        count: entities.length,
        comparisonType
      });

      const comparison = await this.{{serviceName}}Service.compare({
        entities,
        comparisonType,
        options
      });

      incrementCounter('{{serviceName}}_compared_total', {
        count: entities.length
      });

      res.json({
        success: true,
        data: comparison,
        metadata: {
          entityCount: entities.length,
          comparisonType,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      incrementCounter('{{serviceName}}_comparison_errors_total');
      next(error);
    }
  }

  /**
   * Получение статуса асинхронной задачи
   * GET /{{endpoint}}/status/:taskId
   */
  async getTaskStatus(req, res, next) {
    try {
      const { taskId } = req.params;

      logger.info('Getting task status', { taskId });

      const status = await this.{{serviceName}}Service.getTaskStatus(taskId);

      if (!status) {
        throw new NotFoundError('Task not found');
      }

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Отмена асинхронной задачи
   * POST /{{endpoint}}/cancel/:taskId
   */
  async cancelTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const userId = req.user?.id;

      logger.info('Cancelling task', { taskId, userId });

      const task = await this.{{serviceName}}Service.getTaskStatus(taskId);
      
      if (!task) {
        throw new NotFoundError('Task not found');
      }

      if (task.userId !== userId && !req.user?.isAdmin) {
        throw new ValidationError('You do not have permission to cancel this task');
      }

      await this.{{serviceName}}Service.cancelTask(taskId);

      incrementCounter('{{serviceName}}_tasks_cancelled_total');

      res.json({
        success: true,
        message: 'Task cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение статистики
   * GET /{{endpoint}}/stats
   */
  async getStats(req, res, next) {
    try {
      const { 
        period = '7d',
        groupBy = 'day' 
      } = req.query;

      logger.info('Getting {{serviceName}} statistics', {
        period,
        groupBy
      });

      const stats = await this.{{serviceName}}Service.getStatistics({
        period,
        groupBy
      });

      res.json({
        success: true,
        data: stats,
        metadata: {
          period,
          groupBy,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Webhook для внешних интеграций
   * POST /{{endpoint}}/webhook
   */
  async webhook(req, res, next) {
    try {
      const { event, data } = req.body;
      const signature = req.headers['x-webhook-signature'];

      logger.info('Processing webhook', {
        event,
        hasSignature: !!signature
      });

      // Валидация подписи
      if (!this.validateWebhookSignature(req.body, signature)) {
        throw new ValidationError('Invalid webhook signature');
      }

      // Обработка события
      await this.{{serviceName}}Service.processWebhook({
        event,
        data
      });

      incrementCounter('{{serviceName}}_webhooks_processed_total', {
        event
      });

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      incrementCounter('{{serviceName}}_webhook_errors_total');
      next(error);
    }
  }

  // Вспомогательные методы

  /**
   * Валидация запроса на обработку
   */
  validateProcessRequest({ entityId, options }) {
    if (!entityId) {
      throw new ValidationError('Entity ID is required');
    }

    // Дополнительная валидация в зависимости от специфики сервиса
    // ...
  }

  /**
   * Проверка прав доступа
   */
  async checkAccess(entityId, userId) {
    // Реализация проверки прав доступа
    // Может включать проверку владельца, роли пользователя и т.д.
    // ...
  }

  /**
   * Асинхронная обработка
   */
  async processAsync(entityId, options, userId) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await publishMessage('{{serviceName}}.tasks', {
      id: taskId,
      type: 'process',
      entityId,
      options,
      userId,
      timestamp: new Date().toISOString()
    });

    // Сохраняем информацию о задаче
    await this.{{serviceName}}Service.createTask({
      taskId,
      entityId,
      userId,
      status: 'pending'
    });

    return taskId;
  }

  /**
   * Получение сущности для анализа
   */
  async getEntityForAnalysis(entityId) {
    // Реализация получения данных из соответствующего сервиса
    // Может использовать relatedServices
    // ...
  }

  /**
   * Сохранение результатов анализа
   */
  async saveAnalysisResults(entityId, analysis) {
    // Реализация сохранения результатов
    // ...
  }

  /**
   * Определение формата данных
   */
  detectFormat(data) {
    // Реализация определения формата
    if (typeof data === 'string') {
      try {
        JSON.parse(data);
        return 'json';
      } catch {
        return 'text';
      }
    }
    return typeof data;
  }

  /**
   * Валидация подписи webhook
   */
  validateWebhookSignature(payload, signature) {
    // Реализация валидации подписи
    // Обычно используется HMAC с секретным ключом
    return true; // Заглушка
  }
}

module.exports = {{ServiceName}}Controller;