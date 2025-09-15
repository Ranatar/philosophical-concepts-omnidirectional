/**
 * Concept Validation Schemas
 * Схемы валидации для концепций и связанных сущностей
 */

const {
  stringValidators,
  numberValidators,
  arrayValidators,
  specializedValidators,
  philosophyValidators,
  createSchemaValidator
} = require('../validators');

/**
 * Схема для создания концепции
 */
const createConceptSchema = {
  name: {
    required: true,
    validators: [
      (value) => stringValidators.isNonEmptyString(value, 'name'),
      (value) => stringValidators.hasLength(value, 1, 255, 'name')
    ]
  },
  description: {
    required: false,
    validators: [
      (value) => stringValidators.hasLength(value, 0, 5000, 'description')
    ]
  },
  focus: {
    required: false,
    validators: [
      (value) => stringValidators.hasLength(value, 0, 500, 'focus')
    ]
  },
  innovationDegree: {
    required: false,
    validators: [
      (value) => philosophyValidators.isInnovationDegree(value, 'innovationDegree')
    ]
  },
  historicalContext: {
    required: false,
    validators: [
      (value) => stringValidators.hasLength(value, 0, 1000, 'historicalContext')
    ]
  },
  tags: {
    required: false,
    validators: [
      (value) => arrayValidators.isArray(value, 'tags'),
      (value) => arrayValidators.hasArrayLength(value, 0, 20, 'tags'),
      (value) => {
        value.forEach((tag, index) => {
          stringValidators.isNonEmptyString(tag, `tags[${index}]`);
          stringValidators.hasLength(tag, 1, 50, `tags[${index}]`);
        });
      }
    ]
  },
  visibility: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(value, ['private', 'public', 'shared'], 'visibility')
    ]
  }
};

/**
 * Схема для обновления концепции
 */
const updateConceptSchema = {
  name: {
    required: false,
    validators: [
      (value) => stringValidators.isNonEmptyString(value, 'name'),
      (value) => stringValidators.hasLength(value, 1, 255, 'name')
    ]
  },
  description: {
    required: false,
    validators: [
      (value) => stringValidators.hasLength(value, 0, 5000, 'description')
    ]
  },
  focus: {
    required: false,
    validators: [
      (value) => stringValidators.hasLength(value, 0, 500, 'focus')
    ]
  },
  innovationDegree: {
    required: false,
    validators: [
      (value) => philosophyValidators.isInnovationDegree(value, 'innovationDegree')
    ]
  },
  historicalContext: {
    required: false,
    validators: [
      (value) => stringValidators.hasLength(value, 0, 1000, 'historicalContext')
    ]
  },
  status: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(value, ['draft', 'published', 'archived'], 'status')
    ]
  },
  visibility: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(value, ['private', 'public', 'shared'], 'visibility')
    ]
  }
};

/**
 * Схема для синтеза концепций
 */
const synthesisConceptSchema = {
  parentConceptIds: {
    required: true,
    validators: [
      (value) => arrayValidators.isNonEmptyArray(value, 'parentConceptIds'),
      (value) => arrayValidators.hasArrayLength(value, 2, 10, 'parentConceptIds'),
      (value) => arrayValidators.hasUniqueElements(value, 'parentConceptIds'),
      (value) => {
        value.forEach((id, index) => {
          specializedValidators.isUUID(id, `parentConceptIds[${index}]`);
        });
      }
    ]
  },
  synthesisMethod: {
    required: true,
    validators: [
      (value) => stringValidators.isOneOf(
        value, 
        ['dialectical', 'complementary', 'integrative', 'critical'], 
        'synthesisMethod'
      )
    ]
  },
  name: {
    required: true,
    validators: createConceptSchema.name.validators
  },
  description: {
    required: false,
    validators: createConceptSchema.description.validators
  },
  focus: {
    required: false,
    validators: createConceptSchema.focus.validators
  },
  weights: {
    required: false,
    validators: [
      (value) => arrayValidators.isArray(value, 'weights'),
      (value, field, data) => {
        if (data.parentConceptIds && value.length !== data.parentConceptIds.length) {
          throw new Error('Weights array must match parentConceptIds length');
        }
      },
      (value) => {
        value.forEach((weight, index) => {
          numberValidators.isPercentage(weight, `weights[${index}]`);
        });
        const sum = value.reduce((acc, w) => acc + w, 0);
        if (Math.abs(sum - 1.0) > 0.001) {
          throw new Error('Weights must sum to 1.0');
        }
      }
    ]
  }
};

/**
 * Схема для добавления философа к концепции
 */
const addPhilosopherSchema = {
  philosopherId: {
    required: true,
    validators: [
      (value) => specializedValidators.isUUID(value, 'philosopherId')
    ]
  },
  relationshipType: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['author', 'influence', 'critic', 'follower', 'related'],
        'relationshipType'
      )
    ]
  }
};

/**
 * Схема для добавления традиции к концепции
 */
const addTraditionSchema = {
  traditionId: {
    required: true,
    validators: [
      (value) => specializedValidators.isUUID(value, 'traditionId')
    ]
  },
  relationshipStrength: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'relationshipStrength')
    ]
  }
};

/**
 * Схема для добавления коллаборатора
 */
const addCollaboratorSchema = {
  userId: {
    required: true,
    validators: [
      (value) => specializedValidators.isUUID(value, 'userId')
    ]
  },
  permissions: {
    required: false,
    validators: [
      (value) => arrayValidators.isArray(value, 'permissions'),
      (value) => {
        const validPermissions = ['read', 'write', 'delete', 'share'];
        value.forEach((permission, index) => {
          stringValidators.isOneOf(permission, validPermissions, `permissions[${index}]`);
        });
      }
    ]
  }
};

/**
 * Схема для поиска концепций
 */
const searchConceptsSchema = {
  query: {
    required: false,
    validators: [
      (value) => stringValidators.hasLength(value, 1, 200, 'query')
    ]
  },
  creatorId: {
    required: false,
    validators: [
      (value) => specializedValidators.isUUID(value, 'creatorId')
    ]
  },
  status: {
    required: false,
    validators: [
      (value) => {
        const validStatuses = ['draft', 'published', 'archived'];
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
  visibility: {
    required: false,
    validators: [
      (value) => {
        const validVisibilities = ['private', 'public', 'shared'];
        if (Array.isArray(value)) {
          value.forEach((vis, index) => {
            stringValidators.isOneOf(vis, validVisibilities, `visibility[${index}]`);
          });
        } else {
          stringValidators.isOneOf(value, validVisibilities, 'visibility');
        }
      }
    ]
  },
  isSynthesis: {
    required: false,
    validators: [
      (value) => {
        if (typeof value !== 'boolean') {
          throw new Error('isSynthesis must be a boolean');
        }
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
  innovationDegree: {
    required: false,
    validators: [
      (value) => {
        if (typeof value === 'object' && value !== null) {
          if ('min' in value) {
            philosophyValidators.isInnovationDegree(value.min, 'innovationDegree.min');
          }
          if ('max' in value) {
            philosophyValidators.isInnovationDegree(value.max, 'innovationDegree.max');
          }
        } else {
          philosophyValidators.isInnovationDegree(value, 'innovationDegree');
        }
      }
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
        ['createdAt', 'updatedAt', 'name', 'viewCount', 'innovationDegree'],
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
 * Схема для массовых операций с концепциями
 */
const bulkOperationSchema = {
  conceptIds: {
    required: true,
    validators: [
      (value) => arrayValidators.isNonEmptyArray(value, 'conceptIds'),
      (value) => arrayValidators.hasArrayLength(value, 1, 100, 'conceptIds'),
      (value) => arrayValidators.hasUniqueElements(value, 'conceptIds'),
      (value) => {
        value.forEach((id, index) => {
          specializedValidators.isUUID(id, `conceptIds[${index}]`);
        });
      }
    ]
  },
  operation: {
    required: true,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['publish', 'archive', 'delete', 'changeVisibility', 'addTag', 'removeTag'],
        'operation'
      )
    ]
  },
  params: {
    required: false,
    validators: [
      (value, field, data) => {
        if (data.operation === 'changeVisibility' && !value?.visibility) {
          throw new Error('visibility is required for changeVisibility operation');
        }
        if ((data.operation === 'addTag' || data.operation === 'removeTag') && !value?.tag) {
          throw new Error('tag is required for tag operations');
        }
      }
    ]
  }
};

/**
 * Создание валидаторов из схем
 */
const validateCreateConcept = createSchemaValidator(createConceptSchema);
const validateUpdateConcept = createSchemaValidator(updateConceptSchema);
const validateSynthesisConcept = createSchemaValidator(synthesisConceptSchema);
const validateAddPhilosopher = createSchemaValidator(addPhilosopherSchema);
const validateAddTradition = createSchemaValidator(addTraditionSchema);
const validateAddCollaborator = createSchemaValidator(addCollaboratorSchema);
const validateSearchConcepts = createSchemaValidator(searchConceptsSchema);
const validateBulkOperation = createSchemaValidator(bulkOperationSchema);

module.exports = {
  // Схемы
  createConceptSchema,
  updateConceptSchema,
  synthesisConceptSchema,
  addPhilosopherSchema,
  addTraditionSchema,
  addCollaboratorSchema,
  searchConceptsSchema,
  bulkOperationSchema,
  
  // Валидаторы
  validateCreateConcept,
  validateUpdateConcept,
  validateSynthesisConcept,
  validateAddPhilosopher,
  validateAddTradition,
  validateAddCollaborator,
  validateSearchConcepts,
  validateBulkOperation
};