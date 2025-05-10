/**
 * MongoDB Schema: ConceptEvolutions
 * Defines the schema for evolution of philosophical concepts
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

// Define valid evolution directions
const EVOLUTION_DIRECTIONS = [
  'expansion',
  'refinement',
  'reinterpretation',
  'synthesis',
  'critique',
  'integration',
  'application'
];

// Define category change schema
const CategoryChangeSchema = new Schema({
  category_id: {
    type: String,
    default: null
  },
  category_name: {
    type: String,
    required: true
  },
  change_type: {
    type: String,
    enum: ['add', 'modify', 'remove', 'redefine', 'merge', 'split'],
    required: true
  },
  original_definition: {
    type: String,
    default: null
  },
  new_definition: {
    type: String,
    default: null
  },
  justification: {
    type: String,
    required: true
  },
  importance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, { _id: false });

// Define relationship change schema
const RelationshipChangeSchema = new Schema({
  relationship_id: {
    type: String,
    default: null
  },
  source_category: {
    type: String,
    required: true
  },
  target_category: {
    type: String,
    required: true
  },
  relationship_type: {
    type: String,
    required: true
  },
  change_type: {
    type: String,
    enum: ['add', 'modify', 'remove', 'redefine', 'strengthen', 'weaken', 'reverse'],
    required: true
  },
  original_description: {
    type: String,
    default: null
  },
  new_description: {
    type: String,
    default: null
  },
  justification: {
    type: String,
    required: true
  },
  importance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, { _id: false });

// Define thesis change schema
const ThesisChangeSchema = new Schema({
  thesis_id: {
    type: String,
    default: null
  },
  thesis_type: {
    type: String,
    required: true
  },
  change_type: {
    type: String,
    enum: ['add', 'modify', 'remove', 'restate', 'strengthen', 'qualify'],
    required: true
  },
  original_content: {
    type: String,
    default: null
  },
  new_content: {
    type: String,
    default: null
  },
  justification: {
    type: String,
    required: true
  },
  related_categories: {
    type: [String],
    default: []
  },
  importance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, { _id: false });

// Define name change schema
const NameChangeSchema = new Schema({
  original_name: {
    type: String,
    required: true
  },
  new_name: {
    type: String,
    required: true
  },
  justification: {
    type: String,
    required: true
  },
  semantic_shift: {
    type: String,
    enum: ['minor', 'moderate', 'significant', 'fundamental'],
    default: 'moderate'
  }
}, { _id: false });

// Define contextual driver schema
const ContextualDriverSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  driver_type: {
    type: String,
    enum: ['scientific_development', 'societal_change', 'technological_innovation', 'philosophical_development', 'interdisciplinary_insight', 'empirical_evidence'],
    required: true
  },
  relevance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  affected_elements: {
    type: [String],
    default: []
  }
}, { _id: false });

// Define the main concept evolution schema
const ConceptEvolutionSchema = new Schema({
  evolution_id: {
    type: String,
    default: () => uuidv4(),
    required: true,
    unique: true
  },
  concept_id: {
    type: String,
    required: true
  },
  target_concept_id: {
    type: String,
    default: null
  },
  evolution_context: {
    type: String,
    required: true
  },
  evolution_direction: {
    type: String,
    enum: EVOLUTION_DIRECTIONS,
    required: true
  },
  scientific_context: {
    type: String,
    default: ''
  },
  contemporary_relevance: {
    type: String,
    default: ''
  },
  category_changes: {
    type: [CategoryChangeSchema],
    default: []
  },
  relationship_changes: {
    type: [RelationshipChangeSchema],
    default: []
  },
  thesis_changes: {
    type: [ThesisChangeSchema],
    default: []
  },
  name_change: {
    type: NameChangeSchema,
    default: null
  },
  contextual_drivers: {
    type: [ContextualDriverSchema],
    default: []
  },
  innovation_degree: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  applicability_enhancement: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  claude_generation_id: {
    type: String,
    default: null
  },
  generation_parameters: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Add indexes
ConceptEvolutionSchema.index({ evolution_id: 1 }, { unique: true });
ConceptEvolutionSchema.index({ concept_id: 1 });
ConceptEvolutionSchema.index({ target_concept_id: 1 });
ConceptEvolutionSchema.index({ evolution_direction: 1 });
ConceptEvolutionSchema.index({ innovation_degree: 1 });
ConceptEvolutionSchema.index({ claude_generation_id: 1 });
ConceptEvolutionSchema.index({ created_at: 1 });

// Virtual to get total number of changes
ConceptEvolutionSchema.virtual('totalChanges').get(function() {
  return (
    (this.category_changes ? this.category_changes.length : 0) +
    (this.relationship_changes ? this.relationship_changes.length : 0) +
    (this.thesis_changes ? this.thesis_changes.length : 0) +
    (this.name_change ? 1 : 0)
  );
});

// Virtual to get summarized evolution context
ConceptEvolutionSchema.virtual('summary').get(function() {
  if (!this.evolution_context) {
    return '';
  }
  
  const maxLength = 250;
  
  if (this.evolution_context.length <= maxLength) {
    return this.evolution_context;
  }
  
  let summary = this.evolution_context.substring(0, maxLength);
  
  // Try to cut at the end of a sentence
  const lastPeriod = summary.lastIndexOf('.');
  if (lastPeriod > maxLength / 2) {
    summary = summary.substring(0, lastPeriod + 1);
  } else {
    summary += '...';
  }
  
  return summary;
});

// Method to add a category change
ConceptEvolutionSchema.methods.addCategoryChange = function(categoryChange) {
  this.category_changes.push(categoryChange);
  this.updated_at = new Date();
  return this;
};

// Method to add a relationship change
ConceptEvolutionSchema.methods.addRelationshipChange = function(relationshipChange) {
  this.relationship_changes.push(relationshipChange);
  this.updated_at = new Date();
  return this;
};

// Method to add a thesis change
ConceptEvolutionSchema.methods.addThesisChange = function(thesisChange) {
  this.thesis_changes.push(thesisChange);
  this.updated_at = new Date();
  return this;
};

// Method to set name change
ConceptEvolutionSchema.methods.setNameChange = function(nameChange) {
  this.name_change = nameChange;
  this.updated_at = new Date();
  return this;
};

// Method to add a contextual driver
ConceptEvolutionSchema.methods.addContextualDriver = function(contextualDriver) {
  this.contextual_drivers.push(contextualDriver);
  this.updated_at = new Date();
  return this;
};

// Static method to create a new concept evolution
ConceptEvolutionSchema.statics.createConceptEvolution = function(
  conceptId,
  evolutionContext,
  evolutionDirection,
  targetConceptId = null,
  scientificContext = '',
  contemporaryRelevance = '',
  categoryChanges = [],
  relationshipChanges = [],
  thesisChanges = [],
  nameChange = null,
  contextualDrivers = [],
  innovationDegree = 3,
  applicabilityEnhancement = 3,
  generationParameters = {},
  claudeGenerationId = null
) {
  return new this({
    concept_id: conceptId,
    evolution_context: evolutionContext,
    evolution_direction: evolutionDirection,
    target_concept_id: targetConceptId,
    scientific_context: scientificContext,
    contemporary_relevance: contemporaryRelevance,
    category_changes: categoryChanges,
    relationship_changes: relationshipChanges,
    thesis_changes: thesisChanges,
    name_change: nameChange,
    contextual_drivers: contextualDrivers,
    innovation_degree: innovationDegree,
    applicability_enhancement: applicabilityEnhancement,
    generation_parameters: generationParameters,
    claude_generation_id: claudeGenerationId
  });
};

// Create and export model
const ConceptEvolution = mongoose.model('ConceptEvolution', ConceptEvolutionSchema);

module.exports = {
  ConceptEvolution,
  EVOLUTION_DIRECTIONS,
  CategoryChangeSchema,
  RelationshipChangeSchema,
  ThesisChangeSchema,
  NameChangeSchema,
  ContextualDriverSchema
};
