/**
 * Graph model for the philosophy service
 * Represents a graph of philosophical categories and their relationships
 */

const { v4: uuidv4 } = require('uuid');
const { GRAPH_DRAFT } = require('../constants/statuses');
const { RELATIONSHIP_DIRECTIONS } = require('../constants/philosophyConstants');

/**
 * Category class representing a philosophical category in a concept graph
 */
class Category {
  /**
   * Create a new Category instance
   * @param {Object} categoryData - Category data
   * @param {string} [categoryData.category_id] - Category ID (generated if not provided)
   * @param {string} categoryData.concept_id - Parent concept ID
   * @param {string} categoryData.name - Category name
   * @param {string} [categoryData.definition] - Category definition
   * @param {number} [categoryData.centrality=3] - Centrality (1-5)
   * @param {number} [categoryData.certainty=3] - Certainty (1-5)
   * @param {number} [categoryData.historical_significance=3] - Historical significance (1-5)
   * @param {Array<string>} [categoryData.traditions=[]] - Associated philosophical traditions
   * @param {Array<string>} [categoryData.philosophers=[]] - Associated philosophers
   * @param {Object} [categoryData.metadata={}] - Additional metadata
   * @param {Date} [categoryData.created_at] - Creation date
   * @param {Date} [categoryData.updated_at] - Last update date
   */
  constructor(categoryData = {}) {
    this.category_id = categoryData.category_id || uuidv4();
    this.concept_id = categoryData.concept_id;
    this.name = categoryData.name;
    this.definition = categoryData.definition || '';
    
    // Quantitative characteristics (1-5 scale)
    this.centrality = categoryData.centrality || 3;
    this.certainty = categoryData.certainty || 3;
    this.historical_significance = categoryData.historical_significance || 3;
    
    // Associated elements
    this.traditions = categoryData.traditions || [];
    this.philosophers = categoryData.philosophers || [];
    
    // Additional data
    this.metadata = categoryData.metadata || {};
    
    // Date fields
    this.created_at = categoryData.created_at instanceof Date 
      ? categoryData.created_at 
      : categoryData.created_at ? new Date(categoryData.created_at) : new Date();
      
    this.updated_at = categoryData.updated_at instanceof Date 
      ? categoryData.updated_at 
      : categoryData.updated_at ? new Date(categoryData.updated_at) : new Date();
  }
  
  /**
   * Convert the category to a database object
   * @returns {Object} Database representation
   */
  toDatabase() {
    return {
      category_id: this.category_id,
      concept_id: this.concept_id,
      name: this.name,
      definition: this.definition,
      centrality: this.centrality,
      certainty: this.certainty,
      historical_significance: this.historical_significance,
      traditions: JSON.stringify(this.traditions),
      philosophers: JSON.stringify(this.philosophers),
      metadata: JSON.stringify(this.metadata),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
  
  /**
   * Convert the category to a Neo4j node properties object
   * @returns {Object} Neo4j node properties
   */
  toNeo4jProperties() {
    return {
      category_id: this.category_id,
      concept_id: this.concept_id,
      name: this.name,
      definition: this.definition,
      centrality: this.centrality,
      certainty: this.certainty,
      historical_significance: this.historical_significance,
      traditions: this.traditions,
      philosophers: this.philosophers,
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString()
    };
  }
  
  /**
   * Update category with new data
   * @param {Object} categoryData - Category data to update
   * @returns {Category} Updated category instance
   */
  update(categoryData = {}) {
    // Only update allowed fields
    if (categoryData.name !== undefined) this.name = categoryData.name;
    if (categoryData.definition !== undefined) this.definition = categoryData.definition;
    if (categoryData.centrality !== undefined) this.centrality = categoryData.centrality;
    if (categoryData.certainty !== undefined) this.certainty = categoryData.certainty;
    if (categoryData.historical_significance !== undefined) {
      this.historical_significance = categoryData.historical_significance;
    }
    if (categoryData.traditions !== undefined) this.traditions = categoryData.traditions;
    if (categoryData.philosophers !== undefined) this.philosophers = categoryData.philosophers;
    if (categoryData.metadata !== undefined) this.metadata = categoryData.metadata;
    
    // Always update the updated_at field
    this.updated_at = new Date();
    
    return this;
  }
  
  /**
   * Create a Category instance from a Neo4j node
   * @param {Object} node - Neo4j node
   * @returns {Category} Category instance
   */
  static fromNeo4jNode(node) {
    if (!node || !node.properties) return null;
    
    const props = node.properties;
    
    const categoryData = {
      category_id: props.category_id,
      concept_id: props.concept_id,
      name: props.name,
      definition: props.definition,
      centrality: props.centrality.toNumber ? props.centrality.toNumber() : props.centrality,
      certainty: props.certainty.toNumber ? props.certainty.toNumber() : props.certainty,
      historical_significance: props.historical_significance.toNumber 
        ? props.historical_significance.toNumber() 
        : props.historical_significance,
      traditions: Array.isArray(props.traditions) ? props.traditions : [],
      philosophers: Array.isArray(props.philosophers) ? props.philosophers : [],
      metadata: props.metadata || {},
      created_at: props.created_at instanceof Date 
        ? props.created_at 
        : new Date(props.created_at),
      updated_at: props.updated_at instanceof Date 
        ? props.updated_at 
        : new Date(props.updated_at)
    };
    
    return new Category(categoryData);
  }
}

/**
 * Relationship class representing a relationship between categories in a concept graph
 */
class Relationship {
  /**
   * Create a new Relationship instance
   * @param {Object} relationshipData - Relationship data
   * @param {string} [relationshipData.relationship_id] - Relationship ID (generated if not provided)
   * @param {string} relationshipData.concept_id - Parent concept ID
   * @param {string} relationshipData.source_id - Source category ID
   * @param {string} relationshipData.target_id - Target category ID
   * @param {string} relationshipData.type - Relationship type
   * @param {string} [relationshipData.direction=UNIDIRECTIONAL] - Direction (UNIDIRECTIONAL or BIDIRECTIONAL)
   * @param {number} [relationshipData.strength=3] - Strength (1-5)
   * @param {number} [relationshipData.certainty=3] - Certainty (1-5)
   * @param {string} [relationshipData.description] - Relationship description
   * @param {Array<string>} [relationshipData.traditions=[]] - Associated philosophical traditions
   * @param {Array<string>} [relationshipData.philosophers=[]] - Associated philosophers
   * @param {Object} [relationshipData.metadata={}] - Additional metadata
   * @param {Date} [relationshipData.created_at] - Creation date
   * @param {Date} [relationshipData.updated_at] - Last update date
   */
  constructor(relationshipData = {}) {
    this.relationship_id = relationshipData.relationship_id || uuidv4();
    this.concept_id = relationshipData.concept_id;
    this.source_id = relationshipData.source_id;
    this.target_id = relationshipData.target_id;
    this.type = relationshipData.type;
    this.direction = relationshipData.direction || RELATIONSHIP_DIRECTIONS.UNIDIRECTIONAL;
    
    // Quantitative characteristics (1-5 scale)
    this.strength = relationshipData.strength || 3;
    this.certainty = relationshipData.certainty || 3;
    
    // Additional information
    this.description = relationshipData.description || '';
    
    // Associated elements
    this.traditions = relationshipData.traditions || [];
    this.philosophers = relationshipData.philosophers || [];
    
    // Additional data
    this.metadata = relationshipData.metadata || {};
    
    // Date fields
    this.created_at = relationshipData.created_at instanceof Date 
      ? relationshipData.created_at 
      : relationshipData.created_at ? new Date(relationshipData.created_at) : new Date();
      
    this.updated_at = relationshipData.updated_at instanceof Date 
      ? relationshipData.updated_at 
      : relationshipData.updated_at ? new Date(relationshipData.updated_at) : new Date();
  }
  
  /**
   * Convert the relationship to a database object
   * @returns {Object} Database representation
   */
  toDatabase() {
    return {
      relationship_id: this.relationship_id,
      concept_id: this.concept_id,
      source_id: this.source_id,
      target_id: this.target_id,
      type: this.type,
      direction: this.direction,
      strength: this.strength,
      certainty: this.certainty,
      description: this.description,
      traditions: JSON.stringify(this.traditions),
      philosophers: JSON.stringify(this.philosophers),
      metadata: JSON.stringify(this.metadata),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
  
  /**
   * Convert the relationship to a Neo4j relationship properties object
   * @returns {Object} Neo4j relationship properties
   */
  toNeo4jProperties() {
    return {
      relationship_id: this.relationship_id,
      concept_id: this.concept_id,
      type: this.type,
      direction: this.direction,
      strength: this.strength,
      certainty: this.certainty,
      description: this.description,
      traditions: this.traditions,
      philosophers: this.philosophers,
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString()
    };
  }
  
  /**
   * Update relationship with new data
   * @param {Object} relationshipData - Relationship data to update
   * @returns {Relationship} Updated relationship instance
   */
  update(relationshipData = {}) {
    // Only update allowed fields
    if (relationshipData.type !== undefined) this.type = relationshipData.type;
    if (relationshipData.direction !== undefined) this.direction = relationshipData.direction;
    if (relationshipData.strength !== undefined) this.strength = relationshipData.strength;
    if (relationshipData.certainty !== undefined) this.certainty = relationshipData.certainty;
    if (relationshipData.description !== undefined) this.description = relationshipData.description;
    if (relationshipData.traditions !== undefined) this.traditions = relationshipData.traditions;
    if (relationshipData.philosophers !== undefined) this.philosophers = relationshipData.philosophers;
    if (relationshipData.metadata !== undefined) this.metadata = relationshipData.metadata;
    
    // Always update the updated_at field
    this.updated_at = new Date();
    
    return this;
  }
  
  /**
   * Check if the relationship is bidirectional
   * @returns {boolean} Whether the relationship is bidirectional
   */
  isBidirectional() {
    return this.direction === RELATIONSHIP_DIRECTIONS.BIDIRECTIONAL;
  }
  
  /**
   * Create a Relationship instance from a Neo4j relationship
   * @param {Object} relationship - Neo4j relationship
   * @param {string} sourceId - Source category ID
   * @param {string} targetId - Target category ID
   * @returns {Relationship} Relationship instance
   */
  static fromNeo4jRelationship(relationship, sourceId, targetId) {
    if (!relationship || !relationship.properties) return null;
    
    const props = relationship.properties;
    
    const relationshipData = {
      relationship_id: props.relationship_id,
      concept_id: props.concept_id,
      source_id: sourceId,
      target_id: targetId,
      type: props.type,
      direction: props.direction,
      strength: props.strength.toNumber ? props.strength.toNumber() : props.strength,
      certainty: props.certainty.toNumber ? props.certainty.toNumber() : props.certainty,
      description: props.description,
      traditions: Array.isArray(props.traditions) ? props.traditions : [],
      philosophers: Array.isArray(props.philosophers) ? props.philosophers : [],
      metadata: props.metadata || {},
      created_at: props.created_at instanceof Date 
        ? props.created_at 
        : new Date(props.created_at),
      updated_at: props.updated_at instanceof Date 
        ? props.updated_at 
        : new Date(props.updated_at)
    };
    
    return new Relationship(relationshipData);
  }
}

/**
 * Graph class representing a philosophical concept graph
 */
class Graph {
  /**
   * Create a new Graph instance
   * @param {Object} graphData - Graph data
   * @param {string} graphData.concept_id - Concept ID
   * @param {string} [graphData.status=GRAPH_DRAFT] - Graph status
   * @param {Array<Category>} [graphData.categories=[]] - Categories
   * @param {Array<Relationship>} [graphData.relationships=[]] - Relationships
   * @param {Object} [graphData.metadata={}] - Additional metadata
   * @param {Date} [graphData.created_at] - Creation date
   * @param {Date} [graphData.updated_at] - Last update date
   */
  constructor(graphData = {}) {
    this.concept_id = graphData.concept_id;
    this.status = graphData.status || GRAPH_DRAFT;
    this.categories = graphData.categories || [];
    this.relationships = graphData.relationships || [];
    this.metadata = graphData.metadata || {};
    
    // Date fields
    this.created_at = graphData.created_at instanceof Date 
      ? graphData.created_at 
      : graphData.created_at ? new Date(graphData.created_at) : new Date();
      
    this.updated_at = graphData.updated_at instanceof Date 
      ? graphData.updated_at 
      : graphData.updated_at ? new Date(graphData.updated_at) : new Date();
  }
  
  /**
   * Add a category to the graph
   * @param {Category} category - Category to add
   * @returns {Graph} This graph instance
   */
  addCategory(category) {
    // Ensure the category has the correct concept ID
    if (category.concept_id !== this.concept_id) {
      category.concept_id = this.concept_id;
    }
    
    // Check for duplicate category IDs
    const existingIndex = this.categories.findIndex(c => c.category_id === category.category_id);
    
    if (existingIndex >= 0) {
      // Update existing category
      this.categories[existingIndex] = category;
    } else {
      // Add new category
      this.categories.push(category);
    }
    
    // Update graph's updated_at
    this.updated_at = new Date();
    
    return this;
  }
  
  /**
   * Remove a category from the graph
   * @param {string} categoryId - Category ID to remove
   * @returns {Graph} This graph instance
   */
  removeCategory(categoryId) {
    // Remove the category
    this.categories = this.categories.filter(c => c.category_id !== categoryId);
    
    // Also remove any relationships involving this category
    this.relationships = this.relationships.filter(
      r => r.source_id !== categoryId && r.target_id !== categoryId
    );
    
    // Update graph's updated_at
    this.updated_at = new Date();
    
    return this;
  }
  
  /**
   * Add a relationship to the graph
   * @param {Relationship} relationship - Relationship to add
   * @returns {Graph} This graph instance
   */
  addRelationship(relationship) {
    // Ensure the relationship has the correct concept ID
    if (relationship.concept_id !== this.concept_id) {
      relationship.concept_id = this.concept_id;
    }
    
    // Check for duplicate relationship IDs
    const existingIndex = this.relationships.findIndex(
      r => r.relationship_id === relationship.relationship_id
    );
    
    if (existingIndex >= 0) {
      // Update existing relationship
      this.relationships[existingIndex] = relationship;
    } else {
      // Add new relationship
      this.relationships.push(relationship);
    }
    
    // Update graph's updated_at
    this.updated_at = new Date();
    
    return this;
  }
  
  /**
   * Remove a relationship from the graph
   * @param {string} relationshipId - Relationship ID to remove
   * @returns {Graph} This graph instance
   */
  removeRelationship(relationshipId) {
    this.relationships = this.relationships.filter(r => r.relationship_id !== relationshipId);
    
    // Update graph's updated_at
    this.updated_at = new Date();
    
    return this;
  }
  
  /**
   * Get a category by ID
   * @param {string} categoryId - Category ID to find
   * @returns {Category|null} Found category or null
   */
  getCategory(categoryId) {
    return this.categories.find(c => c.category_id === categoryId) || null;
  }
  
  /**
   * Get a relationship by ID
   * @param {string} relationshipId - Relationship ID to find
   * @returns {Relationship|null} Found relationship or null
   */
  getRelationship(relationshipId) {
    return this.relationships.find(r => r.relationship_id === relationshipId) || null;
  }
  
  /**
   * Get all relationships for a category
   * @param {string} categoryId - Category ID
   * @param {string} [direction] - Direction filter ("outgoing", "incoming", or "both")
   * @returns {Array<Relationship>} Relationships involving the category
   */
  getCategoryRelationships(categoryId, direction) {
    if (!direction || direction === 'both') {
      return this.relationships.filter(
        r => r.source_id === categoryId || r.target_id === categoryId
      );
    } else if (direction === 'outgoing') {
      return this.relationships.filter(r => r.source_id === categoryId);
    } else if (direction === 'incoming') {
      return this.relationships.filter(r => r.target_id === categoryId);
    }
    
    return [];
  }
  
  /**
   * Get all connected categories for a category
   * @param {string} categoryId - Category ID
   * @param {string} [direction] - Direction filter ("outgoing", "incoming", or "both")
   * @returns {Array<Category>} Connected categories
   */
  getConnectedCategories(categoryId, direction) {
    const relationships = this.getCategoryRelationships(categoryId, direction);
    const connectedIds = new Set();
    
    for (const rel of relationships) {
      if (rel.source_id === categoryId) {
        connectedIds.add(rel.target_id);
      } else if (rel.target_id === categoryId) {
        connectedIds.add(rel.source_id);
      }
    }
    
    return this.categories.filter(c => connectedIds.has(c.category_id));
  }
  
  /**
   * Get graph statistics
   * @returns {Object} Graph statistics
   */
  getStatistics() {
    const categoryCount = this.categories.length;
    const relationshipCount = this.relationships.length;
    
    // Calculate average characteristics
    let totalCentrality = 0;
    let totalCertainty = 0;
    let totalHistoricalSignificance = 0;
    let totalRelationshipStrength = 0;
    let totalRelationshipCertainty = 0;
    
    for (const category of this.categories) {
      totalCentrality += category.centrality;
      totalCertainty += category.certainty;
      totalHistoricalSignificance += category.historical_significance;
    }
    
    for (const relationship of this.relationships) {
      totalRelationshipStrength += relationship.strength;
      totalRelationshipCertainty += relationship.certainty;
    }
    
    const avgCentrality = categoryCount > 0 ? totalCentrality / categoryCount : 0;
    const avgCategoryCertainty = categoryCount > 0 ? totalCertainty / categoryCount : 0;
    const avgHistoricalSignificance = categoryCount > 0 
      ? totalHistoricalSignificance / categoryCount 
      : 0;
    const avgRelationshipStrength = relationshipCount > 0 
      ? totalRelationshipStrength / relationshipCount 
      : 0;
    const avgRelationshipCertainty = relationshipCount > 0 
      ? totalRelationshipCertainty / relationshipCount 
      : 0;
    
    // Calculate connectivity
    const connectivity = categoryCount > 1 
      ? relationshipCount / (categoryCount * (categoryCount - 1) / 2) 
      : 0;
    
    return {
      categoryCount,
      relationshipCount,
      avgCentrality,
      avgCategoryCertainty,
      avgHistoricalSignificance,
      avgRelationshipStrength,
      avgRelationshipCertainty,
      connectivity,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
  
  /**
   * Convert the graph to a database object
   * @returns {Object} Database representation
   */
  toDatabase() {
    // The graph itself isn't stored directly in the database
    // Instead, categories and relationships are stored separately
    
    return {
      concept_id: this.concept_id,
      status: this.status,
      metadata: JSON.stringify(this.metadata),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
  
  /**
   * Update graph with new data
   * @param {Object} graphData - Graph data to update
   * @returns {Graph} Updated graph instance
   */
  update(graphData = {}) {
    // Only update allowed fields
    if (graphData.status !== undefined) this.status = graphData.status;
    if (graphData.metadata !== undefined) this.metadata = graphData.metadata;
    
    // Always update the updated_at field
    this.updated_at = new Date();
    
    return this;
  }
  
  /**
   * Create a Graph instance from category and relationship nodes from Neo4j
   * @param {string} conceptId - Concept ID
   * @param {Array<Object>} categoryNodes - Category nodes from Neo4j
   * @param {Array<Object>} relationshipRecords - Relationship records from Neo4j
   * @returns {Graph} Graph instance
   */
  static fromNeo4j(conceptId, categoryNodes, relationshipRecords) {
    // Create categories from Neo4j nodes
    const categories = categoryNodes.map(node => Category.fromNeo4jNode(node));
    
    // Create relationships from Neo4j relationships
    const relationships = [];
    
    for (const record of relationshipRecords) {
      const sourceId = record.source && record.source.properties 
        ? record.source.properties.category_id 
        : null;
        
      const targetId = record.target && record.target.properties 
        ? record.target.properties.category_id 
        : null;
        
      if (sourceId && targetId && record.relationship) {
        const relationship = Relationship.fromNeo4jRelationship(record.relationship, sourceId, targetId);
        
        if (relationship) {
          relationships.push(relationship);
        }
      }
    }
    
    // Create and return the graph
    return new Graph({
      concept_id: conceptId,
      categories,
      relationships
    });
  }
  
  /**
   * Create a new empty graph for a concept
   * @param {string} conceptId - Concept ID
   * @returns {Graph} New graph instance
   */
  static createEmpty(conceptId) {
    return new Graph({
      concept_id: conceptId,
      status: GRAPH_DRAFT,
      categories: [],
      relationships: []
    });
  }
}

module.exports = {
  Category,
  Relationship,
  Graph
};
