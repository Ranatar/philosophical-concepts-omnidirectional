/**
 * Шаблон репозитория MongoDB
 * Базовый шаблон для создания репозиториев для работы с MongoDB
 * 
 * Использование:
 * 1. Скопировать файл в нужную директорию
 * 2. Заменить {{EntityName}} на название сущности (например, Thesis)
 * 3. Заменить {{entityName}} на название сущности в camelCase (например, thesis)
 * 4. Заменить {{collectionName}} на название коллекции в БД (например, theses)
 * 5. Адаптировать поля и методы под специфику сущности
 */

const { mongoClient } = require('../../../shared/lib/db/mongodb/client');
const { ObjectId } = require('mongodb');
const logger = require('../../../shared/lib/logging/logger');

class {{EntityName}}Repository {
  constructor(client = mongoClient) {
    this.client = client;
    this.collectionName = '{{collectionName}}';
    this.dbName = process.env.MONGODB_DATABASE || 'philosophy_service';
  }

  /**
   * Получение коллекции
   */
  async getCollection() {
    const db = await this.client.getDb(this.dbName);
    return db.collection(this.collectionName);
  }

  /**
   * Создание документа
   */
  async create(data) {
    try {
      const collection = await this.getCollection();
      
      const document = {
        ...data,
        created_at: data.created_at || new Date(),
        updated_at: data.updated_at || new Date()
      };
      
      const result = await collection.insertOne(document);
      
      if (!result.acknowledged) {
        throw new Error('Failed to create document');
      }
      
      logger.info('{{EntityName}} created', { id: result.insertedId });
      
      return {
        _id: result.insertedId,
        ...document
      };
    } catch (error) {
      logger.error('Error creating {{entityName}}', { error });
      throw error;
    }
  }

  /**
   * Массовое создание документов
   */
  async bulkCreate(documents) {
    if (!Array.isArray(documents) || documents.length === 0) {
      return [];
    }

    try {
      const collection = await this.getCollection();
      
      const preparedDocuments = documents.map(doc => ({
        ...doc,
        created_at: doc.created_at || new Date(),
        updated_at: doc.updated_at || new Date()
      }));
      
      const result = await collection.insertMany(preparedDocuments);
      
      logger.info('{{EntityName}} bulk created', { 
        count: result.insertedCount 
      });
      
      return preparedDocuments.map((doc, index) => ({
        _id: result.insertedIds[index],
        ...doc
      }));
    } catch (error) {
      logger.error('Error bulk creating {{collectionName}}', { error });
      throw error;
    }
  }

  /**
   * Поиск по ID
   */
  async findById(id) {
    try {
      const collection = await this.getCollection();
      
      const objectId = this.toObjectId(id);
      if (!objectId) {
        return null;
      }
      
      const document = await collection.findOne({ _id: objectId });
      
      logger.debug('{{EntityName}} findById', { 
        id, 
        found: !!document 
      });
      
      return document;
    } catch (error) {
      logger.error('Error finding {{entityName}} by id', { id, error });
      throw error;
    }
  }

  /**
   * Поиск по списку ID
   */
  async findByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    try {
      const collection = await this.getCollection();
      
      const objectIds = ids
        .map(id => this.toObjectId(id))
        .filter(Boolean);
      
      if (objectIds.length === 0) {
        return [];
      }
      
      const documents = await collection
        .find({ _id: { $in: objectIds } })
        .toArray();
      
      logger.debug('{{EntityName}} findByIds', { 
        requestedCount: ids.length,
        foundCount: documents.length 
      });
      
      return documents;
    } catch (error) {
      logger.error('Error finding {{collectionName}} by ids', { ids, error });
      throw error;
    }
  }

  /**
   * Поиск всех документов с пагинацией и фильтрацией
   */
  async findAll({ 
    page = 1, 
    limit = 20, 
    sort = { created_at: -1 }, 
    filters = {},
    projection = null 
  } = {}) {
    try {
      const collection = await this.getCollection();
      
      const skip = (page - 1) * limit;
      
      // Построение запроса с фильтрами
      const query = this.buildQuery(filters);
      
      // Получение общего количества
      const total = await collection.countDocuments(query);
      
      // Получение документов
      let cursor = collection.find(query);
      
      if (projection) {
        cursor = cursor.project(projection);
      }
      
      const documents = await cursor
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();
      
      logger.debug('{{EntityName}} findAll', {
        total,
        page,
        limit,
        documentsCount: documents.length
      });
      
      return {
        items: documents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error finding all {{collectionName}}', { error });
      throw error;
    }
  }

  /**
   * Поиск одного документа по условиям
   */
  async findOne(query, options = {}) {
    try {
      const collection = await this.getCollection();
      
      const document = await collection.findOne(query, options);
      
      logger.debug('{{EntityName}} findOne', { 
        query, 
        found: !!document 
      });
      
      return document;
    } catch (error) {
      logger.error('Error finding one {{entityName}}', { query, error });
      throw error;
    }
  }

  /**
   * Поиск документов по условиям
   */
  async find(query, options = {}) {
    try {
      const collection = await this.getCollection();
      
      const documents = await collection.find(query, options).toArray();
      
      logger.debug('{{EntityName}} find', { 
        query, 
        count: documents.length 
      });
      
      return documents;
    } catch (error) {
      logger.error('Error finding {{collectionName}}', { query, error });
      throw error;
    }
  }

  /**
   * Обновление документа
   */
  async update(id, data) {
    try {
      const collection = await this.getCollection();
      
      const objectId = this.toObjectId(id);
      if (!objectId) {
        return null;
      }
      
      // Удаляем _id из обновляемых данных
      const updateData = { ...data };
      delete updateData._id;
      
      const result = await collection.findOneAndUpdate(
        { _id: objectId },
        { 
          $set: {
            ...updateData,
            updated_at: new Date()
          }
        },
        { returnDocument: 'after' }
      );
      
      if (!result.value) {
        return null;
      }
      
      logger.info('{{EntityName}} updated', { id });
      
      return result.value;
    } catch (error) {
      logger.error('Error updating {{entityName}}', { id, error });
      throw error;
    }
  }

  /**
   * Обновление с использованием операторов MongoDB
   */
  async updateWithOperators(id, update) {
    try {
      const collection = await this.getCollection();
      
      const objectId = this.toObjectId(id);
      if (!objectId) {
        return null;
      }
      
      // Добавляем updated_at если используется $set
      if (update.$set) {
        update.$set.updated_at = new Date();
      } else {
        update.$set = { updated_at: new Date() };
      }
      
      const result = await collection.findOneAndUpdate(
        { _id: objectId },
        update,
        { returnDocument: 'after' }
      );
      
      if (!result.value) {
        return null;
      }
      
      logger.info('{{EntityName}} updated with operators', { id });
      
      return result.value;
    } catch (error) {
      logger.error('Error updating {{entityName}} with operators', { id, error });
      throw error;
    }
  }

  /**
   * Массовое обновление документов
   */
  async updateMany(filter, update) {
    try {
      const collection = await this.getCollection();
      
      // Добавляем updated_at
      if (update.$set) {
        update.$set.updated_at = new Date();
      } else {
        update.$set = { updated_at: new Date() };
      }
      
      const result = await collection.updateMany(filter, update);
      
      logger.info('{{EntityName}} updateMany', { 
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount 
      });
      
      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      logger.error('Error updating many {{collectionName}}', { filter, error });
      throw error;
    }
  }

  /**
   * Удаление документа
   */
  async delete(id) {
    try {
      const collection = await this.getCollection();
      
      const objectId = this.toObjectId(id);
      if (!objectId) {
        return false;
      }
      
      const result = await collection.deleteOne({ _id: objectId });
      
      const deleted = result.deletedCount > 0;
      
      logger.info('{{EntityName}} delete', { id, deleted });
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting {{entityName}}', { id, error });
      throw error;
    }
  }

  /**
   * Массовое удаление документов
   */
  async deleteMany(filter) {
    try {
      const collection = await this.getCollection();
      
      const result = await collection.deleteMany(filter);
      
      logger.info('{{EntityName}} deleteMany', { 
        deletedCount: result.deletedCount 
      });
      
      return result.deletedCount;
    } catch (error) {
      logger.error('Error deleting many {{collectionName}}', { filter, error });
      throw error;
    }
  }

  /**
   * Подсчет документов
   */
  async count(filter = {}) {
    try {
      const collection = await this.getCollection();
      
      const count = await collection.countDocuments(filter);
      
      logger.debug('{{EntityName}} count', { filter, count });
      
      return count;
    } catch (error) {
      logger.error('Error counting {{collectionName}}', { filter, error });
      throw error;
    }
  }

  /**
   * Проверка существования документа
   */
  async exists(filter) {
    try {
      const count = await this.count(filter);
      return count > 0;
    } catch (error) {
      logger.error('Error checking existence', { filter, error });
      throw error;
    }
  }

  /**
   * Агрегация данных
   */
  async aggregate(pipeline) {
    try {
      const collection = await this.getCollection();
      
      const results = await collection.aggregate(pipeline).toArray();
      
      logger.debug('{{EntityName}} aggregate', { 
        pipelineLength: pipeline.length,
        resultsCount: results.length 
      });
      
      return results;
    } catch (error) {
      logger.error('Error aggregating {{collectionName}}', { error });
      throw error;
    }
  }

  /**
   * Полнотекстовый поиск
   */
  async search({ query, fields = ['name', 'description'], page = 1, limit = 20 }) {
    try {
      const collection = await this.getCollection();
      const skip = (page - 1) * limit;
      
      // Построение условий поиска
      const searchConditions = fields.map(field => ({
        [field]: { $regex: query, $options: 'i' }
      }));
      
      const searchQuery = { $or: searchConditions };
      
      // Получение общего количества
      const total = await collection.countDocuments(searchQuery);
      
      // Получение документов
      const documents = await collection
        .find(searchQuery)
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      logger.debug('{{EntityName}} search', {
        query,
        total,
        documentsCount: documents.length
      });
      
      return {
        items: documents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error searching {{collectionName}}', { query, error });
      throw error;
    }
  }

  /**
   * Получение уникальных значений поля
   */
  async distinct(field, filter = {}) {
    try {
      const collection = await this.getCollection();
      
      const values = await collection.distinct(field, filter);
      
      logger.debug('{{EntityName}} distinct', { 
        field, 
        count: values.length 
      });
      
      return values;
    } catch (error) {
      logger.error('Error getting distinct values', { field, filter, error });
      throw error;
    }
  }

  /**
   * Создание индекса
   */
  async createIndex(keys, options = {}) {
    try {
      const collection = await this.getCollection();
      
      const indexName = await collection.createIndex(keys, options);
      
      logger.info('Index created', { 
        collection: this.collectionName,
        indexName 
      });
      
      return indexName;
    } catch (error) {
      logger.error('Error creating index', { keys, options, error });
      throw error;
    }
  }

  /**
   * Удаление индекса
   */
  async dropIndex(indexName) {
    try {
      const collection = await this.getCollection();
      
      await collection.dropIndex(indexName);
      
      logger.info('Index dropped', { 
        collection: this.collectionName,
        indexName 
      });
      
      return true;
    } catch (error) {
      logger.error('Error dropping index', { indexName, error });
      throw error;
    }
  }

  /**
   * Получение списка индексов
   */
  async getIndexes() {
    try {
      const collection = await this.getCollection();
      
      const indexes = await collection.indexes();
      
      logger.debug('Indexes retrieved', { 
        collection: this.collectionName,
        count: indexes.length 
      });
      
      return indexes;
    } catch (error) {
      logger.error('Error getting indexes', { error });
      throw error;
    }
  }

  /**
   * Выполнение в транзакции
   */
  async executeInTransaction(callback) {
    const session = this.client.startSession();
    
    try {
      await session.withTransaction(async () => {
        await callback(session);
      });
      
      logger.info('Transaction completed successfully');
    } catch (error) {
      logger.error('Error in transaction', { error });
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Вспомогательные методы

  /**
   * Преобразование в ObjectId
   */
  toObjectId(id) {
    if (!id) return null;
    
    if (id instanceof ObjectId) {
      return id;
    }
    
    try {
      return new ObjectId(id);
    } catch (error) {
      logger.warn('Invalid ObjectId', { id });
      return null;
    }
  }

  /**
   * Построение запроса с фильтрами
   */
  buildQuery(filters) {
    const query = {};
    
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;
      
      // Специальная обработка для различных типов фильтров
      if (key === '_id' || key.endsWith('_id')) {
        // Преобразуем в ObjectId для полей с ID
        query[key] = this.toObjectId(value);
      } else if (key.endsWith('_from')) {
        // Фильтр "от"
        const field = key.replace('_from', '');
        query[field] = { ...query[field], $gte: value };
      } else if (key.endsWith('_to')) {
        // Фильтр "до"
        const field = key.replace('_to', '');
        query[field] = { ...query[field], $lte: value };
      } else if (key.endsWith('_like')) {
        // Фильтр "содержит"
        const field = key.replace('_like', '');
        query[field] = { $regex: value, $options: 'i' };
      } else if (key.endsWith('_in')) {
        // Фильтр "в списке"
        const field = key.replace('_in', '');
        query[field] = { $in: value };
      } else if (key.endsWith('_exists')) {
        // Фильтр "существует"
        const field = key.replace('_exists', '');
        query[field] = { $exists: value };
      } else if (Array.isArray(value)) {
        // Если значение - массив, используем $in
        query[key] = { $in: value };
      } else {
        // Обычное равенство
        query[key] = value;
      }
    }
    
    return query;
  }

  /**
   * Форматирование для экспорта
   */
  async exportData(filter = {}, format = 'json') {
    try {
      const collection = await this.getCollection();
      
      const documents = await collection.find(filter).toArray();
      
      if (format === 'json') {
        return JSON.stringify(documents, null, 2);
      }
      
      // Можно добавить другие форматы (CSV, XML и т.д.)
      
      logger.info('Data exported', { 
        collection: this.collectionName,
        count: documents.length,
        format 
      });
      
      return documents;
    } catch (error) {
      logger.error('Error exporting data', { filter, format, error });
      throw error;
    }
  }
}

module.exports = {{EntityName}}Repository;