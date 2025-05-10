/**
 * MongoDB Schema: CategoryDescriptions
 * Defines the schema for detailed descriptions of philosophical categories
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

// Define historical analogue schema
const HistoricalAnalogueSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  philosopher: {
    type: String,
    default: null
  },
  tradition: {
    type: String,
    default: null
  },
  time_period: {
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

// Define related concept schema
const RelatedConceptSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  relationship_type: {
    type: String,
    enum: ['similar', 'opposite', 'broader', 'narrower', 'contextual', 'derivative'],
    required: true
  },
  relatedness_score: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  }
}, { _id: false });

// Define the main category description schema
const CategoryDescriptionSchema = new Schema({
  description_id: {
    type: String,
    default: () => uuidv4(),
    required: true,
    unique: true
  },
  category_id: {
    type: String,
    required: true,
    unique: true
  },
  detailed_description: {
    type: String,
    required: true
  },
  alternative_interpretations: {
    type: [String],
    default: []
  },
  historical_analogues: {
    type: [HistoricalAnalogueSchema],
    default: []
  },
  related_concepts: {
    type: [RelatedConceptSchema],
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
CategoryDescriptionSchema.index({ description_id: 1 }, { unique: true });
CategoryDescriptionSchema.index({ category_id: 1 }, { unique: true });
CategoryDescriptionSchema.index({ claude_generation_id: 1 });
CategoryDescriptionSchema.index({ created_at: 1 });

// Virtual to get summarized description
CategoryDescriptionSchema.virtual('summary').get(function() {
  if (!this.detailed_description) {
    return '';
  }
  
  const maxLength = 200;
  
  if (this.detailed_description.length <= maxLength) {
    return this.detailed_description;
  }
  
  let summary = this.detailed_description.substring(0, maxLength);
  
  // Try to cut at the end of a sentence
  const lastPeriod = summary.lastIndexOf('.');
  if (lastPeriod > maxLength / 2) {
    summary = summary.substring(0, lastPeriod + 1);
  } else {
    summary += '...';
  }
  
  return summary;
});

// Method to add an alternative interpretation
CategoryDescriptionSchema.methods.addAlternativeInterpretation = function(interpretation) {
  if (!this.alternative_interpretations.includes(interpretation)) {
    this.alternative_interpretations.push(interpretation);
    this.last_modified = new Date();
  }
  return this;
};

// Method to add a historical analogue
CategoryDescriptionSchema.methods.addHistoricalAnalogue = function(analogue) {
  this.historical_analogues.push(analogue);
  this.last_modified = new Date();
  return this;
};

// Method to add a related concept
CategoryDescriptionSchema.methods.addRelatedConcept = function(relatedConcept) {
  this.related_concepts.push(relatedConcept);
  this.last_modified = new Date();
  return this;
};

// Static method to create a new category description
CategoryDescriptionSchema.statics.createDescription = function(
  categoryId,
  detailedDescription,
  alternativeInterpretations = [],
  historicalAnalogues = [],
  relatedConcepts = [],
  claudeGenerationId = null
) {
  return new this({
    category_id: categoryId,
    detailed_description: detailedDescription,
    alternative_interpretations: alternativeInterpretations,
    historical_analogues: historicalAnalogues,
    related_concepts: relatedConcepts,
    claude_generation_id: claudeGenerationId
  });
};

// Create and export model
const CategoryDescription = mongoose.model('CategoryDescription', CategoryDescriptionSchema);

module.exports = {
  CategoryDescription,
  HistoricalAnalogueSchema,
  RelatedConceptSchema
};
