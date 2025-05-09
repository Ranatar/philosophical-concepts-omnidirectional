/**
 * Helper functions for measuring and tracking metrics
 * Provides a simplified interface for common metrics operations
 */

const { performance } = require('perf_hooks');

/**
 * Performance timer for measuring operation duration
 */
class Timer {
  /**
   * Create a new timer and start it
   * @param {Object} [labels={}] - Labels to attach to the timer
   */
  constructor(labels = {}) {
    this.startTime = performance.now();
    this.labels = labels;
    this.stopped = false;
  }
  
  /**
   * Stop the timer and return the duration in milliseconds
   * @returns {number} Duration in milliseconds
   */
  stop() {
    if (!this.stopped) {
      this.endTime = performance.now();
      this.duration = this.endTime - this.startTime;
      this.stopped = true;
    }
    
    return this.duration;
  }
  
  /**
   * Get the current duration without stopping the timer
   * @returns {number} Current duration in milliseconds
   */
  current() {
    return this.stopped
      ? this.duration
      : performance.now() - this.startTime;
  }
  
  /**
   * Get the duration in seconds
   * @returns {number} Duration in seconds
   */
  durationSeconds() {
    return this.stopped
      ? this.duration / 1000
      : (performance.now() - this.startTime) / 1000;
  }
}

/**
 * Track database operations with metrics
 * @param {Object} metrics - Metrics object from prometheusMetrics
 * @param {string} operation - Operation type (e.g., 'create', 'find', 'update')
 * @param {string} entity - Entity type (e.g., 'user', 'concept')
 * @param {Function} fn - Function to execute and measure
 * @returns {Promise<*>} Result of the function
 */
async function trackDbOperation(metrics, operation, entity, fn) {
  const timer = new Timer();
  
  try {
    const result = await fn();
    
    // Record successful operation
    metrics.dbOperationsTotal.inc({
      operation,
      entity,
      success: 'true'
    });
    
    // Record operation duration
    metrics.dbOperationDuration.observe(
      {
        operation,
        entity
      },
      timer.durationSeconds()
    );
    
    return result;
  } catch (error) {
    // Record failed operation
    metrics.dbOperationsTotal.inc({
      operation,
      entity,
      success: 'false'
    });
    
    // Record operation duration even for failed operations
    metrics.dbOperationDuration.observe(
      {
        operation,
        entity
      },
      timer.durationSeconds()
    );
    
    throw error;
  }
}

/**
 * Track Claude API requests with metrics
 * @param {Object} metrics - Metrics object from prometheusMetrics
 * @param {string} template - Template name used for the request
 * @param {boolean} isAsync - Whether the request is asynchronous
 * @param {Function} fn - Function to execute and measure
 * @returns {Promise<*>} Result of the function
 */
async function trackClaudeApiRequest(metrics, template, isAsync, fn) {
  const timer = new Timer();
  
  try {
    const result = await fn();
    
    // Record successful request
    metrics.claudeApiRequestsTotal.inc({
      status: 'success',
      template,
      async: isAsync.toString()
    });
    
    // Record request duration
    metrics.claudeApiRequestDuration.observe(
      {
        status: 'success',
        template,
        async: isAsync.toString()
      },
      timer.durationSeconds()
    );
    
    // Record token usage if available in result
    if (result && result.usage) {
      metrics.claudeApiTokensUsed.inc(
        {
          type: 'prompt',
          template
        },
        result.usage.prompt_tokens || 0
      );
      
      metrics.claudeApiTokensUsed.inc(
        {
          type: 'completion',
          template
        },
        result.usage.completion_tokens || 0
      );
    }
    
    return result;
  } catch (error) {
    // Record failed request
    metrics.claudeApiRequestsTotal.inc({
      status: 'failure',
      template,
      async: isAsync.toString()
    });
    
    // Record request duration even for failed requests
    metrics.claudeApiRequestDuration.observe(
      {
        status: 'failure',
        template,
        async: isAsync.toString()
      },
      timer.durationSeconds()
    );
    
    throw error;
  }
}

/**
 * Track task processing with metrics
 * @param {Object} metrics - Metrics object from prometheusMetrics
 * @param {string} queue - Queue name
 * @param {Function} fn - Function to execute and measure
 * @returns {Promise<*>} Result of the function
 */
async function trackTaskProcessing(metrics, queue, fn) {
  const timer = new Timer();
  
  try {
    // Update queue size
    metrics.taskQueueSize.inc({ queue });
    
    const result = await fn();
    
    // Record successful task
    metrics.taskProcessingDuration.observe(
      {
        queue,
        status: 'success'
      },
      timer.durationSeconds()
    );
    
    // Update queue size
    metrics.taskQueueSize.dec({ queue });
    
    return result;
  } catch (error) {
    // Record failed task
    metrics.taskProcessingDuration.observe(
      {
        queue,
        status: 'failure'
      },
      timer.durationSeconds()
    );
    
    // Update queue size
    metrics.taskQueueSize.dec({ queue });
    
    throw error;
  }
}

module.exports = {
  Timer,
  trackDbOperation,
  trackClaudeApiRequest,
  trackTaskProcessing
};
