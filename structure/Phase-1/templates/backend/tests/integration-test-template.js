/**
 * Шаблон интеграционного теста
 * Базовый шаблон для создания интеграционных тестов
 * 
 * Использование:
 * 1. Скопировать файл в нужную директорию тестов
 * 2. Заменить {{ServiceName}} на название сервиса (например, UserService)
 * 3. Заменить {{serviceName}} на название сервиса в camelCase (например, userService)
 * 4. Заменить {{endpoint}} на базовый endpoint API (например, /api/users)
 * 5. Адаптировать тесты под специфику сервиса
 */

const { describe, it, before, after, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Pool } = require('pg');
const Redis = require('ioredis-mock');

// Импорт приложения и зависимостей
const app = require('../../../src/app');
const { postgresClient } = require('../../../shared/lib/db/postgres/client');
const { mongoClient } = require('../../../shared/lib/db/mongodb/client');
const { redisClient } = require('../../../shared/lib/db/redis/client');
const { neo4jDriver } = require('../../../shared/lib/db/neo4j/driver');

describe('{{ServiceName}} Integration Tests', () => {
  let server;
  let mongoServer;
  let pgPool;
  let agent;
  let authToken;
  let testUser;
  let testData;

  // Настройка тестового окружения
  before(async function() {
    this.timeout(30000); // Увеличиваем таймаут для настройки

    // Запускаем in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;

    // Настраиваем тестовую PostgreSQL базу
    pgPool = new Pool({
      connectionString: process.env.TEST_POSTGRES_URL || 'postgresql://test:test@localhost:5432/test_db'
    });
    
    // Выполняем миграции
    await runMigrations(pgPool);

    // Заменяем Redis на mock
    sinon.stub(redisClient, 'client').value(new Redis());

    // Запускаем сервер
    server = app.listen(0); // Используем случайный порт
    agent = request.agent(server);

    // Создаем тестового пользователя и получаем токен
    testUser = await createTestUser();
    authToken = await getAuthToken(testUser);
  });

  after(async function() {
    this.timeout(10000);

    // Останавливаем сервер
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }

    // Очищаем базы данных
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    if (pgPool) {
      await pgPool.end();
    }

    // Закрываем соединения
    await mongoClient.close();
    await neo4jDriver.close();
    
    // Восстанавливаем заглушки
    sinon.restore();
  });

  beforeEach(async () => {
    // Подготовка тестовых данных перед каждым тестом
    testData = await setupTestData();
  });

  afterEach(async () => {
    // Очистка после каждого теста
    await cleanupTestData();
  });

  describe('GET {{endpoint}}', () => {
    it('should return list of entities with pagination', async () => {
      // Arrange
      const entities = await createMultipleEntities(5);

      // Act
      const response = await agent
        .get('{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 3 })
        .expect(200);

      // Assert
      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.be.an('array').with.lengthOf(3);
      expect(response.body.pagination).to.deep.include({
        page: 1,
        limit: 3,
        total: 5,
        totalPages: 2
      });
    });

    it('should filter entities by criteria', async () => {
      // Arrange
      await createEntity({ name: 'Test Entity 1', status: 'active' });
      await createEntity({ name: 'Test Entity 2', status: 'inactive' });
      await createEntity({ name: 'Test Entity 3', status: 'active' });

      // Act
      const response = await agent
        .get('{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'active' })
        .expect(200);

      // Assert
      expect(response.body.data).to.have.lengthOf(2);
      response.body.data.forEach(entity => {
        expect(entity.status).to.equal('active');
      });
    });

    it('should sort entities', async () => {
      // Arrange
      const entities = [
        await createEntity({ name: 'Charlie' }),
        await createEntity({ name: 'Alice' }),
        await createEntity({ name: 'Bob' })
      ];

      // Act
      const response = await agent
        .get('{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ sort: 'name', order: 'ASC' })
        .expect(200);

      // Assert
      const names = response.body.data.map(e => e.name);
      expect(names).to.deep.equal(['Alice', 'Bob', 'Charlie']);
    });

    it('should require authentication', async () => {
      // Act
      const response = await agent
        .get('{{endpoint}}')
        .expect(401);

      // Assert
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('Unauthorized');
    });
  });

  describe('GET {{endpoint}}/:id', () => {
    it('should return entity by id', async () => {
      // Arrange
      const entity = await createEntity({ name: 'Test Entity' });

      // Act
      const response = await agent
        .get(`{{endpoint}}/${entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.deep.include({
        id: entity.id,
        name: 'Test Entity'
      });
    });

    it('should return 404 for non-existent entity', async () => {
      // Act
      const response = await agent
        .get(`{{endpoint}}/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Assert
      expect(response.body.error).to.include('not found');
    });

    it('should include related data when requested', async () => {
      // Arrange
      const entity = await createEntityWithRelations();

      // Act
      const response = await agent
        .get(`{{endpoint}}/${entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ include: 'relations' })
        .expect(200);

      // Assert
      expect(response.body.data).to.have.property('relations');
      expect(response.body.data.relations).to.be.an('array');
    });
  });

  describe('POST {{endpoint}}', () => {
    it('should create new entity', async () => {
      // Arrange
      const entityData = {
        name: 'New Entity',
        description: 'Test description',
        metadata: { key: 'value' }
      };

      // Act
      const response = await agent
        .post('{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(201);

      // Assert
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.include({
        name: entityData.name,
        description: entityData.description
      });
      expect(response.body.data).to.have.property('id');
      expect(response.body.data).to.have.property('created_at');

      // Verify in database
      const dbEntity = await findEntityById(response.body.data.id);
      expect(dbEntity).to.exist;
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidData = {
        description: 'Missing required name field'
      };

      // Act
      const response = await agent
        .post('{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      // Assert
      expect(response.body.error).to.include('Validation error');
      expect(response.body.details).to.have.property('name');
    });

    it('should handle duplicate entries', async () => {
      // Arrange
      const entityData = { name: 'Unique Name', uniqueField: 'unique-value' };
      await createEntity(entityData);

      // Act
      const response = await agent
        .post('{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(409);

      // Assert
      expect(response.body.error).to.include('already exists');
    });

    it('should trigger related actions', async () => {
      // Arrange
      const spy = sinon.spy();
      subscribeToEvent('entity:created', spy);

      const entityData = { name: 'Trigger Test' };

      // Act
      await agent
        .post('{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(201);

      // Assert
      await waitFor(() => spy.called);
      expect(spy).to.have.been.calledOnce;
      expect(spy.firstCall.args[0]).to.have.property('name', 'Trigger Test');
    });
  });

  describe('PUT {{endpoint}}/:id', () => {
    it('should update existing entity', async () => {
      // Arrange
      const entity = await createEntity({ name: 'Original Name' });
      const updateData = { name: 'Updated Name' };

      // Act
      const response = await agent
        .put(`{{endpoint}}/${entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.data.name).to.equal('Updated Name');
      expect(response.body.data.updated_at).to.not.equal(entity.updated_at);
    });

    it('should validate update data', async () => {
      // Arrange
      const entity = await createEntity();
      const invalidUpdate = { name: '' }; // Empty name

      // Act
      const response = await agent
        .put(`{{endpoint}}/${entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);

      // Assert
      expect(response.body.error).to.include('Validation error');
    });

    it('should check permissions', async () => {
      // Arrange
      const otherUser = await createTestUser();
      const entity = await createEntity({ owner_id: otherUser.id });
      const updateData = { name: 'Unauthorized Update' };

      // Act
      const response = await agent
        .put(`{{endpoint}}/${entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);

      // Assert
      expect(response.body.error).to.include('Forbidden');
    });
  });

  describe('DELETE {{endpoint}}/:id', () => {
    it('should delete entity', async () => {
      // Arrange
      const entity = await createEntity();

      // Act
      const response = await agent
        .delete(`{{endpoint}}/${entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).to.be.true;
      
      // Verify deletion
      const dbEntity = await findEntityById(entity.id);
      expect(dbEntity).to.be.null;
    });

    it('should handle cascade deletions', async () => {
      // Arrange
      const entity = await createEntityWithRelations();
      const relationIds = entity.relations.map(r => r.id);

      // Act
      await agent
        .delete(`{{endpoint}}/${entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      for (const relationId of relationIds) {
        const relation = await findRelationById(relationId);
        expect(relation).to.be.null;
      }
    });

    it('should prevent deletion with dependencies', async () => {
      // Arrange
      const entity = await createEntity();
      await createDependency(entity.id);

      // Act
      const response = await agent
        .delete(`{{endpoint}}/${entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Assert
      expect(response.body.error).to.include('has dependencies');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle concurrent requests', async () => {
      // Arrange
      const promises = [];
      
      // Act
      for (let i = 0; i < 10; i++) {
        promises.push(
          agent
            .post('{{endpoint}}')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: `Concurrent Entity ${i}` })
        );
      }
      
      const responses = await Promise.all(promises);
      
      // Assert
      const successCount = responses.filter(r => r.status === 201).length;
      expect(successCount).to.equal(10);
    });

    it('should handle transaction rollback', async () => {
      // Arrange
      const initialCount = await getEntityCount();
      
      // Simulate a failing transaction
      const entityData = {
        name: 'Transaction Test',
        triggerError: true // Special flag to trigger error in service
      };

      // Act
      await agent
        .post('{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(500);

      // Assert
      const finalCount = await getEntityCount();
      expect(finalCount).to.equal(initialCount);
    });

    it('should integrate with external services', async () => {
      // Arrange
      const externalServiceStub = sinon.stub();
      setupExternalServiceMock(externalServiceStub);

      const entityData = {
        name: 'Integration Test',
        requiresExternalValidation: true
      };

      // Act
      await agent
        .post('{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(201);

      // Assert
      expect(externalServiceStub).to.have.been.calledOnce;
    });
  });

  describe('Performance Tests', () => {
    it('should handle large payloads', async () => {
      // Arrange
      const largeData = {
        name: 'Large Entity',
        data: generateLargePayload(1000) // 1000 items
      };

      // Act
      const startTime = Date.now();
      const response = await agent
        .post('{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeData)
        .expect(201);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).to.be.below(5000); // Should complete within 5 seconds
      expect(response.body.data.data).to.have.lengthOf(1000);
    });

    it('should efficiently query large datasets', async () => {
      // Arrange
      await createMultipleEntities(1000);

      // Act
      const startTime = Date.now();
      const response = await agent
        .get('{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 100 })
        .expect(200);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).to.be.below(1000); // Should complete within 1 second
      expect(response.body.data).to.have.lengthOf(100);
    });
  });

  // Helper functions

  async function createTestUser(userData = {}) {
    const defaultData = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!'
    };
    
    // Implementation specific to user creation
    return { id: 'test-user-id', ...defaultData, ...userData };
  }

  async function getAuthToken(user) {
    const response = await agent
      .post('/api/auth/login')
      .send({
        username: user.username,
        password: user.password
      });
    
    return response.body.token;
  }

  async function setupTestData() {
    // Setup any required test data
    return {
      // test data objects
    };
  }

  async function cleanupTestData() {
    // Cleanup test data after each test
    await pgPool.query('DELETE FROM test_entities WHERE created_by = $1', [testUser.id]);
  }

  async function createEntity(data = {}) {
    const defaultData = {
      name: `Test Entity ${Date.now()}`,
      created_by: testUser.id
    };
    
    const response = await agent
      .post('{{endpoint}}')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ...defaultData, ...data });
    
    return response.body.data;
  }

  async function createMultipleEntities(count) {
    const entities = [];
    for (let i = 0; i < count; i++) {
      entities.push(await createEntity({ name: `Entity ${i}` }));
    }
    return entities;
  }

  async function createEntityWithRelations() {
    // Implementation specific to creating entity with relations
    return {
      id: 'entity-with-relations',
      relations: []
    };
  }

  async function findEntityById(id) {
    const result = await pgPool.query(
      'SELECT * FROM entities WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async function getEntityCount() {
    const result = await pgPool.query('SELECT COUNT(*) FROM entities');
    return parseInt(result.rows[0].count);
  }

  async function runMigrations(pool) {
    // Run database migrations for test database
    // Implementation depends on migration tool
  }

  function waitFor(condition, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const interval = 100;
      let elapsed = 0;
      
      const check = () => {
        if (condition()) {
          resolve();
        } else if (elapsed >= timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          elapsed += interval;
          setTimeout(check, interval);
        }
      };
      
      check();
    });
  }

  function generateLargePayload(size) {
    return Array.from({ length: size }, (_, i) => ({
      id: i,
      value: `Item ${i}`,
      data: { nested: { value: i } }
    }));
  }

  function subscribeToEvent(eventName, handler) {
    // Implementation depends on event system
  }

  function setupExternalServiceMock(stub) {
    // Setup mock for external service calls
  }
});