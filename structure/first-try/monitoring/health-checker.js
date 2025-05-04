// monitoring/health-checker.js

class HealthChecker {
  constructor(databaseManager) {
    this.dbManager = databaseManager;
    this.healthStatus = {
      postgres: 'unknown',
      neo4j: 'unknown',
      mongodb: 'unknown',
      redis: 'unknown',
      lastCheck: null
    };
  }

  async checkAllDatabases() {
    const results = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      databases: {}
    };

    try {
      // Проверка PostgreSQL
      const pgHealth = await this.checkPostgres();
      results.databases.postgres = pgHealth;

      // Проверка Neo4j
      const neo4jHealth = await this.checkNeo4j();
      results.databases.neo4j = neo4jHealth;

      // Проверка MongoDB
      const mongoHealth = await this.checkMongoDB();
      results.databases.mongodb = mongoHealth;

      // Проверка Redis
      const redisHealth = await this.checkRedis();
      results.databases.redis = redisHealth;

      // Определение общего статуса
      results.status = Object.values(results.databases)
        .every(db => db.status === 'healthy') ? 'healthy' : 'degraded';

    } catch (error) {
      results.status = 'error';
      results.error = error.message;
    }

    this.healthStatus = results;
    return results;
  }

  async checkPostgres() {
    const startTime = Date.now();
    try {
      const result = await this.dbManager.postgresPool.query('SELECT 1');
      const duration = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: duration,
        version: result.rows[0].version,
        activeConnections: this.dbManager.postgresPool.totalCount
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  async checkNeo4j() {
    const startTime = Date.now();
    const session = this.dbManager.neo4jDriver.session();
    
    try {
      const result = await session.run('RETURN 1 as value');
      const duration = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: duration,
        version: await this.getNeo4jVersion()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    } finally {
      await session.close();
    }
  }

  async checkMongoDB() {
    const startTime = Date.now();
    try {
      await this.dbManager.mongodb.admin().ping();
      const duration = Date.now() - startTime;
      
      const stats = await this.dbManager.mongodb.stats();
      
      return {
        status: 'healthy',
        responseTime: duration,
        version: stats.version,
        collections: stats.collections,
        dataSize: stats.dataSize
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  async checkRedis() {
    const startTime = Date.now();
    try {
      await this.dbManager.redisClient.ping();
      const duration = Date.now() - startTime;
      
      const info = await this.dbManager.redisClient.info();
      
      return {
        status: 'healthy',
        responseTime: duration,
        version: this.parseRedisVersion(info),
        memoryUsage: this.parseRedisMemory(info)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  parseRedisVersion(info) {
    const match = info.match(/redis_version:(\d+\.\d+\.\d+)/);
    return match ? match[1] : 'unknown';
  }

  parseRedisMemory(info) {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async getNeo4jVersion() {
    const session = this.dbManager.neo4jDriver.session();
    try {
      const result = await session.run('CALL dbms.components()');
      const neo4jComponent = result.records.find(
        record => record.get('name') === 'Neo4j Kernel'
      );
      return neo4jComponent ? neo4jComponent.get('version') : 'unknown';
    } finally {
      await session.close();
    }
  }
}

module.exports = HealthChecker;
