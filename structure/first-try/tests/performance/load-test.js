// tests/performance/load-test.js

const DatabaseManager = require('../../shared/lib/db/DatabaseManager');
const DataSynchronizer = require('../../shared/lib/db/DataSynchronizer');
const { performance } = require('perf_hooks');
const { v4: uuidv4 } = require('uuid');

async function runLoadTest(config) {
  const dbManager = new DatabaseManager(config);
  await dbManager.initialize();
  const dataSynchronizer = new DataSynchronizer(dbManager);

  const results = {
    totalTime: 0,
    operations: 0,
    errors: 0,
    averageTime: 0
  };

  try {
    console.log('Starting load test...');
    const startTime = performance.now();

    // Параллельное создание концепций
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(createTestConcept(dataSynchronizer, i));
    }

    const operationResults = await Promise.allSettled(promises);
    
    results.operations = operationResults.length;
    results.errors = operationResults.filter(r => r.status === 'rejected').length;
    results.totalTime = performance.now() - startTime;
    results.averageTime = results.totalTime / results.operations;

    console.log('Load test results:', results);

  } finally {
    await dbManager.close();
  }

  return results;
}

async function createTestConcept(dataSynchronizer, index) {
  const conceptId = uuidv4();
  const conceptData = {
    concept_id: conceptId,
    creator_id: uuidv4(),
    name: `Load Test Concept ${index}`,
    description: `Load test concept #${index}`
  };

  const graphData = {
    categories: Array(5).fill(null).map(() => ({
      category_id: uuidv4(),
      name: `Category ${Math.random()}`,
      definition: 'Test definition',
      centrality: Math.random(),
      certainty: Math.random()
    })),
    relationships: []
  };

  const thesesData = Array(3).fill(null).map(() => ({
    type: 'general',
    content: `Test thesis ${Math.random()}`,
    style: 'academic'
  }));

  return dataSynchronizer.syncConceptCreation(conceptData, graphData, thesesData);
}

// Запуск теста
if (require.main === module) {
  runLoadTest(require('./config/test-config'))
    .then(results => {
      console.log('Test completed');
      process.exit(results.errors > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}
