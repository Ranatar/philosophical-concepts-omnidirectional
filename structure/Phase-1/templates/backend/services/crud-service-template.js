/**
 * Шаблон CRUD сервиса
 * Базовый шаблон для создания сервисов с типовыми CRUD операциями
 * 
 * Использование:
 * 1. Скопировать файл в нужную директорию
 * 2. Заменить {{EntityName}} на название сущности (например, User)
 * 3. Заменить {{entityName}} на название сущности в camelCase (например, user)
 * 4. Заменить {{tableName}} на название таблицы в БД (например, users)
 * 5. Адаптировать под специфику сущности
 */

const logger = require('../../../shared/lib/logging/logger');
const { ValidationError, NotFoundError } = require('../../../shared/lib/errors');
const { cacheHelper } = require('../../../shared/lib/db/redis/cacheHelper');
const { publishMessage } = require('../../../shared/lib/messaging/producers');

class {{EntityName}}Service {
  constructor({{entityName}}Repository, validators = {}) {
    this.{{entityName}}Repository = {{entityName}}Repository;
    this.validators = validators;
    this.cachePrefix = '{{entityName}}';
    this.cacheTTL = 3600; // 1 час
  }

  /**
   * Получение списка с пагинацией и фильтрацией
   */
  async list({ page = 1, limit = 20, sort = 'created_at', order = 'DESC', filters = {} }) {
    try {
      // Формируем ключ кэша
      const cacheKey = this.getCacheKey('list', { page, limit, sort, order, filters });
      
      // Пытаемся получить из кэша
      const cached = await cacheHelper.get(cacheKey);
      if (cached) {
        logger.debug('{{EntityName}} list retrieved from cache');
        return cached;
      }

      // Валидация параметров
      this.validatePaginationParams({ page, limit });
      
      // Получаем данные из репозитория
      const result = await this.{{entityName}}Repository.findAll({
        page,
        limit,
        sort,
        order,
        filters
      });

      // Обогащаем данные, если необходимо
      result.items = await this.enrichItems(result.items);

      // Сохраняем в кэш
      await cacheHelper.set(cacheKey, result, this.cacheTTL);

      logger.info('{{EntityName}} list retrieved', {
        count: result.items.length,
        total: result.total
      });

      return result;
    } catch (error) {
      logger.error('Error retrieving {{entityName}} list', error);
      throw error;
    }
  }

  /**
   * Получение по ID
   */
  async getById(id) {
    try {
      // Проверяем кэш
      const cacheKey = this.getCacheKey('item', id);
      const cached = await cacheHelper.get(cacheKey);
      if (cached) {
        logger.debug('{{EntityName}} retrieved from cache', { id });
        return cached;
      }

      // Получаем из БД
      const {{entityName}} = await this.{{entityName}}Repository.findById(id);
      
      if (!{{entityName}}) {
        return null;
      }

      // Обогащаем данные
      const enriched = await this.enrichItem({{entityName}});

      // Сохраняем в кэш
      await cacheHelper.set(cacheKey, enriched, this.cacheTTL);

      logger.info('{{EntityName}} retrieved', { id });
      return enriched;
    } catch (error) {
      logger.error('Error retrieving {{entityName}}', { id, error });
      throw error;
    }
  }

  /**
   * Получение по списку ID
   */
  async getByIds(ids) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return [];
      }

      // Получаем из кэша то, что есть
      const cachedItems = [];
      const missingIds = [];

      for (const id of ids) {
        const cacheKey = this.getCacheKey('item', id);
        const cached = await cacheHelper.get(cacheKey);
        if (cached) {
          cachedItems.push(cached);
        } else {
          missingIds.push(id);
        }
      }

      // Получаем недостающие из БД
      let dbItems = [];
      if (missingIds.length > 0) {
        dbItems = await this.{{entityName}}Repository.findByIds(missingIds);
        
        // Обогащаем и кэшируем
        for (const item of dbItems) {
          const enriched = await this.enrichItem(item);
          const cacheKey = this.getCacheKey('item', item.id);
          await cacheHelper.set(cacheKey, enriched, this.cacheTTL);
        }
      }

      return [...cachedItems, ...dbItems];
    } catch (error) {
      logger.error('Error retrieving {{tableName}} by ids', { ids, error });
      throw error;
    }
  }

  /**
   * Создание
   */
  async create(data) {
    try {
      // Валидация данных
      await this.validateCreateData(data);

      // Подготовка данных
      const preparedData = await this.prepareCreateData(data);

      // Создание в БД
      const created = await this.{{entityName}}Repository.create(preparedData);

      // Обогащение данных
      const enriched = await this.enrichItem(created);

      // Инвалидация кэша списков
      await this.invalidateListCache();

      // Публикация события
      await this.publishEvent('created', enriched);

      logger.info('{{EntityName}} created', { id: created.id });
      return enriched;
    } catch (error) {
      logger.error('Error creating {{entityName}}', { error });
      throw error;
    }
  }

  /**
   * Обновление
   */
  async update(id, data) {
    try {
      // Проверяем существование
      const existing = await this.getById(id);
      if (!existing) {
        throw new NotFoundError('{{EntityName}} not found');
      }

      // Валидация данных
      await this.validateUpdateData(data, existing);

      // Подготовка данных
      const preparedData = await this.prepareUpdateData(data, existing);

      // Обновление в БД
      const updated = await this.{{entityName}}Repository.update(id, preparedData);

      // Обогащение данных
      const enriched = await this.enrichItem(updated);

      // Инвалидация кэша
      await this.invalidateItemCache(id);
      await this.invalidateListCache();

      // Публикация события
      await this.publishEvent('updated', enriched, existing);

      logger.info('{{EntityName}} updated', { id });
      return enriched;
    } catch (error) {
      logger.error('Error updating {{entityName}}', { id, error });
      throw error;
    }
  }

  /**
   * Частичное обновление
   */
  async patch(id, data) {
    try {
      // Проверяем существование
      const existing = await this.getById(id);
      if (!existing) {
        throw new NotFoundError('{{EntityName}} not found');
      }

      // Валидация только переданных полей
      await this.validatePatchData(data, existing);

      // Подготовка данных
      const preparedData = await this.preparePatchData(data, existing);

      // Обновление в БД
      const patched = await this.{{entityName}}Repository.patch(id, preparedData);

      // Обогащение данных
      const enriched = await this.enrichItem(patched);

      // Инвалидация кэша
      await this.invalidateItemCache(id);
      await this.invalidateListCache();

      // Публикация события
      await this.publishEvent('patched', enriched, existing);

      logger.info('{{EntityName}} patched', { id });
      return enriched;
    } catch (error) {
      logger.error('Error patching {{entityName}}', { id, error });
      throw error;
    }
  }

  /**
   * Удаление
   */
  async delete(id) {
    try {
      // Проверяем существование
      const existing = await this.getById(id);
      if (!existing) {
        throw new NotFoundError('{{EntityName}} not found');
      }

      // Проверяем возможность удаления
      await this.checkCanDelete(existing);

      // Удаление из БД
      await this.{{entityName}}Repository.delete(id);

      // Инвалидация кэша
      await this.invalidateItemCache(id);
      await this.invalidateListCache();

      // Публикация события
      await this.publishEvent('deleted', { id }, existing);

      logger.info('{{EntityName}} deleted', { id });
      return true;
    } catch (error) {
      logger.error('Error deleting {{entityName}}', { id, error });
      throw error;
    }
  }

  /**
   * Массовое удаление
   */
  async bulkDelete(ids) {
    try {
      // Получаем существующие элементы
      const items = await this.getByIds(ids);
      
      // Проверяем возможность удаления для каждого
      for (const item of items) {
        await this.checkCanDelete(item);
      }

      // Удаление из БД
      const deletedCount = await this.{{entityName}}Repository.bulkDelete(ids);

      // Инвалидация кэша
      for (const id of ids) {
        await this.invalidateItemCache(id);
      }
      await this.invalidateListCache();

      // Публикация событий
      for (const item of items) {
        await this.publishEvent('deleted', { id: item.id }, item);
      }

      logger.info('{{EntityName}}s bulk deleted', { count: deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Error bulk deleting {{tableName}}', { ids, error });
      throw error;
    }
  }

  /**
   * Поиск
   */
  async search({ query, page = 1, limit = 20, ...options }) {
    try {
      // Валидация параметров
      this.validateSearchParams({ query, page, limit });

      // Поиск в БД
      const result = await this.{{entityName}}Repository.search({
        query,
        page,
        limit,
        ...options
      });

      // Обогащение результатов
      result.items = await this.enrichItems(result.items);

      logger.info('{{EntityName}} search completed', {
        query,
        found: result.total
      });

      return result;
    } catch (error) {
      logger.error('Error searching {{tableName}}', { query, error });
      throw error;
    }
  }

  /**
   * Экспорт данных
   */
  async export({ format = 'json', filters = {} }) {
    try {
      // Получаем все данные с учетом фильтров
      const data = await this.{{entityName}}Repository.findAllForExport(filters);

      // Форматируем данные
      const formatted = await this.formatForExport(data, format);

      logger.info('{{EntityName}} data exported', {
        format,
        count: data.length
      });

      return formatted;
    } catch (error) {
      logger.error('Error exporting {{tableName}}', { format, error });
      throw error;
    }
  }

  /**
   * Импорт данных
   */
  async import({ data, format = 'json', userId, ...options }) {
    try {
      // Парсим данные в зависимости от формата
      const parsed = await this.parseImportData(data, format);

      // Валидируем все записи
      const validationResults = await this.validateImportData(parsed);
      
      const validItems = validationResults.filter(r => r.valid).map(r => r.data);
      const errors = validationResults.filter(r => !r.valid);

      // Импортируем валидные записи
      const imported = [];
      for (const item of validItems) {
        try {
          const created = await this.create({
            ...item,
            creator_id: userId,
            imported_at: new Date()
          });
          imported.push(created);
        } catch (error) {
          errors.push({
            data: item,
            error: error.message
          });
        }
      }

      logger.info('{{EntityName}} data imported', {
        total: parsed.length,
        imported: imported.length,
        errors: errors.length
      });

      return {
        total: parsed.length,
        imported: imported.length,
        errors: errors.length,
        importedItems: imported,
        errorDetails: errors
      };
    } catch (error) {
      logger.error('Error importing {{tableName}}', { format, error });
      throw error;
    }
  }

  // Вспомогательные методы

  /**
   * Валидация параметров пагинации
   */
  validatePaginationParams({ page, limit }) {
    if (page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }
    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }
  }

  /**
   * Валидация данных для создания
   */
  async validateCreateData(data) {
    if (this.validators.create) {
      await this.validators.create(data);
    }
    // Дополнительная валидация специфичная для сущности
  }

  /**
   * Валидация данных для обновления
   */
  async validateUpdateData(data, existing) {
    if (this.validators.update) {
      await this.validators.update(data, existing);
    }
    // Дополнительная валидация специфичная для сущности
  }

  /**
   * Валидация данных для частичного обновления
   */
  async validatePatchData(data, existing) {
    if (this.validators.patch) {
      await this.validators.patch(data, existing);
    }
    // Дополнительная валидация специфичная для сущности
  }

  /**
   * Валидация параметров поиска
   */
  validateSearchParams({ query, page, limit }) {
    if (!query || query.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters');
    }
    this.validatePaginationParams({ page, limit });
  }

  /**
   * Проверка возможности удаления
   */
  async checkCanDelete(item) {
    // Реализация проверки зависимостей и ограничений
    // Например, нельзя удалить если есть связанные записи
  }

  /**
   * Подготовка данных для создания
   */
  async prepareCreateData(data) {
    return {
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  /**
   * Подготовка данных для обновления
   */
  async prepareUpdateData(data, existing) {
    return {
      ...data,
      updated_at: new Date()
    };
  }

  /**
   * Подготовка данных для частичного обновления
   */
  async preparePatchData(data, existing) {
    return {
      ...data,
      updated_at: new Date()
    };
  }

  /**
   * Обогащение одного элемента
   */
  async enrichItem(item) {
    // Реализация обогащения данными из связанных сущностей
    return item;
  }

  /**
   * Обогащение списка элементов
   */
  async enrichItems(items) {
    // Оптимизированное обогащение для списка
    return Promise.all(items.map(item => this.enrichItem(item)));
  }

  /**
   * Форматирование для экспорта
   */
  async formatForExport(data, format) {
    switch (format) {
      case 'csv':
        return this.formatAsCsv(data);
      case 'json':
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Форматирование в CSV
   */
  formatAsCsv(data) {
    // Простая реализация CSV
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(header => JSON.stringify(item[header] || '')).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Парсинг импортируемых данных
   */
  async parseImportData(data, format) {
    switch (format) {
      case 'csv':
        return this.parseCsv(data);
      case 'json':
      default:
        return JSON.parse(data);
    }
  }

  /**
   * Парсинг CSV
   */
  parseCsv(csvData) {
    // Простая реализация парсинга CSV
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index];
        return obj;
      }, {});
    });
  }

  /**
   * Валидация импортируемых данных
   */
  async validateImportData(items) {
    return Promise.all(items.map(async (item) => {
      try {
        await this.validateCreateData(item);
        return { valid: true, data: item };
      } catch (error) {
        return { valid: false, data: item, error: error.message };
      }
    }));
  }

  /**
   * Формирование ключа кэша
   */
  getCacheKey(type, params) {
    const key = `${this.cachePrefix}:${type}`;
    if (typeof params === 'string') {
      return `${key}:${params}`;
    }
    return `${key}:${JSON.stringify(params)}`;
  }

  /**
   * Инвалидация кэша элемента
   */
  async invalidateItemCache(id) {
    const cacheKey = this.getCacheKey('item', id);
    await cacheHelper.delete(cacheKey);
  }

  /**
   * Инвалидация кэша списков
   */
  async invalidateListCache() {
    // Удаляем все ключи списков
    const pattern = `${this.cachePrefix}:list:*`;
    await cacheHelper.deletePattern(pattern);
  }

  /**
   * Публикация события
   */
  async publishEvent(eventType, data, previousData = null) {
    const event = {
      type: `{{entityName}}_${eventType}`,
      timestamp: new Date().toISOString(),
      data,
      previousData
    };

    await publishMessage('system.events', event);
  }
}

module.exports = {{EntityName}}Service;