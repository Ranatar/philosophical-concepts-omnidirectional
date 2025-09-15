/**
 * Шаблон репозитория Neo4j
 * Базовый шаблон для создания репозиториев для работы с Neo4j
 * 
 * Использование:
 * 1. Скопировать файл в нужную директорию
 * 2. Заменить {{NodeType}} на тип узла (например, Concept)
 * 3. Заменить {{nodeType}} на тип узла в camelCase (например, concept)
 * 4. Заменить {{nodeLabel}} на метку узла в Neo4j (например, Concept)
 * 5. Адаптировать свойства и отношения под специфику графа
 */

const { neo4jDriver } = require('../../../shared/lib/db/neo4j/driver');
const { cypherBuilder } = require('../../../shared/lib/db/neo4j/cypherBuilder');
const logger = require('../../../shared/lib/logging/logger');
const { v4: uuidv4 } = require('uuid');

class {{NodeType}}Repository {
  constructor(driver = neo4jDriver) {
    this.driver = driver;
    this.nodeLabel = '{{nodeLabel}}';
    
    // Базовые свойства узла
    this.nodeProperties = [
      'id',
      'name',
      'description',
      'created_at',
      'updated_at',
      'properties'
      // Добавить специфичные свойства
    ];
    
    // Типы отношений
    this.relationshipTypes = {
      RELATES_TO: 'RELATES_TO',
      BELONGS_TO: 'BELONGS_TO',
      CONTAINS: 'CONTAINS'
      // Добавить специфичные типы отношений
    };
  }

  /**
   * Получение сессии Neo4j
   */
  getSession(mode = 'READ') {
    return this.driver.session({
      defaultAccessMode: mode === 'WRITE' ? 'WRITE' : 'READ'
    });
  }

  /**
   * Создание узла
   */
  async createNode(properties) {
    const session = this.getSession('WRITE');
    
    try {
      const nodeId = properties.id || uuidv4();
      const timestamp = new Date().toISOString();
      
      const nodeData = {
        ...properties,
        id: nodeId,
        created_at: properties.created_at || timestamp,
        updated_at: properties.updated_at || timestamp
      };
      
      const cypher = `
        CREATE (n:${this.nodeLabel} $properties)
        RETURN n
      `;
      
      const result = await session.run(cypher, { properties: nodeData });
      const node = result.records[0].get('n');
      
      logger.info('{{NodeType}} node created', { id: nodeId });
      
      return this.nodeToObject(node);
    } catch (error) {
      logger.error('Error creating {{nodeType}} node', { error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Получение узла по ID
   */
  async findNodeById(id) {
    const session = this.getSession('READ');
    
    try {
      const cypher = `
        MATCH (n:${this.nodeLabel} {id: $id})
        RETURN n
      `;
      
      const result = await session.run(cypher, { id });
      
      if (result.records.length === 0) {
        return null;
      }
      
      const node = result.records[0].get('n');
      
      logger.debug('{{NodeType}} node found', { id });
      
      return this.nodeToObject(node);
    } catch (error) {
      logger.error('Error finding {{nodeType}} node', { id, error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Получение всех узлов с пагинацией
   */
  async findAllNodes({ skip = 0, limit = 20, orderBy = 'created_at', order = 'DESC' } = {}) {
    const session = this.getSession('READ');
    
    try {
      // Запрос для подсчета общего количества
      const countCypher = `
        MATCH (n:${this.nodeLabel})
        RETURN count(n) as total
      `;
      
      const countResult = await session.run(countCypher);
      const total = countResult.records[0].get('total').toNumber();
      
      // Запрос для получения узлов
      const cypher = `
        MATCH (n:${this.nodeLabel})
        RETURN n
        ORDER BY n.${orderBy} ${order}
        SKIP $skip
        LIMIT $limit
      `;
      
      const result = await session.run(cypher, { 
        skip: parseInt(skip), 
        limit: parseInt(limit) 
      });
      
      const nodes = result.records.map(record => 
        this.nodeToObject(record.get('n'))
      );
      
      logger.debug('{{NodeType}} nodes retrieved', { count: nodes.length, total });
      
      return {
        nodes,
        total,
        skip,
        limit
      };
    } catch (error) {
      logger.error('Error finding all {{nodeType}} nodes', { error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Обновление узла
   */
  async updateNode(id, properties) {
    const session = this.getSession('WRITE');
    
    try {
      const updateData = {
        ...properties,
        updated_at: new Date().toISOString()
      };
      
      // Удаляем id из обновляемых свойств
      delete updateData.id;
      
      const cypher = `
        MATCH (n:${this.nodeLabel} {id: $id})
        SET n += $properties
        RETURN n
      `;
      
      const result = await session.run(cypher, { 
        id, 
        properties: updateData 
      });
      
      if (result.records.length === 0) {
        return null;
      }
      
      const node = result.records[0].get('n');
      
      logger.info('{{NodeType}} node updated', { id });
      
      return this.nodeToObject(node);
    } catch (error) {
      logger.error('Error updating {{nodeType}} node', { id, error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Удаление узла
   */
  async deleteNode(id) {
    const session = this.getSession('WRITE');
    
    try {
      // Сначала проверяем, существует ли узел
      const checkCypher = `
        MATCH (n:${this.nodeLabel} {id: $id})
        RETURN count(n) as count
      `;
      
      const checkResult = await session.run(checkCypher, { id });
      const exists = checkResult.records[0].get('count').toNumber() > 0;
      
      if (!exists) {
        return false;
      }
      
      // Удаляем узел и все его отношения
      const cypher = `
        MATCH (n:${this.nodeLabel} {id: $id})
        DETACH DELETE n
      `;
      
      await session.run(cypher, { id });
      
      logger.info('{{NodeType}} node deleted', { id });
      
      return true;
    } catch (error) {
      logger.error('Error deleting {{nodeType}} node', { id, error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Создание отношения между узлами
   */
  async createRelationship(fromId, toId, type, properties = {}) {
    const session = this.getSession('WRITE');
    
    try {
      const relationshipData = {
        ...properties,
        created_at: new Date().toISOString()
      };
      
      const cypher = `
        MATCH (from:${this.nodeLabel} {id: $fromId})
        MATCH (to:${this.nodeLabel} {id: $toId})
        CREATE (from)-[r:${type} $properties]->(to)
        RETURN r
      `;
      
      const result = await session.run(cypher, {
        fromId,
        toId,
        properties: relationshipData
      });
      
      if (result.records.length === 0) {
        throw new Error('One or both nodes not found');
      }
      
      logger.info('Relationship created', { fromId, toId, type });
      
      const relationship = result.records[0].get('r');
      return this.relationshipToObject(relationship);
    } catch (error) {
      logger.error('Error creating relationship', { fromId, toId, type, error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Получение узла с его отношениями
   */
  async findNodeWithRelationships(id, relationshipTypes = null, depth = 1) {
    const session = this.getSession('READ');
    
    try {
      let relationshipPattern = '';
      if (relationshipTypes && relationshipTypes.length > 0) {
        const types = relationshipTypes.join('|');
        relationshipPattern = `:${types}`;
      }
      
      const cypher = `
        MATCH (n:${this.nodeLabel} {id: $id})
        OPTIONAL MATCH path = (n)-[r${relationshipPattern}*1..${depth}]-(related)
        RETURN n, collect(DISTINCT r) as relationships, collect(DISTINCT related) as relatedNodes
      `;
      
      const result = await session.run(cypher, { id });
      
      if (result.records.length === 0) {
        return null;
      }
      
      const record = result.records[0];
      const node = this.nodeToObject(record.get('n'));
      const relationships = record.get('relationships').map(r => 
        r ? this.relationshipToObject(r) : null
      ).filter(Boolean);
      const relatedNodes = record.get('relatedNodes').map(n => 
        n ? this.nodeToObject(n) : null
      ).filter(Boolean);
      
      logger.debug('{{NodeType}} node with relationships retrieved', { 
        id, 
        relationshipCount: relationships.length,
        relatedNodeCount: relatedNodes.length 
      });
      
      return {
        node,
        relationships,
        relatedNodes
      };
    } catch (error) {
      logger.error('Error finding node with relationships', { id, error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Поиск узлов по свойствам
   */
  async findNodesByProperties(properties) {
    const session = this.getSession('READ');
    
    try {
      const whereConditions = Object.entries(properties)
        .map(([key, value]) => `n.${key} = $${key}`)
        .join(' AND ');
      
      const cypher = `
        MATCH (n:${this.nodeLabel})
        WHERE ${whereConditions}
        RETURN n
      `;
      
      const result = await session.run(cypher, properties);
      
      const nodes = result.records.map(record => 
        this.nodeToObject(record.get('n'))
      );
      
      logger.debug('{{NodeType}} nodes found by properties', { 
        count: nodes.length,
        properties 
      });
      
      return nodes;
    } catch (error) {
      logger.error('Error finding nodes by properties', { properties, error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Полнотекстовый поиск узлов
   */
  async searchNodes(searchText, limit = 20) {
    const session = this.getSession('READ');
    
    try {
      const cypher = `
        MATCH (n:${this.nodeLabel})
        WHERE n.name CONTAINS $searchText 
           OR n.description CONTAINS $searchText
        RETURN n
        LIMIT $limit
      `;
      
      const result = await session.run(cypher, { 
        searchText, 
        limit: parseInt(limit) 
      });
      
      const nodes = result.records.map(record => 
        this.nodeToObject(record.get('n'))
      );
      
      logger.debug('{{NodeType}} nodes search completed', { 
        searchText,
        found: nodes.length 
      });
      
      return nodes;
    } catch (error) {
      logger.error('Error searching nodes', { searchText, error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Получение кратчайшего пути между узлами
   */
  async findShortestPath(fromId, toId, maxLength = 5) {
    const session = this.getSession('READ');
    
    try {
      const cypher = `
        MATCH (from:${this.nodeLabel} {id: $fromId})
        MATCH (to:${this.nodeLabel} {id: $toId})
        MATCH path = shortestPath((from)-[*..${maxLength}]-(to))
        RETURN path
      `;
      
      const result = await session.run(cypher, { fromId, toId });
      
      if (result.records.length === 0) {
        return null;
      }
      
      const path = result.records[0].get('path');
      
      return {
        nodes: path.segments.map(segment => 
          this.nodeToObject(segment.start)
        ).concat([this.nodeToObject(path.segments[path.segments.length - 1].end)]),
        relationships: path.segments.map(segment => 
          this.relationshipToObject(segment.relationship)
        ),
        length: path.length
      };
    } catch (error) {
      logger.error('Error finding shortest path', { fromId, toId, error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Выполнение произвольного Cypher-запроса
   */
  async executeCypher(cypher, parameters = {}) {
    const session = this.getSession();
    
    try {
      const result = await session.run(cypher, parameters);
      
      logger.debug('Custom Cypher query executed', { 
        recordCount: result.records.length 
      });
      
      return result.records;
    } catch (error) {
      logger.error('Error executing Cypher query', { cypher, error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Начало транзакции
   */
  async beginTransaction() {
    const session = this.getSession('WRITE');
    const tx = session.beginTransaction();
    return { session, tx };
  }

  /**
   * Коммит транзакции
   */
  async commitTransaction({ session, tx }) {
    try {
      await tx.commit();
    } finally {
      await session.close();
    }
  }

  /**
   * Откат транзакции
   */
  async rollbackTransaction({ session, tx }) {
    try {
      await tx.rollback();
    } finally {
      await session.close();
    }
  }

  /**
   * Массовое создание узлов
   */
  async bulkCreateNodes(nodesData) {
    const session = this.getSession('WRITE');
    const tx = session.beginTransaction();
    
    try {
      const createdNodes = [];
      
      for (const nodeData of nodesData) {
        const nodeId = nodeData.id || uuidv4();
        const timestamp = new Date().toISOString();
        
        const properties = {
          ...nodeData,
          id: nodeId,
          created_at: nodeData.created_at || timestamp,
          updated_at: nodeData.updated_at || timestamp
        };
        
        const cypher = `
          CREATE (n:${this.nodeLabel} $properties)
          RETURN n
        `;
        
        const result = await tx.run(cypher, { properties });
        const node = result.records[0].get('n');
        createdNodes.push(this.nodeToObject(node));
      }
      
      await tx.commit();
      
      logger.info('{{NodeType}} nodes bulk created', { count: createdNodes.length });
      
      return createdNodes;
    } catch (error) {
      await tx.rollback();
      logger.error('Error bulk creating nodes', { error });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Получение статистики по узлам
   */
  async getNodeStatistics() {
    const session = this.getSession('READ');
    
    try {
      const cypher = `
        MATCH (n:${this.nodeLabel})
        WITH count(n) as totalNodes
        MATCH ()-[r]->()
        RETURN totalNodes, count(DISTINCT r) as totalRelationships
      `;
      
      const result = await session.run(cypher);
      
      if (result.records.length === 0) {
        return { totalNodes: 0, totalRelationships: 0 };
      }
      
      const record = result.records[0];
      
      return {
        totalNodes: record.get('totalNodes').toNumber(),
        totalRelationships: record.get('totalRelationships').toNumber()
      };
    } catch (error) {
      logger.error('Error getting node statistics', { error });
      throw error;
    } finally {
      await session.close();
    }
  }

  // Вспомогательные методы

  /**
   * Преобразование узла Neo4j в объект
   */
  nodeToObject(node) {
    if (!node) return null;
    
    return {
      ...node.properties,
      _id: node.identity.toString(),
      _labels: node.labels
    };
  }

  /**
   * Преобразование отношения Neo4j в объект
   */
  relationshipToObject(relationship) {
    if (!relationship) return null;
    
    return {
      ...relationship.properties,
      _id: relationship.identity.toString(),
      _type: relationship.type,
      _startNodeId: relationship.start.toString(),
      _endNodeId: relationship.end.toString()
    };
  }
}

module.exports = {{NodeType}}Repository;