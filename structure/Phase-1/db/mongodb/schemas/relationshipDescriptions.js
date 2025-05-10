/**
 * MongoDB Schema: RelationshipDescriptions
 * Defines the schema for detailed descriptions of relationships between philosophical categories
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

// Define relationship analogue schema
const RelationshipAnalogueSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    default: 'philosophy'
  },
  tradition: {
    type: String,
    default: null
  },
  similarity_score: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  }
}, { _id: false });

// Define the main relationship description schema
const RelationshipDescriptionSchema = new Schema({
  description_id: {
    type: String,
    default: () => uuidv4(),
    required: true,
    unique: true
  },
  relationship_id: {
    type: String,
    required: true,
    unique: true
  },
  philosophical_foundation: {
    type: String,
    required: true
  },
  counterarguments: {
    type: [String],
    default: []
  },
  analogues: {
    type: [RelationshipAnalogueSchema],
    default: []
  },
  source_category_id: {
    type: String,
    required: true
  },
  target_category_id: {
    type: String,
    required: true
  },
  relationship_type: {
    type: String,
    enum: [
      'hierarchical',
      'causal',
      'dialectical',
      'correlative',
      'analogical',
      'oppositional',
      'metaphorical',
      'functional'
    ],
    required: true
  },
  relevant_philosophers: {
    type: [String],
    default: []
  },
  relevant_traditions: {
    type: [String],
    default: []
  },
  claude_generation_id: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  last_modified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'last_modified'
  }
});

// Add indexes
RelationshipDescriptionSchema.index({ description_id: 1 }, { unique: true });
RelationshipDescriptionSchema.index({ relationship_id: 1 }, { unique: true });
RelationshipDescriptionSchema.index({ source_category_id: 1 });
RelationshipDescriptionSchema.index({ target_category_id: 1 });
RelationshipDescriptionSchema.index({ relationship_type: 1 });
RelationshipDescriptionSchema.index({ claude_generation_id: 1 });
RelationshipDescriptionSchema.index({ created_at: 1 });

// Compound indexes for related categories
RelationshipDescriptionSchema.index({ source_category_id: 1, target_category_id: 1 });

// Virtual to get summarized foundation
RelationshipDescriptionSchema.virtual('summary').get(function() {
  if (!this.philosophical_foundation) {
    return '';
  }
  
  const maxLength = 200;
  
  if (this.philosophical_foundation.length <= maxLength) {
    return this.philosophical_foundation;
  }
  
  let summary = this.philosophical_foundation.substring(0, maxLength);
  
  // Try to cut at the end of a sentence
  const lastPeriod = summary.lastIndexOf('.');
  if (lastPeriod > maxLength / 2) {
    summary = summary.substring(0, lastPeriod + 1);
  } else {
    summary += '...';
  }
  
  return summary;
});

// Method to add a counterargument
RelationshipDescriptionSchema.methods.addCounterargument = function(counterargument) {
  if (!this.counterarguments.includes(counterargument)) {
    this.counterarguments.push(counterargument);
    this.last_modified = new Date();
  }
  return this;
};

// Method to add an analogue
RelationshipDescriptionSchema.methods.addAnalogue = function(analogue) {
  this.analogues.push(analogue);
  this.last_modified = new Date();
  return this;
};

// Method to add a relevant philosopher
RelationshipDescriptionSchema.methods.addPhilosopher = function(philosopher) {
  if (!this.relevant_philosophers.includes(philosopher)) {
    this.relevant_philosophers.push(philosopher);
    this.last_modified = new Date();
  }
  return this;
};

// Method to add a relevant tradition
RelationshipDescriptionSchema.methods.addTradition = function(tradition) {
  if (!this.relevant_traditions.includes(tradition)) {
    this.relevant_traditions.push(tradition);
    this.last_modified = new Date();
  }
  return this;
};

// Static method to create a new relationship description
RelationshipDescriptionSchema.statics.createDescription = function(
  relationshipId,
  sourceCategoryId,
  targetCategoryId,
  relationshipType,
  philosophicalFoundation,
  counterarguments = [],
  analogues = [],
  relevantPhilosophers = [],
  relevantTraditions = [],
  claudeGenerationId = null
) {
  return new this({
    relationship_id: relationshipId,
    source_category_id: sourceCategoryId,
    target_category_id: targetCategoryId,
    relationship_type: relationshipType,
    philosophical_foundation: philosophicalFoundation,
    counterarguments: counterarguments,
    analogues: analogues,
    relevant_philosophers: relevantPhilosophers,
    relevant_traditions: relevantTraditions,
    claude_generation_id: claudeGenerationId
  });
};

// Create and export model
const RelationshipDescription = mongoose.model('RelationshipDescription', RelationshipDescriptionSchema);

module.exports = {
  RelationshipDescription,
  RelationshipAnalogueSchema
};
