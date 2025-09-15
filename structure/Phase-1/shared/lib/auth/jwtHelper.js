/**
 * JWT Helper
 * Утилиты для работы с JSON Web Tokens
 */

const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const logger = require('../logging/logger');
const { UnauthorizedError } = require('../errors/HttpErrors');

// Промисификация методов JWT
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

class JWTHelper {
  constructor(options = {}) {
    this.secret = options.secret || process.env.JWT_SECRET;
    this.accessTokenExpiry = options.accessTokenExpiry || '15m';
    this.refreshTokenExpiry = options.refreshTokenExpiry || '7d';
    this.issuer = options.issuer || 'philosophy-service';
    this.audience = options.audience || 'philosophy-app';
    
    if (!this.secret) {
      throw new Error('JWT secret is required');
    }
  }

  /**
   * Генерация access token
   */
  async generateAccessToken(payload, options = {}) {
    try {
      const tokenPayload = {
        ...payload,
        type: 'access'
      };

      const tokenOptions = {
        expiresIn: options.expiresIn || this.accessTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        ...options
      };

      const token = await signAsync(tokenPayload, this.secret, tokenOptions);
      
      logger.debug('Access token generated', {
        userId: payload.userId,
        expiresIn: tokenOptions.expiresIn
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate access token', { error: error.message });
      throw error;
    }
  }

  /**
   * Генерация refresh token
   */
  async generateRefreshToken(payload, options = {}) {
    try {
      const tokenPayload = {
        ...payload,
        type: 'refresh'
      };

      const tokenOptions = {
        expiresIn: options.expiresIn || this.refreshTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        ...options
      };

      const token = await signAsync(tokenPayload, this.secret, tokenOptions);
      
      logger.debug('Refresh token generated', {
        userId: payload.userId,
        expiresIn: tokenOptions.expiresIn
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate refresh token', { error: error.message });
      throw error;
    }
  }

  /**
   * Генерация пары токенов
   */
  async generateTokenPair(payload, options = {}) {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.generateAccessToken(payload, options.accessTokenOptions),
        this.generateRefreshToken(payload, options.refreshTokenOptions)
      ]);

      return {
        accessToken,
        refreshToken,
        expiresIn: this._getExpiryInSeconds(this.accessTokenExpiry)
      };
    } catch (error) {
      logger.error('Failed to generate token pair', { error: error.message });
      throw error;
    }
  }

  /**
   * Верификация токена
   */
  async verifyToken(token, options = {}) {
    try {
      const verifyOptions = {
        issuer: this.issuer,
        audience: this.audience,
        ...options
      };

      const decoded = await verifyAsync(token, this.secret, verifyOptions);
      
      logger.debug('Token verified', {
        userId: decoded.userId,
        type: decoded.type
      });

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      } else {
        logger.error('Token verification failed', { error: error.message });
        throw new UnauthorizedError('Token verification failed');
      }
    }
  }

  /**
   * Верификация access token
   */
  async verifyAccessToken(token) {
    const decoded = await this.verifyToken(token);
    
    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    return decoded;
  }

  /**
   * Верификация refresh token
   */
  async verifyRefreshToken(token) {
    const decoded = await this.verifyToken(token);
    
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type');
    }

    return decoded;
  }

  /**
   * Обновление токенов по refresh token
   */
  async refreshTokens(refreshToken) {
    try {
      const decoded = await this.verifyRefreshToken(refreshToken);
      
      // Создаем новый payload без служебных полей JWT
      const newPayload = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role
      };

      // Генерируем новую пару токенов
      const tokens = await this.generateTokenPair(newPayload);
      
      logger.info('Tokens refreshed', { userId: decoded.userId });

      return tokens;
    } catch (error) {
      logger.error('Failed to refresh tokens', { error: error.message });
      throw error;
    }
  }

  /**
   * Декодирование токена без верификации
   */
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Failed to decode token', { error: error.message });
      return null;
    }
  }

  /**
   * Проверка, истек ли токен
   */
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Получение оставшегося времени жизни токена
   */
  getTokenTimeToLive(token) {
    try {
      const decoded = this.decodeToken(token);
      
      if (!decoded || !decoded.exp) {
        return 0;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - currentTime;
      
      return ttl > 0 ? ttl : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Генерация токена для сброса пароля
   */
  async generatePasswordResetToken(userId, email) {
    try {
      const payload = {
        userId,
        email,
        type: 'password_reset'
      };

      const options = {
        expiresIn: '1h'
      };

      const token = await signAsync(payload, this.secret, options);
      
      logger.info('Password reset token generated', { userId });

      return token;
    } catch (error) {
      logger.error('Failed to generate password reset token', { error: error.message });
      throw error;
    }
  }

  /**
   * Верификация токена сброса пароля
   */
  async verifyPasswordResetToken(token) {
    const decoded = await this.verifyToken(token);
    
    if (decoded.type !== 'password_reset') {
      throw new UnauthorizedError('Invalid token type');
    }

    return decoded;
  }

  /**
   * Генерация токена подтверждения email
   */
  async generateEmailVerificationToken(userId, email) {
    try {
      const payload = {
        userId,
        email,
        type: 'email_verification'
      };

      const options = {
        expiresIn: '24h'
      };

      const token = await signAsync(payload, this.secret, options);
      
      logger.info('Email verification token generated', { userId });

      return token;
    } catch (error) {
      logger.error('Failed to generate email verification token', { error: error.message });
      throw error;
    }
  }

  /**
   * Верификация токена подтверждения email
   */
  async verifyEmailVerificationToken(token) {
    const decoded = await this.verifyToken(token);
    
    if (decoded.type !== 'email_verification') {
      throw new UnauthorizedError('Invalid token type');
    }

    return decoded;
  }

  /**
   * Генерация токена для API
   */
  async generateApiToken(userId, name, permissions = []) {
    try {
      const payload = {
        userId,
        name,
        permissions,
        type: 'api'
      };

      const options = {
        expiresIn: '365d' // API токены долгоживущие
      };

      const token = await signAsync(payload, this.secret, options);
      
      logger.info('API token generated', { userId, name });

      return token;
    } catch (error) {
      logger.error('Failed to generate API token', { error: error.message });
      throw error;
    }
  }

  /**
   * Верификация API токена
   */
  async verifyApiToken(token) {
    const decoded = await this.verifyToken(token);
    
    if (decoded.type !== 'api') {
      throw new UnauthorizedError('Invalid token type');
    }

    return decoded;
  }

  /**
   * Извлечение токена из заголовка Authorization
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Создание middleware для Express
   */
  createAuthMiddleware(options = {}) {
    return async (req, res, next) => {
      try {
        const token = this.extractTokenFromHeader(req.headers.authorization);
        
        if (!token) {
          throw new UnauthorizedError('No token provided');
        }

        const decoded = await this.verifyAccessToken(token);
        
        // Добавляем данные пользователя в запрос
        req.user = {
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role
        };

        // Добавляем оставшееся время жизни токена
        req.tokenTTL = this.getTokenTimeToLive(token);

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Создание middleware для опциональной аутентификации
   */
  createOptionalAuthMiddleware() {
    return async (req, res, next) => {
      try {
        const token = this.extractTokenFromHeader(req.headers.authorization);
        
        if (token) {
          const decoded = await this.verifyAccessToken(token);
          
          req.user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role
          };

          req.tokenTTL = this.getTokenTimeToLive(token);
        }

        next();
      } catch (error) {
        // Игнорируем ошибки токена при опциональной аутентификации
        next();
      }
    };
  }

  /**
   * Вспомогательные методы
   */
  
  _getExpiryInSeconds(expiry) {
    const units = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
      w: 604800
    };

    const match = expiry.match(/^(\d+)([smhdw])$/);
    
    if (!match) {
      return 0;
    }

    const value = parseInt(match[1]);
    const unit = match[2];
    
    return value * (units[unit] || 0);
  }
}

// Создание singleton экземпляра
const jwtHelper = new JWTHelper();

module.exports = jwtHelper;

// Экспорт класса для создания дополнительных экземпляров
module.exports.JWTHelper = JWTHelper;