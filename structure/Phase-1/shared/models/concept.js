/**
 * Concept model for the philosophy service
 * Represents a philosophical concept
 */

const { v4: uuidv4 } = require('uuid');
const { CONCEPT_DRAFT } = require('../constants/statuses');

/**
 * Concept class representing a philosophical concept
 */
class Concept {
  /**
   * Create a new Concept instance
   * @param {Object} conceptData - Concept data
   * @param {string} [conceptData.concept_id] - Concept ID (generated if not provided)
   * @param {string} conceptData.name - Concept name
   * @param {string} [conceptData.description] - Concept description
   * @param {string} conceptData.creator_id - Creator user ID
   * @param {string} [conceptData.status=CONCEPT_DRAFT] - Concept status
   * @param {boolean} [conceptData.is_synthesis=false] - Whether concept is a synthesis
   * @param {Array} [conceptData.parent_concepts=[]] - Parent concept IDs (for synthesis)
   * @param {string} [conceptData.synthesis_method] - Method used for synthesis
   * @param {string} [conceptData.focus] - Conceptual focus
   * @param {number} [conceptData.innovation_degree=0] - Degree of innovation (0-100)
   * @param {Object} [conceptData.metadata={}] - Additional metadata
   * @param {Date} [conceptData.creation_date] - Creation date
   * @param {Date} [conceptData.last_modified] - Last modification date
   */
  constructor(conceptData = {}) {
    this.concept_id = conceptData.concept_id || uuidv4();
    this.name = conceptData.name || '';
    this.description = conceptData.description || '';
    this.creator_id = conceptData.creator_id;
    this.status = conceptData.status || CONCEPT_DRAFT;
    this.is_synthesis = conceptData.is_synthesis || false;
    this.parent_concepts = conceptData.parent_concepts || [];
    this.synthesis_method = conceptData.synthesis_method || null;
    this.focus = conceptData.focus || null;
    this.innovation_degree = conceptData.innovation_degree || 0;
    this.metadata = conceptData.metadata || {};
    
    // Date fields
    this.creation_date = conceptData.creation_date instanceof Date 
      ? conceptData.creation_date 
      : conceptData.creation_date ? new Date(conceptData.creation_date) : new Date();
      
    this.last_modified = conceptData.last_modified instanceof Date 
      ? conceptData.last_modified 
      : conceptData.last_modified ? new Date(conceptData.last_modified) : new Date();
  }
  
  /**
   * Convert the concept to a database object
   * @returns {Object} Database representation
   */
  toDatabase() {
    return {
      concept_id: this.concept_id,
      name: this.name,
      description: this.description,
      creator_id: this.creator_id,
      status: this.status,
      is_synthesis: this.is_synthesis,
      parent_concepts: JSON.stringify(this.parent_concepts),
      synthesis_method: this.synthesis_method,
      focus: this.focus,
      innovation_degree: this.innovation_degree,
      metadata: JSON.stringify(this.metadata),
      creation_date: this.creation_date,
      last_modified: this.last_modified
    };
  }
  
  /**
   * Update concept with new data
   * @param {Object} conceptData - Concept data to update
   * @returns {Concept} Updated concept instance
   */
  update(conceptData = {}) {
    // Only update allowed fields
    if (conceptData.name !== undefined) this.name = conceptData.name;
    if (conceptData.description !== undefined) this.description = conceptData.description;
    if (conceptData.status !== undefined) this.status = conceptData.status;
    if (conceptData.is_synthesis !== undefined) this.is_synthesis = conceptData.is_synthesis;
    if (conceptData.parent_concepts !== undefined) this.parent_concepts = conceptData.parent_concepts;
    if (conceptData.synthesis_method !== undefined) this.synthesis_method = conceptData.synthesis_method;
    if (conceptData.focus !== undefined) this.focus = conceptData.focus;
    if (conceptData.innovation_degree !== undefined) this.innovation_degree = conceptData.innovation_degree;
    if (conceptData.metadata !== undefined) this.metadata = conceptData.metadata;
    
    // Always update the last_modified field
    this.last_modified = new Date();
    
    return this;
  }
  
  /**
   * Check if the concept is a draft
   * @returns {boolean} Whether the concept is a draft
   */
  isDraft() {
    return this.status === CONCEPT_DRAFT;
  }
  
  /**
   * Check if the concept is a synthesis of other concepts
   * @returns {boolean} Whether the concept is a synthesis
   */
  isSynthesis() {
    return this.is_synthesis === true;
  }
  
  /**
   * Get the parent concepts (if this is a synthesis)
   * @returns {Array<string>} Parent concept IDs
   */
  getParentConcepts() {
    return this.parent_concepts || [];
  }
  
  /**
   * Create a Concept instance from a database row
   * @param {Object} row - Database row
   * @returns {Concept} Concept instance
   */
  static fromDatabase(row) {
    if (!row) return null;
    
    const conceptData = {
      concept_id: row.concept_id,
      name: row.name,
      description: row.description,
      creator_id: row.creator_id,
      status: row.status,
      is_synthesis: row.is_synthesis,
      parent_concepts: typeof row.parent_concepts === 'string' 
        ? JSON.parse(row.parent_concepts) 
        : row.parent_concepts || [],
      synthesis_method: row.synthesis_method,
      focus: row.focus,
      innovation_degree: row.innovation_degree,
      metadata: typeof row.metadata === 'string' 
        ? JSON.parse(row.metadata) 
        : row.metadata || {},
      creation_date: row.creation_date,
      last_modified: row.last_modified
    };
    
    return new Concept(conceptData);
  }
  
  /**
   * Create a new draft concept
   * @param {string} name - Concept name
   * @param {string} creatorId - Creator user ID
   * @param {string} [description] - Concept description
   * @returns {Concept} New concept instance
   */
  static createDraft(name, creatorId, description = '') {
    return new Concept({
      name,
      description,
      creator_id: creatorId,
      status: CONCEPT_DRAFT,
      is_synthesis: false
    });
  }
  
  /**
   * Create a new synthesis concept
   * @param {string} name - Concept name
   * @param {string} creatorId - Creator user ID
   * @param {Array<string>} parentConcepts - Parent concept IDs
   * @param {string} [synthesisMethod] - Method used for synthesis
   * @param {string} [description] - Concept description
   * @returns {Concept} New synthesis concept instance
   */
  static createSynthesis(name, creatorId, parentConcepts, synthesisMethod = null, description = '') {
    return new Concept({
      name,
      description,
      creator_id: creatorId,
      status: CONCEPT_DRAFT,
      is_synthesis: true,
      parent_concepts: parentConcepts,
      synthesis_method: synthesisMethod
    });
  }
}

module.exports = Concept;
