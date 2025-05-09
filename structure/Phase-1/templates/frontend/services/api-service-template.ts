import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: Record<string, any>;
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/**
 * Configuration options for ApiService
 */
export interface ApiServiceConfig {
  /** Base URL for API requests */
  baseURL: string;
  /** Default request timeout in milliseconds */
  timeout?: number;
  /** Default headers to include with all requests */
  headers?: Record<string, string>;
  /** Whether to include credentials with requests */
  withCredentials?: boolean;
  /** Request interceptor */
  requestInterceptor?: (config: AxiosRequestConfig) => AxiosRequestConfig;
  /** Response interceptor */
  responseInterceptor?: (response: AxiosResponse<ApiResponse>) => AxiosResponse<ApiResponse>;
  /** Error interceptor */
  errorInterceptor?: (error: AxiosError) => Promise<any>;
  /** Default error handler */
  errorHandler?: (error: any) => void;
}

/**
 * API Service for making HTTP requests
 * 
 * This service provides a wrapper around Axios for making API requests
 * with standardized error handling and response formatting.
 * 
 * @example
 * ```ts
 * const api = new ApiService({
 *   baseURL: 'https://api.example.com',
 *   headers: {
 *     'Accept': 'application/json'
 *   }
 * });
 * 
 * // GET request
 * const users = await api.get('/users');
 * 
 * // POST request
 * const newUser = await api.post('/users', { name: 'John Doe' });
 * ```
 */
class ApiService {
  private client: AxiosInstance;
  private defaultErrorHandler: (error: any) => void;
  
  /**
   * Create a new ApiService instance
   * @param config - Configuration options
   */
  constructor(config: ApiServiceConfig) {
    // Create Axios instance
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers
      },
      withCredentials: config.withCredentials || false
    });
    
    // Store default error handler
    this.defaultErrorHandler = config.errorHandler || (
      (error: any) => console.error('API Error:', error)
    );
    
    // Add request interceptor
    this.client.interceptors.request.use(
      (axiosConfig) => {
        // Apply custom request interceptor if provided
        if (config.requestInterceptor) {
          return config.requestInterceptor(axiosConfig);
        }
        return axiosConfig;
      },
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Apply custom response interceptor if provided
        if (config.responseInterceptor) {
          return config.responseInterceptor(response);
        }
        return response;
      },
      (error: AxiosError) => {
        // Apply custom error interceptor if provided
        if (config.errorInterceptor) {
          return config.errorInterceptor(error);
        }
        
        // Default error handling
        return Promise.reject(this.formatError(error));
      }
    );
  }
  
  /**
   * Set authorization token
   * @param token - Authorization token
   */
  public setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  /**
   * Clear authorization token
   */
  public clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }
  
  /**
   * Format error response
   * @param error - Axios error
   * @returns Formatted error object
   * @private
   */
  private formatError(error: AxiosError<ApiResponse>): any {
    // Error from API with error structure
    if (error.response?.data?.error) {
      return {
        message: error.response.data.error.message || 'Unknown error',
        code: error.response.data.error.code || 'unknown_error',
        details: error.response.data.error.details,
        status: error.response.status
      };
    }
    
    // Network error
    if (error.code === 'ECONNABORTED') {
      return {
        message: 'Request timed out',
        code: 'timeout',
        status: 0
      };
    }
    
    if (!error.response) {
      return {
        message: 'Network error',
        code: 'network_error',
        status: 0
      };
    }
    
    // Generic HTTP error
    return {
      message: error.message || 'Unknown error',
      code: `http_${error.response.status}`,
      status: error.response.status
    };
  }
  
  /**
   * Send a GET request
   * @param url - Request URL
   * @param params - URL parameters
   * @param config - Additional request configuration
   * @returns Promise resolving to response data
   */
  public async get<T = any>(
    url: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, {
        params,
        ...config
      });
      
      return response.data.data as T;
    } catch (error) {
      this.defaultErrorHandler(error);
      throw error;
    }
  }
  
  /**
   * Send a POST request
   * @param url - Request URL
   * @param data - Request body
   * @param config - Additional request configuration
   * @returns Promise resolving to response data
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
      
      return response.data.data as T;
    } catch (error) {
      this.defaultErrorHandler(error);
      throw error;
    }
  }
  
  /**
   * Send a PUT request
   * @param url - Request URL
   * @param data - Request body
   * @param config - Additional request configuration
   * @returns Promise resolving to response data
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config);
      
      return response.data.data as T;
    } catch (error) {
      this.defaultErrorHandler(error);
      throw error;
    }
  }
  
  /**
   * Send a PATCH request
   * @param url - Request URL
   * @param data - Request body
   * @param config - Additional request configuration
   * @returns Promise resolving to response data
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data, config);
      
      return response.data.data as T;
    } catch (error) {
      this.defaultErrorHandler(error);
      throw error;
    }
  }
  
  /**
   * Send a DELETE request
   * @param url - Request URL
   * @param config - Additional request configuration
   * @returns Promise resolving to response data
   */
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      
      return response.data.data as T;
    } catch (error) {
      this.defaultErrorHandler(error);
      throw error;
    }
  }
  
  /**
   * Send a GET request with pagination
   * @param url - Request URL
   * @param params - Pagination parameters
   * @param config - Additional request configuration
   * @returns Promise resolving to paginated response
   */
  public async getPaginated<T = any>(
    url: string,
    params?: {
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      [key: string]: any;
    },
    config?: AxiosRequestConfig
  ): Promise<{
    data: T[];
    pagination: PaginationMeta;
    meta: Record<string, any>;
  }> {
    try {
      const response = await this.client.get<ApiResponse<T[]>>(url, {
        params: {
          page: 1,
          pageSize: 20,
          ...params
        },
        ...config
      });
      
      // Extract pagination metadata
      const pagination = response.data.meta?.pagination as PaginationMeta || {
        total: 0,
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
        pageCount: 0
      };
      
      return {
        data: response.data.data || [],
        pagination,
        meta: response.data.meta || {}
      };
    } catch (error) {
      this.defaultErrorHandler(error);
      throw error;
    }
  }
  
  /**
   * Upload a file
   * @param url - Request URL
   * @param file - File to upload
   * @param fieldName - Form field name for the file
   * @param additionalData - Additional form data
   * @param config - Additional request configuration
   * @returns Promise resolving to response data
   */
  public async uploadFile<T = any>(
    url: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      // Create form data
      const formData = new FormData();
      formData.append(fieldName, file);
      
      // Add additional data if provided
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      
      // Set content type header automatically for FormData
      const uploadConfig = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        ...config
      };
      
      const response = await this.client.post<ApiResponse<T>>(url, formData, uploadConfig);
      
      return response.data.data as T;
    } catch (error) {
      this.defaultErrorHandler(error);
      throw error;
    }
  }
  
  /**
   * Download a file
   * @param url - Request URL
   * @param params - URL parameters
   * @param filename - Filename to save as
   * @param config - Additional request configuration
   * @returns Promise resolving when download completes
   */
  public async downloadFile(
    url: string,
    params?: Record<string, any>,
    filename?: string,
    config?: AxiosRequestConfig
  ): Promise<void> {
    try {
      const response = await this.client.get(url, {
        params,
        responseType: 'blob',
        ...config
      });
      
      // Create blob URL
      const blob = new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Determine filename
      const downloadFilename = filename ||
        this.getFilenameFromResponse(response) ||
        `download-${new Date().getTime()}`;
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', downloadFilename);
      
      // Append to document, click, and clean up
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up blob URL
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      this.defaultErrorHandler(error);
      throw error;
    }
  }
  
  /**
   * Extract filename from response headers
   * @param response - Axios response
   * @returns Filename or null if not found
   * @private
   */
  private getFilenameFromResponse(response: AxiosResponse): string | null {
    // Try to get filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    
    if (contentDisposition) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(contentDisposition);
      
      if (matches && matches[1]) {
        return matches[1].replace(/['"]/g, '');
      }
    }
    
    return null;
  }
  
  /**
   * Send raw request (for advanced use cases)
   * @param config - Request configuration
   * @returns Promise resolving to Axios response
   */
  public async request<T = any>(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    try {
      return await this.client.request<ApiResponse<T>>(config);
    } catch (error) {
      this.defaultErrorHandler(error);
      throw error;
    }
  }
}

export default ApiService;

/**
 * Create a preconfigured API service
 * @param config - Partial configuration, will be merged with defaults
 * @returns Configured API service instance
 */
export function createApiService(
  config: Partial<ApiServiceConfig> & { baseURL: string }
): ApiService {
  // Default error handler
  const defaultErrorHandler = (error: any) => {
    console.error('API Error:', error);
    
    // Show error notification, dispatch to error tracking, etc.
    if (typeof window !== 'undefined') {
      // Example: trigger custom error event
      const errorEvent = new CustomEvent('api-error', { detail: error });
      window.dispatchEvent(errorEvent);
    }
  };
  
  // Default request interceptor
  const defaultRequestInterceptor = (config: AxiosRequestConfig) => {
    // Add timestamp to prevent caching
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  };
  
  // Default configuration
  const defaultConfig: ApiServiceConfig = {
    baseURL: config.baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    withCredentials: false,
    requestInterceptor: defaultRequestInterceptor,
    errorHandler: defaultErrorHandler
  };
  
  // Merge with provided config
  const mergedConfig: ApiServiceConfig = {
    ...defaultConfig,
    ...config,
    headers: {
      ...defaultConfig.headers,
      ...config.headers
    }
  };
  
  return new ApiService(mergedConfig);
}
