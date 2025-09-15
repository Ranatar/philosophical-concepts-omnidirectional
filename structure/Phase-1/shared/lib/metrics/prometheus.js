/**
 * Prometheus metrics configuration for the Philosophy Service
 * Provides comprehensive metrics collection and exposure
 */

const promClient = require('prom-client');
const { logger } = require('../logging/logger');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'philosophy_service_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// HTTP request duration histogram
const httpRequestDuration = new promClient.Histogram({
  name: 'philosophy_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

// HTTP request count counter
const httpRequestCount = new promClient.Counter({
  name: 'philosophy_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [register]
});

// Active HTTP requests gauge
const activeHttpRequests = new promClient.Gauge({
  name: 'philosophy_service_http_requests_active',
  help: 'Number of active HTTP requests',
  labelNames: ['service'],
  registers: [register]
});

// Database query metrics
const dbQueryDuration = new promClient.Histogram({
  name: 'philosophy_service_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['database', 'operation', 'table', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

const dbQueryCount = new promClient.Counter({
  name: 'philosophy_service_db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['database', 'operation', 'table', 'service', 'status'],
  registers: [register]
});

const dbConnectionPool = new promClient.Gauge({
  name: 'philosophy_service_db_connection_pool_size',
  help: 'Database connection pool size',
  labelNames: ['database', 'service', 'state'],
  registers: [register]
});

// Claude API metrics
const claudeApiDuration = new promClient.Histogram({
  name: 'philosophy_service_claude_api_duration_seconds',
  help: 'Duration of Claude API calls in seconds',
  labelNames: ['operation', 'service', 'api_key_type'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
  registers: [register]
});

const claudeApiCount = new promClient.Counter({
  name: 'philosophy_service_claude_api_calls_total',
  help: 'Total number of Claude API calls',
  labelNames: ['operation', 'service', 'status', 'api_key_type'],
  registers: [register]
});

const claudeApiTokensUsed = new promClient.Counter({
  name: 'philosophy_service_claude_api_tokens_total',
  help: 'Total number of tokens used in Claude API calls',
  labelNames: ['operation', 'service', 'type', 'api_key_type'],
  registers: [register]
});

// Business metrics
const conceptsCreated = new promClient.Counter({
  name: 'philosophy_service_concepts_created_total',
  help: 'Total number of concepts created',
  labelNames: ['service', 'is_synthesis'],
  registers: [register]
});

const graphsCreated = new promClient.Counter({
  name: 'philosophy_service_graphs_created_total',
  help: 'Total number of graphs created',
  labelNames: ['service'],
  registers: [register]
});

const thesesGenerated = new promClient.Counter({
  name: 'philosophy_service_theses_generated_total',
  help: 'Total number of theses generated',
  labelNames: ['service', 'type', 'style'],
  registers: [register]
});

const synthesisOperations = new promClient.Counter({
  name: 'philosophy_service_synthesis_operations_total',
  help: 'Total number of synthesis operations',
  labelNames: ['service', 'method', 'status'],
  registers: [register]
});

// Cache metrics
const cacheHits = new promClient.Counter({
  name: 'philosophy_service_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache', 'operation', 'service'],
  registers: [register]
});

const cacheMisses = new promClient.Counter({
  name: 'philosophy_service_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache', 'operation', 'service'],
  registers: [register]
});

// Queue metrics
const queueSize = new promClient.Gauge({
  name: 'philosophy_service_queue_size',
  help: 'Current queue size',
  labelNames: ['queue', 'service'],
  registers: [register]
});

const queueProcessingDuration = new promClient.Histogram({
  name: 'philosophy_service_queue_processing_duration_seconds',
  help: 'Duration of queue message processing in seconds',
  labelNames: ['queue', 'service', 'message_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
  registers: [register]
});

// Error metrics
const errorCount = new promClient.Counter({
  name: 'philosophy_service_errors_total',
  help: 'Total number of errors',
  labelNames: ['service', 'error_type', 'error_code'],
  registers: [register]
});

// User activity metrics
const activeUsers = new promClient.Gauge({
  name: 'philosophy_service_active_users',
  help: 'Number of active users',
  labelNames: ['service', 'time_window'],
  registers: [register]
});

const apiKeyUsage = new promClient.Counter({
  name: 'philosophy_service_api_key_usage_total',
  help: 'Total API key usage',
  labelNames: ['service', 'key_type', 'operation'],
  registers: [register]
});

/**
 * Express middleware to collect HTTP metrics
 */
function httpMetricsMiddleware(serviceName = 'unknown') {
  return (req, res, next) => {
    const start = Date.now();
    
    // Increment active requests
    activeHttpRequests.labels(serviceName).inc();
    
    // Store original end method
    const originalEnd = res.end;
    
    res.end = function(...args) {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path || 'unknown';
      const statusCode = res.statusCode.toString();
      
      // Record metrics
      httpRequestDuration
        .labels(req.method, route, statusCode, serviceName)
        .observe(duration);
      
      httpRequestCount
        .labels(req.method, route, statusCode, serviceName)
        .inc();
      
      // Decrement active requests
      activeHttpRequests.labels(serviceName).dec();
      
      // Call original end method
      originalEnd.apply(res, args);
    };
    
    next();
  };
}

/**
 * Database metrics helper
 */
class DatabaseMetrics {
  constructor(database, service) {
    this.database = database;
    this.service = service;
  }

  recordQuery(operation, table, duration, success = true) {
    dbQueryDuration
      .labels(this.database, operation, table, this.service)
      .observe(duration / 1000);
    
    dbQueryCount
      .labels(this.database, operation, table, this.service, success ? 'success' : 'error')
      .inc();
  }

  updateConnectionPool(active, idle, waiting) {
    dbConnectionPool.labels(this.database, this.service, 'active').set(active);
    dbConnectionPool.labels(this.database, this.service, 'idle').set(idle);
    dbConnectionPool.labels(this.database, this.service, 'waiting').set(waiting);
  }
}

/**
 * Claude API metrics helper
 */
class ClaudeMetrics {
  constructor(service) {
    this.service = service;
  }

  recordApiCall(operation, duration, success = true, apiKeyType = 'system') {
    claudeApiDuration
      .labels(operation, this.service, apiKeyType)
      .observe(duration / 1000);
    
    claudeApiCount
      .labels(operation, this.service, success ? 'success' : 'error', apiKeyType)
      .inc();
  }

  recordTokenUsage(operation, inputTokens, outputTokens, apiKeyType = 'system') {
    claudeApiTokensUsed
      .labels(operation, this.service, 'input', apiKeyType)
      .inc(inputTokens);
    
    claudeApiTokensUsed
      .labels(operation, this.service, 'output', apiKeyType)
      .inc(outputTokens);
  }
}

/**
 * Business metrics helper
 */
class BusinessMetrics {
  constructor(service) {
    this.service = service;
  }

  recordConceptCreated(isSynthesis = false) {
    conceptsCreated
      .labels(this.service, isSynthesis.toString())
      .inc();
  }

  recordGraphCreated() {
    graphsCreated.labels(this.service).inc();
  }

  recordThesisGenerated(type, style) {
    thesesGenerated
      .labels(this.service, type, style)
      .inc();
  }

  recordSynthesisOperation(method, success = true) {
    synthesisOperations
      .labels(this.service, method, success ? 'success' : 'error')
      .inc();
  }
}

/**
 * Cache metrics helper
 */
class CacheMetrics {
  constructor(cacheName, service) {
    this.cacheName = cacheName;
    this.service = service;
  }

  recordHit(operation) {
    cacheHits.labels(this.cacheName, operation, this.service).inc();
  }

  recordMiss(operation) {
    cacheMisses.labels(this.cacheName, operation, this.service).inc();
  }
}

/**
 * Error metrics helper
 */
function recordError(service, errorType, errorCode) {
  errorCount.labels(service, errorType, errorCode).inc();
}

/**
 * Get metrics endpoint handler
 */
async function metricsHandler(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).end();
  }
}

/**
 * Reset all metrics (useful for testing)
 */
function resetMetrics() {
  register.clear();
}

module.exports = {
  // Registry
  register,
  
  // Middleware
  httpMetricsMiddleware,
  metricsHandler,
  
  // Metrics helpers
  DatabaseMetrics,
  ClaudeMetrics,
  BusinessMetrics,
  CacheMetrics,
  
  // Individual metrics (for direct access if needed)
  metrics: {
    httpRequestDuration,
    httpRequestCount,
    activeHttpRequests,
    dbQueryDuration,
    dbQueryCount,
    dbConnectionPool,
    claudeApiDuration,
    claudeApiCount,
    claudeApiTokensUsed,
    conceptsCreated,
    graphsCreated,
    thesesGenerated,
    synthesisOperations,
    cacheHits,
    cacheMisses,
    queueSize,
    queueProcessingDuration,
    errorCount,
    activeUsers,
    apiKeyUsage
  },
  
  // Utility functions
  recordError,
  resetMetrics
};