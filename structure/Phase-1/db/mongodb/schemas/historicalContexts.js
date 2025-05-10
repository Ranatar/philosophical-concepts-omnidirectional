/**
 * MongoDB Schema: HistoricalContexts
 * Defines the schema for historical contextualization of philosophical concepts
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

// Define valid time periods
const TIME_PERIODS = [
  'ancient',
  'classical',
  'medieval',
  'renaissance',
  'early_modern',
  'enlightenment',
  'modern',
  'contemporary',
  'postmodern'
];

// Define influence schema
const InfluenceSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  influence_type: {
    type: String,
    enum: ['philosopher', 'school', 'tradition', 'event', 'text', 'social_movement'],
    required: true
  },
  time_period: {
    type: String,
    enum: TIME_PERIODS,
    required: true
  },
  influence_strength: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  key_concepts: {
    type: [String],
    default: []
  }
}, { _id: false });

// Define contemporary schema
const ContemporarySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  relationship: {
    type: String,
    enum: ['aligned', 'opposed', 'complementary', 'developed', 'criticized', 'extended'],
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
  comparison_points: {
    type: [String],
    default: []
  }
}, { _id: false });

// Define subsequent influence schema
const SubsequentInfluenceSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  influence_type: {
    type: String,
    enum: ['philosopher', 'school', 'tradition', 'field', 'practical_application'],
    required: true
  },
  time_period: {
    type: String,
    enum: TIME_PERIODS,
    default: 'contemporary'
  },
  influence_strength: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  key_developments: {
    type: [String],
    default: []
  }
}, { _id: false });

// Define timeline event schema
const TimelineEventSchema = new Schema({
  year: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  event_type: {
    type: String,
    enum: ['publication', 'philosophical_development', 'historical_event', 'birth', 'death', 'school_foundation'],
    required: true
  },
  related_philosophers: {
    type: [String],
    default: []
  },
  significance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, { _id: false });

// Define the main historical context schema
const HistoricalContextSchema = new Schema({
  context_id: {
    type: String,
    default: () => uuidv4(),
    required: true,
    unique: true
  },
  concept_id: {
    type: String,
    required: true
  },
  time_period: {
    type: String,
    enum: TIME_PERIODS,
    required: true
  },
  historical_analysis: {
    type: String,
    required: true
  },
  influences: {
    type: [InfluenceSchema],
    default: []
  },
  contemporaries: {
    type: [ContemporarySchema],
    default: []
  },
  subsequent_influence: {
    type: [SubsequentInfluenceSchema],
    default: []
  },
  timeline: {
    type: [TimelineEventSchema],
    default: []
  },
  historical_significance: {
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
HistoricalContextSchema.index({ context_id: 1 }, { unique: true });
HistoricalContextSchema.index({ concept_id: 1 });
HistoricalContextSchema.index({ time_period: 1 });
HistoricalContextSchema.index({ historical_significance: 1 });
HistoricalContextSchema.index({ claude_generation_id: 1 });
HistoricalContextSchema.index({ created_at: 1 });

// Virtual to get summarized historical analysis
HistoricalContextSchema.virtual('summary').get(function() {
  if (!this.historical_analysis) {
    return '';
  }
  
  const maxLength = 250;
  
  if (this.historical_analysis.length <= maxLength) {
    return this.historical_analysis;
  }
  
  let summary = this.historical_analysis.substring(0, maxLength);
  
  // Try to cut at the end of a sentence
  const lastPeriod = summary.lastIndexOf('.');
  if (lastPeriod > maxLength / 2) {
    summary = summary.substring(0, lastPeriod + 1);
  } else {
    summary += '...';
  }
  
  return summary;
});

// Method to add an influence
HistoricalContextSchema.methods.addInfluence = function(influence) {
  this.influences.push(influence);
  this.updated_at = new Date();
  return this;
};

// Method to add a contemporary
HistoricalContextSchema.methods.addContemporary = function(contemporary) {
  this.contemporaries.push(contemporary);
  this.updated_at = new Date();
  return this;
};

// Method to add a subsequent influence
HistoricalContextSchema.methods.addSubsequentInfluence = function(subsequentInfluence) {
  this.subsequent_influence.push(subsequentInfluence);
  this.updated_at = new Date();
  return this;
};

// Method to add a timeline event
HistoricalContextSchema.methods.addTimelineEvent = function(timelineEvent) {
  // Insert event in chronological order
  const index = this.timeline.findIndex(event => event.year > timelineEvent.year);
  
  if (index === -1) {
    // If no event with a later year exists, append to the end
    this.timeline.push(timelineEvent);
  } else {
    // Insert at the found position
    this.timeline.splice(index, 0, timelineEvent);
  }
  
  this.updated_at = new Date();
  return this;
};

// Static method to create a new historical context
HistoricalContextSchema.statics.createHistoricalContext = function(
  conceptId,
  timePeriod,
  historicalAnalysis,
  influences = [],
  contemporaries = [],
  subsequentInfluence = [],
  timeline = [],
  historicalSignificance = 3,
  generationParameters = {},
  claudeGenerationId = null
) {
  return new this({
    concept_id: conceptId,
    time_period: timePeriod,
    historical_analysis: historicalAnalysis,
    influences: influences,
    contemporaries: contemporaries,
    subsequent_influence: subsequentInfluence,
    timeline: timeline,
    historical_significance: historicalSignificance,
    generation_parameters: generationParameters,
    claude_generation_id: claudeGenerationId
  });
};

// Create and export model
const HistoricalContext = mongoose.model('HistoricalContext', HistoricalContextSchema);

module.exports = {
  HistoricalContext,
  TIME_PERIODS,
  InfluenceSchema,
  ContemporarySchema,
  SubsequentInfluenceSchema,
  TimelineEventSchema
};
