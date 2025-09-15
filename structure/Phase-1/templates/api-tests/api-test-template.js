/**
 * Шаблон для тестирования API
 * Использует supertest для тестирования HTTP-эндпоинтов
 */

const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../../src/server'); // Путь к основному серверу
const { generateAuthToken } = require('../helpers/authHelper');
const { createTestData, cleanupTestData } = require('../helpers/testDataHelper');
const { mockExternalServices } = require('../helpers/mockHelper');

describe('[Entity] API Tests', () => {
  let authToken;
  let testData;
  let sandbox;

  // Настройка перед всеми тестами
  before(async () => {
    // Инициализация тестовой базы данных
    await require('../helpers/dbHelper').initTestDb();
  });

  // Настройка перед каждым тестом
  beforeEach(async () => {
    // Создание песочницы для моков
    sandbox = sinon.createSandbox();
    
    // Мокирование внешних сервисов
    mockExternalServices(sandbox);
    
    // Создание тестовых данных
    testData = await createTestData();
    
    // Генерация токена аутентификации
    authToken = await generateAuthToken(testData.user);
  });

  // Очистка после каждого теста
  afterEach(async () => {
    // Восстановление моков
    sandbox.restore();
    
    // Очистка тестовых данных
    await cleanupTestData();
  });

  // Очистка после всех тестов
  after(async () => {
    // Закрытие соединений с БД
    await require('../helpers/dbHelper').closeTestDb();
  });

  describe('GET /api/[entities]', () => {
    it('should return list of entities with pagination', async () => {
      const response = await request(app)
        .get('/api/[entities]')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.be.an('array');
      expect(response.body).to.have.property('pagination');
      expect(response.body.pagination).to.have.all.keys(
        'page', 'limit', 'total', 'pages'
      );
    });

    it('should filter entities by search query', async () => {
      const response = await request(app)
        .get('/api/[entities]')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'test' })
        .expect(200);

      expect(response.body.data).to.be.an('array');
      response.body.data.forEach(entity => {
        expect(entity.name.toLowerCase()).to.include('test');
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/[entities]')
        .expect(401);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.have.property('code', 'UNAUTHORIZED');
    });
  });

  describe('GET /api/[entities]/:id', () => {
    it('should return a single entity', async () => {
      const response = await request(app)
        .get(`/api/[entities]/${testData.entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('id', testData.entity.id);
      expect(response.body.data).to.have.property('name');
    });

    it('should return 404 for non-existent entity', async () => {
      const nonExistentId = 'non-existent-id';
      
      const response = await request(app)
        .get(`/api/[entities]/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.have.property('code', 'NOT_FOUND');
    });

    it('should return 403 for unauthorized access', async () => {
      // Создаем токен для другого пользователя
      const otherUserToken = await generateAuthToken(testData.otherUser);
      
      const response = await request(app)
        .get(`/api/[entities]/${testData.privateEntity.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body).to.have.property('success', false);
      expect(response.body.error).to.have.property('code', 'FORBIDDEN');
    });
  });

  describe('POST /api/[entities]', () => {
    it('should create a new entity', async () => {
      const newEntity = {
        name: 'New Test Entity',
        description: 'Test description',
        additionalField: 'Additional data'
      };

      const response = await request(app)
        .post('/api/[entities]')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newEntity)
        .expect(201);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('id');
      expect(response.body.data).to.have.property('name', newEntity.name);
      expect(response.body.data).to.have.property('createdAt');
    });

    it('should validate required fields', async () => {
      const invalidEntity = {
        // Отсутствует обязательное поле name
        description: 'Test description'
      };

      const response = await request(app)
        .post('/api/[entities]')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEntity)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.have.property('code', 'VALIDATION_ERROR');
      expect(response.body.error).to.have.property('details');
      expect(response.body.error.details).to.be.an('array');
    });

    it('should handle duplicate entities', async () => {
      const duplicateEntity = {
        name: testData.entity.name, // Имя уже существует
        description: 'Another description'
      };

      const response = await request(app)
        .post('/api/[entities]')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateEntity)
        .expect(409);

      expect(response.body).to.have.property('success', false);
      expect(response.body.error).to.have.property('code', 'DUPLICATE_ENTRY');
    });
  });

  describe('PUT /api/[entities]/:id', () => {
    it('should update an existing entity', async () => {
      const updates = {
        name: 'Updated Entity Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/[entities]/${testData.entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property('name', updates.name);
      expect(response.body.data).to.have.property('updatedAt');
    });

    it('should partially update entity', async () => {
      const partialUpdate = {
        description: 'Only description updated'
      };

      const response = await request(app)
        .patch(`/api/[entities]/${testData.entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.data).to.have.property('description', partialUpdate.description);
      expect(response.body.data).to.have.property('name', testData.entity.name);
    });

    it('should validate update data', async () => {
      const invalidUpdate = {
        name: '', // Пустое имя недопустимо
        invalidField: 'This field does not exist'
      };

      const response = await request(app)
        .put(`/api/[entities]/${testData.entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).to.have.property('success', false);
      expect(response.body.error).to.have.property('code', 'VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/[entities]/:id', () => {
    it('should delete an entity', async () => {
      const response = await request(app)
        .delete(`/api/[entities]/${testData.entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message');

      // Проверяем, что сущность действительно удалена
      await request(app)
        .get(`/api/[entities]/${testData.entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle cascading deletes', async () => {
      // Создаем связанные данные
      const relatedData = await createTestData.createRelatedEntity(testData.entity.id);

      const response = await request(app)
        .delete(`/api/[entities]/${testData.entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Проверяем, что связанные данные также удалены
      const checkRelated = await request(app)
        .get(`/api/related-entities/${relatedData.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should prevent deletion of protected entities', async () => {
      const response = await request(app)
        .delete(`/api/[entities]/${testData.protectedEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).to.have.property('success', false);
      expect(response.body.error).to.have.property('code', 'DELETION_FORBIDDEN');
    });
  });

  describe('Integration with external services', () => {
    it('should handle external service failures gracefully', async () => {
      // Мокируем сбой внешнего сервиса
      sandbox.stub(require('../../src/clients/externalServiceClient'), 'fetchData')
        .rejects(new Error('External service unavailable'));

      const response = await request(app)
        .get(`/api/[entities]/${testData.entity.id}/external-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(503);

      expect(response.body).to.have.property('success', false);
      expect(response.body.error).to.have.property('code', 'SERVICE_UNAVAILABLE');
    });

    it('should cache external service responses', async () => {
      // Первый запрос
      const response1 = await request(app)
        .get(`/api/[entities]/${testData.entity.id}/external-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Второй запрос должен использовать кеш
      const response2 = await request(app)
        .get(`/api/[entities]/${testData.entity.id}/external-data`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response2.body.data).to.deep.equal(response1.body.data);
      expect(response2.headers).to.have.property('x-cache-hit', 'true');
    });
  });

  describe('Rate limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = [];
      
      // Делаем много запросов
      for (let i = 0; i < 101; i++) {
        requests.push(
          request(app)
            .get('/api/[entities]')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(requests);
      
      // Проверяем, что последний запрос превысил лимит
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).to.equal(429);
      expect(lastResponse.body.error).to.have.property('code', 'RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Performance tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 50;
      const startTime = Date.now();
      
      const requests = Array(concurrentRequests).fill().map(() =>
        request(app)
          .get('/api/[entities]')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Все запросы должны быть успешными
      responses.forEach(response => {
        expect(response.status).to.equal(200);
      });

      // Общее время должно быть разумным (менее 5 секунд для 50 запросов)
      expect(totalTime).to.be.below(5000);
    });

    it('should return large datasets with proper pagination', async () => {
      // Создаем много тестовых данных
      await createTestData.createBulkEntities(1000);

      const response = await request(app)
        .get('/api/[entities]')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 100 })
        .expect(200);

      expect(response.body.data).to.have.lengthOf(100);
      expect(response.body.pagination.total).to.be.at.least(1000);
      expect(response.body.pagination.pages).to.be.at.least(10);
    });
  });

  describe('Security tests', () => {
    it('should prevent SQL injection', async () => {
      const maliciousInput = {
        name: "'; DROP TABLE entities; --",
        description: 'Test'
      };

      const response = await request(app)
        .post('/api/[entities]')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousInput)
        .expect(201);

      // Данные должны быть корректно экранированы
      expect(response.body.data.name).to.equal(maliciousInput.name);
      
      // Проверяем, что таблица не удалена
      const checkResponse = await request(app)
        .get('/api/[entities]')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should prevent XSS attacks', async () => {
      const xssInput = {
        name: '<script>alert("XSS")</script>',
        description: '<img src=x onerror=alert("XSS")>'
      };

      const response = await request(app)
        .post('/api/[entities]')
        .set('Authorization', `Bearer ${authToken}`)
        .send(xssInput)
        .expect(201);

      // Данные должны быть санитизированы
      expect(response.body.data.name).to.not.include('<script>');
      expect(response.body.data.description).to.not.include('onerror');
    });
  });
});

// Дополнительные хелперы для специфичных тестов
module.exports = {
  // Экспортируем полезные функции для переиспользования
  testEntityCreation: async (entityData, authToken) => {
    return request(app)
      .post('/api/[entities]')
      .set('Authorization', `Bearer ${authToken}`)
      .send(entityData);
  },
  
  testEntityDeletion: async (entityId, authToken) => {
    return request(app)
      .delete(`/api/[entities]/${entityId}`)
      .set('Authorization', `Bearer ${authToken}`);
  }
};