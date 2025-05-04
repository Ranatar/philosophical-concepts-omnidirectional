// tests/integration/concept-sync.test.js

const DatabaseManager = require('../../shared/lib/db/DatabaseManager');
const DataSynchronizer = require('../../shared/lib/db/DataSynchronizer');
const { v4: uuidv4 } = require('uuid');

describe('Concept Synchronization', () => {
  let dbManager;
  let dataSynchronizer;

  beforeAll(async () => {
    dbManager = new DatabaseManager(testConfig);
    await dbManager.initialize();
    dataSynchronizer = new DataSynchronizer(dbManager);
  });

  afterAll(async () => {
    await dbManager.close();
  });

  test('should synchronize concept creation across all databases', async () => {
    const conceptId = uuidv4();
    const conceptData = {
      concept_id: conceptId,
      creator_id: uuidv4(),
      name: 'Integration Test Concept',
      description: 'Test concept for integration testing'
    };

    const graphData = {
      categories: [
        {
          category_id: uuidv4(),
          name: 'Test Category',
          definition: 'Test definition',
          centrality: 0.5,
          certainty: 0.5
        }
      ],
      relationships: []
    };

    const thesesData = [
      {
        type: 'general',
        content: 'Test thesis content',
        style: 'academic'
      }
    ];

    const result = await dataSynchronizer.syncConceptCreation(
      conceptData,
      graphData,
      thesesData
    );

    expect(result.success).toBe(true);
    expect(result.conceptId).toBe(conceptId);

    // Проверка данных в каждой БД
    const pgResult = await dbManager.postgresPool.query(
      'SELECT * FROM concepts WHERE concept_id = $1',
      [conceptId]
    );
    expect(pgResult.rows).toHaveLength(1);

    const session = dbManager.neo4jDriver.session();
    const neo4jResult = await session.run(
      'MATCH (c:Concept {concept_id: $conceptId}) RETURN c',
      { conceptId }
    );
    await session.close();
    expect(neo4jResult.records).toHaveLength(1);

    const mongoResult = await dbManager.mongodb
      .collection('theses')
      .findOne({ concept_id: conceptId });
    expect(mongoResult).toBeDefined();
  });

  test('should handle sync errors gracefully', async () => {
    const invalidData = {
      concept_id: 'invalid-uuid-format',
      creator_id: uuidv4(),
      name: 'Invalid Concept'
    };

    await expect(
      dataSynchronizer.syncConceptCreation(invalidData, {}, [])
    ).rejects.toThrow();
  });
});
