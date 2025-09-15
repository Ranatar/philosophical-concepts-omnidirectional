/**
 * Common Validators
 * Общие функции валидации для использования во всех сервисах
 */

const { ValidationError } = require('../errors/ValidationError');

/**
 * Валидаторы для строк
 */
const stringValidators = {
  /**
   * Проверка, что значение является непустой строкой
   */
  isNonEmptyString(value, fieldName = 'value') {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ValidationError(`${fieldName} must be a non-empty string`);
    }
    return true;
  },

  /**
   * Проверка длины строки
   */
  hasLength(value, min, max, fieldName = 'value') {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`);
    }
    
    const length = value.length;
    if (min !== null && length < min) {
      throw new ValidationError(`${fieldName} must be at least ${min} characters long`);
    }
    if (max !== null && length > max) {
      throw new ValidationError(`${fieldName} must not exceed ${max} characters`);
    }
    return true;
  },

  /**
   * Проверка на соответствие регулярному выражению
   */
  matchesPattern(value, pattern, fieldName = 'value', message = null) {
    if (!pattern.test(value)) {
      throw new ValidationError(
        message || `${fieldName} does not match the required pattern`
      );
    }
    return true;
  },

  /**
   * Проверка на допустимые значения
   */
  isOneOf(value, allowedValues, fieldName = 'value') {
    if (!allowedValues.includes(value)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${allowedValues.join(', ')}`
      );
    }
    return true;
  }
};

/**
 * Валидаторы для чисел
 */
const numberValidators = {
  /**
   * Проверка, что значение является числом
   */
  isNumber(value, fieldName = 'value') {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }
    return true;
  },

  /**
   * Проверка, что число находится в диапазоне
   */
  isInRange(value, min, max, fieldName = 'value') {
    this.isNumber(value, fieldName);
    
    if (min !== null && value < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`);
    }
    if (max !== null && value > max) {
      throw new ValidationError(`${fieldName} must not exceed ${max}`);
    }
    return true;
  },

  /**
   * Проверка, что число является целым
   */
  isInteger(value, fieldName = 'value') {
    if (!Number.isInteger(value)) {
      throw new ValidationError(`${fieldName} must be an integer`);
    }
    return true;
  },

  /**
   * Проверка, что число положительное
   */
  isPositive(value, fieldName = 'value') {
    this.isNumber(value, fieldName);
    if (value <= 0) {
      throw new ValidationError(`${fieldName} must be positive`);
    }
    return true;
  },

  /**
   * Проверка, что значение находится между 0 и 1
   */
  isPercentage(value, fieldName = 'value') {
    this.isInRange(value, 0, 1, fieldName);
    return true;
  }
};

/**
 * Валидаторы для дат
 */
const dateValidators = {
  /**
   * Проверка, что значение является валидной датой
   */
  isValidDate(value, fieldName = 'value') {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      throw new ValidationError(`${fieldName} must be a valid date`);
    }
    return true;
  },

  /**
   * Проверка, что дата не в прошлом
   */
  isNotInPast(value, fieldName = 'value') {
    this.isValidDate(value, fieldName);
    const date = value instanceof Date ? value : new Date(value);
    
    if (date < new Date()) {
      throw new ValidationError(`${fieldName} must not be in the past`);
    }
    return true;
  },

  /**
   * Проверка, что дата в диапазоне
   */
  isInDateRange(value, minDate, maxDate, fieldName = 'value') {
    this.isValidDate(value, fieldName);
    const date = value instanceof Date ? value : new Date(value);
    
    if (minDate && date < minDate) {
      throw new ValidationError(
        `${fieldName} must be after ${minDate.toISOString()}`
      );
    }
    if (maxDate && date > maxDate) {
      throw new ValidationError(
        `${fieldName} must be before ${maxDate.toISOString()}`
      );
    }
    return true;
  }
};

/**
 * Валидаторы для массивов
 */
const arrayValidators = {
  /**
   * Проверка, что значение является массивом
   */
  isArray(value, fieldName = 'value') {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`);
    }
    return true;
  },

  /**
   * Проверка длины массива
   */
  hasArrayLength(value, min, max, fieldName = 'value') {
    this.isArray(value, fieldName);
    
    if (min !== null && value.length < min) {
      throw new ValidationError(
        `${fieldName} must contain at least ${min} items`
      );
    }
    if (max !== null && value.length > max) {
      throw new ValidationError(
        `${fieldName} must not contain more than ${max} items`
      );
    }
    return true;
  },

  /**
   * Проверка, что массив не пустой
   */
  isNonEmptyArray(value, fieldName = 'value') {
    this.hasArrayLength(value, 1, null, fieldName);
    return true;
  },

  /**
   * Проверка уникальности элементов массива
   */
  hasUniqueElements(value, fieldName = 'value') {
    this.isArray(value, fieldName);
    
    const uniqueSet = new Set(value);
    if (uniqueSet.size !== value.length) {
      throw new ValidationError(`${fieldName} must contain unique elements`);
    }
    return true;
  }
};

/**
 * Валидаторы для объектов
 */
const objectValidators = {
  /**
   * Проверка, что значение является объектом
   */
  isObject(value, fieldName = 'value') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an object`);
    }
    return true;
  },

  /**
   * Проверка наличия обязательных полей
   */
  hasRequiredFields(value, requiredFields, fieldName = 'object') {
    this.isObject(value, fieldName);
    
    const missingFields = requiredFields.filter(field => !(field in value));
    if (missingFields.length > 0) {
      throw new ValidationError(
        `${fieldName} is missing required fields: ${missingFields.join(', ')}`
      );
    }
    return true;
  },

  /**
   * Проверка, что объект не пустой
   */
  isNonEmptyObject(value, fieldName = 'value') {
    this.isObject(value, fieldName);
    
    if (Object.keys(value).length === 0) {
      throw new ValidationError(`${fieldName} must not be empty`);
    }
    return true;
  }
};

/**
 * Специализированные валидаторы
 */
const specializedValidators = {
  /**
   * Валидация email
   */
  isEmail(value, fieldName = 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid email address`);
    }
    return true;
  },

  /**
   * Валидация UUID
   */
  isUUID(value, fieldName = 'id') {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid UUID`);
    }
    return true;
  },

  /**
   * Валидация URL
   */
  isURL(value, fieldName = 'url') {
    try {
      new URL(value);
      return true;
    } catch {
      throw new ValidationError(`${fieldName} must be a valid URL`);
    }
  },

  /**
   * Валидация имени пользователя
   */
  isUsername(value, fieldName = 'username') {
    stringValidators.hasLength(value, 3, 30, fieldName);
    
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(value)) {
      throw new ValidationError(
        `${fieldName} can only contain letters, numbers, underscores and hyphens`
      );
    }
    return true;
  },

  /**
   * Валидация пароля
   */
  isStrongPassword(value, fieldName = 'password') {
    stringValidators.hasLength(value, 8, 128, fieldName);
    
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new ValidationError(
        `${fieldName} must contain at least one uppercase letter, ` +
        `one lowercase letter, one number, and one special character`
      );
    }
    return true;
  },

  /**
   * Валидация языкового кода
   */
  isLanguageCode(value, fieldName = 'language') {
    const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
    if (!languageRegex.test(value)) {
      throw new ValidationError(
        `${fieldName} must be a valid language code (e.g., 'en' or 'en-US')`
      );
    }
    return true;
  }
};

/**
 * Философские валидаторы
 */
const philosophyValidators = {
  /**
   * Валидация типа категории
   */
  isCategoryType(value, fieldName = 'type') {
    const validTypes = [
      'ontological', 'epistemological', 'axiological', 'ethical',
      'aesthetic', 'metaphysical', 'logical', 'practical',
      'political', 'theological', 'anthropological', 'social',
      'linguistic', 'phenomenological', 'existential', 'analytical',
      'hermeneutical', 'cross_disciplinary'
    ];
    
    stringValidators.isOneOf(value, validTypes, fieldName);
    return true;
  },

  /**
   * Валидация типа связи
   */
  isRelationshipType(value, fieldName = 'type') {
    const validTypes = [
      'hierarchical', 'causal', 'dialectical', 'correlational',
      'disjunctive', 'conjunctive', 'contradiction', 'complementary',
      'emergence', 'necessary_condition', 'sufficient_condition',
      'identity', 'analogy', 'implementation', 'instantiation',
      'generalization', 'part_whole', 'means_end', 'deductive',
      'inductive', 'abductive', 'temporal', 'conceptual',
      'definitional', 'manifestation', 'foundational', 'recognition',
      'reflexion', 'development'
    ];
    
    stringValidators.isOneOf(value, validTypes, fieldName);
    return true;
  },

  /**
   * Валидация типа тезиса
   */
  isThesisType(value, fieldName = 'type') {
    const validTypes = [
      'ontological', 'epistemological', 'axiological', 'ethical',
      'aesthetic', 'metaphysical', 'logical', 'methodological',
      'anthropological', 'social', 'political', 'historical',
      'phenomenological', 'existential', 'analytical', 'critical',
      'synthetic', 'comparative'
    ];
    
    stringValidators.isOneOf(value, validTypes, fieldName);
    return true;
  },

  /**
   * Валидация стиля тезиса
   */
  isThesisStyle(value, fieldName = 'style') {
    const validStyles = [
      'academic', 'popular', 'aphoristic', 'analytical',
      'narrative', 'dialogical', 'poetic'
    ];
    
    stringValidators.isOneOf(value, validStyles, fieldName);
    return true;
  },

  /**
   * Валидация степени инновации
   */
  isInnovationDegree(value, fieldName = 'innovationDegree') {
    numberValidators.isInteger(value, fieldName);
    numberValidators.isInRange(value, 1, 5, fieldName);
    return true;
  }
};

/**
 * Составные валидаторы
 */
const compositeValidators = {
  /**
   * Валидация пагинации
   */
  validatePagination(params) {
    const { page = 1, limit = 20 } = params;
    
    numberValidators.isInteger(page, 'page');
    numberValidators.isPositive(page, 'page');
    
    numberValidators.isInteger(limit, 'limit');
    numberValidators.isInRange(limit, 1, 100, 'limit');
    
    return true;
  },

  /**
   * Валидация параметров сортировки
   */
  validateSorting(sortBy, sortOrder, allowedFields) {
    if (sortBy) {
      stringValidators.isOneOf(sortBy, allowedFields, 'sortBy');
    }
    
    if (sortOrder) {
      stringValidators.isOneOf(sortOrder, ['asc', 'desc'], 'sortOrder');
    }
    
    return true;
  },

  /**
   * Валидация временного диапазона
   */
  validateDateRange(startDate, endDate) {
    if (startDate) {
      dateValidators.isValidDate(startDate, 'startDate');
    }
    
    if (endDate) {
      dateValidators.isValidDate(endDate, 'endDate');
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        throw new ValidationError('startDate must be before endDate');
      }
    }
    
    return true;
  }
};

/**
 * Утилита для создания валидатора схемы
 */
function createSchemaValidator(schema) {
  return function validateSchema(data) {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      try {
        const value = data[field];
        
        // Проверка обязательности поля
        if (rules.required && (value === undefined || value === null)) {
          throw new ValidationError(`${field} is required`);
        }
        
        // Пропускаем дальнейшую валидацию для необязательных пустых полей
        if (!rules.required && (value === undefined || value === null)) {
          continue;
        }
        
        // Применяем валидаторы
        if (rules.validators) {
          for (const validator of rules.validators) {
            validator(value, field);
          }
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.push({
            field,
            message: error.message
          });
        } else {
          throw error;
        }
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
    
    return true;
  };
}

module.exports = {
  stringValidators,
  numberValidators,
  dateValidators,
  arrayValidators,
  objectValidators,
  specializedValidators,
  philosophyValidators,
  compositeValidators,
  createSchemaValidator
};