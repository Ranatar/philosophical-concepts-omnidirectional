/**
 * Шаблон юнит-теста
 * Базовый шаблон для создания юнит-тестов
 * 
 * Использование:
 * 1. Скопировать файл в нужную директорию тестов
 * 2. Заменить {{ComponentName}} на название тестируемого компонента (например, UserService)
 * 3. Заменить {{componentName}} на название компонента в camelCase (например, userService)
 * 4. Заменить {{componentPath}} на путь к компоненту (например, ../services/userService)
 * 5. Адаптировать тесты под специфику компонента
 */

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

// Подключаем тестируемый компонент
const {{ComponentName}} = require('{{componentPath}}');

describe('{{ComponentName}}', () => {
  let {{componentName}};
  let sandbox;
  let stubs;
  let mocks;

  beforeEach(() => {
    // Создаем песочницу для изоляции тестов
    sandbox = sinon.createSandbox();
    
    // Создаем заглушки для зависимостей
    stubs = {
      repository: {
        findById: sandbox.stub(),
        findAll: sandbox.stub(),
        create: sandbox.stub(),
        update: sandbox.stub(),
        delete: sandbox.stub()
      },
      logger: {
        info: sandbox.stub(),
        error: sandbox.stub(),
        debug: sandbox.stub(),
        warn: sandbox.stub()
      },
      cache: {
        get: sandbox.stub(),
        set: sandbox.stub(),
        delete: sandbox.stub()
      },
      eventEmitter: {
        emit: sandbox.stub()
      }
    };
    
    // Создаем моки для внешних сервисов
    mocks = {
      externalService: {
        call: sandbox.stub()
      }
    };
    
    // Создаем экземпляр тестируемого компонента с заглушками
    {{componentName}} = new {{ComponentName}}(stubs.repository, {
      logger: stubs.logger,
      cache: stubs.cache,
      eventEmitter: stubs.eventEmitter
    });
  });

  afterEach(() => {
    // Восстанавливаем все заглушки
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const instance = new {{ComponentName}}(stubs.repository);
      expect(instance).to.be.instanceOf({{ComponentName}});
      expect(instance.repository).to.equal(stubs.repository);
    });

    it('should create instance with custom options', () => {
      const customOptions = {
        cacheEnabled: false,
        cacheTTL: 1800
      };
      
      const instance = new {{ComponentName}}(stubs.repository, customOptions);
      expect(instance.options).to.deep.include(customOptions);
    });
  });

  describe('getById', () => {
    it('should return entity from cache if exists', async () => {
      // Arrange
      const id = 'test-id';
      const cachedEntity = { id, name: 'Cached Entity' };
      stubs.cache.get.resolves(cachedEntity);
      
      // Act
      const result = await {{componentName}}.getById(id);
      
      // Assert
      expect(result).to.deep.equal(cachedEntity);
      expect(stubs.cache.get).to.have.been.calledOnceWith(`{{componentName}}:${id}`);
      expect(stubs.repository.findById).to.not.have.been.called;
    });

    it('should fetch from repository if not in cache', async () => {
      // Arrange
      const id = 'test-id';
      const entity = { id, name: 'Test Entity' };
      stubs.cache.get.resolves(null);
      stubs.repository.findById.resolves(entity);
      
      // Act
      const result = await {{componentName}}.getById(id);
      
      // Assert
      expect(result).to.deep.equal(entity);
      expect(stubs.repository.findById).to.have.been.calledOnceWith(id);
      expect(stubs.cache.set).to.have.been.calledOnce;
    });

    it('should return null if entity not found', async () => {
      // Arrange
      const id = 'non-existent-id';
      stubs.cache.get.resolves(null);
      stubs.repository.findById.resolves(null);
      
      // Act
      const result = await {{componentName}}.getById(id);
      
      // Assert
      expect(result).to.be.null;
      expect(stubs.cache.set).to.not.have.been.called;
    });

    it('should handle repository errors', async () => {
      // Arrange
      const id = 'test-id';
      const error = new Error('Database error');
      stubs.cache.get.resolves(null);
      stubs.repository.findById.rejects(error);
      
      // Act & Assert
      await expect({{componentName}}.getById(id))
        .to.be.rejectedWith('Database error');
      expect(stubs.logger.error).to.have.been.called;
    });
  });

  describe('create', () => {
    it('should create entity successfully', async () => {
      // Arrange
      const data = { name: 'New Entity', description: 'Test' };
      const created = { id: 'new-id', ...data };
      stubs.repository.create.resolves(created);
      
      // Act
      const result = await {{componentName}}.create(data);
      
      // Assert
      expect(result).to.deep.equal(created);
      expect(stubs.repository.create).to.have.been.calledOnceWith(data);
      expect(stubs.eventEmitter.emit).to.have.been.calledWith('entity:created', created);
    });

    it('should validate data before creation', async () => {
      // Arrange
      const invalidData = { name: '' }; // Invalid: empty name
      
      // Act & Assert
      await expect({{componentName}}.create(invalidData))
        .to.be.rejectedWith('Validation error');
    });

    it('should handle duplicate key errors', async () => {
      // Arrange
      const data = { name: 'Duplicate Entity' };
      const error = new Error('Duplicate key');
      error.code = 'DUPLICATE_KEY';
      stubs.repository.create.rejects(error);
      
      // Act & Assert
      await expect({{componentName}}.create(data))
        .to.be.rejectedWith('Entity already exists');
    });
  });

  describe('update', () => {
    it('should update entity successfully', async () => {
      // Arrange
      const id = 'test-id';
      const data = { name: 'Updated Entity' };
      const existing = { id, name: 'Old Entity' };
      const updated = { ...existing, ...data };
      
      stubs.repository.findById.resolves(existing);
      stubs.repository.update.resolves(updated);
      
      // Act
      const result = await {{componentName}}.update(id, data);
      
      // Assert
      expect(result).to.deep.equal(updated);
      expect(stubs.repository.update).to.have.been.calledWith(id, data);
      expect(stubs.cache.delete).to.have.been.calledWith(`{{componentName}}:${id}`);
      expect(stubs.eventEmitter.emit).to.have.been.calledWith('entity:updated', {
        old: existing,
        new: updated
      });
    });

    it('should throw error if entity not found', async () => {
      // Arrange
      const id = 'non-existent-id';
      const data = { name: 'Updated Entity' };
      stubs.repository.findById.resolves(null);
      
      // Act & Assert
      await expect({{componentName}}.update(id, data))
        .to.be.rejectedWith('Entity not found');
    });
  });

  describe('delete', () => {
    it('should delete entity successfully', async () => {
      // Arrange
      const id = 'test-id';
      const entity = { id, name: 'To Delete' };
      stubs.repository.findById.resolves(entity);
      stubs.repository.delete.resolves(true);
      
      // Act
      const result = await {{componentName}}.delete(id);
      
      // Assert
      expect(result).to.be.true;
      expect(stubs.repository.delete).to.have.been.calledWith(id);
      expect(stubs.cache.delete).to.have.been.calledWith(`{{componentName}}:${id}`);
      expect(stubs.eventEmitter.emit).to.have.been.calledWith('entity:deleted', entity);
    });

    it('should check for dependencies before deletion', async () => {
      // Arrange
      const id = 'test-id';
      const entity = { id, name: 'Has Dependencies' };
      stubs.repository.findById.resolves(entity);
      
      // Симулируем наличие зависимостей
      sandbox.stub({{componentName}}, 'checkDependencies').resolves(true);
      
      // Act & Assert
      await expect({{componentName}}.delete(id))
        .to.be.rejectedWith('Cannot delete: entity has dependencies');
    });
  });

  describe('list', () => {
    it('should return paginated list', async () => {
      // Arrange
      const params = { page: 1, limit: 10 };
      const entities = [
        { id: '1', name: 'Entity 1' },
        { id: '2', name: 'Entity 2' }
      ];
      const result = {
        items: entities,
        total: 2,
        page: 1,
        limit: 10
      };
      stubs.repository.findAll.resolves(result);
      
      // Act
      const list = await {{componentName}}.list(params);
      
      // Assert
      expect(list).to.deep.equal(result);
      expect(stubs.repository.findAll).to.have.been.calledWith(params);
    });

    it('should apply default pagination', async () => {
      // Arrange
      const entities = [];
      const result = {
        items: entities,
        total: 0,
        page: 1,
        limit: 20
      };
      stubs.repository.findAll.resolves(result);
      
      // Act
      await {{componentName}}.list();
      
      // Assert
      expect(stubs.repository.findAll).to.have.been.calledWith({
        page: 1,
        limit: 20
      });
    });
  });

  describe('private methods', () => {
    describe('validateData', () => {
      it('should validate required fields', () => {
        // Arrange
        const data = { description: 'No name' };
        
        // Act & Assert
        expect(() => {{componentName}}.validateData(data))
          .to.throw('Name is required');
      });

      it('should validate field types', () => {
        // Arrange
        const data = { name: 123 }; // Should be string
        
        // Act & Assert
        expect(() => {{componentName}}.validateData(data))
          .to.throw('Name must be a string');
      });

      it('should validate field constraints', () => {
        // Arrange
        const data = { name: 'a' }; // Too short
        
        // Act & Assert
        expect(() => {{componentName}}.validateData(data))
          .to.throw('Name must be at least 3 characters');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle null input gracefully', async () => {
      // Act & Assert
      await expect({{componentName}}.create(null))
        .to.be.rejectedWith('Invalid input');
    });

    it('should handle undefined input gracefully', async () => {
      // Act & Assert
      await expect({{componentName}}.update('id', undefined))
        .to.be.rejectedWith('Invalid input');
    });

    it('should handle empty arrays', async () => {
      // Arrange
      const result = {
        items: [],
        total: 0,
        page: 1,
        limit: 20
      };
      stubs.repository.findAll.resolves(result);
      
      // Act
      const list = await {{componentName}}.list();
      
      // Assert
      expect(list.items).to.be.an('array').that.is.empty;
    });
  });

  describe('error handling', () => {
    it('should log errors with context', async () => {
      // Arrange
      const error = new Error('Test error');
      stubs.repository.findAll.rejects(error);
      
      // Act
      try {
        await {{componentName}}.list();
      } catch (e) {
        // Expected
      }
      
      // Assert
      expect(stubs.logger.error).to.have.been.calledWith(
        sinon.match.string,
        sinon.match.has('error', error)
      );
    });

    it('should wrap repository errors', async () => {
      // Arrange
      const originalError = new Error('Database connection failed');
      stubs.repository.create.rejects(originalError);
      
      // Act & Assert
      await expect({{componentName}}.create({ name: 'Test' }))
        .to.be.rejectedWith('Failed to create entity');
    });
  });

  describe('performance', () => {
    it('should cache frequently accessed entities', async () => {
      // Arrange
      const id = 'popular-id';
      const entity = { id, name: 'Popular Entity' };
      stubs.cache.get.onFirstCall().resolves(null);
      stubs.cache.get.onSecondCall().resolves(entity);
      stubs.repository.findById.resolves(entity);
      
      // Act
      await {{componentName}}.getById(id);
      await {{componentName}}.getById(id);
      
      // Assert
      expect(stubs.repository.findById).to.have.been.calledOnce;
      expect(stubs.cache.get).to.have.been.calledTwice;
    });

    it('should batch operations when possible', async () => {
      // Arrange
      const ids = ['id1', 'id2', 'id3'];
      const batchStub = sandbox.stub({{componentName}}, 'batchGet');
      batchStub.resolves([]);
      
      // Act
      await Promise.all(ids.map(id => {{componentName}}.getById(id)));
      
      // Assert
      expect(batchStub).to.have.been.called;
    });
  });

  describe('concurrency', () => {
    it('should handle concurrent creates', async () => {
      // Arrange
      const data1 = { name: 'Entity 1' };
      const data2 = { name: 'Entity 2' };
      stubs.repository.create.resolves({ id: 'new-id' });
      
      // Act
      const [result1, result2] = await Promise.all([
        {{componentName}}.create(data1),
        {{componentName}}.create(data2)
      ]);
      
      // Assert
      expect(stubs.repository.create).to.have.been.calledTwice;
      expect(result1).to.exist;
      expect(result2).to.exist;
    });
  });
});

// Дополнительные тест-кейсы для специфичной функциональности
describe('{{ComponentName}} - Advanced Features', () => {
  let {{componentName}};
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    // Настройка для продвинутых тестов
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('complex scenarios', () => {
    it('should handle complex business logic', async () => {
      // Тест для сложной бизнес-логики
    });
  });

  describe('integration points', () => {
    it('should integrate with external services', async () => {
      // Тест интеграции с внешними сервисами
    });
  });
});