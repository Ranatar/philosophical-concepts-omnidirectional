/**
 * MongoDB Schema: PracticalApplications
 * Defines the schema for practical applications of philosophical concepts
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

// Define valid application domains
const APPLICATION_DOMAINS = [
  'education',
  'ethics',
  'politics',
  'arts',
  'science',
  'technology',
  'psychology',
  'business',
  'medicine',
  'law',
  'environment',
  'social_policy'
];

// Define domain application schema
const DomainApplicationSchema = new Schema({
  domain: {
    type: String,
    enum: APPLICATION_DOMAINS,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  relevance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  key_examples: {
    type: [String],
    default: []
  },
  potential_impact: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  challenges: {
    type: [String],
    default: []
  }
}, { _id: false });

// Define implementation method schema
const ImplementationMethodSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    enum: APPLICATION_DOMAINS,
    required: true
  },
  steps: {
    type: [String],
    default: []
  },
  required_resources: {
    type: [String],
    default: []
  },
  expected_outcomes: {
    type: [String],
    default: []
  },
  feasibility: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, { _id: false });

// Define relevance mapping schema
const RelevanceMappingSchema = new Schema({
  concept_element: {
    type: String,
    required: true
  },
  element_type: {
    type: String,
    enum: ['category', 'thesis', 'relationship'],
    required: true
  },
  application_domain: {
    type: String,
    enum: APPLICATION_DOMAINS,
    required: true
  },
  relevance_explanation: {
    type: String,
    required: true
  },
  transformation_required: {
    type: Boolean,
    default: false
  },
  operationalization_notes: {
    type: String,
    default: ''
  }
}, { _id: false });

// Define case study schema
const CaseStudySchema = new Schema({
  title: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    enum: APPLICATION_DOMAINS,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  approach: {
    type: String,
    required: true
  },
  outcomes: {
    type: String,
    required: true
  },
  lessons_learned: {
    type: [String],
    default: []
  },
  related_concept_elements: {
    type: [String],
    default: []
  }
}, { _id: false });

// Define the main practical application schema
const PracticalApplicationSchema = new Schema({
  application_id: {
    type: String,
    default: () => uuidv4(),
    required: true,
    unique: true
  },
  concept_id: {
    type: String,
    required: true
  },
  domains: {
    type: [DomainApplicationSchema],
    validate: [arrayMinLength, 'At least one domain application is required']
  },
  application_analysis: {
    type: String,
    required: true
  },
  implementation_methods: {
    type: [ImplementationMethodSchema],
    default: []
  },
  relevance_mappings: {
    type: [RelevanceMappingSchema],
    default: []
  },
  case_studies: {
    type: [CaseStudySchema],
    default: []
  },
  interdisciplinary_connections: {
    type: [String],
    default: []
  },
  overall_applicability: {
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

// Validator function for array minimum length
function arrayMinLength(val) {
  return val.length >= 1;
}

// Add indexes
PracticalApplicationSchema.index({ application_id: 1 }, { unique: true });
PracticalApplicationSchema.index({ concept_id: 1 });
PracticalApplicationSchema.index({ overall_applicability: 1 });
PracticalApplicationSchema.index({ claude_generation_id: 1 });
PracticalApplicationSchema.index({ created_at: 1 });
PracticalApplicationSchema.index({ "domains.domain": 1 });

// Virtual to get summarized application analysis
PracticalApplicationSchema.virtual('summary').get(function() {
  if (!this.application_analysis) {
    return '';
  }
  
  const maxLength = 250;
  
  if (this.application_analysis.length <= maxLength) {
    return this.application_analysis;
  }
  
  let summary = this.application_analysis.substring(0, maxLength);
  
  // Try to cut at the end of a sentence
  const lastPeriod = summary.lastIndexOf('.');
  if (lastPeriod > maxLength / 2) {
    summary = summary.substring(0, lastPeriod + 1);
  } else {
    summary += '...';
  }
  
  return summary;
});

// Virtual to get list of domain names
PracticalApplicationSchema.virtual('domainNames').get(function() {
  return this.domains.map(domain => domain.domain);
});

// Method to add a domain application
PracticalApplicationSchema.methods.addDomain = function(domainApplication) {
  // Check if domain already exists
  const existingIndex = this.domains.findIndex(d => d.domain === domainApplication.domain);
  
  if (existingIndex >= 0) {
    // Update existing domain
    this.domains[existingIndex] = domainApplication;
  } else {
    // Add new domain
    this.domains.push(domainApplication);
  }
  
  this.updated_at = new Date();
  return this;
};

// Method to add an implementation method
PracticalApplicationSchema.methods.addImplementationMethod = function(implementationMethod) {
  this.implementation_methods.push(implementationMethod);
  this.updated_at = new Date();
  return this;
};

// Method to add a relevance mapping
PracticalApplicationSchema.methods.addRelevanceMapping = function(relevanceMapping) {
  this.relevance_mappings.push(relevanceMapping);
  this.updated_at = new Date();
  return this;
};

// Method to add a case study
PracticalApplicationSchema.methods.addCaseStudy = function(caseStudy) {
  this.case_studies.push(caseStudy);
  this.updated_at = new Date();
  return this;
};

// Method to add an interdisciplinary connection
PracticalApplicationSchema.methods.addInterdisciplinaryConnection = function(connection) {
  if (!this.interdisciplinary_connections.includes(connection)) {
    this.interdisciplinary_connections.push(connection);
    this.updated_at = new Date();
  }
  return this;
};

// Static method to create a new practical application
PracticalApplicationSchema.statics.createPracticalApplication = function(
  conceptId,
  domains,
  applicationAnalysis,
  implementationMethods = [],
  relevanceMappings = [],
  caseStudies = [],
  interdisciplinaryConnections = [],
  overallApplicability = 3,
  generationParameters = {},
  claudeGenerationId = null
) {
  return new this({
    concept_id: conceptId,
    domains: domains,
    application_analysis: applicationAnalysis,
    implementation_methods: implementationMethods,
    relevance_mappings: relevanceMappings,
    case_studies: caseStudies,
    interdisciplinary_connections: interdisciplinaryConnections,
    overall_applicability: overallApplicability,
    generation_parameters: generationParameters,
    claude_generation_id: claudeGenerationId
  });
};

// Create and export model
const PracticalApplication = mongoose.model('PracticalApplication', PracticalApplicationSchema);

module.exports = {
  PracticalApplication,
  APPLICATION_DOMAINS,
  DomainApplicationSchema,
  ImplementationMethodSchema,
  RelevanceMappingSchema,
  CaseStudySchema
};
