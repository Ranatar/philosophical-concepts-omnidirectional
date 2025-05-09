/**
 * Template for integration tests
 * Replace all instances of `Entity` with the actual entity name
 * Replace all instances of `entity` with the lowercase entity name
 */

const { describe, it, before, after, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

// Import database clients
const pgClient = require('../../../shared/lib/db/postgres/client').client;
const mongoClient = require('../../../shared/lib/db/mongodb/client').client;

// Import app and models
const app = require('../../src/app');
const Entity = require('../../../shared/models/Entity');

describe('Entity API Integration Tests', () => {
  let testEntities = [];
  let authToken;
  
  before(async () => {
    // Connect to databases if needed
    // await pgClient.connect();
    // await mongoClient.connect();
    
    // Set up test environment
    await setupTestEnvironment();
    
    // Get auth token for API requests
    authToken = await getAuthToken();
  });
  
  after(async () => {
    // Clean up test environment
    await cleanupTestEnvironment();
    
    // Close database connections if needed
    // await pgClient.end();
    // await mongoClient.close();
  });
  
  beforeEach(async () => {
    // Create test entities
    testEntities = await createTestEntities();
  });
  
  afterEach(async () => {
    // Clean up test entities
    await deleteTestEntities(testEntities);
  });
  
  describe('GET /entities', () => {
    it('should return paginated list of entities', async () => {
      // Make request
      const response = await request(app)
        .get('/api/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify response
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data').that.is.an('array');
      expect(response.body).to.have.property('meta');
      expect(response.body.meta).to.have.property('pagination');
      expect(response.body.meta.pagination).to.have.property('total');
      expect(response.body.meta.pagination).to.have.property('page');
      expect(response.body.meta.pagination).to.have.property('pageSize');
      
      // Verify that test entities are in the response
      const entityIds = response.body.data.map(e => e.id);
      testEntities.forEach(testEntity => {
        expect(entityIds).to.include(testEntity.id);
      });
    });
    
    it('should filter entities by query parameters', async () => {
      // Create an entity with specific property for filtering
      const filterEntity = await createEntity({
        name: 'FilterTest',
        type: 'special'
      });
      
      // Add to test entities for cleanup
      testEntities.push(filterEntity);
      
      // Make request with filter
      const response = await request(app)
        .get('/api/entities')
        .query({ type: 'special' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify response
      expect(response.body.data).to.be.an('array');
      expect(response.body.data.length).to.be.at.least(1);
      
      // Verify that filter entity is in the response
      const entityIds = response.body.data.map(e => e.id);
      expect(entityIds).to.include(filterEntity.id);
      
      // Verify that other test entities are not in the response
      testEntities
        .filter(e => e.id !== filterEntity.id)
        .forEach(testEntity => {
          expect(entityIds).to.not.include(testEntity.id);
        });
    });
    
    it('should sort entities correctly', async () => {
      // Create entities with known order
      const entityA = await createEntity({ name: 'A Entity' });
      const entityB = await createEntity({ name: 'B Entity' });
      const entityC = await createEntity({ name: 'C Entity' });
      
      // Add to test entities for cleanup
      testEntities.push(entityA, entityB, entityC);
      
      // Make request with sorting
      const response = await request(app)
        .get('/api/entities')
        .query({ 
          sortBy: 'name',
          sortOrder: 'asc'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify response order
      const names = response.body.data.map(e => e.name);
      
      // Check that 'A Entity' comes before 'B Entity' comes before 'C Entity'
      expect(names.indexOf('A Entity')).to.be.lessThan(names.indexOf('B Entity'));
      expect(names.indexOf('B Entity')).to.be.lessThan(names.indexOf('C Entity'));
      
      // Test descending order
      const desResponse = await request(app)
        .get('/api/entities')
        .query({ 
          sortBy: 'name',
          sortOrder: 'desc'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify response order
      const desNames = desResponse.body.data.map(e => e.name);
      
      // Check that 'C Entity' comes before 'B Entity' comes before 'A Entity'
      expect(desNames.indexOf('C Entity')).to.be.lessThan(desNames.indexOf('B Entity'));
      expect(desNames.indexOf('B Entity')).to.be.lessThan(desNames.indexOf('A Entity'));
    });
    
    it('should return empty array when no entities match filters', async () => {
      // Make request with filter that won't match any entities
      const response = await request(app)
        .get('/api/entities')
        .query({ name: 'NonExistentEntity' + uuidv4() })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify response
      expect(response.body.data).to.be.an('array').that.is.empty;
      expect(response.body.meta.pagination.total).to.equal(0);
    });
    
    it('should require authentication', async () => {
      // Make request without auth token
      await request(app)
        .get('/api/entities')
        .expect(401);
    });
  });
  
  describe('GET /entities/:id', () => {
    it('should return entity by ID', async () => {
      // Get a test entity
      const testEntity = testEntities[0];
      
      // Make request
      const response = await request(app)
        .get(`/api/entities/${testEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify response
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('id', testEntity.id);
      expect(response.body.data).to.have.property('name', testEntity.name);
      // Verify other properties as needed
    });
    
    it('should return 404 for non-existent entity', async () => {
      // Make request with non-existent ID
      const nonExistentId = uuidv4();
      
      const response = await request(app)
        .get(`/api/entities/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      // Verify response
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.have.property('code', 'NOT_FOUND');
    });
    
    it('should require authentication', async () => {
      // Get a test entity
      const testEntity = testEntities[0];
      
      // Make request without auth token
      await request(app)
        .get(`/api/entities/${testEntity.id}`)
        .expect(401);
    });
  });
  
  describe('POST /entities', () => {
    it('should create a new entity', async () => {
      // Prepare entity data
      const entityData = {
        name: 'New Test Entity',
        description: 'Created in integration test',
        // Add other required fields
      };
      
      // Make request
      const response = await request(app)
        .post('/api/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(201);
      
      // Verify response
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('id').that.is.a('string');
      expect(response.body.data).to.have.property('name', entityData.name);
      expect(response.body.data).to.have.property('description', entityData.description);
      
      // Add to test entities for cleanup
      testEntities.push(response.body.data);
      
      // Verify entity is in the database (if direct DB verification is needed)
      const dbEntity = await getEntityFromDb(response.body.data.id);
      expect(dbEntity).to.not.be.null;
      expect(dbEntity.name).to.equal(entityData.name);
    });
    
    it('should validate required fields', async () => {
      // Prepare invalid entity data (missing required fields)
      const invalidData = {
        // Missing 'name' field
        description: 'This should fail validation'
      };
      
      // Make request
      const response = await request(app)
        .post('/api/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(422);
      
      // Verify response
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.have.property('code', 'VALIDATION_ERROR');
      expect(response.body.error).to.have.property('details');
      
      // Verify that validation details mention the missing field
      expect(response.body.error.details).to.have.nested.property('validationErrors.name');
    });
    
    it('should require authentication', async () => {
      // Prepare entity data
      const entityData = {
        name: 'Auth Test Entity',
        description: 'This should fail authentication'
      };
      
      // Make request without auth token
      await request(app)
        .post('/api/entities')
        .send(entityData)
        .expect(401);
    });
  });
  
  describe('PUT /entities/:id', () => {
    it('should update an existing entity', async () => {
      // Get a test entity
      const testEntity = testEntities[0];
      
      // Prepare update data
      const updateData = {
        name: 'Updated Name',
        description: 'Updated in integration test'
      };
      
      // Make request
      const response = await request(app)
        .put(`/api/entities/${testEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      // Verify response
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('id', testEntity.id);
      expect(response.body.data).to.have.property('name', updateData.name);
      expect(response.body.data).to.have.property('description', updateData.description);
      
      // Verify entity is updated in the database (if direct DB verification is needed)
      const dbEntity = await getEntityFromDb(testEntity.id);
      expect(dbEntity).to.not.be.null;
      expect(dbEntity.name).to.equal(updateData.name);
    });
    
    it('should return 404 for non-existent entity', async () => {
      // Prepare update data
      const updateData = {
        name: 'Update Nonexistent',
        description: 'This should fail with 404'
      };
      
      // Make request with non-existent ID
      const nonExistentId = uuidv4();
      
      const response = await request(app)
        .put(`/api/entities/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);
      
      // Verify response
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.have.property('code', 'NOT_FOUND');
    });
    
    it('should validate update data', async () => {
      // Get a test entity
      const testEntity = testEntities[0];
      
      // Prepare invalid update data
      const invalidData = {
        name: '', // Empty name should fail validation
        description: 'This should fail validation'
      };
      
      // Make request
      const response = await request(app)
        .put(`/api/entities/${testEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(422);
      
      // Verify response
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.have.property('code', 'VALIDATION_ERROR');
    });
    
    it('should require authentication', async () => {
      // Get a test entity
      const testEntity = testEntities[0];
      
      // Prepare update data
      const updateData = {
        name: 'Auth Update Test',
        description: 'This should fail authentication'
      };
      
      // Make request without auth token
      await request(app)
        .put(`/api/entities/${testEntity.id}`)
        .send(updateData)
        .expect(401);
    });
  });
  
  describe('DELETE /entities/:id', () => {
    it('should delete an existing entity', async () => {
      // Get a test entity
      const testEntity = testEntities[0];
      
      // Make request
      const response = await request(app)
        .delete(`/api/entities/${testEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify response
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('id', testEntity.id);
      
      // Verify entity is deleted from the database (if direct DB verification is needed)
      const dbEntity = await getEntityFromDb(testEntity.id);
      expect(dbEntity).to.be.null;
      
      // Remove from test entities list since it's already deleted
      testEntities = testEntities.filter(e => e.id !== testEntity.id);
    });
    
    it('should return 404 for non-existent entity', async () => {
      // Make request with non-existent ID
      const nonExistentId = uuidv4();
      
      const response = await request(app)
        .delete(`/api/entities/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      // Verify response
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('error');
      expect(response.body.error).to.have.property('code', 'NOT_FOUND');
    });
    
    it('should require authentication', async () => {
      // Get a test entity
      const testEntity = testEntities[0];
      
      // Make request without auth token
      await request(app)
        .delete(`/api/entities/${testEntity.id}`)
        .expect(401);
    });
  });
  
  // Helper functions
  
  /**
   * Set up test environment
   * @returns {Promise<void>} Promise that resolves when setup is complete
   */
  async function setupTestEnvironment() {
    // Implement test environment setup
    // This might include:
    // - Creating test tables/collections
    // - Setting up test configuration
    // - Initializing test data
  }
  
  /**
   * Clean up test environment
   * @returns {Promise<void>} Promise that resolves when cleanup is complete
   */
  async function cleanupTestEnvironment() {
    // Implement test environment cleanup
    // This might include:
    // - Dropping test tables/collections
    // - Removing test data
  }
  
  /**
   * Get authentication token for API requests
   * @returns {Promise<string>} Promise that resolves to auth token
   */
  async function getAuthToken() {
    // In a real test, this might make a login request
    // For testing, you might use a pre-generated token or a test user
    
    // Example of making a login request:
    /*
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'test-user',
        password: 'test-password'
      });
    
    return response.body.data.token;
    */
    
    // For now, return a mock token
    return 'test-auth-token';
  }
  
  /**
   * Create test entities for testing
   * @returns {Promise<Array<Object>>} Promise that resolves to array of created entities
   */
  async function createTestEntities() {
    // Create multiple test entities
    const entities = [];
    
    for (let i = 0; i < 3; i++) {
      const entity = await createEntity({
        name: `Test Entity ${i}`,
        description: `Test entity ${i} for integration tests`
      });
      
      entities.push(entity);
    }
    
    return entities;
  }
  
  /**
   * Create a single entity for testing
   * @param {Object} data - Entity data
   * @returns {Promise<Object>} Promise that resolves to created entity
   */
  async function createEntity(data) {
    // In a real test, this might use the repository directly
    // For now, use the API to create the entity
    
    const response = await request(app)
      .post('/api/entities')
      .set('Authorization', `Bearer ${authToken}`)
      .send(data);
    
    return response.body.data;
  }
  
  /**
   * Delete test entities
   * @param {Array<Object>} entities - Entities to delete
   * @returns {Promise<void>} Promise that resolves when all entities are deleted
   */
  async function deleteTestEntities(entities) {
    // Delete all test entities
    const deletePromises = entities.map(entity => 
      request(app)
        .delete(`/api/entities/${entity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .catch(err => {
          // Ignore 404 errors (entity already deleted)
          if (err.status !== 404) {
            throw err;
          }
        })
    );
    
    await Promise.all(deletePromises);
  }
  
  /**
   * Get entity from database directly
   * @param {string} id - Entity ID
   * @returns {Promise<Object|null>} Promise that resolves to entity or null if not found
   */
  async function getEntityFromDb(id) {
    // This is a placeholder for direct database access
    // In a real test, this would query the database directly
    
    // Example using PostgreSQL:
    /*
    const result = await pgClient.query(
      'SELECT * FROM entities WHERE entity_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
    */
    
    // Example using MongoDB:
    /*
    const db = mongoClient.db('philosophy');
    const collection = db.collection('entities');
    
    return await collection.findOne({ entity_id: id });
    */
    
    // For now, use the API to get the entity
    try {
      const response = await request(app)
        .get(`/api/entities/${id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      return response.body.data;
    } catch (err) {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }
  }
});
