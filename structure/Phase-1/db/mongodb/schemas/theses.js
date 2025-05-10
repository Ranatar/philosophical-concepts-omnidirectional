/**
 * MongoDB Schema: Theses
 * Defines the schema for philosophical theses
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

// Define valid thesis types
const THESIS_TYPES = [
  'ontological',
  'epistemological',
  'ethical',
  'aesthetic',
  'political',
  'logical',
  'methodological',
  'critical',
  'synthetic'
];

// Define valid thesis styles
const THESIS_STYLES = [
  'academic',
  'aphoristic',
  'poetic',
  'dialectical',
  'analytical',
  'narrative',
  'popular'
];

// Define valid thesis statuses
const THESIS_STATUSES = [
  'generated',
  'edited',
  'approved',
  'rejected',
  'archived'
];

// Define the schema for a thesis elaboration
const ThesisElaborationSchema = new Schema({
  elaboration_id: {
    type: String,
    default: () => uuidv4(),
    required: true
  },
  thesis_id: {
    type: String,
    required: true,
    ref: 'Thesis'
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['explanation', 'justification', 'counterargument', 'implication', 'example', 'historical_context'],
    default: 'explanation'
  },
  claude_generation_id: {
    type: String,
    default: null
  },
  metadata: {
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

// Define the main thesis schema
const ThesisSchema = new Schema({
  thesis_id: {
    type: String,
    default: () => uuidv4(),
    required: true,
    unique: true
  },
  concept_id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: THESIS_TYPES,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  style: {
    type: String,
    enum: THESIS_STYLES,
    default: 'academic'
  },
  status: {
    type: String,
    enum: THESIS_STATUSES,
    default: 'generated'
  },
  related_categories: {
    type: [String],
    default: []
  },
  parent_theses: {
    type: [String],
    default: []
  },
  generation_parameters: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  claude_generation_id: {
    type: String,
    default: null
  },
  metadata: {
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
ThesisSchema.index({ thesis_id: 1 }, { unique: true });
ThesisSchema.index({ concept_id: 1 });
ThesisSchema.index({ type: 1 });
ThesisSchema.index({ style: 1 });
ThesisSchema.index({ status: 1 });
ThesisSchema.index({ created_at: 1 });
ThesisSchema.index({ related_categories: 1 });
ThesisSchema.index({ parent_theses: 1 });

// Virtual for checking if thesis is synthesized
ThesisSchema.virtual('isSynthesized').get(function() {
  return this.parent_theses && this.parent_theses.length > 0;
});

// Method for getting a short excerpt of the thesis content
ThesisSchema.methods.getExcerpt = function(maxLength = 100) {
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
};

// Static method for creating a generated thesis
ThesisSchema.statics.createGenerated = function(
  conceptId, 
  type, 
  content, 
  style, 
  relatedCategories = [], 
  generationParameters = {},
  claudeGenerationId = null
) {
  return new this({
    concept_id: conceptId,
    type,
    content,
    style,
    status: 'generated',
    related_categories: relatedCategories,
    generation_parameters: generationParameters,
    claude_generation_id: claudeGenerationId
  });
};

// Static method for creating a synthesized thesis
ThesisSchema.statics.createSynthesized = function(
  conceptId, 
  type, 
  content, 
  style, 
  parentTheses = [], 
  relatedCategories = [], 
  generationParameters = {},
  claudeGenerationId = null
) {
  return new this({
    concept_id: conceptId,
    type,
    content,
    style,
    status: 'generated',
    parent_theses: parentTheses,
    related_categories: relatedCategories,
    generation_parameters: generationParameters,
    claude_generation_id: claudeGenerationId
  });
};

// Create and export models
const Thesis = mongoose.model('Thesis', ThesisSchema);
const ThesisElaboration = mongoose.model('ThesisElaboration', ThesisElaborationSchema);

module.exports = {
  Thesis,
  ThesisElaboration,
  THESIS_TYPES,
  THESIS_STYLES,
  THESIS_STATUSES
};
