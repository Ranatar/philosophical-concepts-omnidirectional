import ApiService from './api-service-template';

/**
 * Base entity interface
 */
export interface Entity {
  id: string;
  [key: string]: any;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

/**
 * Entity service options
 */
export interface EntityServiceOptions {
  /** Base API endpoint for the entity */
  endpoint: string;
  /** API service instance */
  apiService: ApiService;
  /** Transform function for entity data */
  transform?: (data: any) => any;
  /** Transform function for creating entity data */
  transformCreate?: (data: any) => any;
  /** Transform function for updating entity data */
  transformUpdate?: (data: any) => any;
}

/**
 * Generic entity service for CRUD operations
 * 
 * This service provides standardized methods for working with API entities.
 * 
 * @example
 * ```ts
 * const userService = new EntityService<User>({
 *   endpoint: '/users',
 *   apiService
 * });
 * 
 * // Get all users
 * const users = await userService.getAll();
 * 
 * // Get user by ID
 * const user = await userService.getById('123');
 * 
 * // Create new user
 * const newUser = await userService.create({ name: 'John Doe', email: 'john@example.com' });
 * ```
 */
class EntityService<T extends Entity> {
  /**
   * Base API endpoint for the entity
   * @private
   */
  private endpoint: string;
  
  /**
   * API service instance
   * @private
   */
  private api: ApiService;
  
  /**
   * Transform function for entity data
   * @private
   */
  private transform: (data: any) => any;
  
  /**
   * Transform function for creating entity data
   * @private
   */
  private transformCreate: (data: any) => any;
  
  /**
   * Transform function for updating entity data
   * @private
   */
  private transformUpdate: (data: any) => any;
  
  /**
   * Create a new EntityService instance
   * @param options - Entity service options
   */
  constructor(options: EntityServiceOptions) {
    this.endpoint = options.endpoint;
    this.api = options.apiService;
    
    // Set up transform functions
    this.transform = options.transform || ((data) => data);
    this.transformCreate = options.transformCreate || ((data) => data);
    this.transformUpdate = options.transformUpdate || ((data) => data);
  }
  
  /**
   * Get all entities with pagination
   * @param params - Pagination parameters
   * @returns Promise resolving to paginated entity data
   */
  public async getAll(params?: PaginationParams) {
    const response = await this.api.getPaginated<T>(this.endpoint, params);
    
    // Transform entities
    const transformedData = response.data.map(entity => this.transform(entity));
    
    return {
      data: transformedData,
      pagination: response.pagination,
      meta: response.meta
    };
  }
  
  /**
   * Get entity by ID
   * @param id - Entity ID
   * @returns Promise resolving to entity data
   */
  public async getById(id: string): Promise<T> {
    const data = await this.api.get<T>(`${this.endpoint}/${id}`);
    return this.transform(data);
  }
  
  /**
   * Create new entity
   * @param data - Entity data to create
   * @returns Promise resolving to created entity
   */
  public async create(data: Partial<T>): Promise<T> {
    const transformedData = this.transformCreate(data);
    const createdEntity = await this.api.post<T>(this.endpoint, transformedData);
    return this.transform(createdEntity);
  }
  
  /**
   * Update entity
   * @param id - Entity ID
   * @param data - Entity data to update
   * @returns Promise resolving to updated entity
   */
  public async update(id: string, data: Partial<T>): Promise<T> {
    const transformedData = this.transformUpdate(data);
    const updatedEntity = await this.api.put<T>(`${this.endpoint}/${id}`, transformedData);
    return this.transform(updatedEntity);
  }
  
  /**
   * Delete entity
   * @param id - Entity ID
   * @returns Promise resolving to deleted entity ID
   */
  public async delete(id: string): Promise<string> {
    await this.api.delete(`${this.endpoint}/${id}`);
    return id;
  }
  
  /**
   * Search entities
   * @param query - Search query
   * @param params - Additional parameters
   * @returns Promise resolving to search results
   */
  public async search(query: string, params?: PaginationParams) {
    const searchParams = {
      ...params,
      query
    };
    
    const response = await this.api.getPaginated<T>(
      `${this.endpoint}/search`,
      searchParams
    );
    
    // Transform entities
    const transformedData = response.data.map(entity => this.transform(entity));
    
    return {
      data: transformedData,
      pagination: response.pagination,
      meta: response.meta
    };
  }
  
  /**
   * Execute custom action on entity
   * @param id - Entity ID
   * @param action - Action name
   * @param data - Action data
   * @returns Promise resolving to action result
   */
  public async executeAction<R = any>(
    id: string,
    action: string,
    data?: any
  ): Promise<R> {
    return this.api.post<R>(`${this.endpoint}/${id}/actions/${action}`, data);
  }
  
  /**
   * Execute bulk action on multiple entities
   * @param ids - Entity IDs
   * @param action - Action name
   * @param data - Action data
   * @returns Promise resolving to action result
   */
  public async executeBulkAction<R = any>(
    ids: string[],
    action: string,
    data?: any
  ): Promise<R> {
    return this.api.post<R>(`${this.endpoint}/bulk/${action}`, {
      ids,
      ...data
    });
  }
  
  /**
   * Get related entities
   * @param id - Entity ID
   * @param relationship - Relationship name
   * @param params - Pagination parameters
   * @returns Promise resolving to related entities
   */
  public async getRelated<R extends Entity>(
    id: string,
    relationship: string,
    params?: PaginationParams
  ) {
    const response = await this.api.getPaginated<R>(
      `${this.endpoint}/${id}/${relationship}`,
      params
    );
    
    return {
      data: response.data,
      pagination: response.pagination,
      meta: response.meta
    };
  }
  
  /**
   * Add related entity
   * @param id - Entity ID
   * @param relationship - Relationship name
   * @param relatedId - Related entity ID
   * @param data - Additional data
   * @returns Promise resolving to updated relationship
   */
  public async addRelated<R = any>(
    id: string,
    relationship: string,
    relatedId: string,
    data?: any
  ): Promise<R> {
    return this.api.post<R>(
      `${this.endpoint}/${id}/${relationship}/${relatedId}`,
      data
    );
  }
  
  /**
   * Remove related entity
   * @param id - Entity ID
   * @param relationship - Relationship name
   * @param relatedId - Related entity ID
   * @returns Promise resolving when relationship is removed
   */
  public async removeRelated(
    id: string,
    relationship: string,
    relatedId: string
  ): Promise<void> {
    await this.api.delete(`${this.endpoint}/${id}/${relationship}/${relatedId}`);
  }
  
  /**
   * Export entities to a file
   * @param format - Export format (csv, xlsx, etc.)
   * @param filters - Export filters
   * @returns Promise resolving when export completes
   */
  public async exportEntities(
    format: string = 'csv',
    filters?: Record<string, any>
  ): Promise<void> {
    await this.api.downloadFile(
      `${this.endpoint}/export`,
      {
        format,
        ...filters
      },
      `export-${new Date().toISOString()}.${format}`
    );
  }
  
  /**
   * Import entities from file
   * @param file - File to import
   * @param options - Import options
   * @returns Promise resolving to import result
   */
  public async importEntities<R = any>(
    file: File,
    options?: {
      mode?: 'create' | 'update' | 'upsert';
      [key: string]: any;
    }
  ): Promise<R> {
    return this.api.uploadFile<R>(
      `${this.endpoint}/import`,
      file,
      'file',
      options
    );
  }
  
  /**
   * Get entity statistics
   * @param params - Query parameters
   * @returns Promise resolving to entity statistics
   */
  public async getStatistics<R = any>(
    params?: Record<string, any>
  ): Promise<R> {
    return this.api.get<R>(`${this.endpoint}/stats`, params);
  }
}

export default EntityService;

/**
 * Create specific entity service factory
 * 
 * This is a helper function to create type-specific entity services.
 * 
 * @example
 * ```ts
 * // User entity interface
 * interface User extends Entity {
 *   name: string;
 *   email: string;
 * }
 * 
 * // Create user service factory
 * const createUserService = createEntityServiceFactory<User>('/users');
 * 
 * // Create user service instance
 * const userService = createUserService(apiService);
 * ```
 */
export function createEntityServiceFactory<T extends Entity>(
  endpoint: string,
  transformOptions?: {
    transform?: (data: any) => any;
    transformCreate?: (data: any) => any;
    transformUpdate?: (data: any) => any;
  }
) {
  return (apiService: ApiService): EntityService<T> => {
    return new EntityService<T>({
      endpoint,
      apiService,
      ...transformOptions
    });
  };
}
