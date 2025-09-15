/**
 * Шаблон репозитория PostgreSQL
 * Базовый шаблон для создания репозиториев для работы с PostgreSQL
 * 
 * Использование:
 * 1. Скопировать файл в нужную директорию
 * 2. Заменить {{EntityName}} на название сущности (например, User)
 * 3. Заменить {{entityName}} на название сущности в camelCase (например, user)
 * 4. Заменить {{tableName}} на название таблицы в БД (например, users)
 * 5. Заменить {{primaryKey}} на название первичного ключа (например, user_id)
 * 6. Адаптировать поля и методы под специфику сущности
 */

const { postgresClient } = require('../../../shared/lib/db/postgres/client');
const { queryBuilder } = require('../../../shared/lib/db/postgres/queryBuilder');
const logger = require('../../../shared/lib/logging/logger');

class {{EntityName}}Repository {
  constructor(dbClient = postgresClient) {
    this.db = dbClient;
    this.tableName = '{{tableName}}';
    this.primaryKey = '{{primaryKey}}';
    
    // Маппинг полей для выборки
    this.selectFields = [
      '{{primaryKey}}',
      'name',
      'description',
      'created_at',
      'updated_at',
      'created_by',
      'is_active'
      // Добавить специфичные поля
    ];
    
    // Поля, которые можно обновлять
    this.updateableFields = [
      'name',
      'description',
      'updated_at',
      'is_active'
      // Добавить специфичные поля
    ];
  }

  /**
   * Получение всех записей с пагинацией и фильтрацией
   */
  async findAll({ page = 1, limit = 20, sort = 'created_at', order = 'DESC', filters = {} }) {
    const offset = (page - 1) * limit;
    
    try {
      // Строим базовый запрос
      let query = queryBuilder
        .select(this.selectFields)
        .from(this.tableName);

      // Применяем фильтры
      query = this.applyFilters(query, filters);

      // Получаем общее количество
      const countQuery = query.clone().count(`${this.primaryKey} as total`);
      const [{ total }] = await this.db.raw(countQuery.toString());

      // Добавляем сортировку и пагинацию
      query = query
        .orderBy(sort, order)
        .limit(limit)
        .offset(offset);

      // Выполняем запрос
      const items = await this.db.raw(query.toString());

      logger.debug('{{EntityName}} findAll executed', {
        total: parseInt(total),
        page,
        limit,
        itemsCount: items.length
      });

      return {
        items,
        total: parseInt(total),
        page,
        limit,
        totalPages: Math.ceil(parseInt(total) / limit)
      };
    } catch (error) {
      logger.error('Error in {{entityName}} findAll', { error });
      throw error;
    }
  }

  /**
   * Получение записи по ID
   */
  async findById(id) {
    try {
      const query = queryBuilder
        .select(this.selectFields)
        .from(this.tableName)
        .where(this.primaryKey, id)
        .limit(1);

      const result = await this.db.raw(query.toString());
      
      logger.debug('{{EntityName}} findById executed', { id, found: result.length > 0 });
      
      return result[0] || null;
    } catch (error) {
      logger.error('Error in {{entityName}} findById', { id, error });
      throw error;
    }
  }

  /**
   * Получение записей по списку ID
   */
  async findByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    try {
      const query = queryBuilder
        .select(this.selectFields)
        .from(this.tableName)
        .whereIn(this.primaryKey, ids);

      const result = await this.db.raw(query.toString());
      
      logger.debug('{{EntityName}} findByIds executed', { 
        requestedCount: ids.length,
        foundCount: result.length 
      });
      
      return result;
    } catch (error) {
      logger.error('Error in {{entityName}} findByIds', { ids, error });
      throw error;
    }
  }

  /**
   * Создание новой записи
   */
  async create(data) {
    try {
      // Подготавливаем данные
      const preparedData = this.prepareInsertData(data);
      
      const query = queryBuilder
        .insert(preparedData)
        .into(this.tableName)
        .returning(this.selectFields);

      const [created] = await this.db.raw(query.toString());
      
      logger.info('{{EntityName}} created', { id: created[this.primaryKey] });
      
      return created;
    } catch (error) {
      logger.error('Error in {{entityName}} create', { error });
      
      // Обработка специфичных ошибок PostgreSQL
      if (error.code === '23505') {
        throw new Error('Duplicate entry');
      }
      if (error.code === '23503') {
        throw new Error('Foreign key constraint violation');
      }
      
      throw error;
    }
  }

  /**
   * Массовое создание записей
   */
  async bulkCreate(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return [];
    }

    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const created = [];
      
      for (const data of dataArray) {
        const preparedData = this.prepareInsertData(data);
        
        const query = queryBuilder
          .insert(preparedData)
          .into(this.tableName)
          .returning(this.selectFields);
        
        const result = await client.query(query.toString());
        created.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      
      logger.info('{{EntityName}} bulk created', { count: created.length });
      
      return created;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error in {{entityName}} bulkCreate', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Обновление записи
   */
  async update(id, data) {
    try {
      // Подготавливаем данные
      const preparedData = this.prepareUpdateData(data);
      
      const query = queryBuilder
        .update(preparedData)
        .table(this.tableName)
        .where(this.primaryKey, id)
        .returning(this.selectFields);

      const [updated] = await this.db.raw(query.toString());
      
      if (!updated) {
        return null;
      }
      
      logger.info('{{EntityName}} updated', { id });
      
      return updated;
    } catch (error) {
      logger.error('Error in {{entityName}} update', { id, error });
      throw error;
    }
  }

  /**
   * Частичное обновление записи
   */
  async patch(id, data) {
    try {
      // Фильтруем только разрешенные поля
      const allowedData = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.updateableFields.includes(key)) {
          allowedData[key] = value;
        }
      }
      
      if (Object.keys(allowedData).length === 0) {
        // Нечего обновлять, возвращаем текущую запись
        return this.findById(id);
      }
      
      // Добавляем updated_at
      allowedData.updated_at = new Date();
      
      const query = queryBuilder
        .update(allowedData)
        .table(this.tableName)
        .where(this.primaryKey, id)
        .returning(this.selectFields);

      const [patched] = await this.db.raw(query.toString());
      
      if (!patched) {
        return null;
      }
      
      logger.info('{{EntityName}} patched', { id, fields: Object.keys(allowedData) });
      
      return patched;
    } catch (error) {
      logger.error('Error in {{entityName}} patch', { id, error });
      throw error;
    }
  }

  /**
   * Удаление записи
   */
  async delete(id) {
    try {
      const query = queryBuilder
        .delete()
        .from(this.tableName)
        .where(this.primaryKey, id);

      const result = await this.db.raw(query.toString());
      
      const deleted = result.rowCount > 0;
      
      logger.info('{{EntityName}} delete attempted', { id, deleted });
      
      return deleted;
    } catch (error) {
      logger.error('Error in {{entityName}} delete', { id, error });
      
      // Обработка ошибки внешнего ключа
      if (error.code === '23503') {
        throw new Error('Cannot delete: record is referenced by other entities');
      }
      
      throw error;
    }
  }

  /**
   * Массовое удаление записей
   */
  async bulkDelete(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return 0;
    }

    try {
      const query = queryBuilder
        .delete()
        .from(this.tableName)
        .whereIn(this.primaryKey, ids);

      const result = await this.db.raw(query.toString());
      
      logger.info('{{EntityName}} bulk deleted', { 
        requestedCount: ids.length,
        deletedCount: result.rowCount 
      });
      
      return result.rowCount;
    } catch (error) {
      logger.error('Error in {{entityName}} bulkDelete', { ids, error });
      throw error;
    }
  }

  /**
   * Поиск записей
   */
  async search({ query, fields = ['name', 'description'], page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    
    try {
      // Построение поискового запроса
      let searchQuery = queryBuilder
        .select(this.selectFields)
        .from(this.tableName);

      // Добавляем условия поиска по каждому полю
      if (query && query.trim()) {
        const searchConditions = fields.map(field => 
          `LOWER(${field}) LIKE LOWER('%${query}%')`
        ).join(' OR ');
        
        searchQuery = searchQuery.whereRaw(`(${searchConditions})`);
      }

      // Получаем общее количество
      const countQuery = searchQuery.clone().count(`${this.primaryKey} as total`);
      const [{ total }] = await this.db.raw(countQuery.toString());

      // Добавляем пагинацию
      searchQuery = searchQuery
        .orderBy('created_at', 'DESC')
        .limit(limit)
        .offset(offset);

      // Выполняем запрос
      const items = await this.db.raw(searchQuery.toString());

      logger.debug('{{EntityName}} search executed', {
        query,
        total: parseInt(total),
        itemsCount: items.length
      });

      return {
        items,
        total: parseInt(total),
        page,
        limit,
        totalPages: Math.ceil(parseInt(total) / limit)
      };
    } catch (error) {
      logger.error('Error in {{entityName}} search', { query, error });
      throw error;
    }
  }

  /**
   * Проверка существования записи
   */
  async exists(id) {
    try {
      const query = queryBuilder
        .select(this.primaryKey)
        .from(this.tableName)
        .where(this.primaryKey, id)
        .limit(1);

      const result = await this.db.raw(query.toString());
      
      return result.length > 0;
    } catch (error) {
      logger.error('Error in {{entityName}} exists', { id, error });
      throw error;
    }
  }

  /**
   * Получение количества записей
   */
  async count(filters = {}) {
    try {
      let query = queryBuilder
        .count(`${this.primaryKey} as total`)
        .from(this.tableName);

      // Применяем фильтры
      query = this.applyFilters(query, filters);

      const [{ total }] = await this.db.raw(query.toString());
      
      return parseInt(total);
    } catch (error) {
      logger.error('Error in {{entityName}} count', { error });
      throw error;
    }
  }

  /**
   * Получение записей для экспорта
   */
  async findAllForExport(filters = {}) {
    try {
      let query = queryBuilder
        .select('*') // Выбираем все поля для экспорта
        .from(this.tableName);

      // Применяем фильтры
      query = this.applyFilters(query, filters);

      // Сортировка для консистентности
      query = query.orderBy('created_at', 'ASC');

      const result = await this.db.raw(query.toString());
      
      logger.info('{{EntityName}} export data retrieved', { count: result.length });
      
      return result;
    } catch (error) {
      logger.error('Error in {{entityName}} findAllForExport', { error });
      throw error;
    }
  }

  /**
   * Выполнение произвольного запроса
   */
  async executeRawQuery(sql, params = []) {
    try {
      const result = await this.db.raw(sql, params);
      
      logger.debug('Raw query executed', { 
        sql: sql.substring(0, 100) + '...',
        rowCount: result.rowCount 
      });
      
      return result;
    } catch (error) {
      logger.error('Error executing raw query', { sql, error });
      throw error;
    }
  }

  /**
   * Начало транзакции
   */
  async beginTransaction() {
    const client = await this.db.getClient();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Коммит транзакции
   */
  async commitTransaction(client) {
    await client.query('COMMIT');
    client.release();
  }

  /**
   * Откат транзакции
   */
  async rollbackTransaction(client) {
    await client.query('ROLLBACK');
    client.release();
  }

  // Вспомогательные методы

  /**
   * Применение фильтров к запросу
   */
  applyFilters(query, filters) {
    for (const [field, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;
      
      // Специальная обработка для некоторых типов фильтров
      if (field.endsWith('_from')) {
        const actualField = field.replace('_from', '');
        query = query.where(actualField, '>=', value);
      } else if (field.endsWith('_to')) {
        const actualField = field.replace('_to', '');
        query = query.where(actualField, '<=', value);
      } else if (field.endsWith('_like')) {
        const actualField = field.replace('_like', '');
        query = query.whereRaw(`LOWER(${actualField}) LIKE LOWER(?)`, [`%${value}%`]);
      } else if (Array.isArray(value)) {
        query = query.whereIn(field, value);
      } else {
        query = query.where(field, value);
      }
    }
    
    return query;
  }

  /**
   * Подготовка данных для вставки
   */
  prepareInsertData(data) {
    const now = new Date();
    
    return {
      ...data,
      created_at: data.created_at || now,
      updated_at: data.updated_at || now,
      is_active: data.is_active !== undefined ? data.is_active : true
    };
  }

  /**
   * Подготовка данных для обновления
   */
  prepareUpdateData(data) {
    const prepared = {
      ...data,
      updated_at: new Date()
    };
    
    // Удаляем поля, которые нельзя обновлять
    delete prepared[this.primaryKey];
    delete prepared.created_at;
    delete prepared.created_by;
    
    return prepared;
  }
}

module.exports = {{EntityName}}Repository;