// monitoring/metrics-collector.js

const prometheus = require('prom-client');
const { EventEmitter } = require('events');

class MetricsCollector extends EventEmitter {
  constructor() {
    super();
    this.setupMetrics();
  }

  setupMetrics() {
    // Счетчики операций
    this.operationCounter = new prometheus.Counter({
      name: 'db_operations_total',
      help: 'Total number of database operations',
      labelNames: ['operation', 'database', 'status']
    });

    // Гистограмма времени выполнения
    this.operationDuration = new prometheus.Histogram({
      name: 'db_operation_duration_seconds',
      help: 'Duration of database operations',
      labelNames: ['operation', 'database'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    });

    // Текущие активные транзакции
    this.activeTransactions = new prometheus.Gauge({
      name: 'db_active_transactions',
      help: 'Number of active distributed transactions'
    });

    // Ошибки синхронизации
    this.syncErrors = new prometheus.Counter({
      name: 'db_sync_errors_total',
      help: 'Total number of synchronization errors',
      labelNames: ['error_type']
    });

    // Размер кэша
    this.cacheSize = new prometheus.Gauge({
      name: 'cache_size_bytes',
      help: 'Current cache size in bytes'
    });

    // Проблемы целостности данных
    this.integrityIssues = new prometheus.Gauge({
      name: 'data_integrity_issues',
      help: 'Number of data integrity issues',
      labelNames: ['severity']
    });
  }

  recordOperation(operation, database, status, duration) {
    this.operationCounter.labels(operation, database, status).inc();
    this.operationDuration.labels(operation, database).observe(duration);
  }

  recordSyncError(errorType) {
    this.syncErrors.labels(errorType).inc();
  }

  setActiveTransactions(count) {
    this.activeTransactions.set(count);
  }

  setCacheSize(size) {
    this.cacheSize.set(size);
  }

  setIntegrityIssues(severity, count) {
    this.integrityIssues.labels(severity).set(count);
  }

  getMetrics() {
    return prometheus.register.metrics();
  }
}

module.exports = MetricsCollector;
