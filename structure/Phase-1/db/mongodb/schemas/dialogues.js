/**
 * MongoDB Schema: Dialogues
 * Defines the schema for philosophical dialogues between concepts
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

// Define argument schema
const ArgumentSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  concept_id: {
    type: String,
    required: true
  },
  argument_type: {
    type: String,
    enum: ['premise', 'objection', 'rebuttal', 'clarification', 'conclusion'],
    required: true
  },
  strength: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  related_theses: {
    type: [String],
    default: []
  },
  counterarguments: {
    type: [String],
    default: []
  }
}, { _id: false });

// Define discussion point schema
const DiscussionPointSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  position_one: {
    type: String,
    required: true
  },
  position_one_concept_id: {
    type: String,
    required: true
  },
  position_two: {
    type: String,
    required: true
  },
  position_two_concept_id: {
    type: String,
    required: true
  },
  resolution: {
    type: String,
    default: null
  },
  importance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, { _id: false });

// Define dialogue message schema
const DialogueMessageSchema = new Schema({
  message_id: {
    type: String,
    default: () => uuidv4(),
    required: true
  },
  concept_id: {
    type: String,
    required: true
  },
  speaker: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  references: {
    type: [String],
    default: []
  },
  sequence: {
    type: Number,
    required: true
  }
}, { _id: false });

// Define the main dialogue schema
const DialogueSchema = new Schema({
  dialogue_id: {
    type: String,
    default: () => uuidv4(),
    required: true,
    unique: true
  },
  philosophical_question: {
    type: String,
    required: true
  },
  dialogue_content: {
    type: String,
    required: true
  },
  messages: {
    type: [DialogueMessageSchema],
    default: []
  },
  discussion_points: {
    type: [DiscussionPointSchema],
    default: []
  },
  arguments: {
    type: [ArgumentSchema],
    default: []
  },
  concept_ids: {
    type: [String],
    required: true,
    validate: [arrayMinLength, 'At least two concepts are required for a dialogue']
  },
  convergences: {
    type: [String],
    default: []
  },
  divergences: {
    type: [String],
    default: []
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

// Validator function for array minimum length
function arrayMinLength(val) {
  return val.length >= 2;
}

// Add indexes
DialogueSchema.index({ dialogue_id: 1 }, { unique: true });
DialogueSchema.index({ concept_ids: 1 });
DialogueSchema.index({ claude_generation_id: 1 });
DialogueSchema.index({ created_at: 1 });
DialogueSchema.index({ "arguments.concept_id": 1 });

// Virtual to get summarized dialogue
DialogueSchema.virtual('summary').get(function() {
  if (!this.dialogue_content) {
    return '';
  }
  
  const maxLength = 300;
  
  if (this.dialogue_content.length <= maxLength) {
    return this.dialogue_content;
  }
  
  let summary = this.dialogue_content.substring(0, maxLength);
  
  // Try to cut at the end of a sentence
  const lastPeriod = summary.lastIndexOf('.');
  if (lastPeriod > maxLength / 2) {
    summary = summary.substring(0, lastPeriod + 1);
  } else {
    summary += '...';
  }
  
  return summary;
});

// Virtual to get participants count
DialogueSchema.virtual('participantsCount').get(function() {
  return this.concept_ids ? this.concept_ids.length : 0;
});

// Method to add a message
DialogueSchema.methods.addMessage = function(message) {
  // Set sequence number if not provided
  if (!message.sequence) {
    message.sequence = this.messages.length + 1;
  }
  
  this.messages.push(message);
  this.updated_at = new Date();
  return this;
};

// Method to add a discussion point
DialogueSchema.methods.addDiscussionPoint = function(discussionPoint) {
  this.discussion_points.push(discussionPoint);
  this.updated_at = new Date();
  return this;
};

// Method to add an argument
DialogueSchema.methods.addArgument = function(argument) {
  this.arguments.push(argument);
  this.updated_at = new Date();
  return this;
};

// Method to add a convergence point
DialogueSchema.methods.addConvergence = function(convergence) {
  if (!this.convergences.includes(convergence)) {
    this.convergences.push(convergence);
    this.updated_at = new Date();
  }
  return this;
};

// Method to add a divergence point
DialogueSchema.methods.addDivergence = function(divergence) {
  if (!this.divergences.includes(divergence)) {
    this.divergences.push(divergence);
    this.updated_at = new Date();
  }
  return this;
};

// Static method to create a new dialogue
DialogueSchema.statics.createDialogue = function(
  philosophicalQuestion,
  dialogueContent,
  conceptIds,
  messages = [],
  discussionPoints = [],
  arguments = [],
  convergences = [],
  divergences = [],
  generationParameters = {},
  claudeGenerationId = null
) {
  return new this({
    philosophical_question: philosophicalQuestion,
    dialogue_content: dialogueContent,
    concept_ids: conceptIds,
    messages: messages,
    discussion_points: discussionPoints,
    arguments: arguments,
    convergences: convergences,
    divergences: divergences,
    generation_parameters: generationParameters,
    claude_generation_id: claudeGenerationId
  });
};

// Create and export model
const Dialogue = mongoose.model('Dialogue', DialogueSchema);

module.exports = {
  Dialogue,
  ArgumentSchema,
  DiscussionPointSchema,
  DialogueMessageSchema
};
