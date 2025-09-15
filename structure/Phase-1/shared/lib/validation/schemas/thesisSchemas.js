/**
 * Thesis Validation Schemas
 * Схемы валидации для тезисов и связанных операций
 */

const {
  stringValidators,
  numberValidators,
  arrayValidators,
  objectValidators,
  specializedValidators,
  philosophyValidators,
  createSchemaValidator
} = require('../validators');

/**
 * Схема для создания тезиса
 */
const createThesisSchema = {
  conceptId: {
    required: true,
    validators: [
      (value) => specializedValidators.isUUID(value, 'conceptId')
    ]
  },
  type: {
    required: true,
    validators: [
      (value) => philosophyValidators.isThesisType(value, 'type')
    ]
  },
  content: {
    required: true,
    validators: [
      (value) => stringValidators.isNonEmptyString(value, 'content'),
      (value) => stringValidators.hasLength(value, 10, 5000, 'content')
    ]
  },
  style: {
    required: false,
    validators: [
      (value) => philosophyValidators.isThesisStyle(value, 'style')
    ]
  },
  relatedCategories: {
    required: false,
    validators: [
      (value) => arrayValidators.isArray(value, 'relatedCategories'),
      (value) => arrayValidators.hasArrayLength(value, 0, 20, 'relatedCategories'),
      (value) => {
        value.forEach((categoryId, index) => {
          specializedValidators.isUUID(categoryId, `relatedCategories[${index}]`);
        });
      }
    ]
  },
  language: {
    required: false,
    validators: [
      (value) => specializedValidators.isLanguageCode(value, 'language')
    ]
  },
  tags: {
    required: false,
    validators: [
      (value) => arrayValidators.isArray(value, 'tags'),
      (value) => arrayValidators.hasArrayLength(value, 0, 15, 'tags'),
      (value) => {
        value.forEach((tag, index) => {
          stringValidators.isNonEmptyString(tag, `tags[${index}]`);
          stringValidators.hasLength(tag, 1, 50, `tags[${index}]`);
        });
      }
    ]
  }
};

/**
 * Схема для обновления тезиса
 */
const updateThesisSchema = {
  content: {
    required: false,
    validators: createThesisSchema.content.validators
  },
  type: {
    required: false,
    validators: createThesisSchema.type.validators
  },
  style: {
    required: false,
    validators: createThesisSchema.style.validators
  },
  relatedCategories: {
    required: false,
    validators: createThesisSchema.relatedCategories.validators
  },
  status: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['draft', 'reviewed', 'published'],
        'status'
      )
    ]
  }
};

/**
 * Схема для генерации тезисов
 */
const generateThesesSchema = {
  conceptId: {
    required: true,
    validators: [
      (value) => specializedValidators.isUUID(value, 'conceptId')
    ]
  },
  types: {
    required: false,
    validators: [
      (value) => arrayValidators.isArray(value, 'types'),
      (value) => arrayValidators.hasArrayLength(value, 1, 10, 'types'),
      (value) => {
        value.forEach((type, index) => {
          philosophyValidators.isThesisType(type, `types[${index}]`);
        });
      }
    ]
  },
  count: {
    required: false,
    validators: [
      (value) => numberValidators.isInteger(value, 'count'),
      (value) => numberValidators.isInRange(value, 1, 20, 'count')
    ]
  },
  style: {
    required: false,
    validators: [
      (value) => philosophyValidators.isThesisStyle(value, 'style')
    ]
  },
  language: {
    required: false,
    validators: [
      (value) => specializedValidators.isLanguageCode(value, 'language')
    ]
  },
  considerCharacteristics: {
    required: false,
    validators: [
      (value) => {
        if (typeof value !== 'boolean') {
          throw new Error('considerCharacteristics must be a boolean');
        }
      }
    ]
  },
  focusCategories: {
    required: false,
    validators: [
      (value) => arrayValidators.isArray(value, 'focusCategories'),
      (value) => arrayValidators.hasArrayLength(value, 0, 10, 'focusCategories'),
      (value) => {
        value.forEach((categoryId, index) => {
          specializedValidators.isUUID(categoryId, `focusCategories[${index}]`);
        });
      }
    ]
  },
  parameters: {
    required: false,
    validators: [
      (value) => objectValidators.isObject(value, 'parameters'),
      (value) => {
        if ('creativity' in value) {
          numberValidators.isPercentage(value.creativity, 'parameters.creativity');
        }
        if ('academicLevel' in value) {
          numberValidators.isInRange(value.academicLevel, 1, 5, 'parameters.academicLevel');
        }
      }
    ]
  }
};

/**
 * Схема для добавления обоснования к тезису
 */
const addJustificationSchema = {
  justification: {
    required: true,
    validators: [
      (value) => stringValidators.isNonEmptyString(value, 'justification'),
      (value) => stringValidators.hasLength(value, 20, 3000, 'justification')
    ]
  },
  sources: {
    required: false,
    validators: [
      (value) => arrayValidators.isArray(value, 'sources'),
      (value) => arrayValidators.hasArrayLength(value, 0, 10, 'sources'),
      (value) => {
        value.forEach((source, index) => {
          objectValidators.hasRequiredFields(
            source,
            ['type', 'reference'],
            `sources[${index}]`
          );
          stringValidators.isOneOf(
            source.type,
            ['philosophical', 'empirical', 'logical', 'historical'],
            `sources[${index}].type`
          );
        });
      }
    ]
  }
};

/**
 * Схема для добавления контраргумента
 */
const addCounterargumentSchema = {
  content: {
    required: true,
    validators: [
      (value) => stringValidators.isNonEmptyString(value, 'content'),
      (value) => stringValidators.hasLength(value, 10, 2000, 'content')
    ]
  },
  strength: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'strength')
    ]
  }
};

/**
 * Схема для добавления подтверждающего доказательства
 */
const addSupportingEvidenceSchema = {
  content: {
    required: true,
    validators: [
      (value) => stringValidators.isNonEmptyString(value, 'content'),
      (value) => stringValidators.hasLength(value, 10, 2000, 'content')
    ]
  },
  type: {
    required: true,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['empirical', 'logical', 'historical', 'theoretical', 'experiential'],
        'type'
      )
    ]
  },
  source: {
    required: false,
    validators: [
      (value) => stringValidators.hasLength(value, 0, 500, 'source')
    ]
  },
  reliability: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'reliability')
    ]
  }
};

/**
 * Схема для оценки тезиса
 */
const scoreThesisSchema = {
  clarity: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'clarity')
    ]
  },
  originality: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'originality')
    ]
  },
  validity: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'validity')
    ]
  },
  relevance: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'relevance')
    ]
  }
};

/**
 * Схема для сравнения тезисов
 */
const compareThesesSchema = {
  thesisIds: {
    required: true,
    validators: [
      (value) => arrayValidators.isNonEmptyArray(value, 'thesisIds'),
      (value) => arrayValidators.hasArrayLength(value, 2, 10, 'thesisIds'),
      (value) => arrayValidators.hasUniqueElements(value, 'thesisIds'),
      (value) => {
        value.forEach((id, index) => {
          specializedValidators.isUUID(id, `thesisIds[${index}]`);
        });
      }
    ]
  },
  comparisonType: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['similarity', 'contradiction', 'complementarity', 'development', 'full'],
        'comparisonType'
      )
    ]
  }
};

/**
 * Схема для синтеза тезисов
 */
const synthesizeThesesSchema = {
  parentThesisIds: {
    required: true,
    validators: [
      (value) => arrayValidators.isNonEmptyArray(value, 'parentThesisIds'),
      (value) => arrayValidators.hasArrayLength(value, 2, 10, 'parentThesisIds'),
      (value) => arrayValidators.hasUniqueElements(value, 'parentThesisIds'),
      (value) => {
        value.forEach((id, index) => {
          specializedValidators.isUUID(id, `parentThesisIds[${index}]`);
        });
      }
    ]
  },
  synthesisMethod: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['dialectical', 'integrative', 'critical', 'constructive'],
        'synthesisMethod'
      )
    ]
  },
  targetType: {
    required: false,
    validators: [
      (value) => philosophyValidators.isThesisType(value, 'targetType')
    ]
  }
};

/**
 * Схема для поиска тезисов
 */
const searchThesesSchema = {
  conceptId: {
    required: false,
    validators: [
      (value) => specializedValidators.isUUID(value, 'conceptId')
    ]
  },
  query: {
    required: false,
    validators: [
      (value) => stringValidators.hasLength(value, 1, 200, 'query')
    ]
  },
  types: {
    required: false,
    validators: [
      (value) => {
        if (Array.isArray(value)) {
          value.forEach((type, index) => {
            philosophyValidators.isThesisType(type, `types[${index}]`);
          });
        } else {
          philosophyValidators.isThesisType(value, 'types');
        }
      }
    ]
  },
  styles: {
    required: false,
    validators: [
      (value) => {
        if (Array.isArray(value)) {
          value.forEach((style, index) => {
            philosophyValidators.isThesisStyle(style, `styles[${index}]`);
          });
        } else {
          philosophyValidators.isThesisStyle(value, 'styles');
        }
      }
    ]
  },
  status: {
    required: false,
    validators: [
      (value) => {
        const validStatuses = ['draft', 'reviewed', 'published'];
        if (Array.isArray(value)) {
          value.forEach((status, index) => {
            stringValidators.isOneOf(status, validStatuses, `status[${index}]`);
          });
        } else {
          stringValidators.isOneOf(value, validStatuses, 'status');
        }
      }
    ]
  },
  hasJustification: {
    required: false,
    validators: [
      (value) => {
        if (typeof value !== 'boolean') {
          throw new Error('hasJustification must be a boolean');
        }
      }
    ]
  },
  minScore: {
    required: false,
    validators: [
      (value) => objectValidators.isObject(value, 'minScore'),
      (value) => {
        const scoreFields = ['clarity', 'originality', 'validity', 'relevance'];
        Object.keys(value).forEach(field => {
          if (!scoreFields.includes(field)) {
            throw new Error(`Invalid score field: ${field}`);
          }
          numberValidators.isPercentage(value[field], `minScore.${field}`);
        });
      }
    ]
  },
  relatedCategories: {
    required: false,
    validators: [
      (value) => arrayValidators.isArray(value, 'relatedCategories'),
      (value) => {
        value.forEach((categoryId, index) => {
          specializedValidators.isUUID(categoryId, `relatedCategories[${index}]`);
        });
      }
    ]
  },
  tags: {
    required: false,
    validators: [
      (value) => arrayValidators.isArray(value, 'tags'),
      (value) => arrayValidators.hasArrayLength(value, 0, 10, 'tags')
    ]
  },
  language: {
    required: false,
    validators: [
      (value) => specializedValidators.isLanguageCode(value, 'language')
    ]
  },
  createdAfter: {
    required: false,
    validators: [
      (value) => dateValidators.isValidDate(value, 'createdAfter')
    ]
  },
  createdBefore: {
    required: false,
    validators: [
      (value) => dateValidators.isValidDate(value, 'createdBefore')
    ]
  },
  sortBy: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['createdAt', 'updatedAt', 'viewCount', 'citationCount', 'overallScore'],
        'sortBy'
      )
    ]
  },
  sortOrder: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(value, ['asc', 'desc'], 'sortOrder')
    ]
  },
  page: {
    required: false,
    validators: [
      (value) => numberValidators.isInteger(value, 'page'),
      (value) => numberValidators.isPositive(value, 'page')
    ]
  },
  limit: {
    required: false,
    validators: [
      (value) => numberValidators.isInteger(value, 'limit'),
      (value) => numberValidators.isInRange(value, 1, 100, 'limit')
    ]
  }
};

/**
 * Схема для анализа происхождения тезисов
 */
const analyzeThesisOriginSchema = {
  thesisIds: {
    required: true,
    validators: [
      (value) => arrayValidators.isNonEmptyArray(value, 'thesisIds'),
      (value) => arrayValidators.hasArrayLength(value, 1, 20, 'thesisIds'),
      (value) => {
        value.forEach((id, index) => {
          specializedValidators.isUUID(id, `thesisIds[${index}]`);
        });
      }
    ]
  },
  analysisDepth: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['surface', 'moderate', 'deep'],
        'analysisDepth'
      )
    ]
  }
};

/**
 * Схема для массовых операций с тезисами
 */
const bulkThesisOperationSchema = {
  thesisIds: {
    required: true,
    validators: [
      (value) => arrayValidators.isNonEmptyArray(value, 'thesisIds'),
      (value) => arrayValidators.hasArrayLength(value, 1, 100, 'thesisIds'),
      (value) => arrayValidators.hasUniqueElements(value, 'thesisIds'),
      (value) => {
        value.forEach((id, index) => {
          specializedValidators.isUUID(id, `thesisIds[${index}]`);
        });
      }
    ]
  },
  operation: {
    required: true,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['publish', 'review', 'delete', 'addTag', 'removeTag', 'score'],
        'operation'
      )
    ]
  },
  params: {
    required: false,
    validators: [
      (value, field, data) => {
        if ((data.operation === 'addTag' || data.operation === 'removeTag') && !value?.tag) {
          throw new Error('tag is required for tag operations');
        }
        if (data.operation === 'score' && !value?.scores) {
          throw new Error('scores are required for score operation');
        }
      }
    ]
  }
};

/**
 * Создание валидаторов из схем
 */
const validateCreateThesis = createSchemaValidator(createThesisSchema);
const validateUpdateThesis = createSchemaValidator(updateThesisSchema);
const validateGenerateTheses = createSchemaValidator(generateThesesSchema);
const validateAddJustification = createSchemaValidator(addJustificationSchema);
const validateAddCounterargument = createSchemaValidator(addCounterargumentSchema);
const validateAddSupportingEvidence = createSchemaValidator(addSupportingEvidenceSchema);
const validateScoreThesis = createSchemaValidator(scoreThesisSchema);
const validateCompareTheses = createSchemaValidator(compareThesesSchema);
const validateSynthesizeTheses = createSchemaValidator(synthesizeThesesSchema);
const validateSearchTheses = createSchemaValidator(searchThesesSchema);
const validateAnalyzeThesisOrigin = createSchemaValidator(analyzeThesisOriginSchema);
const validateBulkThesisOperation = createSchemaValidator(bulkThesisOperationSchema);

module.exports = {
  // Схемы
  createThesisSchema,
  updateThesisSchema,
  generateThesesSchema,
  addJustificationSchema,
  addCounterargumentSchema,
  addSupportingEvidenceSchema,
  scoreThesisSchema,
  compareThesesSchema,
  synthesizeThesesSchema,
  searchThesesSchema,
  analyzeThesisOriginSchema,
  bulkThesisOperationSchema,
  
  // Валидаторы
  validateCreateThesis,
  validateUpdateThesis,
  validateGenerateTheses,
  validateAddJustification,
  validateAddCounterargument,
  validateAddSupportingEvidence,
  validateScoreThesis,
  validateCompareTheses,
  validateSynthesizeTheses,
  validateSearchTheses,
  validateAnalyzeThesisOrigin,
  validateBulkThesisOperation
};