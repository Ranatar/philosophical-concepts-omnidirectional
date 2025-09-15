/**
 * MongoDB Migration: Add Validations
 * Description: Добавление дополнительных правил валидации и обновление существующих
 * Version: 00003
 * Date: 2024
 */

// Переключаемся на нужную базу данных
db = db.getSiblingDB('philosophy_concepts');

print('=== Starting MongoDB Validations Update ===');
print(`Database: ${db.getName()}`);
print(`Timestamp: ${new Date().toISOString()}`);

// Функция для обновления валидации коллекции
function updateCollectionValidation(collectionName, validator, validationLevel = 'moderate', validationAction = 'error') {
    try {
        // Проверяем существование коллекции
        const collections = db.getCollectionNames();
        if (!collections.includes(collectionName)) {
            print(`✗ Collection '${collectionName}' does not exist, skipping validation update`);
            return false;
        }
        
        // Обновляем валидацию
        db.runCommand({
            collMod: collectionName,
            validator: validator,
            validationLevel: validationLevel,
            validationAction: validationAction
        });
        
        print(`✓ Updated validation for collection '${collectionName}'`);
        return true;
    } catch (error) {
        print(`✗ Error updating validation for '${collectionName}': ${error}`);
        return false;
    }
}

// Счетчики для статистики
let validationsUpdated = 0;
let validationsFailed = 0;

// ==========================================
// Пользовательские функции валидации
// ==========================================

// Функция для создания валидатора UUID
const uuidPattern = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

// Функция для создания валидатора email
const emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';

// Функция для создания валидатора URL
const urlPattern = '^https?://[\\w\\-]+(\\.[\\w\\-]+)+[/#?]?.*$';

// ==========================================
// Обновление валидации для theses
// ==========================================

print('\n--- Updating validation for theses collection ---');

const thesesValidator = {
    $jsonSchema: {
        bsonType: 'object',
        required: ['concept_id', 'type', 'content', 'style', 'created_at'],
        properties: {
            thesis_id: {
                bsonType: 'objectId',
                description: 'Уникальный идентификатор тезиса'
            },
            concept_id: {
                bsonType: 'string',
                pattern: uuidPattern,
                description: 'UUID концепции'
            },
            type: {
                enum: [
                    'ontological', 'epistemological', 'axiological', 
                    'ethical', 'aesthetic', 'practical', 'methodological',
                    'anthropological', 'social', 'political'
                ],
                description: 'Расширенный список типов тезисов'
            },
            content: {
                bsonType: 'string',
                minLength: 10,
                maxLength: 5000,
                description: 'Содержание тезиса'
            },
            related_categories: {
                bsonType: 'array',
                uniqueItems: true,
                maxItems: 20,
                items: {
                    bsonType: 'string',
                    pattern: uuidPattern
                },
                description: 'Связанные категории (уникальные)'
            },
            style: {
                enum: ['academic', 'popular', 'aphoristic', 'dialectical', 'analytical'],
                description: 'Расширенные стили изложения'
            },
            generation_parameters: {
                bsonType: 'object',
                properties: {
                    temperature: {
                        bsonType: 'double',
                        minimum: 0,
                        maximum: 2
                    },
                    max_tokens: {
                        bsonType: 'int',
                        minimum: 1,
                        maximum: 4000
                    },
                    prompt_template: {
                        bsonType: 'string'
                    }
                }
            },
            quality_metrics: {
                bsonType: 'object',
                properties: {
                    clarity: {
                        bsonType: 'double',
                        minimum: 0,
                        maximum: 1
                    },
                    coherence: {
                        bsonType: 'double',
                        minimum: 0,
                        maximum: 1
                    },
                    relevance: {
                        bsonType: 'double',
                        minimum: 0,
                        maximum: 1
                    }
                }
            },
            created_at: {
                bsonType: 'date',
                description: 'Дата создания'
            },
            updated_at: {
                bsonType: 'date',
                description: 'Дата последнего обновления'
            },
            parent_theses: {
                bsonType: 'array',
                uniqueItems: true,
                items: {
                    bsonType: 'objectId'
                },
                description: 'Родительские тезисы (для синтезированных)'
            },
            version: {
                bsonType: 'int',
                minimum: 1,
                description: 'Версия тезиса'
            },
            is_active: {
                bsonType: 'bool',
                description: 'Активен ли тезис'
            }
        },
        additionalProperties: false
    }
};

if (updateCollectionValidation('theses', thesesValidator)) {
    validationsUpdated++;
} else {
    validationsFailed++;
}

// ==========================================
// Обновление валидации для categoryDescriptions
// ==========================================

print('\n--- Updating validation for categoryDescriptions collection ---');

const categoryDescriptionsValidator = {
    $jsonSchema: {
        bsonType: 'object',
        required: ['category_id', 'detailed_description', 'created_at'],
        properties: {
            description_id: {
                bsonType: 'objectId'
            },
            category_id: {
                bsonType: 'string',
                pattern: uuidPattern
            },
            detailed_description: {
                bsonType: 'string',
                minLength: 50,
                maxLength: 10000
            },
            alternative_interpretations: {
                bsonType: 'array',
                maxItems: 10,
                items: {
                    bsonType: 'string',
                    minLength: 20,
                    maxLength: 2000
                }
            },
            historical_analogues: {
                bsonType: 'array',
                maxItems: 20,
                items: {
                    bsonType: 'object',
                    required: ['name', 'tradition', 'description'],
                    properties: {
                        name: { 
                            bsonType: 'string',
                            maxLength: 200
                        },
                        tradition: { 
                            bsonType: 'string',
                            maxLength: 100
                        },
                        description: { 
                            bsonType: 'string',
                            maxLength: 1000
                        },
                        period: {
                            bsonType: 'string',
                            maxLength: 100
                        },
                        sources: {
                            bsonType: 'array',
                            items: {
                                bsonType: 'string',
                                maxLength: 500
                            }
                        }
                    }
                }
            },
            related_concepts: {
                bsonType: 'array',
                maxItems: 30,
                items: {
                    bsonType: 'object',
                    required: ['name', 'relation_type'],
                    properties: {
                        name: { 
                            bsonType: 'string',
                            maxLength: 200
                        },
                        relation_type: { 
                            enum: [
                                'similar', 'opposite', 'derived', 'parent', 
                                'child', 'associated', 'contradictory'
                            ]
                        },
                        description: { 
                            bsonType: 'string',
                            maxLength: 500
                        },
                        strength: {
                            bsonType: 'double',
                            minimum: 0,
                            maximum: 1
                        }
                    }
                }
            },
            keywords: {
                bsonType: 'array',
                uniqueItems: true,
                maxItems: 50,
                items: {
                    bsonType: 'string',
                    maxLength: 50
                }
            },
            references: {
                bsonType: 'array',
                items: {
                    bsonType: 'object',
                    required: ['author', 'title'],
                    properties: {
                        author: { bsonType: 'string' },
                        title: { bsonType: 'string' },
                        year: { bsonType: 'int' },
                        page: { bsonType: 'string' },
                        url: { 
                            bsonType: 'string',
                            pattern: urlPattern
                        }
                    }
                }
            },
            claude_generation_id: {
                bsonType: 'string',
                pattern: uuidPattern
            },
            created_at: {
                bsonType: 'date'
            },
            last_modified: {
                bsonType: 'date'
            },
            modified_by: {
                bsonType: 'string',
                pattern: uuidPattern
            }
        },
        additionalProperties: false
    }
};

if (updateCollectionValidation('categoryDescriptions', categoryDescriptionsValidator)) {
    validationsUpdated++;
} else {
    validationsFailed++;
}

// ==========================================
// Обновление валидации для generatedElements
// ==========================================

print('\n--- Updating validation for generatedElements collection ---');

const generatedElementsValidator = {
    $jsonSchema: {
        bsonType: 'object',
        required: ['element_type', 'element_name', 'concept_id', 'is_new', 'created_at'],
        properties: {
            element_id: {
                bsonType: 'objectId'
            },
            concept_id: {
                bsonType: 'string',
                pattern: uuidPattern
            },
            element_type: {
                enum: ['category', 'relationship_type', 'tradition', 'philosopher']
            },
            element_name: {
                bsonType: 'string',
                minLength: 1,
                maxLength: 200
            },
            element_definition: {
                bsonType: 'string',
                maxLength: 2000
            },
            element_properties: {
                bsonType: 'object',
                description: 'Дополнительные свойства элемента'
            },
            is_new: {
                bsonType: 'bool'
            },
            is_approved: {
                bsonType: ['bool', 'null'],
                description: 'null - ожидает решения, true - одобрено, false - отклонено'
            },
            approval_status: {
                enum: ['pending', 'approved', 'rejected', 'revised'],
                description: 'Детальный статус одобрения'
            },
            approved_by: {
                bsonType: 'string',
                pattern: uuidPattern
            },
            approved_at: {
                bsonType: 'date'
            },
            rejection_reason: {
                bsonType: 'string',
                maxLength: 1000
            },
            created_at: {
                bsonType: 'date'
            },
            generation_context: {
                bsonType: 'object',
                properties: {
                    source_operation: { 
                        enum: [
                            'graph_from_theses', 'synthesis', 'evolution', 
                            'enrichment', 'manual_creation'
                        ]
                    },
                    claude_interaction_id: { 
                        bsonType: 'string',
                        pattern: uuidPattern
                    },
                    user_id: {
                        bsonType: 'string',
                        pattern: uuidPattern
                    },
                    prompt_used: {
                        bsonType: 'string'
                    }
                }
            },
            usage_count: {
                bsonType: 'int',
                minimum: 0,
                description: 'Количество использований после одобрения'
            },
            last_used_at: {
                bsonType: 'date'
            }
        },
        additionalProperties: false
    }
};

if (updateCollectionValidation('generatedElements', generatedElementsValidator)) {
    validationsUpdated++;
} else {
    validationsFailed++;
}

// ==========================================
// Добавление валидации для новых полей в practicalApplications
// ==========================================

print('\n--- Updating validation for practicalApplications collection ---');

const practicalApplicationsValidator = {
    $jsonSchema: {
        bsonType: 'object',
        required: ['concept_id', 'domains', 'application_analysis', 'created_at'],
        properties: {
            application_id: {
                bsonType: 'objectId'
            },
            concept_id: {
                bsonType: 'string',
                pattern: uuidPattern
            },
            domains: {
                bsonType: 'array',
                minItems: 1,
                maxItems: 20,
                items: {
                    bsonType: 'object',
                    required: ['name', 'relevance_score'],
                    properties: {
                        name: { 
                            enum: [
                                'education', 'ethics', 'politics', 'psychology', 
                                'business', 'art', 'science', 'technology', 
                                'healthcare', 'law', 'environment', 'social_work',
                                'media', 'sports', 'religion', 'other'
                            ]
                        },
                        relevance_score: { 
                            bsonType: 'double',
                            minimum: 0,
                            maximum: 1
                        },
                        description: { 
                            bsonType: 'string',
                            maxLength: 2000
                        },
                        specific_applications: {
                            bsonType: 'array',
                            items: {
                                bsonType: 'string',
                                maxLength: 500
                            }
                        },
                        challenges: {
                            bsonType: 'array',
                            items: {
                                bsonType: 'string',
                                maxLength: 500
                            }
                        }
                    }
                }
            },
            application_analysis: {
                bsonType: 'string',
                minLength: 100,
                maxLength: 20000
            },
            implementation_methods: {
                bsonType: 'array',
                maxItems: 50,
                items: {
                    bsonType: 'object',
                    required: ['method_name', 'description'],
                    properties: {
                        method_name: { 
                            bsonType: 'string',
                            maxLength: 200
                        },
                        description: { 
                            bsonType: 'string',
                            maxLength: 3000
                        },
                        examples: {
                            bsonType: 'array',
                            maxItems: 10,
                            items: { 
                                bsonType: 'string',
                                maxLength: 1000
                            }
                        },
                        effectiveness_rating: {
                            bsonType: 'double',
                            minimum: 0,
                            maximum: 1
                        },
                        complexity_level: {
                            enum: ['low', 'medium', 'high', 'expert']
                        }
                    }
                }
            },
            relevance_mappings: {
                bsonType: 'array',
                items: {
                    bsonType: 'object',
                    required: ['thesis_id', 'domain', 'relevance'],
                    properties: {
                        thesis_id: { bsonType: 'objectId' },
                        domain: { bsonType: 'string' },
                        relevance: { 
                            bsonType: 'double',
                            minimum: 0,
                            maximum: 1
                        },
                        explanation: {
                            bsonType: 'string',
                            maxLength: 1000
                        }
                    }
                }
            },
            case_studies: {
                bsonType: 'array',
                items: {
                    bsonType: 'object',
                    required: ['title', 'description', 'domain'],
                    properties: {
                        title: { bsonType: 'string' },
                        description: { bsonType: 'string' },
                        domain: { bsonType: 'string' },
                        outcome: { bsonType: 'string' },
                        lessons_learned: {
                            bsonType: 'array',
                            items: { bsonType: 'string' }
                        }
                    }
                }
            },
            claude_generation_id: {
                bsonType: 'string',
                pattern: uuidPattern
            },
            created_at: {
                bsonType: 'date'
            },
            updated_at: {
                bsonType: 'date'
            },
            reviewed_by: {
                bsonType: 'string',
                pattern: uuidPattern
            },
            review_status: {
                enum: ['pending', 'approved', 'needs_revision', 'rejected']
            }
        },
        additionalProperties: false
    }
};

if (updateCollectionValidation('practicalApplications', practicalApplicationsValidator)) {
    validationsUpdated++;
} else {
    validationsFailed++;
}

// ==========================================
// Создание функций валидации для использования в приложении
// ==========================================

print('\n--- Creating validation functions ---');

// Создаем коллекцию для хранения функций валидации
if (!db.getCollectionNames().includes('validationFunctions')) {
    db.createCollection('validationFunctions');
    print('✓ Created validationFunctions collection');
}

// Добавляем функции валидации
db.validationFunctions.insertMany([
    {
        name: 'validateUUID',
        function: `function(uuid) {
            const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
            return pattern.test(uuid);
        }`,
        description: 'Validates UUID format'
    },
    {
        name: 'validateEmail',
        function: `function(email) {
            const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return pattern.test(email);
        }`,
        description: 'Validates email format'
    },
    {
        name: 'validateURL',
        function: `function(url) {
            const pattern = /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;
            return pattern.test(url);
        }`,
        description: 'Validates URL format'
    },
    {
        name: 'validateDateRange',
        function: `function(startDate, endDate) {
            return new Date(startDate) <= new Date(endDate);
        }`,
        description: 'Validates that start date is before or equal to end date'
    },
    {
        name: 'validateScore',
        function: `function(score, min = 0, max = 1) {
            return typeof score === 'number' && score >= min && score <= max;
        }`,
        description: 'Validates numerical score within range'
    }
]);

print('✓ Added validation functions');

// ==========================================
// Обновление метаданных миграции
// ==========================================

print('\n--- Recording Migration Metadata ---');

db.migrations.insertOne({
    version: '00003',
    name: 'add_validations',
    description: 'Добавление дополнительных правил валидации и обновление существующих',
    applied_at: new Date(),
    status: 'completed',
    validations_updated: validationsUpdated,
    validations_failed: validationsFailed,
    collections_affected: [
        'theses',
        'categoryDescriptions',
        'generatedElements',
        'practicalApplications'
    ],
    new_features: [
        'Extended validation rules',
        'Additional field constraints',
        'Validation functions collection',
        'Pattern-based validations',
        'Range validations for numerical fields'
    ]
});

// ==========================================
// Финальная статистика
// ==========================================

print('\n=== Migration Summary ===');
print(`Total validations updated: ${validationsUpdated}`);
print(`Total validations failed: ${validationsFailed}`);

// Проверяем валидацию для каждой коллекции
print('\nValidation status by collection:');
['theses', 'categoryDescriptions', 'relationshipDescriptions', 'conceptAnalyses', 
 'dialogues', 'historicalContexts', 'practicalApplications', 'dialogueInterpretations',
 'conceptEvolutions', 'generatedElements'].forEach(collection => {
    try {
        const info = db.getCollectionInfos({ name: collection })[0];
        if (info && info.options && info.options.validator) {
            print(`  ✓ ${collection}: validation active`);
        } else {
            print(`  ⚠ ${collection}: no validation`);
        }
    } catch (e) {
        print(`  ✗ ${collection}: error checking validation`);
    }
});

print('\n✓ Validation update completed successfully');
print(`Timestamp: ${new Date().toISOString()}`);