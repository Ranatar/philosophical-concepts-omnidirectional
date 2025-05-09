/**
 * Validation schemas for theses
 */

const Joi = require('joi');
const { 
  THESIS_DRAFT,
  THESIS_GENERATED,
  THESIS_EDITED,
  THESIS_ELABORATED,
  THESIS_PUBLISHED
} = require('../../../constants/statuses');
const {
  THESIS_TYPES,
  THESIS_STYLES
} = require('../../../constants/philosophyConstants');

// Get valid thesis types
const validThesisTypes = Object.values(THESIS_TYPES);

// Get valid thesis styles
const validThesisStyles = Object.values(THESIS_STYLES);

// Schema for creating a thesis manually
const createThesisSchema = Joi.object({
  type: Joi.string().valid(...validThesisTypes).required()
    .messages({
      'any.only': `Thesis type must be one of: ${validThesisTypes.join(', ')}`,
      'any.required': 'Thesis type is required'
    }),
    
  content: Joi.string().min(1).max(5000).required()
    .messages({
      'string.empty': 'Thesis content is required',
      'string.min': 'Thesis content must be at least {{#limit}} characters',
      'string.max': 'Thesis content cannot exceed {{#limit}} characters',
      'any.required': 'Thesis content is required'
    }),
    
  style: Joi.string().valid(...validThesisStyles).default(THESIS_STYLES.ACADEMIC)
    .messages({
      'any.only': `Thesis style must be one of: ${validThesisStyles.join(', ')}`
    }),
    
  related_categories: Joi.array().items(Joi.string().uuid()).default([])
    .messages({
      'array.base': 'Related categories must be an array'
    }),
    
  parent_theses: Joi.array().items(Joi.string().uuid()).default([])
    .messages({
      'array.base': 'Parent theses must be an array'
    }),
    
  metadata: Joi.object().default({})
});

// Schema for updating a thesis
const updateThesisSchema = Joi.object({
  type: Joi.string().valid(...validThesisTypes)
    .messages({
      'any.only': `Thesis type must be one of: ${validThesisTypes.join(', ')}`
    }),
    
  content: Joi.string().min(1).max(5000)
    .messages({
      'string.empty': 'Thesis content cannot be empty',
      'string.min': 'Thesis content must be at least {{#limit}} characters',
      'string.max': 'Thesis content cannot exceed {{#limit}} characters'
    }),
    
  style: Joi.string().valid(...validThesisStyles)
    .messages({
      'any.only': `Thesis style must be one of: ${validThesisStyles.join(', ')}`
    }),
    
  status: Joi.string().valid(
    THESIS_DRAFT,
    THESIS_GENERATED,
    THESIS_EDITED,
    THESIS_ELABORATED,
    THESIS_PUBLISHED
  ).messages({
    'any.only': 'Status must be one of: draft, generated, edited, elaborated, published'
  }),
  
  related_categories: Joi.array().items(Joi.string().uuid())
    .messages({
      'array.base': 'Related categories must be an array'
    }),
    
  parent_theses: Joi.array().items(Joi.string().uuid())
    .messages({
      'array.base': 'Parent theses must be an array'
    }),
    
  metadata: Joi.object()
}).min(1).messages({
  'object.min': 'At least one field must be provided'
});

// Schema for generating theses
const generateThesesSchema = Joi.object({
  types: Joi.alternatives()
    .try(
      Joi.string().valid(...validThesisTypes),
      Joi.array().items(Joi.string().valid(...validThesisTypes))
    ).required()
    .messages({
      'any.only': `Thesis types must be one of: ${validThesisTypes.join(', ')}`,
      'any.required': 'Thesis types are required'
    }),
    
  count: Joi.number().integer().min(1).max(20).default(5)
    .messages({
      'number.base': 'Count must be a number',
      'number.integer': 'Count must be an integer',
      'number.min': 'Count must be at least {{#limit}}',
      'number.max': 'Count cannot exceed {{#limit}}'
    }),
    
  style: Joi.string().valid(...validThesisStyles).default(THESIS_STYLES.ACADEMIC)
    .messages({
      'any.only': `Thesis style must be one of: ${validThesisStyles.join(', ')}`
    }),
    
  category_ids: Joi.array().items(Joi.string().uuid())
    .messages({
      'array.base': 'Category IDs must be an array'
    }),
    
  use_graph: Joi.boolean().default(true),
  
  use_existing_theses: Joi.boolean().default(false),
  
  focus_on_central_categories: Joi.boolean().default(true),
  
  detail_level: Joi.string().valid('basic', 'moderate', 'detailed').default('moderate')
    .messages({
      'any.only': 'Detail level must be one of: basic, moderate, detailed'
    }),
    
  creativity_level: Joi.string().valid('low', 'moderate', 'high').default('moderate')
    .messages({
      'any.only': 'Creativity level must be one of: low, moderate, high'
    }),
    
  focus: Joi.string().max(255).allow('').default('')
    .messages({
      'string.max': 'Focus cannot exceed {{#limit}} characters'
    })
});

// Schema for generating theses with characteristics
const generateThesesWithCharacteristicsSchema = Joi.object({
  types: Joi.alternatives()
    .try(
      Joi.string().valid(...validThesisTypes),
      Joi.array().items(Joi.string().valid(...validThesisTypes))
    ).required()
    .messages({
      'any.only': `Thesis types must be one of: ${validThesisTypes.join(', ')}`,
      'any.required': 'Thesis types are required'
    }),
    
  count: Joi.number().integer().min(1).max(20).default(5)
    .messages({
      'number.base': 'Count must be a number',
      'number.integer': 'Count must be an integer',
      'number.min': 'Count must be at least {{#limit}}',
      'number.max': 'Count cannot exceed {{#limit}}'
    }),
    
  style: Joi.string().valid(...validThesisStyles).default(THESIS_STYLES.ACADEMIC)
    .messages({
      'any.only': `Thesis style must be one of: ${validThesisStyles.join(', ')}`
    }),
    
  category_ids: Joi.array().items(Joi.string().uuid())
    .messages({
      'array.base': 'Category IDs must be an array'
    }),
    
  use_existing_theses: Joi.boolean().default(false),
  
  characteristic_weights: Joi.object({
    centrality: Joi.number().min(0).max(1).default(0.7)
      .messages({
        'number.base': 'Centrality weight must be a number',
        'number.min': 'Centrality weight must be at least {{#limit}}',
        'number.max': 'Centrality weight cannot exceed {{#limit}}'
      }),
      
    certainty: Joi.number().min(0).max(1).default(0.5)
      .messages({
        'number.base': 'Certainty weight must be a number',
        'number.min': 'Certainty weight must be at least {{#limit}}',
        'number.max': 'Certainty weight cannot exceed {{#limit}}'
      }),
      
    historical_significance: Joi.number().min(0).max(1).default(0.3)
      .messages({
        'number.base': 'Historical significance weight must be a number',
        'number.min': 'Historical significance weight must be at least {{#limit}}',
        'number.max': 'Historical significance weight cannot exceed {{#limit}}'
      }),
      
    relationship_strength: Joi.number().min(0).max(1).default(0.5)
      .messages({
        'number.base': 'Relationship strength weight must be a number',
        'number.min': 'Relationship strength weight must be at least {{#limit}}',
        'number.max': 'Relationship strength weight cannot exceed {{#limit}}'
      })
  }).default({
    centrality: 0.7,
    certainty: 0.5,
    historical_significance: 0.3,
    relationship_strength: 0.5
  }),
  
  detail_level: Joi.string().valid('basic', 'moderate', 'detailed').default('moderate')
    .messages({
      'any.only': 'Detail level must be one of: basic, moderate, detailed'
    }),
    
  creativity_level: Joi.string().valid('low', 'moderate', 'high').default('moderate')
    .messages({
      'any.only': 'Creativity level must be one of: low, moderate, high'
    }),
    
  focus: Joi.string().max(255).allow('').default('')
    .messages({
      'string.max': 'Focus cannot exceed {{#limit}} characters'
    })
});

// Schema for thesis elaboration
const elaborateThesisSchema = Joi.object({
  elaboration_type: Joi.string().valid(
    'explanation',
    'justification',
    'critique',
    'examples',
    'counterarguments',
    'implications',
    'historical_context',
    'comprehensive'
  ).default('explanation')
    .messages({
      'any.only': 'Elaboration type must be one of: explanation, justification, critique, examples, counterarguments, implications, historical_context, comprehensive'
    }),
    
  detail_level: Joi.string().valid('basic', 'moderate', 'detailed').default('moderate')
    .messages({
      'any.only': 'Detail level must be one of: basic, moderate, detailed'
    }),
    
  focus: Joi.string().max(255).allow('').default('')
    .messages({
      'string.max': 'Focus cannot exceed {{#limit}} characters'
    }),
    
  style: Joi.string().valid(...validThesisStyles)
    .messages({
      'any.only': `Style must be one of: ${validThesisStyles.join(', ')}`
    })
});

// Schema for comparing theses
const compareThesesSchema = Joi.object({
  thesis_ids: Joi.array().items(Joi.string().uuid()).min(2).required()
    .messages({
      'array.min': 'At least two thesis IDs are required',
      'array.base': 'Thesis IDs must be an array',
      'any.required': 'Thesis IDs are required'
    }),
    
  comparison_type: Joi.string().valid(
    'compatibility',
    'difference',
    'contradiction',
    'complementarity',
    'comprehensive'
  ).default('comprehensive')
    .messages({
      'any.only': 'Comparison type must be one of: compatibility, difference, contradiction, complementarity, comprehensive'
    }),
    
  detail_level: Joi.string().valid('basic', 'moderate', 'detailed').default('moderate')
    .messages({
      'any.only': 'Detail level must be one of: basic, moderate, detailed'
    }),
    
  consider_categories: Joi.boolean().default(true),
  
  focus: Joi.string().max(255).allow('').default('')
    .messages({
      'string.max': 'Focus cannot exceed {{#limit}} characters'
    })
});

// Schema for analyzing thesis origin
const analyzeThesisOriginSchema = Joi.object({
  thesis_ids: Joi.array().items(Joi.string().uuid()).min(1).required()
    .messages({
      'array.min': 'At least one thesis ID is required',
      'array.base': 'Thesis IDs must be an array',
      'any.required': 'Thesis IDs are required'
    }),
    
  analysis_level: Joi.string().valid('basic', 'moderate', 'detailed').default('moderate')
    .messages({
      'any.only': 'Analysis level must be one of: basic, moderate, detailed'
    }),
    
  traditions_to_consider: Joi.array().items(Joi.string().max(100)).default([])
    .messages({
      'array.base': 'Traditions to consider must be an array'
    }),
    
  philosophers_to_consider: Joi.array().items(Joi.string().max(100)).default([])
    .messages({
      'array.base': 'Philosophers to consider must be an array'
    }),
    
  consider_graph_if_available: Joi.boolean().default(true)
});

// Schema for comparing theses with characteristics
const compareThesesWithCharacteristicsSchema = Joi.object({
  thesis_ids: Joi.array().items(Joi.string().uuid()).min(2).required()
    .messages({
      'array.min': 'At least two thesis IDs are required',
      'array.base': 'Thesis IDs must be an array',
      'any.required': 'Thesis IDs are required'
    }),
    
  characteristic_weights: Joi.object({
    centrality: Joi.number().min(0).max(1).default(0.7)
      .messages({
        'number.base': 'Centrality weight must be a number',
        'number.min': 'Centrality weight must be at least {{#limit}}',
        'number.max': 'Centrality weight cannot exceed {{#limit}}'
      }),
      
    certainty: Joi.number().min(0).max(1).default(0.5)
      .messages({
        'number.base': 'Certainty weight must be a number',
        'number.min': 'Certainty weight must be at least {{#limit}}',
        'number.max': 'Certainty weight cannot exceed {{#limit}}'
      }),
      
    historical_significance: Joi.number().min(0).max(1).default(0.3)
      .messages({
        'number.base': 'Historical significance weight must be a number',
        'number.min': 'Historical significance weight must be at least {{#limit}}',
        'number.max': 'Historical significance weight cannot exceed {{#limit}}'
      })
  }).default({
    centrality: 0.7,
    certainty: 0.5,
    historical_significance: 0.3
  }),
  
  comparison_type: Joi.string().valid(
    'compatibility',
    'difference',
    'contradiction',
    'complementarity',
    'comprehensive'
  ).default('comprehensive')
    .messages({
      'any.only': 'Comparison type must be one of: compatibility, difference, contradiction, complementarity, comprehensive'
    }),
    
  detail_level: Joi.string().valid('basic', 'moderate', 'detailed').default('moderate')
    .messages({
      'any.only': 'Detail level must be one of: basic, moderate, detailed'
    }),
    
  focus: Joi.string().max(255).allow('').default('')
    .messages({
      'string.max': 'Focus cannot exceed {{#limit}} characters'
    })
});

// Schema for creating a thesis elaboration
const createThesisElaborationSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required()
    .messages({
      'string.empty': 'Elaboration content is required',
      'string.min': 'Elaboration content must be at least {{#limit}} characters',
      'string.max': 'Elaboration content cannot exceed {{#limit}} characters',
      'any.required': 'Elaboration content is required'
    }),
    
  type: Joi.string().valid(
    'explanation',
    'justification',
    'critique',
    'examples',
    'counterarguments',
    'implications',
    'historical_context',
    'comprehensive'
  ).default('explanation')
    .messages({
      'any.only': 'Elaboration type must be one of: explanation, justification, critique, examples, counterarguments, implications, historical_context, comprehensive'
    }),
    
  claude_generation_id: Joi.string().uuid().allow(null).default(null),
  
  metadata: Joi.object().default({})
});

// Schema for updating a thesis elaboration
const updateThesisElaborationSchema = Joi.object({
  content: Joi.string().min(1).max(5000)
    .messages({
      'string.empty': 'Elaboration content cannot be empty',
      'string.min': 'Elaboration content must be at least {{#limit}} characters',
      'string.max': 'Elaboration content cannot exceed {{#limit}} characters'
    }),
    
  type: Joi.string().valid(
    'explanation',
    'justification',
    'critique',
    'examples',
    'counterarguments',
    'implications',
    'historical_context',
    'comprehensive'
  ).messages({
    'any.only': 'Elaboration type must be one of: explanation, justification, critique, examples, counterarguments, implications, historical_context, comprehensive'
  }),
  
  claude_generation_id: Joi.string().uuid().allow(null),
  
  metadata: Joi.object()
}).min(1).messages({
  'object.min': 'At least one field must be provided'
});

module.exports = {
  createThesisSchema,
  updateThesisSchema,
  generateThesesSchema,
  generateThesesWithCharacteristicsSchema,
  elaborateThesisSchema,
  compareThesesSchema,
  analyzeThesisOriginSchema,
  compareThesesWithCharacteristicsSchema,
  createThesisElaborationSchema,
  updateThesisElaborationSchema
};
