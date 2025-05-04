// db/mongodb/scripts/migration-runner.js

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

class MigrationRunner {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.db = null;
  }

  async connect() {
    this.client = await MongoClient.connect(this.config.uri);
    this.db = this.client.db(this.config.dbName);
    
    // Создание коллекции для отслеживания миграций
    await this.db.createCollection('migrations').catch(() => {});
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
    }
  }

  async getExecutedMigrations() {
    const migrations = await this.db.collection('migrations')
      .find({})
      .sort({ executedAt: 1 })
      .toArray();
    
    return migrations.map(m => m.filename);
  }

  async runMigration(filename, content) {
    console.log(`Executing migration: ${filename}`);
    
    try {
      // Выполнение миграции
      const migrationFn = eval(content);
      await migrationFn(this.db);
      
      // Регистрация успешной миграции
      await this.db.collection('migrations').insertOne({
        filename,
        executedAt: new Date(),
        status: 'completed'
      });
      
      console.log(`Migration ${filename} completed successfully`);
    } catch (error) {
      console.error(`Error executing migration ${filename}:`, error);
      throw error;
    }
  }

  async runAllMigrations() {
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(f => f.endsWith('.js'))
      .sort();
    
    const executedMigrations = await this.getExecutedMigrations();
    
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        const content = await fs.readFile(
          path.join(migrationsDir, file),
          'utf8'
        );
        await this.runMigration(file, content);
      }
    }
  }
}

// Использование
async function main() {
  const config = {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB || 'philosophy_service'
  };
  
  const runner = new MigrationRunner(config);
  
  try {
    await runner.connect();
    await runner.runAllMigrations();
  } finally {
    await runner.disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MigrationRunner;
