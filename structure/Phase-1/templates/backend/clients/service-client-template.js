/**
 * Template for service clients
 * Replace all instances of `Service` with the actual service name
 * Replace all instances of `service` with the lowercase service name
 */

const { client: httpClient } = require('../../../shared/lib/http/client');
const { defaultLogger } = require('../../../shared/lib/logging/logger');

/**
 * Client for Service API
 */
class ServiceClient {
  /**
   * Create a new ServiceClient
   * @param {Object} [options={}] - Client options
   * @param {string} [options.baseUrl] - Service base URL
   * @param {Object} [options.headers={}] - Default headers
   * @param {number} [options.timeout=10000] - Request timeout in ms
   * @param {Object} [options.httpClient] - HTTP client instance
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(options = {}, logger = defaultLogger) {
    this.baseUrl = options.baseUrl || process.env.SERVICE_URL || 'http://localhost:3000/api/service';
    this.headers = options.headers || {};
    this.timeout = options.timeout || 10000;
    this.httpClient = options.httpClient || httpClient;
    this.logger = logger;
  }

  /**
   * Set authorization header
   * @param {string} token - Authorization token
   * @returns {ServiceClient} This client instance
   */
  setAuthToken(token) {
    this.headers.Authorization = `Bearer ${token}`;
    return this;
  }

  /**
   * Clear authorization header
   * @returns {ServiceClient} This client instance
   */
  clearAuthToken() {
    delete this.headers.Authorization;
    return this;
  }

  /**
   * Get all items with pagination
   * @param {Object} [options={}] - Request options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.pageSize=20] - Page size
   * @param {string} [options.sortBy] - Sort field
   * @param {string} [options.sortOrder='asc'] - Sort order ('asc' or 'desc')
   * @param {Object} [options.filters={}] - Filter criteria
   * @returns {Promise<Object>} Promise resolving to paginated result
   */
  async getAll(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        sortBy,
        sortOrder = 'asc',
        filters = {}
      } = options;
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      
      if (sortBy) {
        queryParams.append('sortBy', sortBy);
        queryParams.append('sortOrder', sortOrder);
      }
      
      // Add filters to query parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const url = `${this.baseUrl}?${queryParams.toString()}`;
      
      const response = await this._request('GET', url);
      
      return response.data;
    } catch (error) {
      this.logger.error(`Error getting all items: ${error.message}`, {
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get item by ID
   * @param {string} id - Item ID
   * @returns {Promise<Object>} Promise resolving to item
   */
  async getById(id) {
    try {
      const url = `${this.baseUrl}/${id}`;
      
      const response = await this._request('GET', url);
      
      return response.data;
    } catch (error) {
      this.logger.error(`Error getting item by ID ${id}: ${error.message}`, {
        id,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create a new item
   * @param {Object} data - Item data
   * @returns {Promise<Object>} Promise resolving to created item
   */
  async create(data) {
    try {
      const response = await this._request('POST', this.baseUrl, data);
      
      return response.data;
    } catch (error) {
      this.logger.error(`Error creating item: ${error.message}`, {
        data,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update an item
   * @param {string} id - Item ID
   * @param {Object} data - Item data
   * @returns {Promise<Object>} Promise resolving to updated item
   */
  async update(id, data) {
    try {
      const url = `${this.baseUrl}/${id}`;
      
      const response = await this._request('PUT', url, data);
      
      return response.data;
    } catch (error) {
      this.logger.error(`Error updating item ${id}: ${error.message}`, {
        id,
        data,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Delete an item
   * @param {string} id - Item ID
   * @returns {Promise<boolean>} Promise resolving to whether the item was deleted
   */
  async delete(id) {
    try {
      const url = `${this.baseUrl}/${id}`;
      
      const response = await this._request('DELETE', url);
      
      return response.success === true;
    } catch (error) {
      this.logger.error(`Error deleting item ${id}: ${error.message}`, {
        id,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Execute a service action
   * @param {string} action - Action name
   * @param {Object} [data={}] - Action data
   * @returns {Promise<Object>} Promise resolving to action result
   */
  async executeAction(action, data = {}) {
    try {
      const url = `${this.baseUrl}/actions/${action}`;
      
      const response = await this._request('POST', url, data);
      
      return response.data;
    } catch (error) {
      this.logger.error(`Error executing action ${action}: ${error.message}`, {
        action,
        data,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get service status
   * @returns {Promise<Object>} Promise resolving to service status
   */
  async getStatus() {
    try {
      const url = `${this.baseUrl}/status`;
      
      const response = await this._request('GET', url);
      
      return response.data;
    } catch (error) {
      this.logger.error(`Error getting service status: ${error.message}`, {
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Make a request to the service
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Object} [data] - Request data
   * @param {Object} [options={}] - Request options
   * @returns {Promise<Object>} Promise resolving to response
   * @private
   */
  async _request(method, url, data, options = {}) {
    try {
      const response = await this.httpClient.request({
        method,
        url,
        data,
        headers: { ...this.headers, ...(options.headers || {}) },
        timeout: options.timeout || this.timeout
      });
      
      return this._processResponse(response);
    } catch (error) {
      // Handle HTTP errors
      if (error.response) {
        return this._handleErrorResponse(error.response);
      }
      
      // Handle request errors (network, timeout, etc.)
      throw this._createServiceError(
        error.message,
        error.code || 'SERVICE_ERROR',
        error
      );
    }
  }

  /**
   * Process response
   * @param {Object} response - HTTP response
   * @returns {Object} Processed response
   * @private
   */
  _processResponse(response) {
    // If the response is already in the expected format, return it
    if (response.data && ('success' in response.data)) {
      return response.data;
    }
    
    // Otherwise, wrap it in the expected format
    return {
      success: true,
      data: response.data
    };
  }

  /**
   * Handle error response
   * @param {Object} errorResponse - Error response
   * @returns {never} Never returns, always throws
   * @throws {Error} Service error
   * @private
   */
  _handleErrorResponse(errorResponse) {
    const status = errorResponse.status;
    const data = errorResponse.data || {};
    
    // If the error response is already in the expected format, use it
    if (data.error) {
      throw this._createServiceError(
        data.error.message || 'Unknown service error',
        data.error.code || 'SERVICE_ERROR',
        data.error
      );
    }
    
    // Otherwise, create an error based on the status code
    let message = 'Unknown service error';
    let code = 'SERVICE_ERROR';
    
    if (status === 400) {
      message = 'Bad request';
      code = 'BAD_REQUEST';
    } else if (status === 401) {
      message = 'Unauthorized';
      code = 'UNAUTHORIZED';
    } else if (status === 403) {
      message = 'Forbidden';
      code = 'FORBIDDEN';
    } else if (status === 404) {
      message = 'Not found';
      code = 'NOT_FOUND';
    } else if (status === 409) {
      message = 'Conflict';
      code = 'CONFLICT';
    } else if (status === 422) {
      message = 'Validation error';
      code = 'VALIDATION_ERROR';
    } else if (status >= 500) {
      message = 'Service unavailable';
      code = 'SERVICE_UNAVAILABLE';
    }
    
    throw this._createServiceError(message, code, data);
  }

  /**
   * Create a service error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {*} [originalError] - Original error
   * @returns {Error} Service error
   * @private
   */
  _createServiceError(message, code, originalError) {
    const error = new Error(message);
    error.code = code;
    error.originalError = originalError;
    return error;
  }
}

module.exports = ServiceClient;
