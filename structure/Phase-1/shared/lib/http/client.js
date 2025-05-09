/**
 * HTTP client for making requests to external services
 * Provides a wrapper around Axios with standard configuration
 */

const axios = require('axios');
const { defaultLogger } = require('../logging/logger');

// Default configuration
const DEFAULT_CONFIG = {
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'PhilosophyService/1.0'
  },
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      // Retry on network errors or 5xx responses
      return (
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND' ||
        (error.response && error.response.status >= 500)
      );
    }
  }
};

/**
 * Create a configured HTTP client instance
 * @param {Object} [config={}] - Configuration options to override defaults
 * @param {Object} [logger=defaultLogger] - Logger instance
 * @returns {Object} HTTP client instance
 */
function createClient(config = {}, logger = defaultLogger) {
  // Merge configurations
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    headers: {
      ...DEFAULT_CONFIG.headers,
      ...(config.headers || {})
    },
    retry: {
      ...DEFAULT_CONFIG.retry,
      ...(config.retry || {})
    }
  };
  
  // Create Axios instance
  const instance = axios.create(mergedConfig);
  
  // Add request interceptor for logging
  instance.interceptors.request.use(
    (config) => {
      const logData = {
        url: config.url,
        method: config.method.toUpperCase(),
        headers: { ...config.headers }
      };
      
      // Remove sensitive headers from logs
      if (logData.headers.Authorization) {
        logData.headers.Authorization = '[REDACTED]';
      }
      if (logData.headers['X-API-Key']) {
        logData.headers['X-API-Key'] = '[REDACTED]';
      }
      
      // Log request data without large payloads
      if (config.data) {
        if (config.method === 'post' || config.method === 'put' || config.method === 'patch') {
          if (typeof config.data === 'string') {
            if (config.data.length > 1000) {
              logData.data = `${config.data.substring(0, 1000)}... [truncated]`;
            } else {
              try {
                logData.data = JSON.parse(config.data);
              } catch (e) {
                logData.data = config.data;
              }
            }
          } else {
            logData.data = config.data;
          }
        }
      }
      
      logger.debug('HTTP request', logData);
      
      // Add timestamp for tracking duration
      config.metadata = { startTime: Date.now() };
      
      return config;
    },
    (error) => {
      logger.error('HTTP request error', {
        error: error.message,
        stack: error.stack
      });
      
      return Promise.reject(error);
    }
  );
  
  // Add response interceptor for logging and retrying
  instance.interceptors.response.use(
    (response) => {
      const { config } = response;
      const duration = config.metadata ? Date.now() - config.metadata.startTime : -1;
      
      logger.debug('HTTP response', {
        url: config.url,
        method: config.method.toUpperCase(),
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`
      });
      
      return response;
    },
    async (error) => {
      // Get request config
      const config = error.config || {};
      
      // Calculate request duration
      const duration = config.metadata ? Date.now() - config.metadata.startTime : -1;
      
      // Get retry configuration
      const { maxRetries = 3, retryDelay = 1000, retryCondition } = mergedConfig.retry;
      
      // Track retry count
      config.retryCount = config.retryCount || 0;
      
      // Determine if we should retry
      const shouldRetry = (
        config.retryCount < maxRetries &&
        typeof retryCondition === 'function' &&
        retryCondition(error)
      );
      
      // Log the error
      if (error.response) {
        // Server responded with non-2xx status
        logger.error('HTTP error response', {
          url: config.url,
          method: config.method?.toUpperCase(),
          status: error.response.status,
          statusText: error.response.statusText,
          duration: `${duration}ms`,
          data: error.response.data,
          retryCount: config.retryCount,
          willRetry: shouldRetry
        });
      } else if (error.request) {
        // Request made but no response received
        logger.error('HTTP no response error', {
          url: config.url,
          method: config.method?.toUpperCase(),
          error: error.message,
          code: error.code,
          duration: `${duration}ms`,
          retryCount: config.retryCount,
          willRetry: shouldRetry
        });
      } else {
        // Error setting up the request
        logger.error('HTTP request setup error', {
          url: config.url,
          method: config.method?.toUpperCase(),
          error: error.message,
          stack: error.stack,
          retryCount: config.retryCount,
          willRetry: shouldRetry
        });
      }
      
      // Retry if conditions are met
      if (shouldRetry) {
        config.retryCount += 1;
        
        // Calculate delay with exponential backoff
        const delay = retryDelay * Math.pow(2, config.retryCount - 1);
        
        logger.debug('Retrying HTTP request', {
          url: config.url,
          method: config.method?.toUpperCase(),
          retryCount: config.retryCount,
          delay: `${delay}ms`
        });
        
        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Reset timestamp for tracking duration
        config.metadata = { startTime: Date.now() };
        
        // Retry the request
        return instance(config);
      }
      
      // If we shouldn't retry, or we've run out of retries, reject with the error
      return Promise.reject(error);
    }
  );
  
  /**
   * Make a GET request
   * @param {string} url - Request URL
   * @param {Object} [config={}] - Request config
   * @returns {Promise<Object>} Response object
   */
  async function get(url, config = {}) {
    return instance.get(url, config);
  }
  
  /**
   * Make a POST request
   * @param {string} url - Request URL
   * @param {Object} [data={}] - Request data
   * @param {Object} [config={}] - Request config
   * @returns {Promise<Object>} Response object
   */
  async function post(url, data = {}, config = {}) {
    return instance.post(url, data, config);
  }
  
  /**
   * Make a PUT request
   * @param {string} url - Request URL
   * @param {Object} [data={}] - Request data
   * @param {Object} [config={}] - Request config
   * @returns {Promise<Object>} Response object
   */
  async function put(url, data = {}, config = {}) {
    return instance.put(url, data, config);
  }
  
  /**
   * Make a PATCH request
   * @param {string} url - Request URL
   * @param {Object} [data={}] - Request data
   * @param {Object} [config={}] - Request config
   * @returns {Promise<Object>} Response object
   */
  async function patch(url, data = {}, config = {}) {
    return instance.patch(url, data, config);
  }
  
  /**
   * Make a DELETE request
   * @param {string} url - Request URL
   * @param {Object} [config={}] - Request config
   * @returns {Promise<Object>} Response object
   */
  async function del(url, config = {}) {
    return instance.delete(url, config);
  }
  
  /**
   * Make an HTTP request with retries
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method
   * @param {string} options.url - Request URL
   * @param {Object} [options.data] - Request data
   * @param {Object} [options.headers] - Request headers
   * @param {number} [options.timeout] - Request timeout
   * @param {number} [options.maxRetries] - Maximum number of retries
   * @param {number} [options.retryDelay] - Delay between retries in milliseconds
   * @returns {Promise<Object>} Response object
   */
  async function request(options) {
    const requestConfig = {
      method: options.method,
      url: options.url,
      data: options.data,
      headers: options.headers,
      timeout: options.timeout,
      retry: {
        maxRetries: options.maxRetries !== undefined ? options.maxRetries : mergedConfig.retry.maxRetries,
        retryDelay: options.retryDelay !== undefined ? options.retryDelay : mergedConfig.retry.retryDelay,
        retryCondition: mergedConfig.retry.retryCondition
      }
    };
    
    return instance(requestConfig);
  }
  
  return {
    axios: instance,
    get,
    post,
    put,
    patch,
    delete: del,
    request
  };
}

// Create default client
const defaultClient = createClient();

module.exports = {
  createClient,
  defaultClient
};
