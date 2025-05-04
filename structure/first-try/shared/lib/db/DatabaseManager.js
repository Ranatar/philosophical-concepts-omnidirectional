// shared/lib/db/DatabaseManager.js

const { Pool } = require('pg');
const neo4j = require('neo4j-driver');
const { MongoClient } = require('mongodb');
const Redis = require('ioredis');

class DatabaseManager {
  constructor(config) {
    this.config = config;
    this.postgresPool = null;
    this.neo4jDriver = null;
    this.mongoClient = null;
    this.redisClient = null;
    this.activeTransactions = new Map();
  }

  async initialize() {
    // Инициализация PostgreSQL
    this.postgresPool = new Pool(this.config.postgres);
    
    // Инициализация Neo4j
    this.neo4jDriver = neo4j.driver(
      this.config.neo4j.uri,
      neo4j.auth.basic(this.config.neo4j.user, this.config.neo4j.password)
    );
    
    // Инициализация MongoDB
    this.mongoClient = await MongoClient.connect(this.config.mongodb.uri);
    this.mongodb = this.mongoClient.db(this.config.mongodb.dbName);
    
    // Инициализация Redis
    this.redisClient = new Redis(this.config.redis);
    
    console.log('All databases initialized');
  }

  async beginDistributedTransaction() {
    const transactionId = Date.now().toString();
    const transaction = {
      id: transactionId,
      postgresClient: await this.postgresPool.connect(),
      neo4jSession: this.neo4jDriver.session(),
      mongoSession: this.mongoClient.startSession(),
      status: 'active'
    };
    
    // Начало транзакций
    await transaction.postgresClient.query('BEGIN');
    transaction.neo4jTx = transaction.neo4jSession.beginTransaction();
    transaction.mongoSession.startTransaction();
    
    this.activeTransactions.set(transactionId, transaction);
    return transactionId;
  }

  async commitDistributedTransaction(transactionId) {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) throw new Error('Transaction not found');
    
    try {
      // Коммит всех транзакций
      await transaction.postgresClient.query('COMMIT');
      await transaction.neo4jTx.commit();
      await transaction.mongoSession.commitTransaction();
      
      transaction.status = 'committed';
      console.log(`Transaction ${transactionId} committed successfully`);
    } catch (error) {
      console.error(`Error committing transaction ${transactionId}:`, error);
      await this.rollbackDistributedTransaction(transactionId);
      throw error;
    } finally {
      // Освобождение ресурсов
      transaction.postgresClient.release();
      await transaction.neo4jSession.close();
      await transaction.mongoSession.endSession();
      this.activeTransactions.delete(transactionId);
    }
  }

  async rollbackDistributedTransaction(transactionId) {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) return;
    
    try {
      if (transaction.status === 'active') {
        await transaction.postgresClient.query('ROLLBACK');
        await transaction.neo4jTx.rollback();
        await transaction.mongoSession.abortTransaction();
      }
      
      transaction.status = 'rolled_back';
      console.log(`Transaction ${transactionId} rolled back`);
    } catch (error) {
      console.error(`Error rolling back transaction ${transactionId}:`, error);
    } finally {
      transaction.postgresClient.release();
      await transaction.neo4jSession.close();
      await transaction.mongoSession.endSession();
      this.activeTransactions.delete(transactionId);
    }
  }

  async executeInTransaction(transactionId, operations) {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) throw new Error('Transaction not found');
    
    const results = {};
    
    for (const [dbType, operation] of Object.entries(operations)) {
      try {
        switch (dbType) {
          case 'postgres':
            results.postgres = await transaction.postgresClient.query(
              operation.query,
              operation.params
            );
            break;
          
          case 'neo4j':
            results.neo4j = await transaction.neo4jTx.run(
              operation.query,
              operation.params
            );
            break;
          
          case 'mongodb':
            const collection = this.mongodb.collection(operation.collection);
            results.mongodb = await collection[operation.method](
              operation.filter || operation.document,
              operation.update || operation.options,
              { session: transaction.mongoSession }
            );
            break;
          
          default:
            throw new Error(`Unknown database type: ${dbType}`);
        }
      } catch (error) {
        console.error(`Error in ${dbType} operation:`, error);
        throw error;
      }
    }
    
    return results;
  }

  async close() {
    await this.postgresPool.end();
    await this.neo4jDriver.close();
    await this.mongoClient.close();
    await this.redisClient.quit();
    console.log('All database connections closed');
  }
}

module.exports = DatabaseManager;
