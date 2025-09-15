/**
 * API Key Encryption
 * Утилиты для безопасного шифрования и дешифрования API ключей
 */

const crypto = require('crypto');
const logger = require('../logging/logger');
const { AppError } = require('../errors/AppError');

class ApiKeyEncryption {
  constructor(options = {}) {
    // Получаем ключ шифрования из переменных окружения или опций
    this.encryptionKey = options.encryptionKey || process.env.API_KEY_ENCRYPTION_KEY;
    this.algorithm = options.algorithm || 'aes-256-gcm';
    this.saltLength = options.saltLength || 64; // Длина соли в байтах
    this.tagLength = options.tagLength || 16; // Длина тега аутентификации
    this.ivLength = options.ivLength || 16; // Длина вектора инициализации
    this.keyDerivationIterations = options.keyDerivationIterations || 100000; // Итерации для PBKDF2
    
    if (!this.encryptionKey) {
      throw new Error('API key encryption key is required');
    }

    // Проверяем, что ключ достаточно сложный
    if (this.encryptionKey.length < 32) {
      throw new Error('Encryption key must be at least 32 characters long');
    }
  }

  /**
   * Шифрование API ключа
   */
  async encrypt(apiKey) {
    try {
      if (!apiKey || typeof apiKey !== 'string') {
        throw new AppError('API key must be a non-empty string');
      }

      // Генерируем случайную соль
      const salt = crypto.randomBytes(this.saltLength);
      
      // Выводим ключ шифрования из мастер-ключа и соли
      const derivedKey = await this._deriveKey(this.encryptionKey, salt);
      
      // Генерируем случайный вектор инициализации
      const iv = crypto.randomBytes(this.ivLength);
      
      // Создаем шифр
      const cipher = crypto.createCipheriv(this.algorithm, derivedKey, iv);
      
      // Шифруем данные
      const encrypted = Buffer.concat([
        cipher.update(apiKey, 'utf8'),
        cipher.final()
      ]);
      
      // Получаем тег аутентификации (для GCM)
      const authTag = cipher.getAuthTag();
      
      // Объединяем все компоненты: соль + iv + authTag + зашифрованные данные
      const combined = Buffer.concat([salt, iv, authTag, encrypted]);
      
      // Кодируем в base64 для удобного хранения
      const encryptedString = combined.toString('base64');
      
      logger.debug('API key encrypted successfully');
      
      return encryptedString;
    } catch (error) {
      logger.error('Failed to encrypt API key', { error: error.message });
      throw new AppError('Failed to encrypt API key');
    }
  }

  /**
   * Дешифрование API ключа
   */
  async decrypt(encryptedKey) {
    try {
      if (!encryptedKey || typeof encryptedKey !== 'string') {
        throw new AppError('Encrypted key must be a non-empty string');
      }

      // Декодируем из base64
      const combined = Buffer.from(encryptedKey, 'base64');
      
      // Проверяем минимальную длину
      const minLength = this.saltLength + this.ivLength + this.tagLength + 1;
      if (combined.length < minLength) {
        throw new AppError('Invalid encrypted key format');
      }
      
      // Извлекаем компоненты
      let offset = 0;
      const salt = combined.slice(offset, offset + this.saltLength);
      offset += this.saltLength;
      
      const iv = combined.slice(offset, offset + this.ivLength);
      offset += this.ivLength;
      
      const authTag = combined.slice(offset, offset + this.tagLength);
      offset += this.tagLength;
      
      const encrypted = combined.slice(offset);
      
      // Выводим ключ шифрования из мастер-ключа и соли
      const derivedKey = await this._deriveKey(this.encryptionKey, salt);
      
      // Создаем дешифратор
      const decipher = crypto.createDecipheriv(this.algorithm, derivedKey, iv);
      
      // Устанавливаем тег аутентификации
      decipher.setAuthTag(authTag);
      
      // Дешифруем данные
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      const apiKey = decrypted.toString('utf8');
      
      logger.debug('API key decrypted successfully');
      
      return apiKey;
    } catch (error) {
      logger.error('Failed to decrypt API key', { error: error.message });
      
      // Не раскрываем детали ошибки дешифрования
      throw new AppError('Failed to decrypt API key');
    }
  }

  /**
   * Проверка, зашифрован ли ключ
   */
  isEncrypted(value) {
    if (!value || typeof value !== 'string') {
      return false;
    }

    try {
      // Пытаемся декодировать из base64
      const decoded = Buffer.from(value, 'base64');
      
      // Проверяем минимальную длину
      const minLength = this.saltLength + this.ivLength + this.tagLength + 1;
      return decoded.length >= minLength;
    } catch {
      return false;
    }
  }

  /**
   * Генерация случайного API ключа
   */
  generateApiKey(options = {}) {
    const length = options.length || 32;
    const prefix = options.prefix || 'sk';
    const includeTimestamp = options.includeTimestamp || false;
    
    // Генерируем случайные байты
    const randomBytes = crypto.randomBytes(length);
    
    // Кодируем в base64url (безопасный для URL)
    let key = randomBytes.toString('base64url');
    
    // Добавляем префикс
    if (prefix) {
      key = `${prefix}_${key}`;
    }
    
    // Добавляем временную метку, если требуется
    if (includeTimestamp) {
      const timestamp = Date.now().toString(36);
      key = `${key}_${timestamp}`;
    }
    
    return key;
  }

  /**
   * Хеширование API ключа для сравнения
   */
  async hashApiKey(apiKey) {
    try {
      if (!apiKey || typeof apiKey !== 'string') {
        throw new AppError('API key must be a non-empty string');
      }

      // Используем SHA-256 для хеширования
      const hash = crypto
        .createHash('sha256')
        .update(apiKey)
        .digest('hex');
      
      return hash;
    } catch (error) {
      logger.error('Failed to hash API key', { error: error.message });
      throw new AppError('Failed to hash API key');
    }
  }

  /**
   * Маскирование API ключа для отображения
   */
  maskApiKey(apiKey, options = {}) {
    if (!apiKey || typeof apiKey !== 'string') {
      return '';
    }

    const showStart = options.showStart || 6;
    const showEnd = options.showEnd || 4;
    const minLength = showStart + showEnd + 5;
    
    if (apiKey.length < minLength) {
      return '*'.repeat(apiKey.length);
    }
    
    const start = apiKey.substring(0, showStart);
    const end = apiKey.substring(apiKey.length - showEnd);
    const maskedLength = apiKey.length - showStart - showEnd;
    const masked = '*'.repeat(Math.min(maskedLength, 20));
    
    return `${start}${masked}${end}`;
  }

  /**
   * Валидация формата API ключа
   */
  validateApiKeyFormat(apiKey, options = {}) {
    if (!apiKey || typeof apiKey !== 'string') {
      return {
        valid: false,
        error: 'API key must be a non-empty string'
      };
    }

    const minLength = options.minLength || 20;
    const maxLength = options.maxLength || 200;
    const pattern = options.pattern || /^[a-zA-Z0-9_-]+$/;
    
    if (apiKey.length < minLength) {
      return {
        valid: false,
        error: `API key must be at least ${minLength} characters long`
      };
    }
    
    if (apiKey.length > maxLength) {
      return {
        valid: false,
        error: `API key must not exceed ${maxLength} characters`
      };
    }
    
    if (options.requirePrefix) {
      const prefixes = Array.isArray(options.requirePrefix) 
        ? options.requirePrefix 
        : [options.requirePrefix];
      
      const hasValidPrefix = prefixes.some(prefix => apiKey.startsWith(`${prefix}_`));
      
      if (!hasValidPrefix) {
        return {
          valid: false,
          error: `API key must start with one of: ${prefixes.join(', ')}`
        };
      }
    }
    
    if (!pattern.test(apiKey)) {
      return {
        valid: false,
        error: 'API key contains invalid characters'
      };
    }
    
    return { valid: true };
  }

  /**
   * Ротация ключа шифрования
   */
  async rotateEncryptionKey(oldKey, newKey, encryptedValue) {
    try {
      // Сохраняем текущий ключ
      const currentKey = this.encryptionKey;
      
      // Устанавливаем старый ключ для дешифрования
      this.encryptionKey = oldKey;
      const decrypted = await this.decrypt(encryptedValue);
      
      // Устанавливаем новый ключ для шифрования
      this.encryptionKey = newKey;
      const reencrypted = await this.encrypt(decrypted);
      
      // Восстанавливаем текущий ключ
      this.encryptionKey = currentKey;
      
      logger.info('Encryption key rotated successfully');
      
      return reencrypted;
    } catch (error) {
      logger.error('Failed to rotate encryption key', { error: error.message });
      throw new AppError('Failed to rotate encryption key');
    }
  }

  /**
   * Вспомогательные методы
   */
  
  async _deriveKey(password, salt) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        this.keyDerivationIterations,
        32, // Длина ключа для AES-256
        'sha256',
        (err, derivedKey) => {
          if (err) {
            reject(err);
          } else {
            resolve(derivedKey);
          }
        }
      );
    });
  }

  /**
   * Создание middleware для защиты API ключей в логах
   */
  createSanitizationMiddleware() {
    return (req, res, next) => {
      // Сохраняем оригинальный метод
      const originalSend = res.json;
      
      // Переопределяем метод json для санитизации ответов
      res.json = (data) => {
        const sanitized = this._sanitizeObject(data);
        return originalSend.call(res, sanitized);
      };
      
      // Санитизируем тело запроса для логирования
      if (req.body) {
        req.sanitizedBody = this._sanitizeObject(req.body);
      }
      
      next();
    };
  }

  _sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sensitiveFields = [
      'apiKey', 'api_key', 'apikey',
      'claudeApiKey', 'claude_api_key',
      'token', 'secret', 'password'
    ];

    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

    if (Array.isArray(sanitized)) {
      return sanitized.map(item => this._sanitizeObject(item));
    }

    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        if (typeof sanitized[key] === 'string' && sanitized[key].length > 0) {
          sanitized[key] = this.maskApiKey(sanitized[key]);
        }
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this._sanitizeObject(sanitized[key]);
      }
    });

    return sanitized;
  }
}

// Создание singleton экземпляра
const apiKeyEncryption = new ApiKeyEncryption();

module.exports = apiKeyEncryption;

// Экспорт класса для создания дополнительных экземпляров
module.exports.ApiKeyEncryption = ApiKeyEncryption;