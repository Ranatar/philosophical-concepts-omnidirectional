// tests/integrity/data-integrity.test.js

const DatabaseManager = require('../../shared/lib/db/DatabaseManager');
const DataIntegrityValidator = require('../../shared/lib/db/DataIntegrityValidator');
const { v4: uuidv4 } = require('uuid');

describe('Data Integrity Validation', () => {
  let dbManager;
  let validator;

  beforeAll(async () => {
    dbManager = new DatabaseManager(testConfig);
    await dbManager.initialize();
    validator = new DataIntegrityValidator(dbManager);
  });

  afterAll(async () => {
    await dbManager.close();
  });

  test('should detect missing data in Neo4j', async () => {
    // Создаем концепцию только в PostgreSQL
    const conceptId = uuidv4();
    await dbManager.postgresPool.query(
      'INSERT INTO concepts (concept_id, name) VALUES ($1, $2)',
      [conceptId, 'Orphan Concept']
    );

    const result = await validator.validateConcept(conceptId);
    
    expect(result.status).toBe('issues_found');
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        type: 'missing_in_neo4j',
        severity: 'critical'
      })
    );
  });

  test('should detect data mismatch between databases', async () => {
    const conceptId = uuidv4();
    
    // Создаем концепцию с разными названиями в разных БД
    await dbManager.postgresPool.query(
      'INSERT INTO concepts (concept_id, name) VALUES ($1, $2)',
      [conceptId, 'Name in PostgreSQL']
    );

    const session = dbManager.neo4jDriver.session();
    await session.run(
      'CREATE (c:Concept {concept_id: $conceptId, name: $name})',
      { conceptId, name: 'Different Name in Neo4j' }
    );
    await session.close();

    const result = await validator.validateConcept(conceptId);
    
    expect(result.status).toBe('issues_found');
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        type: 'data_mismatch',
        field: 'name',
        severity: 'high'
      })
    );
  });

  test('should fix integrity issues automatically', async () => {
    const conceptId = uuidv4();
    
    // Создаем концепцию только в PostgreSQL
    await dbManager.postgresPool.query(
      'INSERT INTO concepts (concept_id, name, description) VALUES ($1, $2, $3)',
      [conceptId, 'Fixable Concept', 'This concept will be fixed']
    );

    // Валидируем и исправляем
    const validationResult = await validator.validateConcept(conceptId);
    const fixes = await validator.fixIntegrityIssues(conceptId, validationResult.issues);
    
    expect(fixes).toContainEqual(
      expect.objectContaining({
        issue: 'missing_in_neo4j',
        status: 'fixed'
      })
    );

    // Проверяем, что концепция теперь есть в Neo4j
    const session = dbManager.neo4jDriver.session();
    const result = await session.run(
      'MATCH (c:Concept {concept_id: $conceptId}) RETURN c',
      { conceptId }
    );
    await session.close();
    
    expect(result.records).toHaveLength(1);
  });
});
