/**
 * HTTP Client
 * Универсальный HTTP-клиент с поддержкой retry, circuit breaker,
 * логирования и метрик
 */

const axios = require('axios');
const CircuitBreaker = require('opossum');
const logger = require('../logging/logger');
const { incrementCounter, observeHistogram } = require('../metrics/counters');

class HttpClient {
  constructor(options = {}) {
    this.options = {
      timeout: 30000, // 30 секунд по умолчанию
      retries: 3,
      retryDelay: 1000,
      circuitBreakerOptions: {
        timeout: 30000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        ...options.circuitBreakerOptions
      },
      ...options
    };
    
    // Создание базового axios экземпляра
    this.axiosInstance = axios.create({
      timeout: this.options.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.options.headers
      },
      ...this.options.axiosOptions
    });
    
    // Настройка interceptors
    this._setupInterceptors();
    
    // Circuit breaker для каждого базового URL
    this.circuitBreakers = new Map();
  }

  /**
   * Настройка interceptors для логирования и метрик
   */
  _setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        
        logger.debug('HTTP request', {
          method: config.method,
          url: config.url,
          headers: this._sanitizeHeaders(config.headers),
          data: this._sanitizeData(config.data)
        });
        
        return config;
      },
      (error) => {
        logger.error('HTTP request error', { error: error.message });
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        
        logger.debug('HTTP response', {
          method: response.config.method,
          url: response.config.url,
          status: response.status,
          duration
        });
        
        observeHistogram('http_request_duration_ms', duration, {
          method: response.config.method,
          status: response.status,
          host: this._getHost(response.config.url)
        });
        
        incrementCounter('http_requests_total', {
          method: response.config.method,
          status: response.status,
          host: this._getHost(response.config.url)
        });
        
        return response;
      },
      (error) => {
        if (error.response) {
          const duration = Date.now() - error.config.metadata.startTime;
          
          logger.error('HTTP response error', {
            method: error.config.method,
            url: error.config.url,
            status: error.response.status,
            duration,
            data: error.response.data
          });
          
          observeHistogram('http_request_duration_ms', duration, {
            method: error.config.method,
            status: error.response.status,
            host: this._getHost(error.config.url)
          });
          
          incrementCounter('http_requests_total', {
            method: error.config.method,
            status: error.response.status,
            host: this._getHost(error.config.url)
          });
        } else {
          logger.error('HTTP request failed', {
            message: error.message,
            code: error.code
          });
          
          incrementCounter('http_request_errors_total', {
            errorType: error.code || 'unknown'
          });
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET запрос
   */
  async get(url, options = {}) {
    return this._executeWithCircuitBreaker(url, () => 
      this._executeWithRetry(() => 
        this.axiosInstance.get(url, this._prepareOptions(options))
      )
    );
  }

  /**
   * POST запрос
   */
  async post(url, data = {}, options = {}) {
    return this._executeWithCircuitBreaker(url, () => 
      this._executeWithRetry(() => 
        this.axiosInstance.post(url, data, this._prepareOptions(options))
      )
    );
  }

  /**
   * PUT запрос
   */
  async put(url, data = {}, options = {}) {
    return this._executeWithCircuitBreaker(url, () => 
      this._executeWithRetry(() => 
        this.axiosInstance.put(url, data, this._prepareOptions(options))
      )
    );
  }

  /**
   * PATCH запрос
   */
  async patch(url, data = {}, options = {}) {
    return this._executeWithCircuitBreaker(url, () => 
      this._executeWithRetry(() => 
        this.axiosInstance.patch(url, data, this._prepareOptions(options))
      )
    );
  }

  /**
   * DELETE запрос
   */
  async delete(url, options = {}) {
    return this._executeWithCircuitBreaker(url, () => 
      this._executeWithRetry(() => 
        this.axiosInstance.delete(url, this._prepareOptions(options))
      )
    );
  }

  /**
   * HEAD запрос
   */
  async head(url, options = {}) {
    return this._executeWithCircuitBreaker(url, () => 
      this._executeWithRetry(() => 
        this.axiosInstance.head(url, this._prepareOptions(options))
      )
    );
  }

  /**
   * Выполнение запроса с поддержкой Circuit Breaker
   */
  async _executeWithCircuitBreaker(url, requestFunction) {
    const host = this._getHost(url);
    
    // Получаем или создаем circuit breaker для хоста
    if (!this.circuitBreakers.has(host)) {
      const breaker = new CircuitBreaker(requestFunction, {
        ...this.options.circuitBreakerOptions,
        name: `http-client-${host}`
      });
      
      // Обработчики событий circuit breaker
      breaker.on('open', () => {
        logger.warn('Circuit breaker opened', { host });
        incrementCounter('circuit_breaker_state_changes_total', { 
          host, 
          state: 'open' 
        });
      });
      
      breaker.on('halfOpen', () => {
        logger.info('Circuit breaker half-open', { host });
        incrementCounter('circuit_breaker_state_changes_total', { 
          host, 
          state: 'halfOpen' 
        });
      });
      
      breaker.on('close', () => {
        logger.info('Circuit breaker closed', { host });
        incrementCounter('circuit_breaker_state_changes_total', { 
          host, 
          state: 'closed' 
        });
      });
      
      this.circuitBreakers.set(host, breaker);
    }
    
    const breaker = this.circuitBreakers.get(host);
    
    try {
      return await breaker.fire();
    } catch (error) {
      if (error.name === 'OpenCircuitError') {
        logger.error('Circuit breaker is open', { host });
        incrementCounter('circuit_breaker_rejections_total', { host });
      }
      throw error;
    }
  }

  /**
   * Выполнение запроса с retry логикой
   */
  async _executeWithRetry(requestFunction, retries = this.options.retries) {
    let lastError;
    
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await requestFunction();
        
        if (i > 0) {
          logger.info('Request succeeded after retry', { attempt: i });
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        // Не ретраим для определенных статусов
        if (error.response && this._isNonRetryableStatus(error.response.status)) {
          throw error;
        }
        
        if (i < retries) {
          const delay = this._calculateRetryDelay(i);
          
          logger.warn('Request failed, retrying', {
            attempt: i + 1,
            maxRetries: retries,
            delay,
            error: error.message
          });
          
          incrementCounter('http_request_retries_total', {
            attempt: i + 1
          });
          
          await this._sleep(delay);
        }
      }
    }
    
    logger.error('Request failed after all retries', {
      retries,
      error: lastError.message
    });
    
    throw lastError;
  }

  /**
   * Проверка, является ли статус неповторяемым
   */
  _isNonRetryableStatus(status) {
    const nonRetryableStatuses = [400, 401, 403, 404, 409, 422];
    return nonRetryableStatuses.includes(status);
  }

  /**
   * Расчет задержки для retry с экспоненциальным backoff
   */
  _calculateRetryDelay(attempt) {
    const baseDelay = this.options.retryDelay || 1000;
    const maxDelay = this.options.maxRetryDelay || 30000;
    
    // Экспоненциальный backoff с jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay; // до 30% jitter
    
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Подготовка опций запроса
   */
  _prepareOptions(options) {
    const preparedOptions = { ...options };
    
    // Добавление токена аутентификации, если он есть
    if (this.options.getAuthToken && !preparedOptions.skipAuth) {
      const token = this.options.getAuthToken();
      if (token) {
        preparedOptions.headers = {
          ...preparedOptions.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    }
    
    // Добавление request ID для трассировки
    if (this.options.getRequestId) {
      const requestId = this.options.getRequestId();
      if (requestId) {
        preparedOptions.headers = {
          ...preparedOptions.headers,
          'X-Request-ID': requestId
        };
      }
    }
    
    return preparedOptions;
  }

  /**
   * Создание специализированного клиента для сервиса
   */
  createServiceClient(serviceName, baseURL, options = {}) {
    const serviceClient = new HttpClient({
      ...this.options,
      ...options,
      axiosOptions: {
        ...this.options.axiosOptions,
        baseURL,
        ...options.axiosOptions
      }
    });
    
    // Добавление метрик для конкретного сервиса
    serviceClient.axiosInstance.interceptors.request.use(
      (config) => {
        config.headers['X-Service-Name'] = serviceName;
        return config;
      }
    );
    
    return serviceClient;
  }

  /**
   * Массовые запросы с ограничением параллельности
   */
  async batchRequests(requests, options = {}) {
    const concurrency = options.concurrency || 5;
    const results = [];
    const errors = [];
    
    // Разбиваем запросы на батчи
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (request, index) => {
        try {
          const response = await this[request.method](
            request.url,
            request.data,
            request.options
          );
          
          results[i + index] = {
            success: true,
            data: response.data,
            status: response.status
          };
        } catch (error) {
          errors.push({
            request,
            error: error.message,
            status: error.response?.status
          });
          
          results[i + index] = {
            success: false,
            error: error.message,
            status: error.response?.status
          };
        }
      });
      
      await Promise.all(batchPromises);
    }
    
    if (errors.length > 0) {
      logger.warn('Batch requests completed with errors', {
        total: requests.length,
        failed: errors.length
      });
    }
    
    return {
      results,
      errors,
      summary: {
        total: requests.length,
        succeeded: results.filter(r => r.success).length,
        failed: errors.length
      }
    };
  }

  /**
   * Health check для сервиса
   */
  async healthCheck(url, options = {}) {
    const timeout = options.timeout || 5000;
    
    try {
      const response = await this.get(url, {
        timeout,
        skipAuth: true,
        ...options
      });
      
      return {
        healthy: response.status >= 200 && response.status < 300,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        status: error.response?.status || 0
      };
    }
  }

  /**
   * Получение хоста из URL
   */
  _getHost(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.host;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Санитизация заголовков для логирования
   */
  _sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Санитизация данных для логирования
   */
  _sanitizeData(data) {
    if (!data) return data;
    
    const sensitiveFields = ['password', 'apiKey', 'secret', 'token'];
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      });
      
      return sanitized;
    }
    
    return data;
  }

  /**
   * Утилита для ожидания
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Получение статистики circuit breakers
   */
  getCircuitBreakerStats() {
    const stats = {};
    
    this.circuitBreakers.forEach((breaker, host) => {
      stats[host] = {
        state: breaker.opened ? 'open' : 'closed',
        stats: breaker.stats
      };
    });
    
    return stats;
  }
}

// Создание экземпляра по умолчанию
const httpClient = new HttpClient();

module.exports = httpClient;

// Экспорт класса для создания дополнительных экземпляров
module.exports.HttpClient = HttpClient;