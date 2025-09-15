/**
 * Шаблон CRUD контроллера
 * Базовый шаблон для создания контроллеров с типовыми CRUD операциями
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
const { incrementCounter } = require('../../../shared/lib/metrics/counters');

class {{EntityName}}Controller {
  constructor({{entityName}}Service) {
    this.{{entityName}}Service = {{entityName}}Service;
  }

  /**
   * Получение списка {{tableName}} с пагинацией и фильтрацией
   * GET /{{tableName}}
   */
  async list(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = 'created_at',
        order = 'DESC',
        ...filters
      } = req.query;

      logger.info('Fetching {{tableName}} list', {
        page,
        limit,
        sort,
        order,
        filters
      });

      const result = await this.{{entityName}}Service.list({
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        order: order.toUpperCase(),
        filters
      });

      incrementCounter('api_requests_total', {
        method: 'GET',
        endpoint: '/{{tableName}}',
        status: 'success'
      });

      res.json({
        success: true,
        data: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      incrementCounter('api_requests_total', {
        method: 'GET',
        endpoint: '/{{tableName}}',
        status: 'error'
      });
      next(error);
    }
  }

  /**
   * Получение {{entityName}} по ID
   * GET /{{tableName}}/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      logger.info('Fetching {{entityName}} by id', { id });

      const {{entityName}} = await this.{{entityName}}Service.getById(id);

      if (!{{entityName}}) {
        throw new NotFoundError('{{EntityName}} not found');
      }

      incrementCounter('api_requests_total', {
        method: 'GET',
        endpoint: '/{{tableName}}/:id',
        status: 'success'
      });

      res.json({
        success: true,
        data: {{entityName}}
      });
    } catch (error) {
      incrementCounter('api_requests_total', {
        method: 'GET',
        endpoint: '/{{tableName}}/:id',
        status: 'error'
      });
      next(error);
    }
  }

  /**
   * Создание нового {{entityName}}
   * POST /{{tableName}}
   */
  async create(req, res, next) {
    try {
      const data = req.body;
      const userId = req.user?.id;

      logger.info('Creating new {{entityName}}', {
        userId,
        dataKeys: Object.keys(data)
      });

      // Добавляем информацию о создателе, если есть
      if (userId) {
        data.creator_id = userId;
      }

      const {{entityName}} = await this.{{entityName}}Service.create(data);

      incrementCounter('api_requests_total', {
        method: 'POST',
        endpoint: '/{{tableName}}',
        status: 'success'
      });

      incrementCounter('{{tableName}}_created_total');

      res.status(201).json({
        success: true,
        data: {{entityName}},
        message: '{{EntityName}} created successfully'
      });
    } catch (error) {
      incrementCounter('api_requests_total', {
        method: 'POST',
        endpoint: '/{{tableName}}',
        status: 'error'
      });
      next(error);
    }
  }

  /**
   * Обновление {{entityName}}
   * PUT /{{tableName}}/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;
      const userId = req.user?.id;

      logger.info('Updating {{entityName}}', {
        id,
        userId,
        dataKeys: Object.keys(data)
      });

      // Проверяем существование
      const existing = await this.{{entityName}}Service.getById(id);
      if (!existing) {
        throw new NotFoundError('{{EntityName}} not found');
      }

      // Проверяем права доступа (если применимо)
      if (existing.creator_id && existing.creator_id !== userId && !req.user?.isAdmin) {
        throw new ValidationError('You do not have permission to update this {{entityName}}');
      }

      const updated = await this.{{entityName}}Service.update(id, data);

      incrementCounter('api_requests_total', {
        method: 'PUT',
        endpoint: '/{{tableName}}/:id',
        status: 'success'
      });

      incrementCounter('{{tableName}}_updated_total');

      res.json({
        success: true,
        data: updated,
        message: '{{EntityName}} updated successfully'
      });
    } catch (error) {
      incrementCounter('api_requests_total', {
        method: 'PUT',
        endpoint: '/{{tableName}}/:id',
        status: 'error'
      });
      next(error);
    }
  }

  /**
   * Частичное обновление {{entityName}}
   * PATCH /{{tableName}}/:id
   */
  async patch(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;
      const userId = req.user?.id;

      logger.info('Patching {{entityName}}', {
        id,
        userId,
        dataKeys: Object.keys(data)
      });

      // Проверяем существование
      const existing = await this.{{entityName}}Service.getById(id);
      if (!existing) {
        throw new NotFoundError('{{EntityName}} not found');
      }

      // Проверяем права доступа (если применимо)
      if (existing.creator_id && existing.creator_id !== userId && !req.user?.isAdmin) {
        throw new ValidationError('You do not have permission to update this {{entityName}}');
      }

      const patched = await this.{{entityName}}Service.patch(id, data);

      incrementCounter('api_requests_total', {
        method: 'PATCH',
        endpoint: '/{{tableName}}/:id',
        status: 'success'
      });

      res.json({
        success: true,
        data: patched,
        message: '{{EntityName}} patched successfully'
      });
    } catch (error) {
      incrementCounter('api_requests_total', {
        method: 'PATCH',
        endpoint: '/{{tableName}}/:id',
        status: 'error'
      });
      next(error);
    }
  }

  /**
   * Удаление {{entityName}}
   * DELETE /{{tableName}}/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      logger.info('Deleting {{entityName}}', { id, userId });

      // Проверяем существование
      const existing = await this.{{entityName}}Service.getById(id);
      if (!existing) {
        throw new NotFoundError('{{EntityName}} not found');
      }

      // Проверяем права доступа (если применимо)
      if (existing.creator_id && existing.creator_id !== userId && !req.user?.isAdmin) {
        throw new ValidationError('You do not have permission to delete this {{entityName}}');
      }

      await this.{{entityName}}Service.delete(id);

      incrementCounter('api_requests_total', {
        method: 'DELETE',
        endpoint: '/{{tableName}}/:id',
        status: 'success'
      });

      incrementCounter('{{tableName}}_deleted_total');

      res.json({
        success: true,
        message: '{{EntityName}} deleted successfully'
      });
    } catch (error) {
      incrementCounter('api_requests_total', {
        method: 'DELETE',
        endpoint: '/{{tableName}}/:id',
        status: 'error'
      });
      next(error);
    }
  }

  /**
   * Массовое удаление {{tableName}}
   * DELETE /{{tableName}}
   */
  async bulkDelete(req, res, next) {
    try {
      const { ids } = req.body;
      const userId = req.user?.id;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new ValidationError('IDs array is required');
      }

      logger.info('Bulk deleting {{tableName}}', {
        userId,
        count: ids.length
      });

      // Проверяем права доступа для каждого элемента
      const items = await this.{{entityName}}Service.getByIds(ids);
      
      for (const item of items) {
        if (item.creator_id && item.creator_id !== userId && !req.user?.isAdmin) {
          throw new ValidationError(`You do not have permission to delete {{entityName}} ${item.id}`);
        }
      }

      const deletedCount = await this.{{entityName}}Service.bulkDelete(ids);

      incrementCounter('api_requests_total', {
        method: 'DELETE',
        endpoint: '/{{tableName}}/bulk',
        status: 'success'
      });

      incrementCounter('{{tableName}}_deleted_total', deletedCount);

      res.json({
        success: true,
        message: `${deletedCount} {{tableName}} deleted successfully`,
        data: { deletedCount }
      });
    } catch (error) {
      incrementCounter('api_requests_total', {
        method: 'DELETE',
        endpoint: '/{{tableName}}/bulk',
        status: 'error'
      });
      next(error);
    }
  }

  /**
   * Поиск {{tableName}}
   * POST /{{tableName}}/search
   */
  async search(req, res, next) {
    try {
      const {
        query,
        page = 1,
        limit = 20,
        ...options
      } = req.body;

      logger.info('Searching {{tableName}}', {
        query,
        page,
        limit,
        options
      });

      const result = await this.{{entityName}}Service.search({
        query,
        page: parseInt(page),
        limit: parseInt(limit),
        ...options
      });

      incrementCounter('api_requests_total', {
        method: 'POST',
        endpoint: '/{{tableName}}/search',
        status: 'success'
      });

      res.json({
        success: true,
        data: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      incrementCounter('api_requests_total', {
        method: 'POST',
        endpoint: '/{{tableName}}/search',
        status: 'error'
      });
      next(error);
    }
  }

  /**
   * Экспорт {{tableName}}
   * GET /{{tableName}}/export
   */
  async export(req, res, next) {
    try {
      const { format = 'json', ...filters } = req.query;

      logger.info('Exporting {{tableName}}', {
        format,
        filters
      });

      const data = await this.{{entityName}}Service.export({
        format,
        filters
      });

      incrementCounter('api_requests_total', {
        method: 'GET',
        endpoint: '/{{tableName}}/export',
        status: 'success'
      });

      // Устанавливаем заголовки для скачивания
      const filename = `{{tableName}}_export_${Date.now()}.${format}`;
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.send(data);
    } catch (error) {
      incrementCounter('api_requests_total', {
        method: 'GET',
        endpoint: '/{{tableName}}/export',
        status: 'error'
      });
      next(error);
    }
  }

  /**
   * Импорт {{tableName}}
   * POST /{{tableName}}/import
   */
  async import(req, res, next) {
    try {
      const { data, format = 'json', options = {} } = req.body;
      const userId = req.user?.id;

      logger.info('Importing {{tableName}}', {
        userId,
        format,
        itemCount: Array.isArray(data) ? data.length : 1
      });

      const result = await this.{{entityName}}Service.import({
        data,
        format,
        userId,
        ...options
      });

      incrementCounter('api_requests_total', {
        method: 'POST',
        endpoint: '/{{tableName}}/import',
        status: 'success'
      });

      incrementCounter('{{tableName}}_imported_total', result.imported);

      res.json({
        success: true,
        message: `${result.imported} {{tableName}} imported successfully`,
        data: result
      });
    } catch (error) {
      incrementCounter('api_requests_total', {
        method: 'POST',
        endpoint: '/{{tableName}}/import',
        status: 'error'
      });
      next(error);
    }
  }
}

module.exports = {{EntityName}}Controller;