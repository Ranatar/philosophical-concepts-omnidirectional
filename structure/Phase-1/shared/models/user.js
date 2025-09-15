/**
 * User Model
 * Доменная модель пользователя с бизнес-логикой
 */

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { ValidationError } = require('../lib/errors/ValidationError');

class User {
  constructor(data = {}) {
    this.userId = data.userId || uuidv4();
    this.username = data.username;
    this.email = data.email;
    this.passwordHash = data.passwordHash || data.password_hash;
    this.createdAt = data.createdAt || data.created_at || new Date();
    this.lastLogin = data.lastLogin || data.last_login || null;
    this.userSettings = data.userSettings || data.user_settings || {};
    
    // API Key управление
    this.claudeApiKeyEncrypted = data.claudeApiKeyEncrypted || data.claude_api_key_encrypted || null;
    this.useOwnApiKey = data.useOwnApiKey !== undefined ? data.useOwnApiKey : data.use_own_api_key || false;
    this.apiKeyAddedAt = data.apiKeyAddedAt || data.api_key_added_at || null;
    this.apiKeyLastUsed = data.apiKeyLastUsed || data.api_key_last_used || null;
    
    // Дополнительные поля
    this.role = data.role || 'user';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.emailVerified = data.emailVerified || false;
    this.emailVerificationToken = data.emailVerificationToken || null;
    this.resetPasswordToken = data.resetPasswordToken || null;
    this.resetPasswordExpires = data.resetPasswordExpires || null;
    
    // Статистика
    this.totalConcepts = data.totalConcepts || 0;
    this.totalInteractions = data.totalInteractions || 0;
    this.apiKeyUsageCount = data.apiKeyUsageCount || 0;
  }

  /**
   * Валидация модели
   */
  validate() {
    const errors = [];

    if (!this.username || this.username.length < 3) {
      errors.push({
        field: 'username',
        message: 'Username must be at least 3 characters long'
      });
    }

    if (!this.email || !this._isValidEmail(this.email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email address'
      });
    }

    if (this.username && !/^[a-zA-Z0-9_-]+$/.test(this.username)) {
      errors.push({
        field: 'username',
        message: 'Username can only contain letters, numbers, underscores and hyphens'
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('User validation failed', errors);
    }

    return true;
  }

  /**
   * Установка пароля с хешированием
   */
  async setPassword(plainPassword) {
    if (!plainPassword || plainPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    const saltRounds = 10;
    this.passwordHash = await bcrypt.hash(plainPassword, saltRounds);
    return this;
  }

  /**
   * Проверка пароля
   */
  async verifyPassword(plainPassword) {
    if (!this.passwordHash) {
      return false;
    }

    return bcrypt.compare(plainPassword, this.passwordHash);
  }

  /**
   * Установка API ключа (должен быть предварительно зашифрован)
   */
  setApiKey(encryptedKey) {
    this.claudeApiKeyEncrypted = encryptedKey;
    this.apiKeyAddedAt = new Date();
    this.useOwnApiKey = true;
    return this;
  }

  /**
   * Удаление API ключа
   */
  removeApiKey() {
    this.claudeApiKeyEncrypted = null;
    this.apiKeyAddedAt = null;
    this.apiKeyLastUsed = null;
    this.useOwnApiKey = false;
    this.apiKeyUsageCount = 0;
    return this;
  }

  /**
   * Обновление времени последнего использования API ключа
   */
  updateApiKeyLastUsed() {
    if (this.claudeApiKeyEncrypted) {
      this.apiKeyLastUsed = new Date();
      this.apiKeyUsageCount = (this.apiKeyUsageCount || 0) + 1;
    }
    return this;
  }

  /**
   * Обновление последнего входа
   */
  updateLastLogin() {
    this.lastLogin = new Date();
    return this;
  }

  /**
   * Обновление настроек пользователя
   */
  updateSettings(settings) {
    this.userSettings = {
      ...this.userSettings,
      ...settings
    };
    return this;
  }

  /**
   * Получение конкретной настройки
   */
  getSetting(key, defaultValue = null) {
    return this.userSettings[key] !== undefined 
      ? this.userSettings[key] 
      : defaultValue;
  }

  /**
   * Установка конкретной настройки
   */
  setSetting(key, value) {
    this.userSettings[key] = value;
    return this;
  }

  /**
   * Генерация токена подтверждения email
   */
  generateEmailVerificationToken() {
    this.emailVerificationToken = uuidv4();
    return this.emailVerificationToken;
  }

  /**
   * Подтверждение email
   */
  verifyEmail(token) {
    if (this.emailVerificationToken === token) {
      this.emailVerified = true;
      this.emailVerificationToken = null;
      return true;
    }
    return false;
  }

  /**
   * Генерация токена сброса пароля
   */
  generateResetPasswordToken() {
    this.resetPasswordToken = uuidv4();
    this.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 час
    return this.resetPasswordToken;
  }

  /**
   * Проверка токена сброса пароля
   */
  isResetPasswordTokenValid(token) {
    return this.resetPasswordToken === token && 
           this.resetPasswordExpires && 
           this.resetPasswordExpires > new Date();
  }

  /**
   * Очистка токена сброса пароля
   */
  clearResetPasswordToken() {
    this.resetPasswordToken = null;
    this.resetPasswordExpires = null;
    return this;
  }

  /**
   * Проверка активности пользователя
   */
  isActiveUser() {
    return this.isActive && this.emailVerified;
  }

  /**
   * Проверка прав администратора
   */
  isAdmin() {
    return this.role === 'admin';
  }

  /**
   * Проверка наличия собственного API ключа
   */
  hasOwnApiKey() {
    return this.useOwnApiKey && this.claudeApiKeyEncrypted !== null;
  }

  /**
   * Получение публичной информации (без чувствительных данных)
   */
  toPublicJSON() {
    return {
      userId: this.userId,
      username: this.username,
      createdAt: this.createdAt,
      totalConcepts: this.totalConcepts,
      role: this.role
    };
  }

  /**
   * Получение профиля пользователя (для самого пользователя)
   */
  toProfileJSON() {
    return {
      userId: this.userId,
      username: this.username,
      email: this.email,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin,
      emailVerified: this.emailVerified,
      role: this.role,
      settings: this.userSettings,
      hasApiKey: this.hasOwnApiKey(),
      apiKeyAddedAt: this.apiKeyAddedAt,
      apiKeyLastUsed: this.apiKeyLastUsed,
      apiKeyUsageCount: this.apiKeyUsageCount,
      statistics: {
        totalConcepts: this.totalConcepts,
        totalInteractions: this.totalInteractions
      }
    };
  }

  /**
   * Преобразование в объект для сохранения в БД
   */
  toDatabaseObject() {
    return {
      user_id: this.userId,
      username: this.username,
      email: this.email,
      password_hash: this.passwordHash,
      created_at: this.createdAt,
      last_login: this.lastLogin,
      user_settings: JSON.stringify(this.userSettings),
      claude_api_key_encrypted: this.claudeApiKeyEncrypted,
      use_own_api_key: this.useOwnApiKey,
      api_key_added_at: this.apiKeyAddedAt,
      api_key_last_used: this.apiKeyLastUsed,
      role: this.role,
      is_active: this.isActive,
      email_verified: this.emailVerified,
      email_verification_token: this.emailVerificationToken,
      reset_password_token: this.resetPasswordToken,
      reset_password_expires: this.resetPasswordExpires
    };
  }

  /**
   * Создание модели из объекта БД
   */
  static fromDatabaseObject(dbObject) {
    return new User({
      userId: dbObject.user_id,
      username: dbObject.username,
      email: dbObject.email,
      passwordHash: dbObject.password_hash,
      createdAt: dbObject.created_at,
      lastLogin: dbObject.last_login,
      userSettings: typeof dbObject.user_settings === 'string' 
        ? JSON.parse(dbObject.user_settings) 
        : dbObject.user_settings,
      claudeApiKeyEncrypted: dbObject.claude_api_key_encrypted,
      useOwnApiKey: dbObject.use_own_api_key,
      apiKeyAddedAt: dbObject.api_key_added_at,
      apiKeyLastUsed: dbObject.api_key_last_used,
      role: dbObject.role,
      isActive: dbObject.is_active,
      emailVerified: dbObject.email_verified,
      emailVerificationToken: dbObject.email_verification_token,
      resetPasswordToken: dbObject.reset_password_token,
      resetPasswordExpires: dbObject.reset_password_expires
    });
  }

  /**
   * Проверка валидности email
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Клонирование объекта
   */
  clone() {
    return new User({
      ...this,
      userSettings: { ...this.userSettings }
    });
  }

  /**
   * Сравнение с другим пользователем
   */
  equals(other) {
    if (!(other instanceof User)) {
      return false;
    }
    return this.userId === other.userId;
  }
}

module.exports = User;