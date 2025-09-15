/**
 * Response Formatter
 * Утилиты для стандартизированного форматирования HTTP-ответов
 */

const { STATUSES } = require('../../constants/statuses');
const logger = require('../logging/logger');

class ResponseFormatter {
  /**
   * Форматирование успешного ответа
   */
  static success(data = null, options = {}) {
    const response = {
      success: true,
      status: options.status || STATUSES.SUCCESS,
      message: options.message || 'Operation completed successfully'
    };

    if (data !== null && data !== undefined) {
      response.data = data;
    }

    // Добавление метаданных, если есть
    if (options.meta) {
      response.meta = options.meta;
    }

    // Добавление пагинации, если есть
    if (options.pagination) {
      response.pagination = this._formatPagination(options.pagination);
    }

    // Добавление времени выполнения, если есть
    if (options.duration) {
      response.duration = options.duration;
    }

    // Добавление request ID для трассировки
    if (options.requestId) {
      response.requestId = options.requestId;
    }

    return response;
  }

  /**
   * Форматирование ответа с ошибкой
   */
  static error(error, options = {}) {
    const response = {
      success: false,
      status: options.status || STATUSES.ERROR,
      message: error.message || 'An error occurred',
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        type: error.constructor.name || 'Error'
      }
    };

    // Добавление деталей ошибки в режиме разработки
    if (process.env.NODE_ENV !== 'production' && error.stack) {
      response.error.stack = error.stack.split('\n');
    }

    // Добавление дополнительных деталей ошибки
    if (error.details) {
      response.error.details = error.details;
    }

    // Добавление полей валидации для ошибок валидации
    if (error.validationErrors) {
      response.error.validationErrors = error.validationErrors;
    }

    // Добавление request ID для трассировки
    if (options.requestId) {
      response.requestId = options.requestId;
    }

    // Логирование ошибки
    logger.error('Response error', {
      error: response.error,
      requestId: options.requestId
    });

    return response;
  }

  /**
   * Форматирование списка с пагинацией
   */
  static list(items, pagination, options = {}) {
    return this.success(items, {
      ...options,
      pagination,
      meta: {
        ...options.meta,
        count: items.length
      }
    });
  }

  /**
   * Форматирование пустого успешного ответа (204 No Content)
   */
  static noContent(options = {}) {
    return {
      success: true,
      status: options.status || STATUSES.SUCCESS,
      message: options.message || 'No content'
    };
  }

  /**
   * Форматирование ответа создания ресурса (201 Created)
   */
  static created(data, options = {}) {
    return this.success(data, {
      ...options,
      status: STATUSES.CREATED,
      message: options.message || 'Resource created successfully'
    });
  }

  /**
   * Форматирование ответа обновления ресурса
   */
  static updated(data, options = {}) {
    return this.success(data, {
      ...options,
      message: options.message || 'Resource updated successfully'
    });
  }

  /**
   * Форматирование ответа удаления ресурса
   */
  static deleted(options = {}) {
    return this.success(null, {
      ...options,
      message: options.message || 'Resource deleted successfully'
    });
  }

  /**
   * Форматирование ответа валидации
   */
  static validationError(errors, options = {}) {
    const formattedErrors = this._formatValidationErrors(errors);
    
    return {
      success: false,
      status: STATUSES.VALIDATION_ERROR,
      message: options.message || 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        type: 'ValidationError',
        validationErrors: formattedErrors
      },
      requestId: options.requestId
    };
  }

  /**
   * Форматирование ответа для неавторизованного доступа
   */
  static unauthorized(message = 'Unauthorized access', options = {}) {
    return {
      success: false,
      status: STATUSES.UNAUTHORIZED,
      message,
      error: {
        code: 'UNAUTHORIZED',
        type: 'UnauthorizedError'
      },
      requestId: options.requestId
    };
  }

  /**
   * Форматирование ответа для запрещенного доступа
   */
  static forbidden(message = 'Access forbidden', options = {}) {
    return {
      success: false,
      status: STATUSES.FORBIDDEN,
      message,
      error: {
        code: 'FORBIDDEN',
        type: 'ForbiddenError'
      },
      requestId: options.requestId
    };
  }

  /**
   * Форматирование ответа для не найденного ресурса
   */
  static notFound(resource = 'Resource', options = {}) {
    return {
      success: false,
      status: STATUSES.NOT_FOUND,
      message: `${resource} not found`,
      error: {
        code: 'NOT_FOUND',
        type: 'NotFoundError',
        resource
      },
      requestId: options.requestId
    };
  }

  /**
   * Форматирование ответа для конфликта
   */
  static conflict(message = 'Resource conflict', options = {}) {
    return {
      success: false,
      status: STATUSES.CONFLICT,
      message,
      error: {
        code: 'CONFLICT',
        type: 'ConflictError',
        details: options.details
      },
      requestId: options.requestId
    };
  }

  /**
   * Форматирование ответа для слишком большого количества запросов
   */
  static tooManyRequests(options = {}) {
    const response = {
      success: false,
      status: STATUSES.TOO_MANY_REQUESTS,
      message: options.message || 'Too many requests',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        type: 'RateLimitError'
      },
      requestId: options.requestId
    };

    // Добавление информации о лимите
    if (options.retryAfter) {
      response.error.retryAfter = options.retryAfter;
    }

    if (options.limit) {
      response.error.limit = options.limit;
    }

    return response;
  }

  /**
   * Форматирование ответа для внутренней ошибки сервера
   */
  static serverError(error, options = {}) {
    const response = {
      success: false,
      status: STATUSES.INTERNAL_ERROR,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        type: 'ServerError'
      },
      requestId: options.requestId
    };

    // В production скрываем детали ошибки
    if (process.env.NODE_ENV !== 'production') {
      response.error.message = error.message;
      response.error.stack = error.stack?.split('\n');
    }

    // Логирование критической ошибки
    logger.error('Internal server error', {
      error: {
        message: error.message,
        stack: error.stack
      },
      requestId: options.requestId
    });

    return response;
  }

  /**
   * Форматирование ответа для недоступного сервиса
   */
  static serviceUnavailable(service = 'Service', options = {}) {
    return {
      success: false,
      status: STATUSES.SERVICE_UNAVAILABLE,
      message: `${service} is temporarily unavailable`,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        type: 'ServiceUnavailableError',
        service
      },
      requestId: options.requestId
    };
  }

  /**
   * Форматирование асинхронного задания
   */
  static asyncJob(jobId, options = {}) {
    return this.success({
      jobId,
      status: 'pending',
      message: options.message || 'Job has been queued for processing'
    }, {
      ...options,
      status: STATUSES.ACCEPTED
    });
  }

  /**
   * Форматирование результата batch операции
   */
  static batchResult(results, options = {}) {
    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return this.success({
      results,
      summary: {
        total: results.length,
        succeeded,
        failed
      }
    }, {
      ...options,
      message: `Batch operation completed: ${succeeded} succeeded, ${failed} failed`
    });
  }

  /**
   * Форматирование health check ответа
   */
  static healthCheck(checks, options = {}) {
    const allHealthy = Object.values(checks).every(check => check.healthy);
    
    return {
      success: allHealthy,
      status: allHealthy ? STATUSES.SUCCESS : STATUSES.SERVICE_UNAVAILABLE,
      message: allHealthy ? 'All systems operational' : 'Some systems are unhealthy',
      data: {
        healthy: allHealthy,
        checks,
        timestamp: new Date().toISOString()
      },
      requestId: options.requestId
    };
  }

  /**
   * Форматирование частичного успеха
   */
  static partial(data, errors, options = {}) {
    return {
      success: true,
      status: STATUSES.PARTIAL_SUCCESS,
      message: options.message || 'Operation partially completed',
      data,
      errors: errors.map(error => ({
        message: error.message,
        code: error.code,
        details: error.details
      })),
      requestId: options.requestId
    };
  }

  /**
   * Обертка для Express middleware
   */
  static expressWrapper(handler) {
    return async (req, res, next) => {
      try {
        const result = await handler(req, res, next);
        
        // Если обработчик уже отправил ответ, ничего не делаем
        if (res.headersSent) {
          return;
        }

        // Если результат - это форматированный ответ
        if (result && typeof result === 'object' && 'success' in result) {
          const statusCode = this._getHttpStatusCode(result.status);
          return res.status(statusCode).json(result);
        }

        // Иначе форматируем как успешный ответ
        const response = this.success(result, {
          requestId: req.id || req.headers['x-request-id']
        });
        
        return res.status(200).json(response);
      } catch (error) {
        // Передаем ошибку следующему middleware
        next(error);
      }
    };
  }

  /**
   * Обработчик ошибок для Express
   */
  static errorHandler() {
    return (err, req, res, next) => {
      // Если ответ уже отправлен, передаем ошибку дальше
      if (res.headersSent) {
        return next(err);
      }

      const requestId = req.id || req.headers['x-request-id'];
      let response;
      let statusCode;

      // Определяем тип ошибки и форматируем соответственно
      if (err.name === 'ValidationError' || err.isValidation) {
        response = this.validationError(err.errors || err.details, { requestId });
        statusCode = 400;
      } else if (err.name === 'UnauthorizedError' || err.statusCode === 401) {
        response = this.unauthorized(err.message, { requestId });
        statusCode = 401;
      } else if (err.name === 'ForbiddenError' || err.statusCode === 403) {
        response = this.forbidden(err.message, { requestId });
        statusCode = 403;
      } else if (err.name === 'NotFoundError' || err.statusCode === 404) {
        response = this.notFound(err.resource || 'Resource', { requestId });
        statusCode = 404;
      } else if (err.name === 'ConflictError' || err.statusCode === 409) {
        response = this.conflict(err.message, { requestId, details: err.details });
        statusCode = 409;
      } else if (err.statusCode === 429) {
        response = this.tooManyRequests({ 
          requestId,
          retryAfter: err.retryAfter,
          limit: err.limit 
        });
        statusCode = 429;
      } else {
        response = this.serverError(err, { requestId });
        statusCode = err.statusCode || 500;
      }

      res.status(statusCode).json(response);
    };
  }

  /**
   * Вспомогательные методы
   */
  
  static _formatPagination(pagination) {
    return {
      page: pagination.page || 1,
      perPage: pagination.perPage || pagination.limit || 20,
      total: pagination.total || 0,
      totalPages: Math.ceil(
        (pagination.total || 0) / (pagination.perPage || pagination.limit || 20)
      ),
      hasNext: pagination.hasNext !== undefined 
        ? pagination.hasNext 
        : pagination.page < Math.ceil(
            (pagination.total || 0) / (pagination.perPage || pagination.limit || 20)
          ),
      hasPrev: pagination.hasPrev !== undefined
        ? pagination.hasPrev
        : pagination.page > 1
    };
  }

  static _formatValidationErrors(errors) {
    if (Array.isArray(errors)) {
      return errors.map(error => ({
        field: error.field || error.path || 'unknown',
        message: error.message || 'Invalid value',
        value: error.value,
        code: error.code || 'INVALID'
      }));
    }

    // Если errors - это объект (например, от Joi)
    if (typeof errors === 'object') {
      return Object.entries(errors).map(([field, error]) => ({
        field,
        message: error.message || error,
        code: error.code || 'INVALID'
      }));
    }

    return [{
      field: 'unknown',
      message: String(errors),
      code: 'INVALID'
    }];
  }

  static _getHttpStatusCode(status) {
    const statusMap = {
      [STATUSES.SUCCESS]: 200,
      [STATUSES.CREATED]: 201,
      [STATUSES.ACCEPTED]: 202,
      [STATUSES.NO_CONTENT]: 204,
      [STATUSES.PARTIAL_SUCCESS]: 207,
      [STATUSES.BAD_REQUEST]: 400,
      [STATUSES.UNAUTHORIZED]: 401,
      [STATUSES.FORBIDDEN]: 403,
      [STATUSES.NOT_FOUND]: 404,
      [STATUSES.CONFLICT]: 409,
      [STATUSES.VALIDATION_ERROR]: 422,
      [STATUSES.TOO_MANY_REQUESTS]: 429,
      [STATUSES.INTERNAL_ERROR]: 500,
      [STATUSES.SERVICE_UNAVAILABLE]: 503
    };

    return statusMap[status] || 200;
  }
}

module.exports = ResponseFormatter;