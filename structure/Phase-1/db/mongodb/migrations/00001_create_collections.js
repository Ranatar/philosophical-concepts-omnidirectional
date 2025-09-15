/**
 * MongoDB Migration: Create Collections
 * Description: Создание всех необходимых коллекций для сервиса философских концепций
 * Version: 00001
 * Date: 2024
 */

// Переключаемся на нужную базу данных
db = db.getSiblingDB('philosophy_concepts');

print('=== Starting MongoDB Collections Creation ===');
print(`Database: ${db.getName()}`);
print(`Timestamp: ${new Date().toISOString()}`);

// Функция для безопасного создания коллекции
function createCollectionSafely(name, options = {}) {
    try {
        // Проверяем, существует ли коллекция
        const collections = db.getCollectionNames();
        if (collections.includes(name)) {
            print(`Collection '${name}' already exists, skipping creation`);
            return true;
        }
        
        // Создаем коллекцию
        db.createCollection(name, options);
        print(`✓ Created collection: ${name}`);
        return true;
    } catch (error) {
        print(`✗ Error creating collection '${name}': ${error}`);
        return false;
    }
}

// ==========================================
// Основные коллекции
// ==========================================

print('\n--- Creating Main Collections ---');

// 1. Коллекция тезисов
createCollectionSafely('theses', {
    validator: {
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
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
                    description: 'UUID концепции'
                },
                type: {
                    enum: [
                        'ontological', 'epistemological', 'axiological', 
                        'ethical', 'aesthetic', 'practical'
                    ],
                    description: 'Тип тезиса'
                },
                content: {
                    bsonType: 'string',
                    minLength: 10,
                    maxLength: 5000,
                    description: 'Содержание тезиса'
                },
                related_categories: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'string',
                        pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    },
                    description: 'Связанные категории'
                },
                style: {
                    enum: ['academic', 'popular', 'aphoristic'],
                    description: 'Стиль изложения'
                },
                generation_parameters: {
                    bsonType: 'object',
                    description: 'Параметры генерации'
                },
                created_at: {
                    bsonType: 'date',
                    description: 'Дата создания'
                },
                parent_theses: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'objectId'
                    },
                    description: 'Родительские тезисы (для синтезированных)'
                }
            }
        }
    }
});

// 2. Коллекция развернутых описаний категорий
createCollectionSafely('categoryDescriptions', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['category_id', 'detailed_description', 'created_at'],
            properties: {
                description_id: {
                    bsonType: 'objectId',
                    description: 'Уникальный идентификатор описания'
                },
                category_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
                    description: 'UUID категории'
                },
                detailed_description: {
                    bsonType: 'string',
                    minLength: 50,
                    description: 'Развернутое описание категории'
                },
                alternative_interpretations: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'string'
                    },
                    description: 'Альтернативные интерпретации'
                },
                historical_analogues: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        required: ['name', 'tradition', 'description'],
                        properties: {
                            name: { bsonType: 'string' },
                            tradition: { bsonType: 'string' },
                            description: { bsonType: 'string' }
                        }
                    }
                },
                related_concepts: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        required: ['name', 'relation_type'],
                        properties: {
                            name: { bsonType: 'string' },
                            relation_type: { bsonType: 'string' },
                            description: { bsonType: 'string' }
                        }
                    }
                },
                claude_generation_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
                    description: 'ID взаимодействия с Claude'
                },
                created_at: {
                    bsonType: 'date',
                    description: 'Дата создания'
                },
                last_modified: {
                    bsonType: 'date',
                    description: 'Дата последнего изменения'
                }
            }
        }
    }
});

// 3. Коллекция описаний связей
createCollectionSafely('relationshipDescriptions', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['relationship_id', 'philosophical_foundation', 'created_at'],
            properties: {
                description_id: {
                    bsonType: 'objectId',
                    description: 'Уникальный идентификатор описания'
                },
                relationship_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
                    description: 'UUID связи'
                },
                philosophical_foundation: {
                    bsonType: 'string',
                    minLength: 50,
                    description: 'Философское обоснование связи'
                },
                counterarguments: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'string'
                    },
                    description: 'Контраргументы'
                },
                analogues: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        required: ['concept', 'categories', 'description'],
                        properties: {
                            concept: { bsonType: 'string' },
                            categories: { 
                                bsonType: 'array',
                                items: { bsonType: 'string' }
                            },
                            description: { bsonType: 'string' }
                        }
                    }
                },
                claude_generation_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                },
                created_at: {
                    bsonType: 'date'
                },
                last_modified: {
                    bsonType: 'date'
                }
            }
        }
    }
});

// 4. Коллекция анализов концепций
createCollectionSafely('conceptAnalyses', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['concept_id', 'analysis_type', 'content', 'created_at'],
            properties: {
                analysis_id: {
                    bsonType: 'objectId'
                },
                concept_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                },
                analysis_type: {
                    enum: ['critical', 'historical', 'comparative', 'systematic', 'applied']
                },
                content: {
                    bsonType: 'string',
                    minLength: 100
                },
                generation_parameters: {
                    bsonType: 'object'
                },
                claude_generation_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                },
                created_at: {
                    bsonType: 'date'
                }
            }
        }
    }
});

// 5. Коллекция диалогов
createCollectionSafely('dialogues', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['concept_ids', 'topic', 'content', 'generated_at'],
            properties: {
                dialogue_id: {
                    bsonType: 'objectId'
                },
                concept_ids: {
                    bsonType: 'array',
                    minItems: 2,
                    items: {
                        bsonType: 'string',
                        pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    }
                },
                topic: {
                    bsonType: 'string',
                    minLength: 5
                },
                content: {
                    bsonType: 'string',
                    minLength: 100
                },
                claude_generation_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                },
                generated_at: {
                    bsonType: 'date'
                },
                parameters: {
                    bsonType: 'object'
                }
            }
        }
    }
});

// ==========================================
// Специализированные коллекции
// ==========================================

print('\n--- Creating Specialized Collections ---');

// 6. Коллекция исторических контекстов
createCollectionSafely('historicalContexts', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['concept_id', 'time_period', 'historical_analysis', 'created_at'],
            properties: {
                context_id: {
                    bsonType: 'objectId'
                },
                concept_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                },
                time_period: {
                    bsonType: 'string'
                },
                historical_analysis: {
                    bsonType: 'string',
                    minLength: 100
                },
                influences: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        required: ['philosopher', 'concept', 'influence_type'],
                        properties: {
                            philosopher: { bsonType: 'string' },
                            concept: { bsonType: 'string' },
                            influence_type: { bsonType: 'string' },
                            description: { bsonType: 'string' }
                        }
                    }
                },
                contemporaries: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        required: ['name', 'relation'],
                        properties: {
                            name: { bsonType: 'string' },
                            relation: { bsonType: 'string' },
                            concepts: {
                                bsonType: 'array',
                                items: { bsonType: 'string' }
                            }
                        }
                    }
                },
                subsequent_influence: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        required: ['target', 'influence_description'],
                        properties: {
                            target: { bsonType: 'string' },
                            influence_description: { bsonType: 'string' },
                            period: { bsonType: 'string' }
                        }
                    }
                },
                claude_generation_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                },
                created_at: {
                    bsonType: 'date'
                }
            }
        }
    }
});

// 7. Коллекция практических применений
createCollectionSafely('practicalApplications', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['concept_id', 'domains', 'application_analysis', 'created_at'],
            properties: {
                application_id: {
                    bsonType: 'objectId'
                },
                concept_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                },
                domains: {
                    bsonType: 'array',
                    minItems: 1,
                    items: {
                        bsonType: 'object',
                        required: ['name', 'relevance_score'],
                        properties: {
                            name: { 
                                enum: ['education', 'ethics', 'politics', 'psychology', 
                                       'business', 'art', 'science', 'technology', 'other']
                            },
                            relevance_score: { 
                                bsonType: 'double',
                                minimum: 0,
                                maximum: 1
                            },
                            description: { bsonType: 'string' }
                        }
                    }
                },
                application_analysis: {
                    bsonType: 'string',
                    minLength: 100
                },
                implementation_methods: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        required: ['method_name', 'description'],
                        properties: {
                            method_name: { bsonType: 'string' },
                            description: { bsonType: 'string' },
                            examples: {
                                bsonType: 'array',
                                items: { bsonType: 'string' }
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
                            relevance: { bsonType: 'double' }
                        }
                    }
                },
                claude_generation_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                },
                created_at: {
                    bsonType: 'date'
                }
            }
        }
    }
});

// 8. Коллекция диалогических интерпретаций
createCollectionSafely('dialogueInterpretations', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['philosophical_question', 'dialogue_content', 'concept_ids', 'created_at'],
            properties: {
                dialogue_id: {
                    bsonType: 'objectId'
                },
                philosophical_question: {
                    bsonType: 'string',
                    minLength: 10
                },
                dialogue_content: {
                    bsonType: 'string',
                    minLength: 200
                },
                discussion_points: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        required: ['point', 'concept_position'],
                        properties: {
                            point: { bsonType: 'string' },
                            concept_position: { bsonType: 'string' },
                            arguments: {
                                bsonType: 'array',
                                items: { bsonType: 'string' }
                            }
                        }
                    }
                },
                arguments: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        required: ['speaker', 'argument_type', 'content'],
                        properties: {
                            speaker: { bsonType: 'string' },
                            argument_type: { 
                                enum: ['thesis', 'objection', 'counter-objection', 
                                       'synthesis', 'clarification']
                            },
                            content: { bsonType: 'string' }
                        }
                    }
                },
                concept_ids: {
                    bsonType: 'array',
                    minItems: 2,
                    items: {
                        bsonType: 'string',
                        pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    }
                },
                claude_generation_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                },
                created_at: {
                    bsonType: 'date'
                }
            }
        }
    }
});

// 9. Коллекция эволюций концепций
createCollectionSafely('conceptEvolutions', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['concept_id', 'evolution_analysis', 'suggested_changes', 'created_at'],
            properties: {
                evolution_id: {
                    bsonType: 'objectId'
                },
                concept_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                },
                evolution_analysis: {
                    bsonType: 'string',
                    minLength: 100
                },
                suggested_changes: {
                    bsonType: 'object',
                    properties: {
                        new_categories: {
                            bsonType: 'array',
                            items: {
                                bsonType: 'object',
                                required: ['name', 'type', 'rationale'],
                                properties: {
                                    name: { bsonType: 'string' },
                                    type: { bsonType: 'string' },
                                    definition: { bsonType: 'string' },
                                    rationale: { bsonType: 'string' }
                                }
                            }
                        },
                        modified_categories: {
                            bsonType: 'array',
                            items: {
                                bsonType: 'object',
                                required: ['category_id', 'changes', 'rationale'],
                                properties: {
                                    category_id: { bsonType: 'string' },
                                    changes: { bsonType: 'object' },
                                    rationale: { bsonType: 'string' }
                                }
                            }
                        },
                        new_relationships: {
                            bsonType: 'array',
                            items: {
                                bsonType: 'object',
                                required: ['from_category', 'to_category', 'type', 'rationale'],
                                properties: {
                                    from_category: { bsonType: 'string' },
                                    to_category: { bsonType: 'string' },
                                    type: { bsonType: 'string' },
                                    rationale: { bsonType: 'string' }
                                }
                            }
                        },
                        name_change: {
                            bsonType: 'object',
                            properties: {
                                new_name: { bsonType: 'string' },
                                rationale: { bsonType: 'string' }
                            }
                        }
                    }
                },
                scientific_context: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        required: ['field', 'discovery', 'impact'],
                        properties: {
                            field: { bsonType: 'string' },
                            discovery: { bsonType: 'string' },
                            impact: { bsonType: 'string' }
                        }
                    }
                },
                evolution_direction: {
                    enum: ['expansion', 'refinement', 'synthesis', 'paradigm_shift', 'specialization']
                },
                claude_generation_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                },
                created_at: {
                    bsonType: 'date'
                }
            }
        }
    }
});

// ==========================================
// Служебные коллекции
// ==========================================

print('\n--- Creating Service Collections ---');

// 10. Коллекция сгенерированных элементов (для валидации)
createCollectionSafely('generatedElements', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['element_type', 'element_name', 'concept_id', 'is_new', 'created_at'],
            properties: {
                element_id: {
                    bsonType: 'objectId'
                },
                concept_id: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                },
                element_type: {
                    enum: ['category', 'relationship_type']
                },
                element_name: {
                    bsonType: 'string',
                    minLength: 1
                },
                element_definition: {
                    bsonType: 'string'
                },
                is_new: {
                    bsonType: 'bool'
                },
                is_approved: {
                    bsonType: 'bool',
                    description: 'null - ожидает решения, true - одобрено, false - отклонено'
                },
                approved_by: {
                    bsonType: 'string',
                    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                },
                approved_at: {
                    bsonType: 'date'
                },
                created_at: {
                    bsonType: 'date'
                },
                generation_context: {
                    bsonType: 'object',
                    properties: {
                        source_operation: { bsonType: 'string' },
                        claude_interaction_id: { bsonType: 'string' }
                    }
                }
            }
        }
    }
});

// 11. Коллекция для логов миграций
createCollectionSafely('migrations', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['version', 'name', 'applied_at', 'status'],
            properties: {
                version: {
                    bsonType: 'string'
                },
                name: {
                    bsonType: 'string'
                },
                description: {
                    bsonType: 'string'
                },
                applied_at: {
                    bsonType: 'date'
                },
                status: {
                    enum: ['pending', 'in_progress', 'completed', 'failed']
                },
                error: {
                    bsonType: 'string'
                }
            }
        }
    }
});

// ==========================================
// Создание метаданных о миграции
// ==========================================

print('\n--- Recording Migration Metadata ---');

db.migrations.insertOne({
    version: '00001',
    name: 'create_collections',
    description: 'Создание всех необходимых коллекций для сервиса философских концепций',
    applied_at: new Date(),
    status: 'completed',
    collections_created: [
        'theses',
        'categoryDescriptions',
        'relationshipDescriptions',
        'conceptAnalyses',
        'dialogues',
        'historicalContexts',
        'practicalApplications',
        'dialogueInterpretations',
        'conceptEvolutions',
        'generatedElements',
        'migrations'
    ]
});

// ==========================================
// Финальная статистика
// ==========================================

print('\n=== Migration Summary ===');
const collections = db.getCollectionNames();
print(`Total collections in database: ${collections.length}`);
print('Collections:');
collections.forEach(col => {
    const count = db[col].countDocuments();
    print(`  - ${col}: ${count} documents`);
});

print('\n✓ Collection creation completed successfully');
print(`Timestamp: ${new Date().toISOString()}`);