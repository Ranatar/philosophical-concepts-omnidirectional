/**
 * Шаблон сервиса для работы с сущностями
 * Базовый шаблон для создания сервисов управления сущностями через API
 * 
 * Использование:
 * 1. Скопировать файл в директорию services
 * 2. Заменить {{ServiceName}} на название сервиса (например, UserService)
 * 3. Заменить {{EntityName}} на название сущности (например, User)
 * 4. Заменить {{entityName}} на название в camelCase (например, user)
 * 5. Заменить {{endpoint}} на базовый endpoint (например, /users)
 * 6. Адаптировать методы и типы под специфику сущности
 */

import apiService from './api';
import { ApiService } from './api';

/**
 * Интерфейс сущности {{EntityName}}
 */
export interface {{EntityName}} {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  // Добавить специфичные поля сущности
}

/**
 * Интерфейс для создания {{EntityName}}
 */
export interface Create{{EntityName}}Data {
  name: string;
  description?: string;
  status?: 'active' | 'inactive' | 'pending';
  // Добавить специфичные поля для создания
}

/**
 * Интерфейс для обновления {{EntityName}}
 */
export interface Update{{EntityName}}Data extends Partial<Create{{EntityName}}Data> {
  // Дополнительные поля для обновления
}

/**
 * Интерфейс фильтров для {{EntityName}}
 */
export interface {{EntityName}}Filters {
  search?: string;
  status?: 'active' | 'inactive' | 'pending';
  createdBy?: string;
  createdFrom?: string;
  createdTo?: string;
  // Добавить специфичные фильтры
}

/**
 * Интерфейс параметров списка
 */
export interface {{EntityName}}ListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: {{EntityName}}Filters;
}

/**
 * Интерфейс ответа списка
 */
export interface {{EntityName}}ListResponse {
  items: {{EntityName}}[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Интерфейс параметров экспорта
 */
export interface {{EntityName}}ExportParams {
  format: 'csv' | 'json' | 'xlsx';
  filters?: {{EntityName}}Filters;
  fields?: (keyof {{EntityName}})[];
}

/**
 * Интерфейс статистики
 */
export interface {{EntityName}}Statistics {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  createdToday: number;
  createdThisWeek: number;
  createdThisMonth: number;
  // Добавить специфичную статистику
}

/**
 * Класс сервиса для работы с {{EntityName}}
 * 
 * @example
 * ```ts
 * const {{entityName}}Service = new {{ServiceName}}();
 * 
 * // Получение списка
 * const {{entityName}}s = await {{entityName}}Service.getList({ page: 1, limit: 20 });
 * 
 * // Создание
 * const new{{EntityName}} = await {{entityName}}Service.create({ name: 'Test' });
 * 
 * // Обновление
 * await {{entityName}}Service.update('123', { name: 'Updated' });
 * ```
 */
export class {{ServiceName}} {
  private api: ApiService;
  private endpoint = '{{endpoint}}';
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTimeout = 5 * 60 * 1000; // 5 минут

  constructor(apiInstance?: ApiService) {
    this.api = apiInstance || apiService;
    this.cache = new Map();
  }

  /**
   * Получение списка {{entityName}}
   */
  async getList(params: {{EntityName}}ListParams = {}): Promise<{{EntityName}}ListResponse> {
    const {
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc',
      filters = {}
    } = params;

    const queryParams = {
      page,
      limit,
      sort,
      order,
      ...this.formatFilters(filters)
    };

    const cacheKey = this.getCacheKey('list', queryParams);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await this.api.get<{{EntityName}}ListResponse>(this.endpoint, {
      params: queryParams
    });

    this.setCache(cacheKey, response);
    return response;
  }

  /**
   * Получение {{entityName}} по ID
   */
  async getById(id: string): Promise<{{EntityName}}> {
    const cacheKey = this.getCacheKey('item', id);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await this.api.get<{{EntityName}}>(`${this.endpoint}/${id}`);
    
    this.setCache(cacheKey, response);
    this.updateListCache(response);
    
    return response;
  }

  /**
   * Создание {{entityName}}
   */
  async create(data: Create{{EntityName}}Data): Promise<{{EntityName}}> {
    const response = await this.api.post<{{EntityName}}>(this.endpoint, data);
    
    this.clearListCache();
    this.setCache(this.getCacheKey('item', response.id), response);
    
    return response;
  }

  /**
   * Обновление {{entityName}}
   */
  async update(id: string, data: Update{{EntityName}}Data): Promise<{{EntityName}}> {
    const response = await this.api.put<{{EntityName}}>(`${this.endpoint}/${id}`, data);
    
    this.clearListCache();
    this.setCache(this.getCacheKey('item', id), response);
    
    return response;
  }

  /**
   * Частичное обновление {{entityName}}
   */
  async patch(id: string, data: Partial<Update{{EntityName}}Data>): Promise<{{EntityName}}> {
    const response = await this.api.patch<{{EntityName}}>(`${this.endpoint}/${id}`, data);
    
    this.clearListCache();
    this.setCache(this.getCacheKey('item', id), response);
    
    return response;
  }

  /**
   * Удаление {{entityName}}
   */
  async delete(id: string): Promise<void> {
    await this.api.delete(`${this.endpoint}/${id}`);
    
    this.clearCache();
  }

  /**
   * Массовое удаление
   */
  async bulkDelete(ids: string[]): Promise<{ deleted: number }> {
    const response = await this.api.post<{ deleted: number }>(`${this.endpoint}/bulk-delete`, {
      ids
    });
    
    this.clearCache();
    
    return response;
  }

  /**
   * Поиск {{entityName}}
   */
  async search(query: string, options: {{EntityName}}ListParams = {}): Promise<{{EntityName}}ListResponse> {
    const params = {
      ...options,
      filters: {
        ...options.filters,
        search: query
      }
    };

    return this.getList(params);
  }

  /**
   * Экспорт данных
   */
  async export(params: {{EntityName}}ExportParams): Promise<Blob> {
    const { format, filters = {}, fields } = params;

    const response = await this.api.post(
      `${this.endpoint}/export`,
      {
        format,
        filters: this.formatFilters(filters),
        fields
      },
      {
        responseType: 'blob'
      }
    );

    return response as unknown as Blob;
  }

  /**
   * Импорт данных
   */
  async import(file: File, options: { format?: string; mapping?: Record<string, string> } = {}): Promise<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    return this.api.upload(
      `${this.endpoint}/import`,
      file,
      undefined,
      options
    );
  }

  /**
   * Получение статистики
   */
  async getStatistics(filters?: {{EntityName}}Filters): Promise<{{EntityName}}Statistics> {
    const cacheKey = this.getCacheKey('stats', filters);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const response = await this.api.get<{{EntityName}}Statistics>(`${this.endpoint}/statistics`, {
      params: filters ? this.formatFilters(filters) : undefined
    });

    this.setCache(cacheKey, response, 60000); // Кэш на 1 минуту
    return response;
  }

  /**
   * Проверка существования
   */
  async exists(id: string): Promise<boolean> {
    try {
      await this.getById(id);
      return true;
    } catch (error) {
      if ((error as any).status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Получение по slug/уникальному полю
   */
  async getBySlug(slug: string): Promise<{{EntityName}} | null> {
    try {
      const response = await this.api.get<{{EntityName}}>(`${this.endpoint}/slug/${slug}`);
      return response;
    } catch (error) {
      if ((error as any).status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Дублирование {{entityName}}
   */
  async duplicate(id: string, data?: Partial<Create{{EntityName}}Data>): Promise<{{EntityName}}> {
    const response = await this.api.post<{{EntityName}}>(`${this.endpoint}/${id}/duplicate`, data);
    
    this.clearListCache();
    
    return response;
  }

  /**
   * Изменение статуса
   */
  async changeStatus(id: string, status: {{EntityName}}['status']): Promise<{{EntityName}}> {
    return this.patch(id, { status });
  }

  /**
   * Массовое изменение статуса
   */
  async bulkChangeStatus(ids: string[], status: {{EntityName}}['status']): Promise<{ updated: number }> {
    const response = await this.api.post<{ updated: number }>(`${this.endpoint}/bulk-status`, {
      ids,
      status
    });
    
    this.clearCache();
    
    return response;
  }

  /**
   * Получение истории изменений
   */
  async getHistory(id: string): Promise<Array<{
    id: string;
    action: string;
    changes: Record<string, any>;
    userId: string;
    timestamp: string;
  }>> {
    return this.api.get(`${this.endpoint}/${id}/history`);
  }

  /**
   * Восстановление удаленного {{entityName}}
   */
  async restore(id: string): Promise<{{EntityName}}> {
    const response = await this.api.post<{{EntityName}}>(`${this.endpoint}/${id}/restore`);
    
    this.clearCache();
    
    return response;
  }

  /**
   * Получение связанных сущностей
   */
  async getRelated(id: string, relation: string): Promise<any[]> {
    return this.api.get(`${this.endpoint}/${id}/${relation}`);
  }

  /**
   * Подписка на обновления через WebSocket
   */
  subscribeToUpdates(callback: (event: {
    type: 'created' | 'updated' | 'deleted';
    data: {{EntityName}};
  }) => void): () => void {
    // Реализация WebSocket подписки
    // Возвращает функцию отписки
    console.log('WebSocket subscription not implemented');
    return () => {};
  }

  // Вспомогательные методы

  /**
   * Форматирование фильтров для API
   */
  private formatFilters(filters: {{EntityName}}Filters): Record<string, any> {
    const formatted: Record<string, any> = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formatted[key] = value;
      }
    });

    return formatted;
  }

  /**
   * Генерация ключа кэша
   */
  private getCacheKey(type: string, params?: any): string {
    return `{{entityName}}:${type}:${JSON.stringify(params || {})}`;
  }

  /**
   * Получение из кэша
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Сохранение в кэш
   */
  private setCache(key: string, data: any, timeout?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Автоматическая очистка кэша
    setTimeout(() => {
      this.cache.delete(key);
    }, timeout || this.cacheTimeout);
  }

  /**
   * Очистка кэша списков
   */
  private clearListCache(): void {
    Array.from(this.cache.keys())
      .filter(key => key.includes(':list:'))
      .forEach(key => this.cache.delete(key));
  }

  /**
   * Обновление элемента в кэше списков
   */
  private updateListCache(item: {{EntityName}}): void {
    Array.from(this.cache.entries())
      .filter(([key]) => key.includes(':list:'))
      .forEach(([key, cached]) => {
        const listData = cached.data as {{EntityName}}ListResponse;
        const index = listData.items.findIndex(i => i.id === item.id);
        if (index !== -1) {
          listData.items[index] = item;
          this.cache.set(key, { ...cached, data: listData });
        }
      });
  }

  /**
   * Полная очистка кэша
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Установка таймаута кэша
   */
  setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
  }

  /**
   * Получение размера кэша
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Создаем и экспортируем экземпляр по умолчанию
const {{entityName}}Service = new {{ServiceName}}();

export default {{entityName}}Service;