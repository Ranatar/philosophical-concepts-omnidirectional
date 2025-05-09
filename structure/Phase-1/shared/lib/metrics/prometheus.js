/**
 * Prometheus metrics configuration and middleware
 * Provides standardized metrics collection for all services
 */

const prometheus = require('prom-client');
const responseTime = require('response-time');

// Create a Registry for each service instance
const registry = new prometheus.Registry();

// Add default metrics
prometheus.collectDefaultMetrics({ register: registry });

/**
 * Configuration for service metrics
 * @typedef {Object} MetricsConfig
 * @property {string} serviceName - Name of the service
 * @property {string} serviceVersion - Version of the service
 * @property {Object} customLabels - Additional labels to add to all metrics
 */

/**
 * Initialize metrics for a service
 * @param {MetricsConfig} config - Metrics configuration
 * @returns {Object} Metrics object with all counters, gauges, and histograms
 */
function initializeMetrics(config = {}) {
  const {
    serviceName = 'unknown-service',
    serviceVersion = '0.0.0',
    customLabels = {}
  } = config;
  
  // Define default labels
  const defaultLabels = {
    service: serviceName,
    version: serviceVersion,
    ...customLabels
  };
  
  // Set default labels for all metrics
  registry.setDefaultLabels(defaultLabels);
  
  // Create HTTP metrics
  const httpRequestsTotal = new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry]
  });
  
  const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    registers: [registry]
  });
  
  const httpRequestSize = new prometheus.Histogram({
    name: 'http_request_size_bytes',
    help: 'HTTP request size in bytes',
    labelNames: ['method', 'route'],
    buckets: [10, 100, 1000, 10000, 100000, 1000000],
    registers: [registry]
  });
  
  const httpResponseSize = new prometheus.Histogram({
    name: 'http_response_size_bytes',
    help: 'HTTP response size in bytes',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [10, 100, 1000, 10000, 100000, 1000000],
    registers: [registry]
  });
  
  // Create database metrics
  const dbOperationsTotal = new prometheus.Counter({
    name: 'db_operations_total',
    help: 'Total number of database operations',
    labelNames: ['operation', 'entity', 'success'],
    registers: [registry]
  });
  
  const dbOperationDuration = new prometheus.Histogram({
    name: 'db_operation_duration_seconds',
    help: 'Database operation duration in seconds',
    labelNames: ['operation', 'entity'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    registers: [registry]
  });
  
  // Create Claude API metrics
  const claudeApiRequestsTotal = new prometheus.Counter({
    name: 'claude_api_requests_total',
    help: 'Total number of Claude API requests',
    labelNames: ['status', 'template', 'async'],
    registers: [registry]
  });
  
  const claudeApiRequestDuration = new prometheus.Histogram({
    name: 'claude_api_request_duration_seconds',
    help: 'Claude API request duration in seconds',
    labelNames: ['status', 'template', 'async'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 60],
    registers: [registry]
  });
  
  const claudeApiTokensUsed = new prometheus.Counter({
    name: 'claude_api_tokens_total',
    help: 'Total number of tokens used in Claude API requests',
    labelNames: ['type', 'template'],
    registers: [registry]
  });
  
  // Create task queue metrics
  const taskQueueSize = new prometheus.Gauge({
    name: 'task_queue_size',
    help: 'Number of tasks in the queue',
    labelNames: ['queue'],
    registers: [registry]
  });
  
  const taskProcessingDuration = new prometheus.Histogram({
    name: 'task_processing_duration_seconds',
    help: 'Task processing duration in seconds',
    labelNames: ['queue', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 20, 30, 60, 120, 300, 600],
    registers: [registry]
  });
  
  const activeConnections = new prometheus.Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
    registers: [registry]
  });
  
  // Return all metrics
  return {
    registry,
    httpRequestsTotal,
    httpRequestDuration,
    httpRequestSize,
    httpResponseSize,
    dbOperationsTotal,
    dbOperationDuration,
    claudeApiRequestsTotal,
    claudeApiRequestDuration,
    claudeApiTokensUsed,
    taskQueueSize,
    taskProcessingDuration,
    activeConnections
  };
}

/**
 * Create Express middleware for HTTP metrics
 * @param {Object} metrics - Metrics object from initializeMetrics
 * @returns {Function} Express middleware
 */
function createHttpMetricsMiddleware(metrics) {
  return responseTime((req, res, time) => {
    if (!req.route || req.route.path === '/metrics') {
      return;
    }
    
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const statusCode = res.statusCode.toString();
    
    // Count request
    metrics.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode
    });
    
    // Record request duration
    metrics.httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode
      },
      time / 1000 // Convert from ms to seconds
    );
    
    // Record request size (if available)
    if (req.headers['content-length']) {
      metrics.httpRequestSize.observe(
        {
          method,
          route
        },
        parseInt(req.headers['content-length'], 10)
      );
    }
    
    // Record response size (if available)
    if (res.getHeader('content-length')) {
      metrics.httpResponseSize.observe(
        {
          method,
          route,
          status_code: statusCode
        },
        parseInt(res.getHeader('content-length'), 10)
      );
    }
  });
}

/**
 * Create Express endpoint for metrics
 * @param {Object} registry - Prometheus registry
 * @returns {Function} Express route handler
 */
function createMetricsEndpoint(registry) {
  return async (req, res) => {
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  };
}

module.exports = {
  prometheus,
  registry,
  initializeMetrics,
  createHttpMetricsMiddleware,
  createMetricsEndpoint
};
