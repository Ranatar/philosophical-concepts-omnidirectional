/**
 * Шаблон клиента сервиса
 * Базовый шаблон для создания клиентов для взаимодействия с другими микросервисами
 * 
 * Использование:
 * 1. Скопировать файл в нужную директорию
 * 2. Заменить {{ServiceName}} на название сервиса (например, GraphService)
 * 3. Заменить {{serviceName}} на название сервиса в camelCase (например, graphService)
 * 4. Заменить {{serviceUrl}} на базовый URL сервиса (например, http://graph-service:3000)
 * 5. Адаптировать методы под API сервиса
 */

const axios = require('axios');
const logger = require('../../../shared/lib/logging/logger');
const { incrementCounter } = require('../../../shared/lib/metrics/counters');
const CircuitBreaker = require('opossum');

class {{ServiceName}}Client {
  constructor(config = {}) {
    this.baseURL = config.baseURL || process.env.{{SERVICE_NAME}}_URL || '{{serviceUrl}}';
    this.timeout = config.timeout || 30000; // 30 секунд
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000; // 1 секунда
    
    // Создаем HTTP клиент
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Настраиваем interceptors
    this.setupInterceptors();
    
    // Настраиваем Circuit Breaker
    this.circuitBreaker = this.setupCircuitBreaker();
  }

  /**
   * Настройка interceptors для HTTP клиента
   */
  setupInterceptors() {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        // Добавляем заголовки аутентификации если есть
        const token = this.getAuthToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Добавляем request ID для трассировки
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        logger.debug('{{ServiceName}} request', {
          method: config.method,
          url: config.url,
          requestId: config.headers['X-Request-ID']
        });
        
        return config;
      },
      (error) => {
        logger.error('{{ServiceName}} request error', { error });
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        logger.debug('{{ServiceName}} response', {
          status: response.status,
          url: response.config.url,
          requestId: response.config.headers['X-Request-ID']
        });
        
        incrementCounter('{{serviceName}}_requests_total', {
          method: response.config.method,
          status: 'success'
        });
        
        return response;
      },
      async (error) => {
        if (error.response) {
          logger.error('{{ServiceName}} response error', {
            status: error.response.status,
            url: error.config.url,
            error: error.response.data
          });
          
          incrementCounter('{{serviceName}}_requests_total', {
            method: error.config.method,
            status: 'error',
            code: error.response.status
          });
        } else if (error.request) {
          logger.error('{{ServiceName}} network error', {
            url: error.config.url,
            error: error.message
          });
          
          incrementCounter('{{serviceName}}_requests_total', {
            method: error.config.method,
            status: 'network_error'
          });
        }
        
        // Retry logic
        if (this.shouldRetry(error) && error.config.__retryCount < this.retries) {
          error.config.__retryCount = (error.config.__retryCount || 0) + 1;
          
          await this.delay(this.retryDelay * error.config.__retryCount);
          
          logger.info('Retrying {{ServiceName}} request', {
            attempt: error.config.__retryCount,
            url: error.config.url
          });
          
          return this.httpClient(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Настройка Circuit Breaker
   */
  setupCircuitBreaker() {
    const options = {
      timeout: this.timeout,
      errorThresholdPercentage: 50,
      resetTimeout: 30000, // 30 секунд
      rollingCountTimeout: 10000, // 10 секунд
      rollingCountBuckets: 10,
      name: '{{serviceName}}CircuitBreaker'
    };
    
    const breaker = new CircuitBreaker(
      (requestFn) => requestFn(),
      options
    );
    
    breaker.on('open', () => {
      logger.warn('{{ServiceName}} circuit breaker opened');
      incrementCounter('{{serviceName}}_circuit_breaker_state', { state: 'open' });
    });
    
    breaker.on('halfOpen', () => {
      logger.info('{{ServiceName}} circuit breaker half-open');
      incrementCounter('{{serviceName}}_circuit_breaker_state', { state: 'half_open' });
    });
    
    breaker.on('close', () => {
      logger.info('{{ServiceName}} circuit breaker closed');
      incrementCounter('{{serviceName}}_circuit_breaker_state', { state: 'closed' });
    });
    
    return breaker;
  }

  /**
   * Выполнение HTTP запроса через Circuit Breaker
   */
  async request(config) {
    return this.circuitBreaker.fire(() => this.httpClient(config));
  }

  // Основные методы API

  /**
   * Получение сущности по ID
   * GET /entities/:id
   */
  async getById(id) {
    try {
      const response = await this.request({
        method: 'GET',
        url: `/entities/${id}`
      });
      
      return response.data.data;
    } catch (error) {
      this.handleError('getById', error);
    }
  }

  /**
   * Получение списка сущностей
   * GET /entities
   */
  async list(params = {}) {
    try {
      const response = await this.request({
        method: 'GET',
        url: '/entities',
        params
      });
      
      return response.data;
    } catch (error) {
      this.handleError('list', error);
    }
  }

  /**
   * Создание сущности
   * POST /entities
   */
  async create(data) {
    try {
      const response = await this.request({
        method: 'POST',
        url: '/entities',
        data
      });
      
      return response.data.data;
    } catch (error) {
      this.handleError('create', error);
    }
  }

  /**
   * Обновление сущности
   * PUT /entities/:id
   */
  async update(id, data) {
    try {
      const response = await this.request({
        method: 'PUT',
        url: `/entities/${id}`,
        data
      });
      
      return response.data.data;
    } catch (error) {
      this.handleError('update', error);
    }
  }

  /**
   * Удаление сущности
   * DELETE /entities/:id
   */
  async delete(id) {
    try {
      const response = await this.request({
        method: 'DELETE',
        url: `/entities/${id}`
      });
      
      return response.data.success;
    } catch (error) {
      this.handleError('delete', error);
    }
  }

  /**
   * Поиск сущностей
   * POST /entities/search
   */
  async search(searchParams) {
    try {
      const response = await this.request({
        method: 'POST',
        url: '/entities/search',
        data: searchParams
      });
      
      return response.data;
    } catch (error) {
      this.handleError('search', error);
    }
  }

  /**
   * Массовая операция
   * POST /entities/bulk
   */
  async bulk(operation, data) {
    try {
      const response = await this.request({
        method: 'POST',
        url: '/entities/bulk',
        data: {
          operation,
          data
        }
      });
      
      return response.data;
    } catch (error) {
      this.handleError('bulk', error);
    }
  }

  // Специализированные методы (примеры)

  /**
   * Выполнение специфичной операции
   * POST /specific-operation
   */
  async performSpecificOperation(params) {
    try {
      const response = await this.request({
        method: 'POST',
        url: '/specific-operation',
        data: params
      });
      
      return response.data.data;
    } catch (error) {
      this.handleError('performSpecificOperation', error);
    }
  }

  /**
   * Получение статистики
   * GET /stats
   */
  async getStatistics(params = {}) {
    try {
      const response = await this.request({
        method: 'GET',
        url: '/stats',
        params
      });
      
      return response.data.data;
    } catch (error) {
      this.handleError('getStatistics', error);
    }
  }

  /**
   * Проверка здоровья сервиса
   * GET /health
   */
  async checkHealth() {
    try {
      const response = await this.request({
        method: 'GET',
        url: '/health',
        timeout: 5000 // Короткий таймаут для health check
      });
      
      return response.data;
    } catch (error) {
      logger.error('{{ServiceName}} health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Методы для работы с потоковыми данными

  /**
   * Получение потока данных
   * GET /stream
   */
  async *getStream(params = {}) {
    try {
      const response = await this.httpClient({
        method: 'GET',
        url: '/stream',
        params,
        responseType: 'stream'
      });
      
      for await (const chunk of response.data) {
        yield JSON.parse(chunk.toString());
      }
    } catch (error) {
      this.handleError('getStream', error);
    }
  }

  // WebSocket методы (если сервис поддерживает)

  /**
   * Подключение к WebSocket
   */
  connectWebSocket(path = '/ws') {
    const wsUrl = this.baseURL.replace(/^http/, 'ws') + path;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.on('open', () => {
      logger.info('{{ServiceName}} WebSocket connected');
    });
    
    this.ws.on('error', (error) => {
      logger.error('{{ServiceName}} WebSocket error', { error });
    });
    
    this.ws.on('close', () => {
      logger.info('{{ServiceName}} WebSocket disconnected');
    });
    
    return this.ws;
  }

  // Вспомогательные методы

  /**
   * Получение токена аутентификации
   */
  getAuthToken() {
    // Реализация получения токена
    // Может быть из переменной окружения, конфига или контекста
    return process.env.SERVICE_AUTH_TOKEN || null;
  }

  /**
   * Генерация ID запроса
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Проверка необходимости повторной попытки
   */
  shouldRetry(error) {
    // Повторяем при сетевых ошибках и 5xx статусах
    if (!error.response) {
      return true; // Сетевая ошибка
    }
    
    const status = error.response.status;
    return status >= 500 && status < 600;
  }

  /**
   * Задержка между попытками
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Обработка ошибок
   */
  handleError(method, error) {
    const errorDetails = {
      method,
      message: error.message,
      code: error.code,
      response: error.response?.data
    };
    
    logger.error(`{{ServiceName}} client error in ${method}`, errorDetails);
    
    // Преобразуем ошибку в более понятный формат
    if (error.response) {
      const customError = new Error(
        error.response.data?.message || 
        `{{ServiceName}} error: ${error.response.status}`
      );
      customError.status = error.response.status;
      customError.code = error.response.data?.code || 'SERVICE_ERROR';
      customError.details = error.response.data;
      throw customError;
    } else if (error.request) {
      const networkError = new Error('Network error: {{ServiceName}} is unavailable');
      networkError.code = 'NETWORK_ERROR';
      throw networkError;
    } else {
      throw error;
    }
  }

  /**
   * Установка пользовательских заголовков
   */
  setHeaders(headers) {
    Object.assign(this.httpClient.defaults.headers.common, headers);
  }

  /**
   * Очистка ресурсов
   */
  async close() {
    if (this.ws) {
      this.ws.close();
    }
    
    logger.info('{{ServiceName}} client closed');
  }
}

// Singleton экземпляр для использования по умолчанию
let defaultClient = null;

/**
 * Получение экземпляра клиента по умолчанию
 */
function getDefaultClient() {
  if (!defaultClient) {
    defaultClient = new {{ServiceName}}Client();
  }
  return defaultClient;
}

module.exports = {
  {{ServiceName}}Client,
  getDefaultClient
};