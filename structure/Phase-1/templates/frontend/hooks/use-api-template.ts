/**
 * Шаблон хука для работы с API
 * Базовый шаблон для создания хуков для взаимодействия с API
 * 
 * Использование:
 * 1. Скопировать файл в директорию hooks
 * 2. Заменить {{HookName}} на название хука (например, useUserApi)
 * 3. Заменить {{EntityName}} на название сущности (например, User)
 * 4. Заменить {{endpoint}} на базовый endpoint API (например, /api/users)
 * 5. Адаптировать методы и типы под специфику API
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios, { AxiosError, CancelTokenSource } from 'axios';
import { useAuth } from './useAuth';
import { useNotification } from './useNotification';

/**
 * Конфигурация хука
 */
interface {{HookName}}Options<T = any> {
  // Автоматически выполнить запрос при монтировании
  enabled?: boolean;
  // Начальные данные
  initialData?: T;
  // Параметры запроса
  params?: Record<string, any>;
  // Колбэки
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  // Настройки кэширования
  cacheTime?: number;
  staleTime?: number;
  // Настройки повторных попыток
  retry?: boolean | number;
  retryDelay?: number;
  // Преобразование данных
  transform?: (data: any) => T;
  // Дополнительные заголовки
  headers?: Record<string, string>;
}

/**
 * Состояние хука
 */
interface {{HookName}}State<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isValidating: boolean;
  isStale: boolean;
}

/**
 * Возвращаемое значение хука
 */
interface {{HookName}}Result<T> extends {{HookName}}State<T> {
  refetch: () => Promise<T | null>;
  mutate: (data: Partial<T>) => void;
  reset: () => void;
  cancel: () => void;
}

/**
 * Кэш для хранения данных
 */
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * Хук для работы с API {{EntityName}}
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = {{HookName}}('/users/123', {
 *   onSuccess: (user) => console.log('User loaded:', user),
 *   transform: (data) => ({ ...data, fullName: `${data.firstName} ${data.lastName}` })
 * });
 * ```
 */
export function {{HookName}}<T = any>(
  endpoint: string | null,
  options: {{HookName}}Options<T> = {}
): {{HookName}}Result<T> {
  const {
    enabled = true,
    initialData = null,
    params = {},
    onSuccess,
    onError,
    onSettled,
    cacheTime = 5 * 60 * 1000, // 5 минут
    staleTime = 60 * 1000, // 1 минута
    retry = 3,
    retryDelay = 1000,
    transform,
    headers = {}
  } = options;

  const { token } = useAuth();
  const { showNotification } = useNotification();
  
  // Состояние
  const [state, setState] = useState<{{HookName}}State<T>>({
    data: initialData,
    loading: false,
    error: null,
    isValidating: false,
    isStale: false
  });

  // Рефы
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);
  const lastFetchTimeRef = useRef<number>(0);

  // Генерация ключа для кэша
  const cacheKey = useMemo(() => {
    if (!endpoint) return null;
    const paramString = JSON.stringify(params);
    return `${endpoint}:${paramString}`;
  }, [endpoint, params]);

  /**
   * Проверка, устарели ли данные
   */
  const checkIfStale = useCallback(() => {
    if (!lastFetchTimeRef.current) return true;
    const now = Date.now();
    return now - lastFetchTimeRef.current > staleTime;
  }, [staleTime]);

  /**
   * Получение данных из кэша
   */
  const getCachedData = useCallback((): T | null => {
    if (!cacheKey) return null;
    
    const cached = cache.get(cacheKey);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cacheTime) {
      cache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }, [cacheKey, cacheTime]);

  /**
   * Сохранение данных в кэш
   */
  const setCachedData = useCallback((data: T) => {
    if (!cacheKey) return;
    
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }, [cacheKey]);

  /**
   * Выполнение запроса к API
   */
  const fetchData = useCallback(async (): Promise<T | null> => {
    if (!endpoint) return null;

    // Отменяем предыдущий запрос
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('New request initiated');
    }

    // Создаем новый токен отмены
    cancelTokenRef.current = axios.CancelToken.source();

    setState(prev => ({
      ...prev,
      loading: !prev.data,
      isValidating: !!prev.data,
      error: null
    }));

    try {
      const response = await axios({
        method: 'GET',
        url: endpoint,
        params,
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          ...headers
        },
        cancelToken: cancelTokenRef.current.token
      });

      const data = transform ? transform(response.data) : response.data;
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          data,
          loading: false,
          isValidating: false,
          error: null,
          isStale: false
        }));

        setCachedData(data);
        lastFetchTimeRef.current = Date.now();
        retryCountRef.current = 0;
        
        onSuccess?.(data);
        onSettled?.();
      }

      return data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        return null;
      }

      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 
                          axiosError.message || 
                          'An error occurred';
      
      const appError = new Error(errorMessage);
      
      if (mountedRef.current) {
        // Обработка повторных попыток
        const shouldRetry = typeof retry === 'boolean' ? retry : retryCountRef.current < retry;
        const isRetryableError = !axiosError.response || 
                                axiosError.response.status >= 500 ||
                                axiosError.code === 'ECONNABORTED';

        if (shouldRetry && isRetryableError) {
          retryCountRef.current++;
          const delay = retryDelay * Math.pow(2, retryCountRef.current - 1); // Экспоненциальная задержка
          
          console.log(`Retrying request (attempt ${retryCountRef.current})...`);
          
          setTimeout(() => {
            if (mountedRef.current) {
              fetchData();
            }
          }, delay);
          
          return null;
        }

        setState(prev => ({
          ...prev,
          loading: false,
          isValidating: false,
          error: appError
        }));

        onError?.(appError);
        onSettled?.();
      }

      return null;
    }
  }, [endpoint, params, token, headers, transform, onSuccess, onError, onSettled, 
      retry, retryDelay, setCachedData]);

  /**
   * Обновление данных
   */
  const refetch = useCallback(async (): Promise<T | null> => {
    retryCountRef.current = 0;
    return fetchData();
  }, [fetchData]);

  /**
   * Мутация данных (оптимистичное обновление)
   */
  const mutate = useCallback((newData: Partial<T>) => {
    setState(prev => ({
      ...prev,
      data: prev.data ? { ...prev.data, ...newData } : (newData as T),
      isStale: true
    }));
    
    if (cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached) {
        cache.set(cacheKey, {
          ...cached,
          data: { ...cached.data, ...newData }
        });
      }
    }
  }, [cacheKey]);

  /**
   * Сброс состояния
   */
  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      isValidating: false,
      isStale: false
    });
    retryCountRef.current = 0;
    lastFetchTimeRef.current = 0;
  }, [initialData]);

  /**
   * Отмена запроса
   */
  const cancel = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Request cancelled by user');
      cancelTokenRef.current = null;
    }
  }, []);

  /**
   * Эффект для автоматического выполнения запроса
   */
  useEffect(() => {
    if (!enabled || !endpoint) return;

    // Проверяем кэш
    const cachedData = getCachedData();
    if (cachedData) {
      setState(prev => ({
        ...prev,
        data: cachedData,
        isStale: checkIfStale()
      }));
      
      // Если данные устарели, обновляем в фоне
      if (checkIfStale()) {
        fetchData();
      }
    } else {
      fetchData();
    }

    return () => {
      cancel();
    };
  }, [enabled, endpoint, cacheKey]); // Исключаем функции из зависимостей

  /**
   * Эффект для отслеживания монтирования компонента
   */
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Периодическая проверка устаревания данных
   */
  useEffect(() => {
    if (!state.data || state.loading || state.isValidating) return;

    const intervalId = setInterval(() => {
      if (checkIfStale() && !state.isStale) {
        setState(prev => ({ ...prev, isStale: true }));
      }
    }, 10000); // Проверяем каждые 10 секунд

    return () => clearInterval(intervalId);
  }, [state.data, state.loading, state.isValidating, state.isStale, checkIfStale]);

  return {
    ...state,
    refetch,
    mutate,
    reset,
    cancel
  };
}

/**
 * Хук для выполнения мутаций (POST, PUT, DELETE)
 */
export function {{HookName}}Mutation<TData = any, TVariables = any>(
  endpoint: string,
  options: {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    transform?: (data: any) => TData;
  } = {}
) {
  const { method = 'POST', onSuccess, onError, transform } = options;
  const { token } = useAuth();
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables?: TVariables): Promise<TData | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios({
        method,
        url: endpoint,
        data: variables,
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      const data = transform ? transform(response.data) : response.data;
      
      onSuccess?.(data);
      showNotification({
        type: 'success',
        message: 'Operation completed successfully'
      });

      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 
                          axiosError.message || 
                          'An error occurred';
      
      const appError = new Error(errorMessage);
      setError(appError);
      
      onError?.(appError);
      showNotification({
        type: 'error',
        message: errorMessage
      });

      return null;
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, token, transform, onSuccess, onError, showNotification]);

  return {
    mutate,
    loading,
    error
  };
}

/**
 * Хук для работы с пагинацией
 */
export function {{HookName}}Paginated<T = any>(
  baseEndpoint: string,
  options: {{HookName}}Options<T> & {
    pageSize?: number;
    initialPage?: number;
  } = {}
) {
  const { pageSize = 20, initialPage = 1, ...apiOptions } = options;
  const [page, setPage] = useState(initialPage);

  const { data, loading, error, refetch } = {{HookName}}<{
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(baseEndpoint, {
    ...apiOptions,
    params: {
      ...apiOptions.params,
      page,
      limit: pageSize
    }
  });

  const nextPage = useCallback(() => {
    if (data && page < data.totalPages) {
      setPage(prev => prev + 1);
    }
  }, [data, page]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    if (data && newPage >= 1 && newPage <= data.totalPages) {
      setPage(newPage);
    }
  }, [data]);

  return {
    items: data?.items || [],
    total: data?.total || 0,
    page: data?.page || page,
    pageSize: data?.pageSize || pageSize,
    totalPages: data?.totalPages || 0,
    loading,
    error,
    refetch,
    nextPage,
    previousPage,
    goToPage,
    hasNextPage: data ? page < data.totalPages : false,
    hasPreviousPage: page > 1
  };
}

/**
 * Хук для бесконечной прокрутки
 */
export function {{HookName}}InfiniteScroll<T = any>(
  baseEndpoint: string,
  options: {{HookName}}Options<T[]> & {
    pageSize?: number;
  } = {}
) {
  const { pageSize = 20, ...apiOptions } = options;
  const [pages, setPages] = useState<T[][]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const currentPageRef = useRef(1);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const response = await axios({
        method: 'GET',
        url: baseEndpoint,
        params: {
          ...apiOptions.params,
          page: currentPageRef.current,
          limit: pageSize
        }
      });

      const newItems = response.data.items || [];
      
      if (newItems.length < pageSize) {
        setHasMore(false);
      }

      setPages(prev => [...prev, newItems]);
      currentPageRef.current++;
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [baseEndpoint, apiOptions.params, pageSize, loadingMore, hasMore]);

  const reset = useCallback(() => {
    setPages([]);
    setHasMore(true);
    currentPageRef.current = 1;
  }, []);

  const allItems = useMemo(() => pages.flat(), [pages]);

  return {
    items: allItems,
    loadMore,
    loadingMore,
    hasMore,
    reset
  };
}