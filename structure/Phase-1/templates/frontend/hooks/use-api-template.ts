import { useState, useEffect, useCallback, useRef } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * API response interface
 */
interface ApiResponse<T> {
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
 * Pagination response interface
 */
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      pageCount: number;
    };
    [key: string]: any;
  };
}

/**
 * API state interface
 */
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  statusCode: number | null;
  meta: Record<string, any> | null;
}

/**
 * Error details from API
 */
interface ApiErrorDetails {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

/**
 * API options interface
 */
interface ApiOptions<T> extends AxiosRequestConfig {
  /** Mock response for testing */
  mockResponse?: ApiResponse<T>;
  /** Whether to enable mock response */
  enableMock?: boolean;
  /** Delay for mock response (ms) */
  mockDelay?: number;
  /** Whether to skip automatic execution */
  skip?: boolean;
  /** Automatic retry configuration */
  retry?: {
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Delay between retries (ms) */
    retryDelay: number;
    /** Whether to use exponential backoff */
    useExponentialBackoff?: boolean;
    /** Status codes that should be retried */
    retryStatusCodes?: number[];
  };
  /** Callback when request is successful */
  onSuccess?: (data: T, response: AxiosResponse<ApiResponse<T>>) => void;
  /** Callback when request fails */
  onError?: (error: ApiErrorDetails) => void;
  /** Transform response data before setting state */
  transformResponse?: (data: T) => any;
  /** Cache key for result caching */
  cacheKey?: string;
  /** Cache time in ms (default: 5 minutes) */
  cacheTime?: number;
}

/**
 * Default API state
 */
const defaultApiState = {
  data: null,
  loading: false,
  error: null,
  status: 'idle' as const,
  statusCode: null,
  meta: null,
};

/**
 * In-memory cache for API responses
 */
const apiCache: Record<string, {
  data: any;
  timestamp: number;
  meta: any;
}> = {};

/**
 * Process API error
 */
function processApiError(error: AxiosError<ApiResponse<any>>): ApiErrorDetails {
  // Get status code
  const statusCode = error.response?.status || 0;
  
  // Get error details from response if available
  if (error.response?.data?.error) {
    return {
      code: error.response.data.error.code || 'unknown_error',
      message: error.response.data.error.message || error.message,
      details: error.response.data.error.details,
      statusCode
    };
  }
  
  // Network error
  if (error.code === 'ECONNABORTED') {
    return {
      code: 'timeout',
      message: 'Request timed out',
      statusCode
    };
  }
  
  if (!error.response) {
    return {
      code: 'network_error',
      message: 'Network error',
      statusCode
    };
  }
  
  // Default error
  return {
    code: `http_${statusCode}`,
    message: error.message || 'Unknown error',
    statusCode
  };
}

/**
 * Custom hook for making API requests
 * 
 * @example Basic usage
 * ```ts
 * const { data, loading, error, executeRequest } = useApi<User[]>({
 *   url: '/api/users',
 *   method: 'GET'
 * });
 * ```
 * 
 * @example With pagination
 * ```ts
 * const { data, loading, error, meta, executeRequest } = useApi<User[]>({
 *   url: '/api/users',
 *   method: 'GET',
 *   params: { page: 1, pageSize: 10 }
 * });
 * 
 * // Access pagination info
 * const { total, page, pageSize } = meta?.pagination || {};
 * ```
 * 
 * @example With manual execution
 * ```ts
 * const { data, loading, executeRequest } = useApi<User>({
 *   url: '/api/users',
 *   method: 'POST',
 *   skip: true // Skip automatic execution
 * });
 * 
 * const handleSubmit = (userData) => {
 *   executeRequest({ data: userData });
 * };
 * ```
 */
function useApi<T = any>(options: ApiOptions<T>): ApiState<T> & {
  executeRequest: (overrideOptions?: Partial<ApiOptions<T>>) => Promise<T | null>;
  reset: () => void;
} {
  // Request state
  const [state, setState] = useState<ApiState<T>>({
    ...defaultApiState
  });
  
  // Reference to the current options
  const optionsRef = useRef(options);
  
  // Last request time for caching
  const lastRequestTimeRef = useRef<number>(0);
  
  // Track if component is mounted
  const isMountedRef = useRef(true);
  
  // Track current retry count
  const retryCountRef = useRef(0);
  
  // Update options when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  
  // Check if we should use cached data
  const getCachedData = useCallback(() => {
    const { cacheKey, cacheTime = 5 * 60 * 1000 } = optionsRef.current;
    
    if (!cacheKey) return null;
    
    const cachedItem = apiCache[cacheKey];
    
    if (
      cachedItem &&
      Date.now() - cachedItem.timestamp < cacheTime
    ) {
      return cachedItem;
    }
    
    return null;
  }, []);
  
  // Store data in cache
  const setCacheData = useCallback((data: T, meta: any) => {
    const { cacheKey } = optionsRef.current;
    
    if (cacheKey) {
      apiCache[cacheKey] = {
        data,
        meta,
        timestamp: Date.now()
      };
    }
  }, []);
  
  // Main request function
  const makeRequest = useCallback(async (
    requestOptions: ApiOptions<T> = optionsRef.current
  ): Promise<T | null> => {
    // Skip if explicitly requested
    if (requestOptions.skip) {
      return null;
    }
    
    // Check for cached data
    const cachedData = getCachedData();
    if (cachedData) {
      if (isMountedRef.current) {
        setState({
          data: cachedData.data,
          meta: cachedData.meta,
          loading: false,
          error: null,
          status: 'success',
          statusCode: 200
        });
      }
      return cachedData.data;
    }
    
    // Show loading state
    if (isMountedRef.current) {
      setState(prev => ({
        ...prev,
        loading: true,
        status: 'loading',
        error: null
      }));
    }
    
    try {
      let response;
      
      // Use mock response if provided
      if (requestOptions.enableMock && requestOptions.mockResponse) {
        // Simulate network delay
        await new Promise(resolve => 
          setTimeout(resolve, requestOptions.mockDelay || 500)
        );
        
        response = {
          data: requestOptions.mockResponse,
          status: 200
        } as AxiosResponse<ApiResponse<T>>;
      } else {
        // Remove hook-specific options before making the request
        const {
          mockResponse,
          enableMock,
          mockDelay,
          skip,
          retry,
          onSuccess,
          onError,
          transformResponse,
          cacheKey,
          cacheTime,
          ...axiosOptions
        } = requestOptions;
        
        // Make the request
        lastRequestTimeRef.current = Date.now();
        response = await axios.request<ApiResponse<T>>(axiosOptions);
      }
      
      // Reset retry count on success
      retryCountRef.current = 0;
      
      // Extract data and metadata
      let responseData = response.data.data || null;
      const meta = response.data.meta || null;
      
      // Apply transform if provided
      if (requestOptions.transformResponse && responseData) {
        responseData = requestOptions.transformResponse(responseData as T);
      }
      
      // Store in cache
      setCacheData(responseData as T, meta);
      
      // Call success callback
      if (requestOptions.onSuccess && responseData) {
        requestOptions.onSuccess(responseData as T, response);
      }
      
      // Update state if component is still mounted
      if (isMountedRef.current) {
        setState({
          data: responseData as T,
          meta,
          loading: false,
          error: null,
          status: 'success',
          statusCode: response.status
        });
      }
      
      return responseData as T;
    } catch (err) {
      const error = err as AxiosError<ApiResponse<T>>;
      const errorDetails = processApiError(error);
      
      // Check if we should retry
      const { retry } = requestOptions;
      if (
        retry &&
        retryCountRef.current < retry.maxRetries &&
        (!retry.retryStatusCodes || retry.retryStatusCodes.includes(errorDetails.statusCode))
      ) {
        retryCountRef.current++;
        
        // Calculate retry delay
        let delay = retry.retryDelay;
        if (retry.useExponentialBackoff) {
          delay = retry.retryDelay * Math.pow(2, retryCountRef.current - 1);
        }
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeRequest(requestOptions);
      }
      
      // Reset retry count
      retryCountRef.current = 0;
      
      // Call error callback
      if (requestOptions.onError) {
        requestOptions.onError(errorDetails);
      }
      
      // Update state if component is still mounted
      if (isMountedRef.current) {
        setState({
          data: null,
          loading: false,
          error: errorDetails.message,
          status: 'error',
          statusCode: errorDetails.statusCode,
          meta: null
        });
      }
      
      return null;
    }
  }, [getCachedData, setCacheData]);
  
  // Public API to execute request with optional overrides
  const executeRequest = useCallback(
    async (overrideOptions?: Partial<ApiOptions<T>>) => {
      const mergedOptions = {
        ...optionsRef.current,
        ...overrideOptions
      };
      
      return makeRequest(mergedOptions);
    }, 
    [makeRequest]
  );
  
  // Reset state
  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setState({ ...defaultApiState });
    }
  }, []);
  
  // Automatically execute on mount or when URL changes
  useEffect(() => {
    // Skip if explicitly requested
    if (options.skip) {
      return;
    }
    
    makeRequest();
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
    };
  }, [options.url, options.method, makeRequest, options.skip]);
  
  return {
    ...state,
    executeRequest,
    reset
  };
}

/**
 * Hook for making GET requests
 */
export function useGet<T = any>(
  url: string,
  params?: Record<string, any>,
  options?: Omit<ApiOptions<T>, 'url' | 'method' | 'params'>
) {
  return useApi<T>({
    url,
    method: 'GET',
    params,
    ...options
  });
}

/**
 * Hook for making POST requests
 */
export function usePost<T = any>(
  url: string,
  data?: any,
  options?: Omit<ApiOptions<T>, 'url' | 'method' | 'data'>
) {
  return useApi<T>({
    url,
    method: 'POST',
    data,
    skip: true, // Skip automatic execution for POST
    ...options
  });
}

/**
 * Hook for making PUT requests
 */
export function usePut<T = any>(
  url: string,
  data?: any,
  options?: Omit<ApiOptions<T>, 'url' | 'method' | 'data'>
) {
  return useApi<T>({
    url,
    method: 'PUT',
    data,
    skip: true, // Skip automatic execution for PUT
    ...options
  });
}

/**
 * Hook for making DELETE requests
 */
export function useDelete<T = any>(
  url: string,
  options?: Omit<ApiOptions<T>, 'url' | 'method'>
) {
  return useApi<T>({
    url,
    method: 'DELETE',
    skip: true, // Skip automatic execution for DELETE
    ...options
  });
}

/**
 * Hook for making paginated GET requests
 */
export function usePagination<T = any>(
  url: string,
  options?: Omit<ApiOptions<T[]>, 'url' | 'method'> & {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
  }
) {
  const {
    page = 1,
    pageSize = 20,
    sortBy,
    sortOrder = 'asc',
    filters = {},
    ...restOptions
  } = options || {};
  
  // Build params
  const params: Record<string, any> = {
    page,
    pageSize,
    ...filters
  };
  
  // Add sorting if provided
  if (sortBy) {
    params.sortBy = sortBy;
    params.sortOrder = sortOrder;
  }
  
  // Use the main API hook
  const apiResult = useApi<T[]>({
    url,
    method: 'GET',
    params,
    ...restOptions
  });
  
  // Extract pagination info from metadata
  const pagination = apiResult.meta?.pagination || {
    total: 0,
    page,
    pageSize,
    pageCount: 0
  };
  
  // Change page handler
  const changePage = useCallback(
    (newPage: number) => {
      return apiResult.executeRequest({
        params: {
          ...params,
          page: newPage
        }
      });
    },
    [apiResult, params]
  );
  
  // Change page size handler
  const changePageSize = useCallback(
    (newPageSize: number) => {
      return apiResult.executeRequest({
        params: {
          ...params,
          page: 1, // Reset to first page when changing page size
          pageSize: newPageSize
        }
      });
    },
    [apiResult, params]
  );
  
  // Change sorting handler
  const changeSort = useCallback(
    (newSortBy: string, newSortOrder: 'asc' | 'desc' = 'asc') => {
      return apiResult.executeRequest({
        params: {
          ...params,
          sortBy: newSortBy,
          sortOrder: newSortOrder
        }
      });
    },
    [apiResult, params]
  );
  
  // Change filters handler
  const changeFilters = useCallback(
    (newFilters: Record<string, any>) => {
      return apiResult.executeRequest({
        params: {
          ...params,
          page: 1, // Reset to first page when changing filters
          ...filters,
          ...newFilters
        }
      });
    },
    [apiResult, params, filters]
  );
  
  return {
    ...apiResult,
    pagination,
    changePage,
    changePageSize,
    changeSort,
    changeFilters
  };
}

export default useApi;
