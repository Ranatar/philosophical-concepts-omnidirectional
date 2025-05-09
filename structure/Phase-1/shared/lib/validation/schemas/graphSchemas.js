/**
 * Validation schemas for graphs
 */

const Joi = require('joi');
const { 
  GRAPH_DRAFT, 
  GRAPH_VALIDATED, 
  GRAPH_ENRICHED, 
  GRAPH_PUBLISHED 
} = require('../../../constants/statuses');
const { 
  RELATIONSHIP_TYPES, 
  RELATIONSHIP_DIRECTIONS 
} = require('../../../constants/philosophyConstants');

// Helper for characteristic validation (1-5 scale)
const characteristicSchema = Joi.number().integer().min(1).max(5);

// Schema for creating a new category
const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(255).required()
    .messages({
      'string.empty': 'Category name is required',
      'string.min': 'Category name must be at least {{#limit}} characters',
      'string.max': 'Category name cannot exceed {{#limit}} characters',
      'any.required': 'Category name is required'
    }),
    
  definition: Joi.string().max(2000).allow('').default('')
    .messages({
      'string.max': 'Category definition cannot exceed {{#limit}} characters'
    }),
    
  centrality: characteristicSchema.default(3)
    .messages({
      'number.base': 'Centrality must be a number',
      'number.integer': 'Centrality must be an integer',
      'number.min': 'Centrality must be at least {{#limit}}',
      'number.max': 'Centrality cannot exceed {{#limit}}'
    }),
    
  certainty: characteristicSchema.default(3)
    .messages({
      'number.base': 'Certainty must be a number',
      'number.integer': 'Certainty must be an integer',
      'number.min': 'Certainty must be at least {{#limit}}',
      'number.max': 'Certainty cannot exceed {{#limit}}'
    }),
    
  historical_significance: characteristicSchema.default(3)
    .messages({
      'number.base': 'Historical significance must be a number',
      'number.integer': 'Historical significance must be an integer',
      'number.min': 'Historical significance must be at least {{#limit}}',
      'number.max': 'Historical significance cannot exceed {{#limit}}'
    }),
    
  traditions: Joi.array().items(Joi.string().max(100)).default([])
    .messages({
      'array.base': 'Traditions must be an array'
    }),
    
  philosophers: Joi.array().items(Joi.string().max(100)).default([])
    .messages({
      'array.base': 'Philosophers must be an array'
    }),
    
  metadata: Joi.object().default({})
});

// Schema for updating a category
const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(255)
    .messages({
      'string.empty': 'Category name cannot be empty',
      'string.min': 'Category name must be at least {{#limit}} characters',
      'string.max': 'Category name cannot exceed {{#limit}} characters'
    }),
    
  definition: Joi.string().max(2000).allow('')
    .messages({
      'string.max': 'Category definition cannot exceed {{#limit}} characters'
    }),
    
  centrality: characteristicSchema
    .messages({
      'number.base': 'Centrality must be a number',
      'number.integer': 'Centrality must be an integer',
      'number.min': 'Centrality must be at least {{#limit}}',
      'number.max': 'Centrality cannot exceed {{#limit}}'
    }),
    
  certainty: characteristicSchema
    .messages({
      'number.base': 'Certainty must be a number',
      'number.integer': 'Certainty must be an integer',
      'number.min': 'Certainty must be at least {{#limit}}',
      'number.max': 'Certainty cannot exceed {{#limit}}'
    }),
    
  historical_significance: characteristicSchema
    .messages({
      'number.base': 'Historical significance must be a number',
      'number.integer': 'Historical significance must be an integer',
      'number.min': 'Historical significance must be at least {{#limit}}',
      'number.max': 'Historical significance cannot exceed {{#limit}}'
    }),
    
  traditions: Joi.array().items(Joi.string().max(100))
    .messages({
      'array.base': 'Traditions must be an array'
    }),
    
  philosophers: Joi.array().items(Joi.string().max(100))
    .messages({
      'array.base': 'Philosophers must be an array'
    }),
    
  metadata: Joi.object()
}).min(1).messages({
  'object.min': 'At least one field must be provided'
});

// Get valid relationship types
const validRelationshipTypes = Object.values(RELATIONSHIP_TYPES);

// Get valid relationship directions
const validRelationshipDirections = Object.values(RELATIONSHIP_DIRECTIONS);

// Schema for creating a new relationship
const createRelationshipSchema = Joi.object({
  source_id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Source ID must be a valid UUID',
      'any.required': 'Source ID is required'
    }),
    
  target_id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Target ID must be a valid UUID',
      'any.required': 'Target ID is required'
    }),
    
  type: Joi.string().valid(...validRelationshipTypes).required()
    .messages({
      'any.only': `Relationship type must be one of: ${validRelationshipTypes.join(', ')}`,
      'any.required': 'Relationship type is required'
    }),
    
  direction: Joi.string().valid(...validRelationshipDirections).default(RELATIONSHIP_DIRECTIONS.UNIDIRECTIONAL)
    .messages({
      'any.only': `Direction must be one of: ${validRelationshipDirections.join(', ')}`
    }),
    
  strength: characteristicSchema.default(3)
    .messages({
      'number.base': 'Strength must be a number',
      'number.integer': 'Strength must be an integer',
      'number.min': 'Strength must be at least {{#limit}}',
      'number.max': 'Strength cannot exceed {{#limit}}'
    }),
    
  certainty: characteristicSchema.default(3)
    .messages({
      'number.base': 'Certainty must be a number',
      'number.integer': 'Certainty must be an integer',
      'number.min': 'Certainty must be at least {{#limit}}',
      'number.max': 'Certainty cannot exceed {{#limit}}'
    }),
    
  description: Joi.string().max(2000).allow('').default('')
    .messages({
      'string.max': 'Description cannot exceed {{#limit}} characters'
    }),
    
  traditions: Joi.array().items(Joi.string().max(100)).default([])
    .messages({
      'array.base': 'Traditions must be an array'
    }),
    
  philosophers: Joi.array().items(Joi.string().max(100)).default([])
    .messages({
      'array.base': 'Philosophers must be an array'
    }),
    
  metadata: Joi.object().default({})
});

// Schema for updating a relationship
const updateRelationshipSchema = Joi.object({
  type: Joi.string().valid(...validRelationshipTypes)
    .messages({
      'any.only': `Relationship type must be one of: ${validRelationshipTypes.join(', ')}`
    }),
    
  direction: Joi.string().valid(...validRelationshipDirections)
    .messages({
      'any.only': `Direction must be one of: ${validRelationshipDirections.join(', ')}`
    }),
    
  strength: characteristicSchema
    .messages({
      'number.base': 'Strength must be a number',
      'number.integer': 'Strength must be an integer',
      'number.min': 'Strength must be at least {{#limit}}',
      'number.max': 'Strength cannot exceed {{#limit}}'
    }),
    
  certainty: characteristicSchema
    .messages({
      'number.base': 'Certainty must be a number',
      'number.integer': 'Certainty must be an integer',
      'number.min': 'Certainty must be at least {{#limit}}',
      'number.max': 'Certainty cannot exceed {{#limit}}'
    }),
    
  description: Joi.string().max(2000).allow('')
    .messages({
      'string.max': 'Description cannot exceed {{#limit}} characters'
    }),
    
  traditions: Joi.array().items(Joi.string().max(100))
    .messages({
      'array.base': 'Traditions must be an array'
    }),
    
  philosophers: Joi.array().items(Joi.string().max(100))
    .messages({
      'array.base': 'Philosophers must be an array'
    }),
    
  metadata: Joi.object()
}).min(1).messages({
  'object.min': 'At least one field must be provided'
});

// Schema for updating graph status
const updateGraphStatusSchema = Joi.object({
  status: Joi.string().valid(
    GRAPH_DRAFT,
    GRAPH_VALIDATED,
    GRAPH_ENRICHED,
    GRAPH_PUBLISHED
  ).required()
    .messages({
      'any.only': 'Status must be one of: draft, validated, enriched, published',
      'any.required': 'Status is required'
    })
});

// Schema for graph validation request
const graphValidationSchema = Joi.object({
  checkCircularReferences: Joi.boolean().default(true),
  checkOrphanedCategories: Joi.boolean().default(true),
  checkCategoryNames: Joi.boolean().default(true),
  checkRelationshipTypes: Joi.boolean().default(true),
  suggestionLevel: Joi.string().valid('none', 'basic', 'detailed').default('basic')
    .messages({
      'any.only': 'Suggestion level must be one of: none, basic, detailed'
    })
});

// Schema for graph enrichment request
const graphEnrichmentSchema = Joi.object({
  enrichCategories: Joi.boolean().default(true),
  enrichRelationships: Joi.boolean().default(true),
  suggestNewCategories: Joi.boolean().default(false),
  suggestNewRelationships: Joi.boolean().default(false),
  detailLevel: Joi.string().valid('basic', 'detailed', 'comprehensive').default('detailed')
    .messages({
      'any.only': 'Detail level must be one of: basic, detailed, comprehensive'
    }),
  focus: Joi.array().items(Joi.string().max(100)).default([])
    .messages({
      'array.base': 'Focus must be an array'
    }),
  traditions: Joi.array().items(Joi.string().max(100)).default([])
    .messages({
      'array.base': 'Traditions must be an array'
    }),
  philosophers: Joi.array().items(Joi.string().max(100)).default([])
    .messages({
      'array.base': 'Philosophers must be an array'
    })
});

// Schema for generating a graph from theses
const graphFromThesesSchema = Joi.object({
  thesis_ids: Joi.array().items(Joi.string().uuid()).min(1).required()
    .messages({
      'array.min': 'At least one thesis ID is required',
      'array.base': 'Thesis IDs must be an array',
      'any.required': 'Thesis IDs are required'
    }),
  extractionLevel: Joi.string().valid('basic', 'detailed', 'comprehensive').default('detailed')
    .messages({
      'any.only': 'Extraction level must be one of: basic, detailed, comprehensive'
    }),
  createMissingCategories: Joi.boolean().default(true),
  mergeSimilarCategories: Joi.boolean().default(true),
  similarityThreshold: Joi.number().min(0).max(1).default(0.7)
    .messages({
      'number.base': 'Similarity threshold must be a number',
      'number.min': 'Similarity threshold must be at least {{#limit}}',
      'number.max': 'Similarity threshold cannot exceed {{#limit}}'
    })
});

// Schema for category characteristics metadata
const categoryCharacteristicsMetadataSchema = Joi.object({
  field: Joi.string().valid('centrality', 'certainty', 'historical_significance').required()
    .messages({
      'any.only': 'Field must be one of: centrality, certainty, historical_significance',
      'any.required': 'Field is required'
    }),
  value: characteristicSchema.required()
    .messages({
      'number.base': 'Value must be a number',
      'number.integer': 'Value must be an integer',
      'number.min': 'Value must be at least {{#limit}}',
      'number.max': 'Value cannot exceed {{#limit}}',
      'any.required': 'Value is required'
    })
});

// Schema for relationship characteristics metadata
const relationshipCharacteristicsMetadataSchema = Joi.object({
  field: Joi.string().valid('strength', 'certainty').required()
    .messages({
      'any.only': 'Field must be one of: strength, certainty',
      'any.required': 'Field is required'
    }),
  value: characteristicSchema.required()
    .messages({
      'number.base': 'Value must be a number',
      'number.integer': 'Value must be an integer',
      'number.min': 'Value must be at least {{#limit}}',
      'number.max': 'Value cannot exceed {{#limit}}',
      'any.required': 'Value is required'
    })
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  createRelationshipSchema,
  updateRelationshipSchema,
  updateGraphStatusSchema,
  graphValidationSchema,
  graphEnrichmentSchema,
  graphFromThesesSchema,
  categoryCharacteristicsMetadataSchema,
  relationshipCharacteristicsMetadataSchema
};
