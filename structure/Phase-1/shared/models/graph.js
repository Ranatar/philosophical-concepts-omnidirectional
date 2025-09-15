/**
 * Graph Model
 * Доменная модель графа философской концепции
 */

const { v4: uuidv4 } = require('uuid');
const { ValidationError } = require('../lib/errors/ValidationError');

class Graph {
  constructor(data = {}) {
    this.conceptId = data.conceptId || data.concept_id;
    this.categories = data.categories || [];
    this.relationships = data.relationships || [];
    this.metadata = data.metadata || {};
    this.validationStatus = data.validationStatus || null;
    this.lastValidated = data.lastValidated || null;
  }

  /**
   * Добавление категории
   */
  addCategory(category) {
    const newCategory = new Category(category);
    newCategory.validate();
    
    // Проверка на дубликаты
    if (this.categories.find(c => c.categoryId === newCategory.categoryId)) {
      throw new ValidationError('Category with this ID already exists');
    }

    this.categories.push(newCategory);
    return newCategory;
  }

  /**
   * Добавление связи
   */
  addRelationship(relationship) {
    const newRelationship = new Relationship(relationship);
    newRelationship.validate();

    // Проверка существования категорий
    const sourceExists = this.categories.find(c => c.categoryId === newRelationship.sourceId);
    const targetExists = this.categories.find(c => c.categoryId === newRelationship.targetId);

    if (!sourceExists || !targetExists) {
      throw new ValidationError('Source or target category not found');
    }

    // Проверка на дубликаты
    const duplicate = this.relationships.find(r => 
      r.sourceId === newRelationship.sourceId &&
      r.targetId === newRelationship.targetId &&
      r.type === newRelationship.type
    );

    if (duplicate) {
      throw new ValidationError('This relationship already exists');
    }

    this.relationships.push(newRelationship);
    return newRelationship;
  }

  /**
   * Получение категории по ID
   */
  getCategoryById(categoryId) {
    return this.categories.find(c => c.categoryId === categoryId);
  }

  /**
   * Получение связей категории
   */
  getCategoryRelationships(categoryId) {
    return {
      outgoing: this.relationships.filter(r => r.sourceId === categoryId),
      incoming: this.relationships.filter(r => r.targetId === categoryId)
    };
  }

  /**
   * Удаление категории
   */
  removeCategory(categoryId) {
    // Удаляем категорию
    this.categories = this.categories.filter(c => c.categoryId !== categoryId);
    
    // Удаляем все связи с этой категорией
    this.relationships = this.relationships.filter(r => 
      r.sourceId !== categoryId && r.targetId !== categoryId
    );

    return this;
  }

  /**
   * Удаление связи
   */
  removeRelationship(relationshipId) {
    this.relationships = this.relationships.filter(r => r.relationshipId !== relationshipId);
    return this;
  }

  /**
   * Обновление категории
   */
  updateCategory(categoryId, updates) {
    const category = this.getCategoryById(categoryId);
    if (!category) {
      throw new ValidationError('Category not found');
    }

    Object.assign(category, updates);
    category.validate();
    
    return category;
  }

  /**
   * Обновление связи
   */
  updateRelationship(relationshipId, updates) {
    const relationship = this.relationships.find(r => r.relationshipId === relationshipId);
    if (!relationship) {
      throw new ValidationError('Relationship not found');
    }

    Object.assign(relationship, updates);
    relationship.validate();
    
    return relationship;
  }

  /**
   * Валидация графа
   */
  validate() {
    const errors = [];

    if (!this.conceptId) {
      errors.push({
        field: 'conceptId',
        message: 'Concept ID is required'
      });
    }

    // Валидация категорий
    this.categories.forEach((category, index) => {
      try {
        category.validate();
      } catch (error) {
        errors.push({
          field: `categories[${index}]`,
          message: error.message
        });
      }
    });

    // Валидация связей
    this.relationships.forEach((relationship, index) => {
      try {
        relationship.validate();
      } catch (error) {
        errors.push({
          field: `relationships[${index}]`,
          message: error.message
        });
      }
    });

    if (errors.length > 0) {
      throw new ValidationError('Graph validation failed', errors);
    }

    return true;
  }

  /**
   * Получение статистики графа
   */
  getStatistics() {
    const categoryTypes = {};
    const relationshipTypes = {};
    const innovationLevels = {};

    this.categories.forEach(category => {
      categoryTypes[category.type] = (categoryTypes[category.type] || 0) + 1;
      innovationLevels[category.innovationDegree] = (innovationLevels[category.innovationDegree] || 0) + 1;
    });

    this.relationships.forEach(relationship => {
      relationshipTypes[relationship.type] = (relationshipTypes[relationship.type] || 0) + 1;
    });

    return {
      totalCategories: this.categories.length,
      totalRelationships: this.relationships.length,
      categoryTypes,
      relationshipTypes,
      innovationLevels,
      avgCentrality: this._calculateAverageCentrality(),
      avgCertainty: this._calculateAverageCertainty()
    };
  }

  /**
   * Экспорт в формат для визуализации
   */
  toVisualizationFormat() {
    const nodes = this.categories.map(category => ({
      id: category.categoryId,
      label: category.name,
      type: category.type,
      centrality: category.centrality,
      innovationDegree: category.innovationDegree
    }));

    const edges = this.relationships.map(relationship => ({
      id: relationship.relationshipId,
      source: relationship.sourceId,
      target: relationship.targetId,
      type: relationship.type,
      strength: relationship.strength,
      label: relationship.type
    }));

    return { nodes, edges };
  }

  /**
   * Преобразование в JSON
   */
  toJSON() {
    return {
      conceptId: this.conceptId,
      categories: this.categories.map(c => c.toJSON()),
      relationships: this.relationships.map(r => r.toJSON()),
      metadata: this.metadata,
      validationStatus: this.validationStatus,
      lastValidated: this.lastValidated,
      statistics: this.getStatistics()
    };
  }

  /**
   * Создание из JSON
   */
  static fromJSON(json) {
    const graph = new Graph({
      conceptId: json.conceptId,
      metadata: json.metadata,
      validationStatus: json.validationStatus,
      lastValidated: json.lastValidated
    });

    // Добавляем категории
    if (json.categories) {
      json.categories.forEach(categoryData => {
        graph.categories.push(new Category(categoryData));
      });
    }

    // Добавляем связи
    if (json.relationships) {
      json.relationships.forEach(relationshipData => {
        graph.relationships.push(new Relationship(relationshipData));
      });
    }

    return graph;
  }

  /**
   * Клонирование графа
   */
  clone() {
    return Graph.fromJSON(this.toJSON());
  }

  /**
   * Вспомогательные методы
   */
  
  _calculateAverageCentrality() {
    if (this.categories.length === 0) return 0;
    const sum = this.categories.reduce((acc, cat) => acc + cat.centrality, 0);
    return sum / this.categories.length;
  }

  _calculateAverageCertainty() {
    if (this.categories.length === 0) return 0;
    const sum = this.categories.reduce((acc, cat) => acc + cat.certainty, 0);
    return sum / this.categories.length;
  }
}

/**
 * Модель категории
 */
class Category {
  constructor(data = {}) {
    this.categoryId = data.categoryId || data.category_id || uuidv4();
    this.conceptId = data.conceptId || data.concept_id;
    this.name = data.name;
    this.type = data.type || 'ontological';
    this.definition = data.definition || '';
    
    // Количественные характеристики
    this.centrality = data.centrality !== undefined ? data.centrality : 0.5;
    this.certainty = data.certainty !== undefined ? data.certainty : 0.5;
    this.historicalSignificance = data.historicalSignificance !== undefined ? data.historicalSignificance : 0.5;
    this.innovationDegree = data.innovationDegree !== undefined ? data.innovationDegree : 3;
    this.clarity = data.clarity !== undefined ? data.clarity : 0.5;
    this.breadth = data.breadth !== undefined ? data.breadth : 0.5;
    this.depth = data.depth !== undefined ? data.depth : 0.5;
    this.applicability = data.applicability !== undefined ? data.applicability : 0.5;
    
    // Связанные философы и традиции
    this.traditions = data.traditions || [];
    this.philosophers = data.philosophers || [];
    
    // Метаданные
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Category name is required'
      });
    }

    const validTypes = [
      'ontological', 'epistemological', 'axiological', 'ethical',
      'aesthetic', 'metaphysical', 'logical', 'practical',
      'political', 'theological', 'anthropological', 'social',
      'linguistic', 'phenomenological', 'existential', 'analytical',
      'hermeneutical', 'cross_disciplinary'
    ];

    if (!validTypes.includes(this.type)) {
      errors.push({
        field: 'type',
        message: `Category type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Валидация количественных характеристик
    const floatFields = [
      'centrality', 'certainty', 'historicalSignificance',
      'clarity', 'breadth', 'depth', 'applicability'
    ];

    floatFields.forEach(field => {
      if (this[field] < 0 || this[field] > 1) {
        errors.push({
          field,
          message: `${field} must be between 0 and 1`
        });
      }
    });

    if (this.innovationDegree < 1 || this.innovationDegree > 5) {
      errors.push({
        field: 'innovationDegree',
        message: 'Innovation degree must be between 1 and 5'
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('Category validation failed', errors);
    }

    return true;
  }

  toJSON() {
    return {
      categoryId: this.categoryId,
      conceptId: this.conceptId,
      name: this.name,
      type: this.type,
      definition: this.definition,
      centrality: this.centrality,
      certainty: this.certainty,
      historicalSignificance: this.historicalSignificance,
      innovationDegree: this.innovationDegree,
      clarity: this.clarity,
      breadth: this.breadth,
      depth: this.depth,
      applicability: this.applicability,
      traditions: this.traditions,
      philosophers: this.philosophers,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

/**
 * Модель связи
 */
class Relationship {
  constructor(data = {}) {
    this.relationshipId = data.relationshipId || data.relationship_id || uuidv4();
    this.sourceId = data.sourceId || data.source_id;
    this.targetId = data.targetId || data.target_id;
    this.type = data.type || 'correlational';
    this.direction = data.direction || 'unidirectional';
    
    // Количественные характеристики
    this.strength = data.strength !== undefined ? data.strength : 0.5;
    this.certainty = data.certainty !== undefined ? data.certainty : 0.5;
    this.innovationDegree = data.innovationDegree !== undefined ? data.innovationDegree : 3;
    this.historicalSupport = data.historicalSupport !== undefined ? data.historicalSupport : 0.5;
    this.logicalNecessity = data.logicalNecessity !== undefined ? data.logicalNecessity : 0.5;
    this.contextDependence = data.contextDependence !== undefined ? data.contextDependence : 0.5;
    
    // Метаданные
    this.source = data.source || null;
    this.traditions = data.traditions || [];
    this.philosophers = data.philosophers || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  validate() {
    const errors = [];

    if (!this.sourceId) {
      errors.push({
        field: 'sourceId',
        message: 'Source category ID is required'
      });
    }

    if (!this.targetId) {
      errors.push({
        field: 'targetId',
        message: 'Target category ID is required'
      });
    }

    if (this.sourceId === this.targetId && this.type !== 'reflexive') {
      errors.push({
        field: 'relationship',
        message: 'Self-referencing relationships must be of type "reflexive"'
      });
    }

    const validTypes = [
      'hierarchical', 'causal', 'dialectical', 'correlational',
      'disjunctive', 'conjunctive', 'contradiction', 'complementary',
      'emergence', 'necessary_condition', 'sufficient_condition',
      'identity', 'analogy', 'implementation', 'instantiation',
      'generalization', 'part_whole', 'means_end', 'deductive',
      'inductive', 'abductive', 'temporal', 'conceptual',
      'definitional', 'manifestation', 'foundational', 'recognition',
      'reflexion', 'development'
    ];

    if (!validTypes.includes(this.type)) {
      errors.push({
        field: 'type',
        message: `Relationship type must be one of: ${validTypes.join(', ')}`
      });
    }

    const validDirections = ['unidirectional', 'bidirectional', 'reflexive'];
    if (!validDirections.includes(this.direction)) {
      errors.push({
        field: 'direction',
        message: `Direction must be one of: ${validDirections.join(', ')}`
      });
    }

    // Валидация количественных характеристик
    const floatFields = [
      'strength', 'certainty', 'historicalSupport',
      'logicalNecessity', 'contextDependence'
    ];

    floatFields.forEach(field => {
      if (this[field] < 0 || this[field] > 1) {
        errors.push({
          field,
          message: `${field} must be between 0 and 1`
        });
      }
    });

    if (this.innovationDegree < 1 || this.innovationDegree > 5) {
      errors.push({
        field: 'innovationDegree',
        message: 'Innovation degree must be between 1 and 5'
      });
    }

    if (errors.length > 0) {
      throw new ValidationError('Relationship validation failed', errors);
    }

    return true;
  }

  toJSON() {
    return {
      relationshipId: this.relationshipId,
      sourceId: this.sourceId,
      targetId: this.targetId,
      type: this.type,
      direction: this.direction,
      strength: this.strength,
      certainty: this.certainty,
      innovationDegree: this.innovationDegree,
      historicalSupport: this.historicalSupport,
      logicalNecessity: this.logicalNecessity,
      contextDependence: this.contextDependence,
      source: this.source,
      traditions: this.traditions,
      philosophers: this.philosophers,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Экспорт классов
module.exports = Graph;
module.exports.Category = Category;
module.exports.Relationship = Relationship;