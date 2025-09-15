/**
 * Graph Validation Schemas
 * Схемы валидации для графов, категорий и связей
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
 * Схема для создания категории
 */
const createCategorySchema = {
  conceptId: {
    required: true,
    validators: [
      (value) => specializedValidators.isUUID(value, 'conceptId')
    ]
  },
  name: {
    required: true,
    validators: [
      (value) => stringValidators.isNonEmptyString(value, 'name'),
      (value) => stringValidators.hasLength(value, 1, 255, 'name')
    ]
  },
  type: {
    required: false,
    validators: [
      (value) => philosophyValidators.isCategoryType(value, 'type')
    ]
  },
  definition: {
    required: false,
    validators: [
      (value) => stringValidators.hasLength(value, 0, 2000, 'definition')
    ]
  },
  centrality: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'centrality')
    ]
  },
  certainty: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'certainty')
    ]
  },
  historicalSignificance: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'historicalSignificance')
    ]
  },
  innovationDegree: {
    required: false,
    validators: [
      (value) => philosophyValidators.isInnovationDegree(value, 'innovationDegree')
    ]
  },
  clarity: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'clarity')
    ]
  },
  breadth: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'breadth')
    ]
  },
  depth: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'depth')
    ]
  },
  applicability: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'applicability')
    ]
  },
  traditions: {
    required: false,
    validators: [
      (value) => arrayValidators.isArray(value, 'traditions'),
      (value) => arrayValidators.hasArrayLength(value, 0, 20, 'traditions'),
      (value) => {
        value.forEach((tradition, index) => {
          objectValidators.hasRequiredFields(
            tradition, 
            ['id'], 
            `traditions[${index}]`
          );
          specializedValidators.isUUID(tradition.id, `traditions[${index}].id`);
        });
      }
    ]
  },
  philosophers: {
    required: false,
    validators: [
      (value) => arrayValidators.isArray(value, 'philosophers'),
      (value) => arrayValidators.hasArrayLength(value, 0, 50, 'philosophers'),
      (value) => {
        value.forEach((philosopher, index) => {
          objectValidators.hasRequiredFields(
            philosopher, 
            ['id'], 
            `philosophers[${index}]`
          );
          specializedValidators.isUUID(philosopher.id, `philosophers[${index}].id`);
        });
      }
    ]
  }
};

/**
 * Схема для обновления категории
 */
const updateCategorySchema = {
  name: {
    required: false,
    validators: createCategorySchema.name.validators
  },
  type: {
    required: false,
    validators: createCategorySchema.type.validators
  },
  definition: {
    required: false,
    validators: createCategorySchema.definition.validators
  },
  centrality: {
    required: false,
    validators: createCategorySchema.centrality.validators
  },
  certainty: {
    required: false,
    validators: createCategorySchema.certainty.validators
  },
  historicalSignificance: {
    required: false,
    validators: createCategorySchema.historicalSignificance.validators
  },
  innovationDegree: {
    required: false,
    validators: createCategorySchema.innovationDegree.validators
  },
  clarity: {
    required: false,
    validators: createCategorySchema.clarity.validators
  },
  breadth: {
    required: false,
    validators: createCategorySchema.breadth.validators
  },
  depth: {
    required: false,
    validators: createCategorySchema.depth.validators
  },
  applicability: {
    required: false,
    validators: createCategorySchema.applicability.validators
  }
};

/**
 * Схема для создания связи
 */
const createRelationshipSchema = {
  sourceId: {
    required: true,
    validators: [
      (value) => specializedValidators.isUUID(value, 'sourceId')
    ]
  },
  targetId: {
    required: true,
    validators: [
      (value) => specializedValidators.isUUID(value, 'targetId')
    ]
  },
  type: {
    required: true,
    validators: [
      (value) => philosophyValidators.isRelationshipType(value, 'type')
    ]
  },
  direction: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(
        value, 
        ['unidirectional', 'bidirectional', 'reflexive'], 
        'direction'
      )
    ]
  },
  strength: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'strength')
    ]
  },
  certainty: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'certainty')
    ]
  },
  innovationDegree: {
    required: false,
    validators: [
      (value) => philosophyValidators.isInnovationDegree(value, 'innovationDegree')
    ]
  },
  historicalSupport: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'historicalSupport')
    ]
  },
  logicalNecessity: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'logicalNecessity')
    ]
  },
  contextDependence: {
    required: false,
    validators: [
      (value) => numberValidators.isPercentage(value, 'contextDependence')
    ]
  },
  source: {
    required: false,
    validators: [
      (value) => stringValidators.hasLength(value, 0, 500, 'source')
    ]
  },
  traditions: {
    required: false,
    validators: createCategorySchema.traditions.validators
  },
  philosophers: {
    required: false,
    validators: createCategorySchema.philosophers.validators
  }
};

/**
 * Схема для обновления связи
 */
const updateRelationshipSchema = {
  type: {
    required: false,
    validators: createRelationshipSchema.type.validators
  },
  direction: {
    required: false,
    validators: createRelationshipSchema.direction.validators
  },
  strength: {
    required: false,
    validators: createRelationshipSchema.strength.validators
  },
  certainty: {
    required: false,
    validators: createRelationshipSchema.certainty.validators
  },
  innovationDegree: {
    required: false,
    validators: createRelationshipSchema.innovationDegree.validators
  },
  historicalSupport: {
    required: false,
    validators: createRelationshipSchema.historicalSupport.validators
  },
  logicalNecessity: {
    required: false,
    validators: createRelationshipSchema.logicalNecessity.validators
  },
  contextDependence: {
    required: false,
    validators: createRelationshipSchema.contextDependence.validators
  },
  source: {
    required: false,
    validators: createRelationshipSchema.source.validators
  }
};

/**
 * Схема для обновления характеристик
 */
const updateCharacteristicsSchema = {
  characteristic: {
    required: true,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        [
          'centrality', 'certainty', 'historicalSignificance', 'innovationDegree',
          'clarity', 'breadth', 'depth', 'applicability', 'strength',
          'historicalSupport', 'logicalNecessity', 'contextDependence'
        ],
        'characteristic'
      )
    ]
  },
  value: {
    required: true,
    validators: [
      (value, field, data) => {
        if (data.characteristic === 'innovationDegree') {
          philosophyValidators.isInnovationDegree(value, 'value');
        } else {
          numberValidators.isPercentage(value, 'value');
        }
      }
    ]
  },
  justification: {
    required: false,
    validators: [
      (value) => stringValidators.hasLength(value, 0, 1000, 'justification')
    ]
  }
};

/**
 * Схема для генерации графа из тезисов
 */
const generateGraphFromThesesSchema = {
  thesisIds: {
    required: true,
    validators: [
      (value) => arrayValidators.isNonEmptyArray(value, 'thesisIds'),
      (value) => arrayValidators.hasArrayLength(value, 1, 50, 'thesisIds'),
      (value) => {
        value.forEach((id, index) => {
          specializedValidators.isUUID(id, `thesisIds[${index}]`);
        });
      }
    ]
  },
  parameters: {
    required: false,
    validators: [
      (value) => objectValidators.isObject(value, 'parameters')
    ]
  }
};

/**
 * Схема для валидации графа
 */
const validateGraphSchema = {
  conceptId: {
    required: true,
    validators: [
      (value) => specializedValidators.isUUID(value, 'conceptId')
    ]
  },
  validationType: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['structure', 'consistency', 'completeness', 'full'],
        'validationType'
      )
    ]
  }
};

/**
 * Схема для обогащения графа
 */
const enrichGraphSchema = {
  conceptId: {
    required: true,
    validators: [
      (value) => specializedValidators.isUUID(value, 'conceptId')
    ]
  },
  enrichmentType: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['categories', 'relationships', 'definitions', 'characteristics', 'full'],
        'enrichmentType'
      )
    ]
  },
  targetElements: {
    required: false,
    validators: [
      (value) => arrayValidators.isArray(value, 'targetElements'),
      (value) => {
        value.forEach((id, index) => {
          specializedValidators.isUUID(id, `targetElements[${index}]`);
        });
      }
    ]
  }
};

/**
 * Схема для экспорта графа
 */
const exportGraphSchema = {
  conceptId: {
    required: true,
    validators: [
      (value) => specializedValidators.isUUID(value, 'conceptId')
    ]
  },
  format: {
    required: true,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['json', 'graphml', 'gexf', 'cytoscape', 'd3', 'neo4j'],
        'format'
      )
    ]
  },
  includeMetadata: {
    required: false,
    validators: [
      (value) => {
        if (typeof value !== 'boolean') {
          throw new Error('includeMetadata must be a boolean');
        }
      }
    ]
  }
};

/**
 * Схема для импорта графа
 */
const importGraphSchema = {
  conceptId: {
    required: true,
    validators: [
      (value) => specializedValidators.isUUID(value, 'conceptId')
    ]
  },
  format: {
    required: true,
    validators: exportGraphSchema.format.validators
  },
  data: {
    required: true,
    validators: [
      (value) => {
        if (!value || (typeof value !== 'object' && typeof value !== 'string')) {
          throw new Error('data must be an object or string');
        }
      }
    ]
  },
  mergeStrategy: {
    required: false,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['replace', 'merge', 'append'],
        'mergeStrategy'
      )
    ]
  }
};

/**
 * Схема для массовых операций с элементами графа
 */
const bulkGraphOperationSchema = {
  operation: {
    required: true,
    validators: [
      (value) => stringValidators.isOneOf(
        value,
        ['createCategories', 'createRelationships', 'updateCategories', 'updateRelationships', 'delete'],
        'operation'
      )
    ]
  },
  elements: {
    required: true,
    validators: [
      (value) => arrayValidators.isNonEmptyArray(value, 'elements'),
      (value) => arrayValidators.hasArrayLength(value, 1, 100, 'elements')
    ]
  }
};

/**
 * Схема для анализа структуры графа
 */
const analyzeGraphStructureSchema = {
  conceptId: {
    required: true,
    validators: [
      (value) => specializedValidators.isUUID(value, 'conceptId')
    ]
  },
  analysisType: {
    required: false,
    validators: [
      (value) => {
        const validTypes = ['centrality', 'clustering', 'paths', 'communities', 'full'];
        if (Array.isArray(value)) {
          value.forEach((type, index) => {
            stringValidators.isOneOf(type, validTypes, `analysisType[${index}]`);
          });
        } else {
          stringValidators.isOneOf(value, validTypes, 'analysisType');
        }
      }
    ]
  }
};

/**
 * Создание валидаторов из схем
 */
const validateCreateCategory = createSchemaValidator(createCategorySchema);
const validateUpdateCategory = createSchemaValidator(updateCategorySchema);
const validateCreateRelationship = createSchemaValidator(createRelationshipSchema);
const validateUpdateRelationship = createSchemaValidator(updateRelationshipSchema);
const validateUpdateCharacteristics = createSchemaValidator(updateCharacteristicsSchema);
const validateGenerateGraphFromTheses = createSchemaValidator(generateGraphFromThesesSchema);
const validateValidateGraph = createSchemaValidator(validateGraphSchema);
const validateEnrichGraph = createSchemaValidator(enrichGraphSchema);
const validateExportGraph = createSchemaValidator(exportGraphSchema);
const validateImportGraph = createSchemaValidator(importGraphSchema);
const validateBulkGraphOperation = createSchemaValidator(bulkGraphOperationSchema);
const validateAnalyzeGraphStructure = createSchemaValidator(analyzeGraphStructureSchema);

module.exports = {
  // Схемы
  createCategorySchema,
  updateCategorySchema,
  createRelationshipSchema,
  updateRelationshipSchema,
  updateCharacteristicsSchema,
  generateGraphFromThesesSchema,
  validateGraphSchema,
  enrichGraphSchema,
  exportGraphSchema,
  importGraphSchema,
  bulkGraphOperationSchema,
  analyzeGraphStructureSchema,
  
  // Валидаторы
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateRelationship,
  validateUpdateRelationship,
  validateUpdateCharacteristics,
  validateGenerateGraphFromTheses,
  validateValidateGraph,
  validateEnrichGraph,
  validateExportGraph,
  validateImportGraph,
  validateBulkGraphOperation,
  validateAnalyzeGraphStructure
};