/**
 * Validation schemas for concepts
 */

const Joi = require('joi');
const { CONCEPT_DRAFT, CONCEPT_PUBLISHED, CONCEPT_ARCHIVED, CONCEPT_DELETED } = require('../../../constants/statuses');

// Schema for creating a new concept
const createConceptSchema = Joi.object({
  name: Joi.string().min(1).max(255).required()
    .messages({
      'string.empty': 'Concept name is required',
      'string.min': 'Concept name must be at least {{#limit}} characters',
      'string.max': 'Concept name cannot exceed {{#limit}} characters',
      'any.required': 'Concept name is required'
    }),
    
  description: Joi.string().max(2000).allow('').default('')
    .messages({
      'string.max': 'Concept description cannot exceed {{#limit}} characters'
    }),
    
  is_synthesis: Joi.boolean().default(false),
  
  parent_concepts: Joi.when('is_synthesis', {
    is: true,
    then: Joi.array().items(Joi.string().uuid()).min(1).required()
      .messages({
        'array.min': 'At least one parent concept is required for synthesis',
        'array.base': 'Parent concepts must be an array',
        'any.required': 'Parent concepts are required for synthesis'
      }),
    otherwise: Joi.array().items(Joi.string().uuid()).default([])
  }),
  
  synthesis_method: Joi.when('is_synthesis', {
    is: true,
    then: Joi.string().max(100).allow(null).default(null),
    otherwise: Joi.any().strip()
  }),
  
  focus: Joi.string().max(100).allow(null).default(null)
    .messages({
      'string.max': 'Focus cannot exceed {{#limit}} characters'
    }),
    
  innovation_degree: Joi.number().integer().min(0).max(100).default(0)
    .messages({
      'number.base': 'Innovation degree must be a number',
      'number.integer': 'Innovation degree must be an integer',
      'number.min': 'Innovation degree must be at least {{#limit}}',
      'number.max': 'Innovation degree cannot exceed {{#limit}}'
    }),
    
  metadata: Joi.object().default({})
});

// Schema for updating an existing concept
const updateConceptSchema = Joi.object({
  name: Joi.string().min(1).max(255)
    .messages({
      'string.empty': 'Concept name cannot be empty',
      'string.min': 'Concept name must be at least {{#limit}} characters',
      'string.max': 'Concept name cannot exceed {{#limit}} characters'
    }),
    
  description: Joi.string().max(2000).allow('')
    .messages({
      'string.max': 'Concept description cannot exceed {{#limit}} characters'
    }),
    
  status: Joi.string().valid(
    CONCEPT_DRAFT, 
    CONCEPT_PUBLISHED, 
    CONCEPT_ARCHIVED, 
    CONCEPT_DELETED
  ).messages({
    'any.only': 'Status must be one of: draft, published, archived, deleted'
  }),
  
  focus: Joi.string().max(100).allow(null)
    .messages({
      'string.max': 'Focus cannot exceed {{#limit}} characters'
    }),
    
  innovation_degree: Joi.number().integer().min(0).max(100)
    .messages({
      'number.base': 'Innovation degree must be a number',
      'number.integer': 'Innovation degree must be an integer',
      'number.min': 'Innovation degree must be at least {{#limit}}',
      'number.max': 'Innovation degree cannot exceed {{#limit}}'
    }),
    
  metadata: Joi.object()
}).min(1).messages({
  'object.min': 'At least one field must be provided'
});

// Schema for retrieving concepts with filters
const getConceptsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least {{#limit}}'
    }),
    
  pageSize: Joi.number().integer().min(1).max(100).default(20)
    .messages({
      'number.base': 'Page size must be a number',
      'number.integer': 'Page size must be an integer',
      'number.min': 'Page size must be at least {{#limit}}',
      'number.max': 'Page size cannot exceed {{#limit}}'
    }),
    
  sortBy: Joi.string().valid(
    'name', 
    'creation_date', 
    'last_modified', 
    'innovation_degree'
  ).default('creation_date')
    .messages({
      'any.only': 'Sort field must be one of: name, creation_date, last_modified, innovation_degree'
    }),
    
  sortDirection: Joi.string().valid('asc', 'desc').default('desc')
    .messages({
      'any.only': 'Sort direction must be either asc or desc'
    }),
    
  status: Joi.string().valid(
    CONCEPT_DRAFT, 
    CONCEPT_PUBLISHED, 
    CONCEPT_ARCHIVED, 
    CONCEPT_DELETED
  ).messages({
    'any.only': 'Status must be one of: draft, published, archived, deleted'
  }),
  
  creatorId: Joi.string().uuid()
    .messages({
      'string.guid': 'Creator ID must be a valid UUID'
    }),
    
  isSynthesis: Joi.boolean(),
  
  search: Joi.string().max(100)
    .messages({
      'string.max': 'Search term cannot exceed {{#limit}} characters'
    }),
    
  hasGraph: Joi.boolean(),
  
  hasTheses: Joi.boolean()
});

// Schema for creating a concept name
const createConceptNameSchema = Joi.object({
  name: Joi.string().min(1).max(255).required()
    .messages({
      'string.empty': 'Concept name is required',
      'string.min': 'Concept name must be at least {{#limit}} characters',
      'string.max': 'Concept name cannot exceed {{#limit}} characters',
      'any.required': 'Concept name is required'
    }),
    
  analysis: Joi.string().max(2000).allow('').default('')
    .messages({
      'string.max': 'Name analysis cannot exceed {{#limit}} characters'
    }),
    
  alternative_names: Joi.array().items(Joi.string().max(255)).default([])
    .messages({
      'array.base': 'Alternative names must be an array',
      'string.max': 'Alternative name cannot exceed {{#limit}} characters'
    })
});

// Schema for updating a concept name
const updateConceptNameSchema = Joi.object({
  name: Joi.string().min(1).max(255)
    .messages({
      'string.empty': 'Concept name cannot be empty',
      'string.min': 'Concept name must be at least {{#limit}} characters',
      'string.max': 'Concept name cannot exceed {{#limit}} characters'
    }),
    
  analysis: Joi.string().max(2000).allow('')
    .messages({
      'string.max': 'Name analysis cannot exceed {{#limit}} characters'
    }),
    
  alternative_names: Joi.array().items(Joi.string().max(255))
    .messages({
      'array.base': 'Alternative names must be an array',
      'string.max': 'Alternative name cannot exceed {{#limit}} characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided'
});

// Schema for concept origin
const conceptOriginSchema = Joi.object({
  parent_concepts: Joi.array().items(Joi.string().uuid()).min(1).required()
    .messages({
      'array.min': 'At least one parent concept is required',
      'array.base': 'Parent concepts must be an array',
      'any.required': 'Parent concepts are required'
    }),
    
  influence_weights: Joi.array().items(
    Joi.number().min(0).max(1)
  ).length(Joi.ref('parent_concepts.length'))
    .messages({
      'array.length': 'Influence weights must match the number of parent concepts',
      'number.min': 'Influence weight must be at least {{#limit}}',
      'number.max': 'Influence weight cannot exceed {{#limit}}'
    }),
    
  analysis: Joi.string().max(2000).allow('').default('')
    .messages({
      'string.max': 'Origin analysis cannot exceed {{#limit}} characters'
    })
});

// Schema for concept evolution
const conceptEvolutionSchema = Joi.object({
  evolution_context: Joi.string().max(2000).required()
    .messages({
      'string.empty': 'Evolution context is required',
      'string.max': 'Evolution context cannot exceed {{#limit}} characters',
      'any.required': 'Evolution context is required'
    }),
    
  suggested_changes: Joi.object({
    new_categories: Joi.array().items(
      Joi.object({
        name: Joi.string().min(1).max(255).required(),
        definition: Joi.string().max(1000).allow('').default(''),
        rationale: Joi.string().max(1000).allow('').default('')
      })
    ).default([]),
    
    modified_categories: Joi.array().items(
      Joi.object({
        category_id: Joi.string().uuid().required(),
        name: Joi.string().min(1).max(255),
        definition: Joi.string().max(1000).allow(''),
        rationale: Joi.string().max(1000).allow('').default('')
      })
    ).default([]),
    
    new_relationships: Joi.array().items(
      Joi.object({
        source_id: Joi.string().uuid().required(),
        target_id: Joi.string().uuid().required(),
        type: Joi.string().max(100).required(),
        description: Joi.string().max(1000).allow('').default(''),
        rationale: Joi.string().max(1000).allow('').default('')
      })
    ).default([]),
    
    modified_relationships: Joi.array().items(
      Joi.object({
        relationship_id: Joi.string().uuid().required(),
        type: Joi.string().max(100),
        description: Joi.string().max(1000).allow(''),
        rationale: Joi.string().max(1000).allow('').default('')
      })
    ).default([]),
    
    removed_categories: Joi.array().items(
      Joi.object({
        category_id: Joi.string().uuid().required(),
        rationale: Joi.string().max(1000).allow('').default('')
      })
    ).default([]),
    
    removed_relationships: Joi.array().items(
      Joi.object({
        relationship_id: Joi.string().uuid().required(),
        rationale: Joi.string().max(1000).allow('').default('')
      })
    ).default([])
  }).required()
});

module.exports = {
  createConceptSchema,
  updateConceptSchema,
  getConceptsSchema,
  createConceptNameSchema,
  updateConceptNameSchema,
  conceptOriginSchema,
  conceptEvolutionSchema
};
