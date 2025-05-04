// shared/lib/db/DataSynchronizer.js

const EventEmitter = require('events');

class DataSynchronizer extends EventEmitter {
  constructor(databaseManager) {
    super();
    this.dbManager = databaseManager;
  }

  async syncConceptCreation(conceptData, graphData, thesesData) {
    const transactionId = await this.dbManager.beginDistributedTransaction();
    
    try {
      // 1. Создание концепции в PostgreSQL
      const pgResult = await this.dbManager.executeInTransaction(transactionId, {
        postgres: {
          query: `
            INSERT INTO concepts (
              concept_id, creator_id, name, description, 
              is_synthesis, parent_concepts, innovation_degree
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *
          `,
          params: [
            conceptData.concept_id,
            conceptData.creator_id,
            conceptData.name,
            conceptData.description,
            conceptData.is_synthesis,
            conceptData.parent_concepts,
            conceptData.innovation_degree
          ]
        }
      });

      // 2. Создание графа в Neo4j
      const neo4jResult = await this.dbManager.executeInTransaction(transactionId, {
        neo4j: {
          query: `
            CREATE (c:Concept {
              concept_id: $conceptId,
              name: $name,
              description: $description,
              creation_date: datetime()
            })
            WITH c
            UNWIND $categories AS category
            CREATE (cat:Category {
              category_id: category.category_id,
              concept_id: $conceptId,
              name: category.name,
              definition: category.definition,
              centrality: category.centrality,
              certainty: category.certainty
            })
            CREATE (c)-[:INCLUDES]->(cat)
            RETURN c, collect(cat) as categories
          `,
          params: {
            conceptId: conceptData.concept_id,
            name: conceptData.name,
            description: conceptData.description,
            categories: graphData.categories
          }
        }
      });

      // 3. Создание связей между категориями в Neo4j
      for (const relationship of graphData.relationships) {
        await this.dbManager.executeInTransaction(transactionId, {
          neo4j: {
            query: `
              MATCH (source:Category {category_id: $sourceId})
              MATCH (target:Category {category_id: $targetId})
              CREATE (source)-[r:RELATED_TO {
                relationship_id: $relationshipId,
                type: $type,
                direction: $direction,
                strength: $strength,
                certainty: $certainty
              }]->(target)
              RETURN r
            `,
            params: {
              sourceId: relationship.source_id,
              targetId: relationship.target_id,
              relationshipId: relationship.relationship_id,
              type: relationship.type,
              direction: relationship.direction,
              strength: relationship.strength,
              certainty: relationship.certainty
            }
          }
        });
      }

      // 4. Создание тезисов в MongoDB
      if (thesesData && thesesData.length > 0) {
        await this.dbManager.executeInTransaction(transactionId, {
          mongodb: {
            collection: 'theses',
            method: 'insertMany',
            document: thesesData.map(thesis => ({
              ...thesis,
              concept_id: conceptData.concept_id,
              created_at: new Date(),
              updated_at: new Date()
            }))
          }
        });
      }

      // 5. Коммит транзакции
      await this.dbManager.commitDistributedTransaction(transactionId);

      // 6. Инвалидация кэша
      await this.invalidateConceptCache(conceptData.concept_id);

      // 7. Отправка события
      this.emit('conceptCreated', {
        conceptId: conceptData.concept_id,
        conceptData,
        graphData,
        thesesData
      });

      return {
        success: true,
        conceptId: conceptData.concept_id,
        message: 'Concept created successfully across all databases'
      };

    } catch (error) {
      await this.dbManager.rollbackDistributedTransaction(transactionId);
      this.emit('syncError', {
        operation: 'conceptCreation',
        conceptId: conceptData.concept_id,
        error
      });
      throw error;
    }
  }

  async syncConceptUpdate(conceptId, updates) {
    const transactionId = await this.dbManager.beginDistributedTransaction();
    
    try {
      // 1. Обновление в PostgreSQL
      if (updates.metadata) {
        await this.dbManager.executeInTransaction(transactionId, {
          postgres: {
            query: `
              UPDATE concepts 
              SET name = COALESCE($2, name),
                  description = COALESCE($3, description),
                  last_modified = CURRENT_TIMESTAMP
              WHERE concept_id = $1
              RETURNING *
            `,
            params: [conceptId, updates.metadata.name, updates.metadata.description]
          }
        });
      }

      // 2. Обновление в Neo4j
      if (updates.graph) {
        for (const categoryUpdate of updates.graph.categoryUpdates || []) {
          await this.dbManager.executeInTransaction(transactionId, {
            neo4j: {
              query: `
                MATCH (cat:Category {category_id: $categoryId})
                SET cat += $updates
                SET cat.updated_at = datetime()
                RETURN cat
              `,
              params: {
                categoryId: categoryUpdate.category_id,
                updates: categoryUpdate.updates
              }
            }
          });
        }
      }

      // 3. Обновление в MongoDB
      if (updates.theses) {
        for (const thesisUpdate of updates.theses) {
          await this.dbManager.executeInTransaction(transactionId, {
            mongodb: {
              collection: 'theses',
              method: 'updateOne',
              filter: { _id: thesisUpdate.thesis_id },
              update: { 
                $set: {
                  ...thesisUpdate.updates,
                  updated_at: new Date()
                }
              }
            }
          });
        }
      }

      // 4. Коммит транзакции
      await this.dbManager.commitDistributedTransaction(transactionId);

      // 5. Обновление кэша
      await this.updateConceptCache(conceptId);

      this.emit('conceptUpdated', {
        conceptId,
        updates
      });

      return {
        success: true,
        conceptId,
        message: 'Concept updated successfully across all databases'
      };

    } catch (error) {
      await this.dbManager.rollbackDistributedTransaction(transactionId);
      this.emit('syncError', {
        operation: 'conceptUpdate',
        conceptId,
        error
      });
      throw error;
    }
  }

  async syncConceptDeletion(conceptId) {
    const transactionId = await this.dbManager.beginDistributedTransaction();
    
    try {
      // 1. Удаление тезисов из MongoDB
      await this.dbManager.executeInTransaction(transactionId, {
        mongodb: {
          collection: 'theses',
          method: 'deleteMany',
          filter: { concept_id: conceptId }
        }
      });

      // 2. Удаление графа из Neo4j
      await this.dbManager.executeInTransaction(transactionId, {
        neo4j: {
          query: `
            MATCH (c:Concept {concept_id: $conceptId})
            OPTIONAL MATCH (c)-[:INCLUDES]->(cat:Category)
            DETACH DELETE c, cat
          `,
          params: { conceptId }
        }
      });

      // 3. Удаление из PostgreSQL
      await this.dbManager.executeInTransaction(transactionId, {
        postgres: {
          query: 'DELETE FROM concepts WHERE concept_id = $1',
          params: [conceptId]
        }
      });

      // 4. Коммит транзакции
      await this.dbManager.commitDistributedTransaction(transactionId);

      // 5. Очистка кэша
      await this.invalidateConceptCache(conceptId);

      this.emit('conceptDeleted', { conceptId });

      return {
        success: true,
        conceptId,
        message: 'Concept deleted successfully from all databases'
      };

    } catch (error) {
      await this.dbManager.rollbackDistributedTransaction(transactionId);
      this.emit('syncError', {
        operation: 'conceptDeletion',
        conceptId,
        error
      });
      throw error;
    }
  }

  // Методы для работы с кэшем
  async cacheConceptData(conceptId, data) {
    const key = `concept:${conceptId}`;
    await this.dbManager.redisClient.set(
      key, 
      JSON.stringify(data),
      'EX',
      3600 // TTL 1 час
    );
  }

  async getConceptFromCache(conceptId) {
    const key = `concept:${conceptId}`;
    const data = await this.dbManager.redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidateConceptCache(conceptId) {
    const key = `concept:${conceptId}`;
    await this.dbManager.redisClient.del(key);
  }

  async updateConceptCache(conceptId) {
    // Получение свежих данных из всех БД
    const conceptData = await this.getCompleteConceptData(conceptId);
    await this.cacheConceptData(conceptId, conceptData);
  }

  async getCompleteConceptData(conceptId) {
    // Параллельное получение данных из всех БД
    const [pgData, neo4jData, mongoData] = await Promise.all([
      // PostgreSQL
      this.dbManager.postgresPool.query(
        'SELECT * FROM concepts WHERE concept_id = $1',
        [conceptId]
      ),
      
      // Neo4j
      this.dbManager.neo4jDriver.session().run(`
        MATCH (c:Concept {concept_id: $conceptId})
        OPTIONAL MATCH (c)-[:INCLUDES]->(cat:Category)
        OPTIONAL MATCH (cat)-[r:RELATED_TO]-(related:Category)
        RETURN c, collect(DISTINCT cat) as categories, 
               collect(DISTINCT r) as relationships
      `, { conceptId }),
      
      // MongoDB
      this.dbManager.mongodb.collection('theses')
        .find({ concept_id: conceptId })
        .toArray()
    ]);

    return {
      metadata: pgData.rows[0],
      graph: neo4jData.records[0]?.toObject(),
      theses: mongoData
    };
  }
}

module.exports = DataSynchronizer;
