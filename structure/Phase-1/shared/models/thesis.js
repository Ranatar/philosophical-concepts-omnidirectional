/**
 * Thesis model for the philosophy service
 * Represents a philosophical thesis
 */

const { v4: uuidv4 } = require('uuid');
const { THESIS_GENERATED } = require('../constants/statuses');
const { THESIS_TYPES, THESIS_STYLES } = require('../constants/philosophyConstants');

/**
 * Thesis class representing a philosophical thesis
 */
class Thesis {
  /**
   * Create a new Thesis instance
   * @param {Object} thesisData - Thesis data
   * @param {string} [thesisData.thesis_id] - Thesis ID (generated if not provided)
   * @param {string} thesisData.concept_id - Parent concept ID
   * @param {string} thesisData.type - Thesis type (e.g., 'ontological', 'epistemological')
   * @param {string} thesisData.content - Thesis content
   * @param {string} [thesisData.style=ACADEMIC] - Thesis style
   * @param {string} [thesisData.status=THESIS_GENERATED] - Thesis status
   * @param {Array<string>} [thesisData.related_categories=[]] - Related category IDs
   * @param {Array<string>} [thesisData.parent_theses=[]] - Parent thesis IDs (for synthesized theses)
   * @param {Object} [thesisData.generation_parameters={}] - Parameters used for generation
   * @param {string} [thesisData.claude_generation_id] - Claude interaction ID for generation
   * @param {Object} [thesisData.metadata={}] - Additional metadata
   * @param {Date} [thesisData.created_at] - Creation date
   * @param {Date} [thesisData.updated_at] - Last update date
   */
  constructor(thesisData = {}) {
    this.thesis_id = thesisData.thesis_id || uuidv4();
    this.concept_id = thesisData.concept_id;
    this.type = thesisData.type;
    this.content = thesisData.content;
    this.style = thesisData.style || THESIS_STYLES.ACADEMIC;
    this.status = thesisData.status || THESIS_GENERATED;
    this.related_categories = thesisData.related_categories || [];
    this.parent_theses = thesisData.parent_theses || [];
    this.generation_parameters = thesisData.generation_parameters || {};
    this.claude_generation_id = thesisData.claude_generation_id || null;
    this.metadata = thesisData.metadata || {};
    
    // Date fields
    this.created_at = thesisData.created_at instanceof Date 
      ? thesisData.created_at 
      : thesisData.created_at ? new Date(thesisData.created_at) : new Date();
      
    this.updated_at = thesisData.updated_at instanceof Date 
      ? thesisData.updated_at 
      : thesisData.updated_at ? new Date(thesisData.updated_at) : new Date();
  }
  
  /**
   * Convert the thesis to a MongoDB document
   * @returns {Object} MongoDB document
   */
  toDocument() {
    return {
      thesis_id: this.thesis_id,
      concept_id: this.concept_id,
      type: this.type,
      content: this.content,
      style: this.style,
      status: this.status,
      related_categories: this.related_categories,
      parent_theses: this.parent_theses,
      generation_parameters: this.generation_parameters,
      claude_generation_id: this.claude_generation_id,
      metadata: this.metadata,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
  
  /**
   * Update thesis with new data
   * @param {Object} thesisData - Thesis data to update
   * @returns {Thesis} Updated thesis instance
   */
  update(thesisData = {}) {
    // Only update allowed fields
    if (thesisData.type !== undefined) this.type = thesisData.type;
    if (thesisData.content !== undefined) this.content = thesisData.content;
    if (thesisData.style !== undefined) this.style = thesisData.style;
    if (thesisData.status !== undefined) this.status = thesisData.status;
    if (thesisData.related_categories !== undefined) this.related_categories = thesisData.related_categories;
    if (thesisData.parent_theses !== undefined) this.parent_theses = thesisData.parent_theses;
    if (thesisData.generation_parameters !== undefined) {
      this.generation_parameters = thesisData.generation_parameters;
    }
    if (thesisData.claude_generation_id !== undefined) {
      this.claude_generation_id = thesisData.claude_generation_id;
    }
    if (thesisData.metadata !== undefined) this.metadata = thesisData.metadata;
    
    // Always update the updated_at field
    this.updated_at = new Date();
    
    return this;
  }
  
  /**
   * Get a short excerpt of the thesis content
   * @param {number} [maxLength=100] - Maximum excerpt length
   * @returns {string} Thesis excerpt
   */
  getExcerpt(maxLength = 100) {
    if (!this.content || this.content.length <= maxLength) {
      return this.content || '';
    }
    
    let excerpt = this.content.substring(0, maxLength);
    
    // Try to cut at the end of a sentence or phrase
    const lastPeriod = excerpt.lastIndexOf('.');
    const lastComma = excerpt.lastIndexOf(',');
    const lastSemicolon = excerpt.lastIndexOf(';');
    
    let cutoff = Math.max(lastPeriod, lastComma, lastSemicolon);
    
    if (cutoff > maxLength / 2) {
      excerpt = excerpt.substring(0, cutoff + 1);
    } else {
      // If no good breakpoint found, cut at a space
      const lastSpace = excerpt.lastIndexOf(' ');
      
      if (lastSpace > maxLength / 2) {
        excerpt = excerpt.substring(0, lastSpace);
      }
    }
    
    return excerpt + '...';
  }
  
  /**
   * Check if the thesis is a synthesized thesis
   * @returns {boolean} Whether the thesis is synthesized
   */
  isSynthesized() {
    return Array.isArray(this.parent_theses) && this.parent_theses.length > 0;
  }
  
  /**
   * Validate thesis type against allowed types
   * @returns {boolean} Whether the type is valid
   */
  hasValidType() {
    return Object.values(THESIS_TYPES).includes(this.type);
  }
  
  /**
   * Validate thesis style against allowed styles
   * @returns {boolean} Whether the style is valid
   */
  hasValidStyle() {
    return Object.values(THESIS_STYLES).includes(this.style);
  }
  
  /**
   * Create a Thesis instance from a MongoDB document
   * @param {Object} document - MongoDB document
   * @returns {Thesis} Thesis instance
   */
  static fromDocument(document) {
    if (!document) return null;
    
    // Handle MongoDB _id if present
    const thesisData = { ...document };
    
    // Convert dates
    if (thesisData.created_at) {
      thesisData.created_at = new Date(thesisData.created_at);
    }
    
    if (thesisData.updated_at) {
      thesisData.updated_at = new Date(thesisData.updated_at);
    }
    
    return new Thesis(thesisData);
  }
  
  /**
   * Create a new generated thesis
   * @param {string} conceptId - Concept ID
   * @param {string} type - Thesis type
   * @param {string} content - Thesis content
   * @param {string} style - Thesis style
   * @param {Array<string>} relatedCategories - Related category IDs
   * @param {Object} generationParameters - Generation parameters
   * @param {string} [claudeGenerationId] - Claude interaction ID
   * @returns {Thesis} New thesis instance
   */
  static createGenerated(
    conceptId, 
    type, 
    content, 
    style, 
    relatedCategories = [], 
    generationParameters = {},
    claudeGenerationId = null
  ) {
    return new Thesis({
      concept_id: conceptId,
      type,
      content,
      style,
      status: THESIS_GENERATED,
      related_categories: relatedCategories,
      generation_parameters: generationParameters,
      claude_generation_id: claudeGenerationId
    });
  }
  
  /**
   * Create a new synthesized thesis
   * @param {string} conceptId - Concept ID
   * @param {string} type - Thesis type
   * @param {string} content - Thesis content
   * @param {string} style - Thesis style
   * @param {Array<string>} parentTheses - Parent thesis IDs
   * @param {Array<string>} relatedCategories - Related category IDs
   * @param {Object} generationParameters - Generation parameters
   * @param {string} [claudeGenerationId] - Claude interaction ID
   * @returns {Thesis} New synthesized thesis instance
   */
  static createSynthesized(
    conceptId, 
    type, 
    content, 
    style, 
    parentTheses = [], 
    relatedCategories = [], 
    generationParameters = {},
    claudeGenerationId = null
  ) {
    return new Thesis({
      concept_id: conceptId,
      type,
      content,
      style,
      status: THESIS_GENERATED,
      parent_theses: parentTheses,
      related_categories: relatedCategories,
      generation_parameters: generationParameters,
      claude_generation_id: claudeGenerationId
    });
  }
}

/**
 * ThesisElaboration class representing an elaboration of a thesis
 */
class ThesisElaboration {
  /**
   * Create a new ThesisElaboration instance
   * @param {Object} elaborationData - Elaboration data
   * @param {string} [elaborationData.elaboration_id] - Elaboration ID (generated if not provided)
   * @param {string} elaborationData.thesis_id - Parent thesis ID
   * @param {string} elaborationData.content - Elaboration content
   * @param {string} [elaborationData.type='explanation'] - Elaboration type
   * @param {string} [elaborationData.claude_generation_id] - Claude interaction ID
   * @param {Object} [elaborationData.metadata={}] - Additional metadata
   * @param {Date} [elaborationData.created_at] - Creation date
   * @param {Date} [elaborationData.updated_at] - Last update date
   */
  constructor(elaborationData = {}) {
    this.elaboration_id = elaborationData.elaboration_id || uuidv4();
    this.thesis_id = elaborationData.thesis_id;
    this.content = elaborationData.content;
    this.type = elaborationData.type || 'explanation';
    this.claude_generation_id = elaborationData.claude_generation_id || null;
    this.metadata = elaborationData.metadata || {};
    
    // Date fields
    this.created_at = elaborationData.created_at instanceof Date 
      ? elaborationData.created_at 
      : elaborationData.created_at ? new Date(elaborationData.created_at) : new Date();
      
    this.updated_at = elaborationData.updated_at instanceof Date 
      ? elaborationData.updated_at 
      : elaborationData.updated_at ? new Date(elaborationData.updated_at) : new Date();
  }
  
  /**
   * Convert the elaboration to a MongoDB document
   * @returns {Object} MongoDB document
   */
  toDocument() {
    return {
      elaboration_id: this.elaboration_id,
      thesis_id: this.thesis_id,
      content: this.content,
      type: this.type,
      claude_generation_id: this.claude_generation_id,
      metadata: this.metadata,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
  
  /**
   * Update elaboration with new data
   * @param {Object} elaborationData - Elaboration data to update
   * @returns {ThesisElaboration} Updated elaboration instance
   */
  update(elaborationData = {}) {
    // Only update allowed fields
    if (elaborationData.content !== undefined) this.content = elaborationData.content;
    if (elaborationData.type !== undefined) this.type = elaborationData.type;
    if (elaborationData.claude_generation_id !== undefined) {
      this.claude_generation_id = elaborationData.claude_generation_id;
    }
    if (elaborationData.metadata !== undefined) this.metadata = elaborationData.metadata;
    
    // Always update the updated_at field
    this.updated_at = new Date();
    
    return this;
  }
  
  /**
   * Create a ThesisElaboration instance from a MongoDB document
   * @param {Object} document - MongoDB document
   * @returns {ThesisElaboration} ThesisElaboration instance
   */
  static fromDocument(document) {
    if (!document) return null;
    
    // Handle MongoDB _id if present
    const elaborationData = { ...document };
    
    // Convert dates
    if (elaborationData.created_at) {
      elaborationData.created_at = new Date(elaborationData.created_at);
    }
    
    if (elaborationData.updated_at) {
      elaborationData.updated_at = new Date(elaborationData.updated_at);
    }
    
    return new ThesisElaboration(elaborationData);
  }
}

module.exports = {
  Thesis,
  ThesisElaboration
};
