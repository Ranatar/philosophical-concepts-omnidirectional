/**
 * MongoDB Schema: ConceptAnalyses
 * Defines the schema for analyses of philosophical concepts
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

// Define valid analysis types
const ANALYSIS_TYPES = [
  'critical',
  'historical',
  'comparative',
  'structural',
  'linguistic',
  'ethical',
  'political',
  'methodological',
  'interdisciplinary',
  'creative'
];

// Define key point schema
const KeyPointSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  relevance_score: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  related_elements: {
    type: [String],
    default: []
  }
}, { _id: false });

// Define reference schema
const ReferenceSchema = new Schema({
  philosopher: {
    type: String,
    default: null
  },
  text: {
    type: String,
    default: null
  },
  year: {
    type: Number,
    default: null
  },
  description: {
    type: String,
    required: true
  },
  relevance_type: {
    type: String,
    enum: ['support', 'contrast', 'context', 'elaboration'],
    default: 'support'
  }
}, { _id: false });

// Define the main concept analysis schema
const ConceptAnalysisSchema = new Schema({
  analysis_id: {
    type: String,
    default: () => uuidv4(),
    required: true,
    unique: true
  },
  concept_id: {
    type: String,
    required: true
  },
  analysis_type: {
    type: String,
    enum: ANALYSIS_TYPES,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  key_points: {
    type: [KeyPointSchema],
    default: []
  },
  references: {
    type: [ReferenceSchema],
    default: []
  },
  suggested_improvements: {
    type: [String],
    default: []
  },
  critique_points: {
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
ConceptAnalysisSchema.index({ analysis_id: 1 }, { unique: true });
ConceptAnalysisSchema.index({ concept_id: 1 });
ConceptAnalysisSchema.index({ analysis_type: 1 });
ConceptAnalysisSchema.index({ claude_generation_id: 1 });
ConceptAnalysisSchema.index({ created_at: 1 });

// Virtual to get summarized content
ConceptAnalysisSchema.virtual('summary').get(function() {
  if (!this.content) {
    return '';
  }
  
  const maxLength = 200;
  
  if (this.content.length <= maxLength) {
    return this.content;
  }
  
  let summary = this.content.substring(0, maxLength);
  
  // Try to cut at the end of a sentence
  const lastPeriod = summary.lastIndexOf('.');
  if (lastPeriod > maxLength / 2) {
    summary = summary.substring(0, lastPeriod + 1);
  } else {
    summary += '...';
  }
  
  return summary;
});

// Method to add a key point
ConceptAnalysisSchema.methods.addKeyPoint = function(keyPoint) {
  this.key_points.push(keyPoint);
  this.updated_at = new Date();
  return this;
};

// Method to add a reference
ConceptAnalysisSchema.methods.addReference = function(reference) {
  this.references.push(reference);
  this.updated_at = new Date();
  return this;
};

// Method to add a suggested improvement
ConceptAnalysisSchema.methods.addSuggestedImprovement = function(improvement) {
  if (!this.suggested_improvements.includes(improvement)) {
    this.suggested_improvements.push(improvement);
    this.updated_at = new Date();
  }
  return this;
};

// Method to add a critique point
ConceptAnalysisSchema.methods.addCritiquePoint = function(critique) {
  if (!this.critique_points.includes(critique)) {
    this.critique_points.push(critique);
    this.updated_at = new Date();
  }
  return this;
};

// Static method to create a new concept analysis
ConceptAnalysisSchema.statics.createAnalysis = function(
  conceptId,
  analysisType,
  content,
  keyPoints = [],
  references = [],
  suggestedImprovements = [],
  critiquePoints = [],
  generationParameters = {},
  claudeGenerationId = null
) {
  return new this({
    concept_id: conceptId,
    analysis_type: analysisType,
    content: content,
    key_points: keyPoints,
    references: references,
    suggested_improvements: suggestedImprovements,
    critique_points: critiquePoints,
    generation_parameters: generationParameters,
    claude_generation_id: claudeGenerationId
  });
};

// Create and export model
const ConceptAnalysis = mongoose.model('ConceptAnalysis', ConceptAnalysisSchema);

module.exports = {
  ConceptAnalysis,
  ANALYSIS_TYPES,
  KeyPointSchema,
  ReferenceSchema
};
