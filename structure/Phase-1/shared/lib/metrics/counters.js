/**
 * Simple counters and metrics utilities for the Philosophy Service
 * Provides in-memory counters and aggregation utilities
 */

const { EventEmitter } = require('events');

/**
 * Simple in-memory counter
 */
class Counter {
  constructor(name, resetInterval = null) {
    this.name = name;
    this.value = 0;
    this.resetInterval = resetInterval;
    this.created = Date.now();
    this.lastReset = Date.now();
    
    if (resetInterval) {
      this.resetTimer = setInterval(() => this.reset(), resetInterval);
    }
  }

  increment(amount = 1) {
    this.value += amount;
    return this.value;
  }

  decrement(amount = 1) {
    this.value -= amount;
    return this.value;
  }

  get() {
    return this.value;
  }

  reset() {
    const oldValue = this.value;
    this.value = 0;
    this.lastReset = Date.now();
    return oldValue;
  }

  destroy() {
    if (this.resetTimer) {
      clearInterval(this.resetTimer);
    }
  }

  toJSON() {
    return {
      name: this.name,
      value: this.value,
      created: new Date(this.created).toISOString(),
      lastReset: new Date(this.lastReset).toISOString()
    };
  }
}

/**
 * Rate counter - tracks operations per time window
 */
class RateCounter extends EventEmitter {
  constructor(name, windowSizeMs = 60000) {
    super();
    this.name = name;
    this.windowSizeMs = windowSizeMs;
    this.windows = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), windowSizeMs);
  }

  increment(amount = 1) {
    const now = Date.now();
    const windowKey = Math.floor(now / this.windowSizeMs);
    
    if (!this.windows.has(windowKey)) {
      this.windows.set(windowKey, 0);
    }
    
    this.windows.set(windowKey, this.windows.get(windowKey) + amount);
    
    // Emit event if rate exceeds threshold
    const rate = this.getRate();
    this.emit('update', { rate, timestamp: now });
  }

  getRate() {
    const now = Date.now();
    const currentWindow = Math.floor(now / this.windowSizeMs);
    const previousWindow = currentWindow - 1;
    
    // Get counts for current and previous windows
    const currentCount = this.windows.get(currentWindow) || 0;
    const previousCount = this.windows.get(previousWindow) || 0;
    
    // Calculate weighted average based on position in current window
    const positionInWindow = (now % this.windowSizeMs) / this.windowSizeMs;
    const rate = currentCount * positionInWindow + previousCount * (1 - positionInWindow);
    
    return Math.round(rate);
  }

  cleanup() {
    const now = Date.now();
    const currentWindow = Math.floor(now / this.windowSizeMs);
    
    // Keep only current and previous window
    for (const [windowKey] of this.windows) {
      if (windowKey < currentWindow - 1) {
        this.windows.delete(windowKey);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.removeAllListeners();
  }

  toJSON() {
    return {
      name: this.name,
      rate: this.getRate(),
      windowSize: this.windowSizeMs
    };
  }
}

/**
 * Histogram for tracking value distributions
 */
class Histogram {
  constructor(name, buckets = [0.1, 0.5, 1, 2, 5, 10, 20, 50, 100]) {
    this.name = name;
    this.buckets = [...buckets].sort((a, b) => a - b);
    this.bucketCounts = new Map();
    this.sum = 0;
    this.count = 0;
    this.min = Infinity;
    this.max = -Infinity;
    
    // Initialize bucket counts
    this.buckets.forEach(bucket => {
      this.bucketCounts.set(bucket, 0);
    });
  }

  observe(value) {
    this.sum += value;
    this.count++;
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);
    
    // Update bucket counts
    for (const bucket of this.buckets) {
      if (value <= bucket) {
        this.bucketCounts.set(bucket, this.bucketCounts.get(bucket) + 1);
        break;
      }
    }
  }

  getPercentile(percentile) {
    if (this.count === 0) return 0;
    
    const targetCount = Math.ceil(this.count * percentile / 100);
    let cumulative = 0;
    
    for (const bucket of this.buckets) {
      cumulative += this.bucketCounts.get(bucket);
      if (cumulative >= targetCount) {
        return bucket;
      }
    }
    
    return this.max;
  }

  getMean() {
    return this.count > 0 ? this.sum / this.count : 0;
  }

  reset() {
    this.buckets.forEach(bucket => {
      this.bucketCounts.set(bucket, 0);
    });
    this.sum = 0;
    this.count = 0;
    this.min = Infinity;
    this.max = -Infinity;
  }

  toJSON() {
    const buckets = {};
    this.bucketCounts.forEach((count, bucket) => {
      buckets[bucket] = count;
    });
    
    return {
      name: this.name,
      count: this.count,
      sum: this.sum,
      min: this.min === Infinity ? null : this.min,
      max: this.max === -Infinity ? null : this.max,
      mean: this.getMean(),
      p50: this.getPercentile(50),
      p90: this.getPercentile(90),
      p95: this.getPercentile(95),
      p99: this.getPercentile(99),
      buckets
    };
  }
}

/**
 * Gauge for tracking current values
 */
class Gauge {
  constructor(name) {
    this.name = name;
    this.value = 0;
    this.lastUpdated = Date.now();
  }

  set(value) {
    this.value = value;
    this.lastUpdated = Date.now();
  }

  inc(amount = 1) {
    this.value += amount;
    this.lastUpdated = Date.now();
  }

  dec(amount = 1) {
    this.value -= amount;
    this.lastUpdated = Date.now();
  }

  get() {
    return this.value;
  }

  toJSON() {
    return {
      name: this.name,
      value: this.value,
      lastUpdated: new Date(this.lastUpdated).toISOString()
    };
  }
}

/**
 * Counter registry for managing multiple counters
 */
class CounterRegistry {
  constructor() {
    this.counters = new Map();
    this.rateCounters = new Map();
    this.histograms = new Map();
    this.gauges = new Map();
  }

  // Counter management
  createCounter(name, resetInterval = null) {
    if (this.counters.has(name)) {
      throw new Error(`Counter ${name} already exists`);
    }
    const counter = new Counter(name, resetInterval);
    this.counters.set(name, counter);
    return counter;
  }

  getCounter(name) {
    return this.counters.get(name);
  }

  incrementCounter(name, amount = 1) {
    const counter = this.counters.get(name);
    if (!counter) {
      throw new Error(`Counter ${name} not found`);
    }
    return counter.increment(amount);
  }

  // Rate counter management
  createRateCounter(name, windowSizeMs = 60000) {
    if (this.rateCounters.has(name)) {
      throw new Error(`Rate counter ${name} already exists`);
    }
    const rateCounter = new RateCounter(name, windowSizeMs);
    this.rateCounters.set(name, rateCounter);
    return rateCounter;
  }

  getRateCounter(name) {
    return this.rateCounters.get(name);
  }

  // Histogram management
  createHistogram(name, buckets) {
    if (this.histograms.has(name)) {
      throw new Error(`Histogram ${name} already exists`);
    }
    const histogram = new Histogram(name, buckets);
    this.histograms.set(name, histogram);
    return histogram;
  }

  getHistogram(name) {
    return this.histograms.get(name);
  }

  // Gauge management
  createGauge(name) {
    if (this.gauges.has(name)) {
      throw new Error(`Gauge ${name} already exists`);
    }
    const gauge = new Gauge(name);
    this.gauges.set(name, gauge);
    return gauge;
  }

  getGauge(name) {
    return this.gauges.get(name);
  }

  // Get all metrics
  getAllMetrics() {
    const metrics = {
      counters: {},
      rateCounters: {},
      histograms: {},
      gauges: {}
    };

    this.counters.forEach((counter, name) => {
      metrics.counters[name] = counter.toJSON();
    });

    this.rateCounters.forEach((rateCounter, name) => {
      metrics.rateCounters[name] = rateCounter.toJSON();
    });

    this.histograms.forEach((histogram, name) => {
      metrics.histograms[name] = histogram.toJSON();
    });

    this.gauges.forEach((gauge, name) => {
      metrics.gauges[name] = gauge.toJSON();
    });

    return metrics;
  }

  // Reset all metrics
  reset() {
    this.counters.forEach(counter => counter.reset());
    this.histograms.forEach(histogram => histogram.reset());
  }

  // Destroy all metrics
  destroy() {
    this.counters.forEach(counter => counter.destroy());
    this.rateCounters.forEach(rateCounter => rateCounter.destroy());
    this.counters.clear();
    this.rateCounters.clear();
    this.histograms.clear();
    this.gauges.clear();
  }
}

// Create a default registry
const defaultRegistry = new CounterRegistry();

// Pre-create some common counters
const commonCounters = {
  requests: defaultRegistry.createCounter('http_requests'),
  errors: defaultRegistry.createCounter('errors'),
  dbQueries: defaultRegistry.createCounter('db_queries'),
  cacheHits: defaultRegistry.createCounter('cache_hits'),
  cacheMisses: defaultRegistry.createCounter('cache_misses')
};

// Pre-create some common rate counters
const commonRateCounters = {
  requestRate: defaultRegistry.createRateCounter('request_rate', 60000),
  errorRate: defaultRegistry.createRateCounter('error_rate', 60000)
};

// Pre-create some common histograms
const commonHistograms = {
  requestDuration: defaultRegistry.createHistogram('request_duration', [10, 25, 50, 100, 250, 500, 1000, 2500, 5000]),
  dbQueryDuration: defaultRegistry.createHistogram('db_query_duration', [1, 5, 10, 25, 50, 100, 250, 500, 1000])
};

// Pre-create some common gauges
const commonGauges = {
  activeConnections: defaultRegistry.createGauge('active_connections'),
  queueSize: defaultRegistry.createGauge('queue_size'),
  memoryUsage: defaultRegistry.createGauge('memory_usage')
};

module.exports = {
  // Classes
  Counter,
  RateCounter,
  Histogram,
  Gauge,
  CounterRegistry,
  
  // Default registry
  defaultRegistry,
  
  // Common metrics
  commonCounters,
  commonRateCounters,
  commonHistograms,
  commonGauges,
  
  // Convenience methods
  incrementCounter: (name, amount) => defaultRegistry.incrementCounter(name, amount),
  recordDuration: (name, duration) => {
    const histogram = defaultRegistry.getHistogram(name);
    if (histogram) histogram.observe(duration);
  },
  setGauge: (name, value) => {
    const gauge = defaultRegistry.getGauge(name);
    if (gauge) gauge.set(value);
  },
  getAllMetrics: () => defaultRegistry.getAllMetrics()
};