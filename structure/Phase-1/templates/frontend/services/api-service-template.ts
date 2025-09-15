/**
 * Шаблон сервиса API
 * Базовый шаблон для создания сервисов взаимодействия с API
 * 
 * Использование:
 * 1. Скопировать файл в директорию services
 * 2. Заменить {{ServiceName}} на название сервиса (например, ApiService)
 * 3. Адаптировать базовый URL и методы под специфику API
 */

import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig 
} from 'axios';

/**
 * Интерфейс конфигурации API
 */
interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Интерфейс ответа API
 */
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    timestamp?: string;
    version?: string;
  };
}

/**
 * Интерфейс ошибки API
 */
interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
}

/**
 * Типы методов HTTP
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Класс для работы с API
 * 
 * @example
 * ```ts
 * const api = new {{ServiceName}}({
 *   baseURL: 'https://api.example.com',
 *   timeout: 30000
 * });
 * 
 * const users = await api.get<User[]>('/users');
 * const newUser = await api.post<User>('/users', { name: 'John' });
 * ```
 */
export class {{ServiceName}} {
  private client: AxiosInstance;
  private config: ApiConfig;
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.client = this.createClient();
    this.setupInterceptors();
    this.loadTokens();
  }

  /**
   * Создание экземпляра axios
   */
  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.config.headers
      },
      withCredentials: this.config.withCredentials
    });
  }

  /**
   * Настройка interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => this.handleRequest(config),
      (error: AxiosError) => this.handleRequestError(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => this.handleResponse(response),
      (error: AxiosError) => this.handleResponseError(error)
    );
  }

  /**
   * Обработка запроса
   */
  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    // Добавляем токен авторизации
    if (this.authToken && config.headers) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }

    // Добавляем уникальный ID запроса для трассировки
    config.headers['X-Request-ID'] = this.generateRequestId();

    // Логирование в development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data
      });
    }

    return config;
  }

  /**
   * Обработка ошибки запроса
   */
  private handleRequestError(error: AxiosError): Promise<never> {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }

  /**
   * Обработка ответа
   */
  private handleResponse(response: AxiosResponse): AxiosResponse {
    // Логирование в development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Response ${response.status}:`, response.data);
    }

    // Обработка специальных заголовков
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      this.setAuthToken(newToken);
    }

    return response;
  }

  /**
   * Обработка ошибки ответа
   */
  private async handleResponseError(error: AxiosError): Promise<never> {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Обработка 401 ошибки (неавторизован)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (this.refreshToken) {
        if (this.isRefreshing) {
          // Если уже идет обновление токена, ждем результата
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            })
            .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        this.isRefreshing = true;

        try {
          const newToken = await this.refreshAccessToken();
          this.isRefreshing = false;
          this.processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return this.client(originalRequest);
        } catch (refreshError) {
          this.isRefreshing = false;
          this.processQueue(refreshError as Error, null);
          this.clearTokens();
          // Перенаправление на страницу логина
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // Нет refresh токена, перенаправляем на логин
        this.clearTokens();
        window.location.href = '/login';
      }
    }

    // Обработка других ошибок с retry логикой
    const retryCount = (originalRequest as any)._retryCount || 0;
    const shouldRetry = this.shouldRetry(error) && retryCount < this.config.retryAttempts!;

    if (shouldRetry) {
      (originalRequest as any)._retryCount = retryCount + 1;
      
      await this.delay(this.config.retryDelay! * Math.pow(2, retryCount));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] Retrying request (attempt ${retryCount + 1})`);
      }
      
      return this.client(originalRequest);
    }

    // Форматирование ошибки
    const apiError = this.formatError(error);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('[API] Response error:', apiError);
    }

    return Promise.reject(apiError);
  }

  /**
   * Проверка необходимости повторной попытки
   */
  private shouldRetry(error: AxiosError): boolean {
    // Повторяем при сетевых ошибках
    if (!error.response) return true;
    
    // Повторяем при 5xx ошибках сервера
    const status = error.response.status;
    return status >= 500 && status < 600;
  }

  /**
   * Форматирование ошибки
   */
  private formatError(error: AxiosError<ApiError>): Error {
    if (error.response?.data) {
      const apiError = error.response.data;
      const formattedError = new Error(apiError.message || 'An error occurred');
      (formattedError as any).code = apiError.code;
      (formattedError as any).details = apiError.details;
      (formattedError as any).status = error.response.status;
      return formattedError;
    }

    if (error.request) {
      const networkError = new Error('Network error: Unable to connect to server');
      (networkError as any).code = 'NETWORK_ERROR';
      return networkError;
    }

    return new Error(error.message || 'An unexpected error occurred');
  }

  /**
   * Обработка очереди запросов при обновлении токена
   */
  private processQueue(error: Error | null, token: string | null = null): void {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token!);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Обновление access токена
   */
  private async refreshAccessToken(): Promise<string> {
    const response = await this.client.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
      refreshToken: this.refreshToken
    });

    const { accessToken } = response.data.data;
    this.setAuthToken(accessToken);
    
    return accessToken;
  }

  /**
   * Генерация уникального ID запроса
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Задержка для retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Загрузка токенов из localStorage
   */
  private loadTokens(): void {
    this.authToken = localStorage.getItem('authToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  /**
   * Сохранение токенов
   */
  private saveTokens(): void {
    if (this.authToken) {
      localStorage.setItem('authToken', this.authToken);
    }
    if (this.refreshToken) {
      localStorage.setItem('refreshToken', this.refreshToken);
    }
  }

  /**
   * Очистка токенов
   */
  private clearTokens(): void {
    this.authToken = null;
    this.refreshToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Установка токена авторизации
   */
  public setAuthToken(token: string): void {
    this.authToken = token;
    this.saveTokens();
  }

  /**
   * Установка refresh токена
   */
  public setRefreshToken(token: string): void {
    this.refreshToken = token;
    this.saveTokens();
  }

  /**
   * Установка токенов
   */
  public setTokens(authToken: string, refreshToken: string): void {
    this.authToken = authToken;
    this.refreshToken = refreshToken;
    this.saveTokens();
  }

  /**
   * Выход из системы
   */
  public logout(): void {
    this.clearTokens();
  }

  /**
   * Выполнение запроса
   */
  private async request<T>(
    method: HttpMethod,
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.request<ApiResponse<T>>({
        method,
        url,
        data,
        ...config
      });

      // Извлекаем данные из стандартного формата ответа
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Request failed');
      }
    } catch (error) {
      // Если ошибка уже обработана, просто пробрасываем
      throw error;
    }
  }

  /**
   * GET запрос
   */
  public get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  /**
   * POST запрос
   */
  public post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  /**
   * PUT запрос
   */
  public put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  /**
   * PATCH запрос
   */
  public patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }

  /**
   * DELETE запрос
   */
  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  /**
   * Загрузка файла
   */
  public async upload<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    // Добавляем дополнительные данные
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    });
  }

  /**
   * Скачивание файла
   */
  public async download(url: string, filename?: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: 'blob'
    });

    // Получаем имя файла из заголовков или используем переданное
    const contentDisposition = response.headers['content-disposition'];
    const fileNameMatch = contentDisposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    const downloadFilename = filename || (fileNameMatch && fileNameMatch[1]) || 'download';

    // Создаем ссылку для скачивания
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = downloadFilename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }

  /**
   * Отмена всех активных запросов
   */
  public cancelAllRequests(): void {
    // В axios 0.22+ используется AbortController
    // Здесь можно реализовать логику отмены через AbortController
    console.log('Cancelling all requests...');
  }

  /**
   * Получение базового URL
   */
  public getBaseURL(): string {
    return this.config.baseURL;
  }

  /**
   * Установка базового URL
   */
  public setBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }

  /**
   * Получение заголовков по умолчанию
   */
  public getDefaultHeaders(): Record<string, string> {
    return this.client.defaults.headers.common as Record<string, string>;
  }

  /**
   * Установка заголовка по умолчанию
   */
  public setDefaultHeader(key: string, value: string): void {
    this.client.defaults.headers.common[key] = value;
  }

  /**
   * Удаление заголовка по умолчанию
   */
  public removeDefaultHeader(key: string): void {
    delete this.client.defaults.headers.common[key];
  }
}

// Создаем и экспортируем экземпляр по умолчанию
const apiService = new {{ServiceName}}({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  withCredentials: true
});

export default apiService;