/**
 * API Key Validator
 * Утилиты для валидации и проверки API ключей различных сервисов
 */

const axios = require('axios');
const logger = require('../logging/logger');
const { ValidationError } = require('../errors/ValidationError');
const { AppError } = require('../errors/AppError');
const apiKeyEncryption = require('./apiKeyEncryption');

class ApiKeyValidator {
  constructor(options = {}) {
    this.validationTimeout = options.validationTimeout || 10000; // 10 секунд
    this.cacheResults = options.cacheResults !== false; // Кэшировать результаты по умолчанию
    this.cacheTTL = options.cacheTTL || 3600; // 1 час
    this.validationCache = new Map();
    
    // Конфигурация для различных провайдеров
    this.providers = {
      anthropic: {
        name: 'Anthropic Claude',
        validateUrl: 'https://api.anthropic.com/v1/messages',
        headers: (apiKey) => ({
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }),
        testPayload: {
          model: 'claude-3-opus-20240229',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1
        },
        validateResponse: (response) => {
          return response.status === 200 && response.data;
        },
        extractError: (error) => {
          if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            if (status === 401) {
              return 'Invalid API key';
            } else if (status === 403) {
              return 'API key does not have access to this resource';
            } else if (status === 429) {
              return 'Rate limit exceeded';
            } else if (data && data.error) {
              return data.error.message || 'API validation failed';
            }
          }
          return 'Failed to validate API key';
        }
      },
      
      openai: {
        name: 'OpenAI',
        validateUrl: 'https://api.openai.com/v1/models',
        headers: (apiKey) => ({
          'Authorization': `Bearer ${apiKey}`
        }),
        validateResponse: (response) => {
          return response.status === 200 && response.data && response.data.data;
        },
        extractError: (error) => {
          if (error.response) {
            const status = error.response.status;
            
            if (status === 401) {
              return 'Invalid API key';
            } else if (status === 429) {
              return 'Rate limit exceeded or quota exhausted';
            }
          }
          return 'Failed to validate API key';
        }
      }
    };
  }

  /**
   * Валидация API ключа для указанного провайдера
   */
  async validateApiKey(apiKey, provider = 'anthropic') {
    try {
      if (!apiKey) {
        throw new ValidationError('API key is required');
      }

      // Проверяем формат ключа
      const formatValidation = this._validateKeyFormat(apiKey, provider);
      if (!formatValidation.valid) {
        throw new ValidationError(formatValidation.error);
      }

      // Проверяем кэш
      const cacheKey = this._getCacheKey(apiKey, provider);
      if (this.cacheResults) {
        const cached = this._getFromCache(cacheKey);
        if (cached !== null) {
          logger.debug('API key validation result from cache', { provider, valid: cached });
          return cached;
        }
      }

      // Валидируем ключ через API провайдера
      const isValid = await this._validateWithProvider(apiKey, provider);
      
      // Сохраняем в кэш
      if (this.cacheResults) {
        this._saveToCache(cacheKey, isValid);
      }

      logger.info('API key validated', { provider, valid: isValid });
      
      return isValid;
    } catch (error) {
      logger.error('API key validation failed', { 
        provider, 
        error: error.message 
      });
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new AppError(`Failed to validate ${provider} API key: ${error.message}`);
    }
  }

  /**
   * Валидация API ключа через реальный запрос к провайдеру
   */
  async _validateWithProvider(apiKey, provider) {
    const config = this.providers[provider];
    
    if (!config) {
      throw new ValidationError(`Unknown provider: ${provider}`);
    }

    try {
      const requestConfig = {
        timeout: this.validationTimeout,
        headers: config.headers(apiKey)
      };

      if (config.testPayload) {
        // POST запрос с тестовыми данными
        const response = await axios.post(
          config.validateUrl,
          config.testPayload,
          requestConfig
        );
        
        return config.validateResponse(response);
      } else {
        // GET запрос
        const response = await axios.get(
          config.validateUrl,
          requestConfig
        );
        
        return config.validateResponse(response);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Невалидный ключ - это не ошибка, а ожидаемый результат
        return false;
      }
      
      // Извлекаем понятное сообщение об ошибке
      const errorMessage = config.extractError(error);
      
      logger.warn('API key validation request failed', {
        provider,
        status: error.response?.status,
        message: errorMessage
      });
      
      // Для некоторых ошибок (например, rate limit) мы не можем определить валидность
      if (error.response && error.response.status === 429) {
        throw new AppError('Unable to validate API key due to rate limiting');
      }
      
      return false;
    }
  }

  /**
   * Валидация формата ключа для различных провайдеров
   */
  _validateKeyFormat(apiKey, provider) {
    const formats = {
      anthropic: {
        pattern: /^sk-ant-api\d{2}-[\w-]{95,}$/,
        minLength: 108,
        maxLength: 150,
        errorMessage: 'Invalid Anthropic API key format. It should start with "sk-ant-api"'
      },
      openai: {
        pattern: /^sk-[a-zA-Z0-9]{48,}$/,
        minLength: 51,
        maxLength: 100,
        errorMessage: 'Invalid OpenAI API key format. It should start with "sk-"'
      }
    };

    const format = formats[provider];
    
    if (!format) {
      return { valid: true }; // Неизвестный провайдер - пропускаем проверку формата
    }

    if (apiKey.length < format.minLength || apiKey.length > format.maxLength) {
      return {
        valid: false,
        error: `${provider} API key must be between ${format.minLength} and ${format.maxLength} characters`
      };
    }

    if (!format.pattern.test(apiKey)) {
      return {
        valid: false,
        error: format.errorMessage
      };
    }

    return { valid: true };
  }

  /**
   * Проверка, является ли ключ зашифрованным
   */
  isEncryptedKey(value) {
    return apiKeyEncryption.isEncrypted(value);
  }

  /**
   * Валидация зашифрованного ключа
   */
  async validateEncryptedApiKey(encryptedKey, provider = 'anthropic') {
    try {
      // Расшифровываем ключ
      const apiKey = await apiKeyEncryption.decrypt(encryptedKey);
      
      // Валидируем расшифрованный ключ
      return await this.validateApiKey(apiKey, provider);
    } catch (error) {
      logger.error('Failed to validate encrypted API key', { error: error.message });
      return false;
    }
  }

  /**
   * Получение информации о квотах и лимитах для API ключа
   */
  async getApiKeyInfo(apiKey, provider = 'anthropic') {
    try {
      const info = {
        valid: false,
        provider,
        limits: null,
        usage: null
      };

      // Сначала проверяем валидность
      info.valid = await this.validateApiKey(apiKey, provider);
      
      if (!info.valid) {
        return info;
      }

      // Получаем дополнительную информацию в зависимости от провайдера
      if (provider === 'anthropic') {
        // Anthropic не предоставляет API для получения квот
        info.limits = {
          rateLimit: 'Provider specific',
          note: 'Contact Anthropic for limit information'
        };
      } else if (provider === 'openai') {
        // OpenAI предоставляет информацию через заголовки ответов
        try {
          const response = await axios.get('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            timeout: this.validationTimeout
          });
          
          info.limits = {
            rateLimit: response.headers['x-ratelimit-limit'],
            remaining: response.headers['x-ratelimit-remaining'],
            reset: response.headers['x-ratelimit-reset']
          };
        } catch (error) {
          logger.warn('Failed to get API key limits', { provider });
        }
      }

      return info;
    } catch (error) {
      logger.error('Failed to get API key info', { 
        provider, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Пакетная валидация нескольких ключей
   */
  async validateMultipleKeys(keys) {
    const results = [];
    
    for (const { apiKey, provider = 'anthropic', name } of keys) {
      try {
        const isValid = await this.validateApiKey(apiKey, provider);
        results.push({
          name: name || provider,
          provider,
          valid: isValid,
          error: null
        });
      } catch (error) {
        results.push({
          name: name || provider,
          provider,
          valid: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Очистка кэша валидации
   */
  clearCache() {
    this.validationCache.clear();
    logger.info('API key validation cache cleared');
  }

  /**
   * Получение статистики кэша
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, entry] of this.validationCache.entries()) {
      if (now - entry.timestamp > this.cacheTTL * 1000) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }
    
    return {
      totalEntries: this.validationCache.size,
      validEntries,
      expiredEntries,
      cacheEnabled: this.cacheResults,
      cacheTTL: this.cacheTTL
    };
  }

  /**
   * Создание middleware для валидации API ключей
   */
  createValidationMiddleware(options = {}) {
    return async (req, res, next) => {
      try {
        const provider = options.provider || 'anthropic';
        const getApiKey = options.getApiKey || ((req) => req.body.apiKey);
        const required = options.required !== false;
        
        const apiKey = getApiKey(req);
        
        if (!apiKey && required) {
          throw new ValidationError('API key is required');
        }
        
        if (apiKey) {
          const isValid = await this.validateApiKey(apiKey, provider);
          
          if (!isValid) {
            throw new ValidationError('Invalid API key');
          }
          
          // Добавляем информацию о валидном ключе в запрос
          req.validatedApiKey = {
            provider,
            validated: true,
            timestamp: Date.now()
          };
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Вспомогательные методы для работы с кэшем
   */
  
  _getCacheKey(apiKey, provider) {
    // Используем хэш ключа для безопасности
    const hash = require('crypto')
      .createHash('sha256')
      .update(`${provider}:${apiKey}`)
      .digest('hex');
    
    return hash;
  }

  _getFromCache(key) {
    const entry = this.validationCache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age > this.cacheTTL * 1000) {
      // Запись устарела
      this.validationCache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  _saveToCache(key, value) {
    this.validationCache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    // Периодически очищаем устаревшие записи
    if (this.validationCache.size > 1000) {
      this._cleanupCache();
    }
  }

  _cleanupCache() {
    const now = Date.now();
    const maxAge = this.cacheTTL * 1000;
    
    for (const [key, entry] of this.validationCache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.validationCache.delete(key);
      }
    }
  }
}

// Создание singleton экземпляра
const apiKeyValidator = new ApiKeyValidator();

module.exports = apiKeyValidator;

// Экспорт класса для создания дополнительных экземпляров
module.exports.ApiKeyValidator = ApiKeyValidator;