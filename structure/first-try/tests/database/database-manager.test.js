// tests/database/database-manager.test.js

const DatabaseManager = require('../../shared/lib/db/DatabaseManager');
const { v4: uuidv4 } = require('uuid');

describe('DatabaseManager', () => {
  let dbManager;
  let testConfig;

  beforeAll(async () => {
    // Конфигурация для тестовой среды
    testConfig = {
      postgres: {
        host: 'localhost',
        port: 5432,
        database: 'philosophy_test',
        user: 'postgres',
        password: 'password'
      },
      neo4j: {
        uri: 'bolt://localhost:7687',
        user: 'neo4j',
        password: 'test_password'
      },
      mongodb: {
        uri: 'mongodb://localhost:27017',
        dbName: 'philosophy_test'
      },
      redis: {
        host: 'localhost',
        port: 6379,
        db: 1 // Используем отдельную БД для тестов
      }
    };

    dbManager = new DatabaseManager(testConfig);
    await dbManager.initialize();
  });

  afterAll(async () => {
    await dbManager.close();
  });

  describe('Distributed Transactions', () => {
    test('should successfully complete distributed transaction', async () => {
      const transactionId = await dbManager.beginDistributedTransaction();
      expect(transactionId).toBeDefined();

      const conceptId = uuidv4();
      const operations = {
        postgres: {
          query: 'INSERT INTO concepts (concept_id, name) VALUES ($1, $2) RETURNING *',
          params: [conceptId, 'Test Concept']
        },
        neo4j: {
          query: 'CREATE (c:Concept {concept_id: $conceptId, name: $name}) RETURN c',
          params: { conceptId, name: 'Test Concept' }
        },
        mongodb: {
          collection: 'theses',
          method: 'insertOne',
          document: {
            concept_id: conceptId,
            content: 'Test thesis',
            created_at: new Date()
          }
        }
      };

      const results = await dbManager.executeInTransaction(transactionId, operations);
      expect(results.postgres.rows).toHaveLength(1);
      expect(results.neo4j.records).toHaveLength(1);
      expect(results.mongodb.insertedId).toBeDefined();

      await dbManager.commitDistributedTransaction(transactionId);

      // Проверка, что данные действительно сохранены
      const pgCheck = await dbManager.postgresPool.query(
        'SELECT * FROM concepts WHERE concept_id = $1',
        [conceptId]
      );
      expect(pgCheck.rows).toHaveLength(1);
    });

    test('should rollback distributed transaction on error', async () => {
      const transactionId = await dbManager.beginDistributedTransaction();
      const conceptId = uuidv4();

      try {
        // Операция, которая вызовет ошибку
        await dbManager.executeInTransaction(transactionId, {
          postgres: {
            query: 'INSERT INTO non_existent_table (id) VALUES ($1)',
            params: [conceptId]
          }
        });
      } catch (error) {
        await dbManager.rollbackDistributedTransaction(transactionId);
      }

      // Проверка, что транзакция откатилась
      const transaction = dbManager.activeTransactions.get(transactionId);
      expect(transaction).toBeUndefined();
    });
  });
});
