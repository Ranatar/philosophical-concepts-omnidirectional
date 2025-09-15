/**
 * MongoDB Schema: Relationship Descriptions
 * Схема для коллекции описаний связей между философскими категориями
 */

// Типы философских обоснований
const FOUNDATION_TYPES = {
    LOGICAL: 'logical',                    // Логическое обоснование
    EMPIRICAL: 'empirical',                // Эмпирическое обоснование
    DIALECTICAL: 'dialectical',            // Диалектическое обоснование
    PHENOMENOLOGICAL: 'phenomenological',  // Феноменологическое обоснование
    HERMENEUTICAL: 'hermeneutical',       // Герменевтическое обоснование
    ANALYTICAL: 'analytical',              // Аналитическое обоснование
    HISTORICAL: 'historical',              // Историческое обоснование
    PRAGMATIC: 'pragmatic'                 // Прагматическое обоснование
};

// Типы контраргументов
const COUNTERARGUMENT_TYPES = {
    LOGICAL_CONTRADICTION: 'logical_contradiction',
    EMPIRICAL_REFUTATION: 'empirical_refutation',
    ALTERNATIVE_INTERPRETATION: 'alternative_interpretation',
    CONTEXTUAL_LIMITATION: 'contextual_limitation',
    METHODOLOGICAL_CRITIQUE: 'methodological_critique',
    HISTORICAL_CONTINGENCY: 'historical_contingency'
};

// Схема валидации для MongoDB
const relationshipDescriptionSchema = {
    bsonType: 'object',
    required: ['relationship_id', 'philosophical_foundation', 'created_at'],
    properties: {
        // Основные поля
        description_id: {
            bsonType: 'objectId',
            description: 'Уникальный идентификатор описания'
        },
        relationship_id: {
            bsonType: 'string',
            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            description: 'UUID связи из Neo4j'
        },
        
        // Информация о связываемых категориях
        relationship_info: {
            bsonType: 'object',
            required: ['from_category', 'to_category', 'type'],
            properties: {
                from_category: {
                    bsonType: 'object',
                    required: ['id', 'name'],
                    properties: {
                        id: {
                            bsonType: 'string',
                            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                        },
                        name: {
                            bsonType: 'string',
                            maxLength: 200
                        }
                    }
                },
                to_category: {
                    bsonType: 'object',
                    required: ['id', 'name'],
                    properties: {
                        id: {
                            bsonType: 'string',
                            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                        },
                        name: {
                            bsonType: 'string',
                            maxLength: 200
                        }
                    }
                },
                type: {
                    bsonType: 'string',
                    description: 'Тип связи из Neo4j'
                },
                direction: {
                    enum: ['unidirectional', 'bidirectional', 'reflexive'],
                    description: 'Направленность связи'
                }
            },
            description: 'Информация о связываемых категориях'
        },
        
        // Философское обоснование
        philosophical_foundation: {
            bsonType: 'string',
            minLength: 50,
            maxLength: 10000,
            description: 'Развернутое философское обоснование связи'
        },
        foundation_type: {
            enum: Object.values(FOUNDATION_TYPES),
            description: 'Тип философского обоснования'
        },
        
        // Аргументация
        arguments: {
            bsonType: 'array',
            maxItems: 20,
            items: {
                bsonType: 'object',
                required: ['argument', 'type'],
                properties: {
                    argument: {
                        bsonType: 'string',
                        maxLength: 2000,
                        description: 'Текст аргумента'
                    },
                    type: {
                        enum: ['premise', 'supporting', 'example', 'clarification'],
                        description: 'Тип аргумента'
                    },
                    strength: {
                        bsonType: 'double',
                        minimum: 0,
                        maximum: 1,
                        description: 'Сила аргумента (0-1)'
                    },
                    sources: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            properties: {
                                author: { bsonType: 'string' },
                                work: { bsonType: 'string' },
                                quote: { bsonType: 'string' }
                            }
                        }
                    }
                }
            },
            description: 'Аргументы в поддержку связи'
        },
        
        // Контраргументы
        counterarguments: {
            bsonType: 'array',
            maxItems: 15,
            items: {
                bsonType: 'object',
                required: ['counterargument', 'type'],
                properties: {
                    counterargument: {
                        bsonType: 'string',
                        maxLength: 2000,
                        description: 'Текст контраргумента'
                    },
                    type: {
                        enum: Object.values(COUNTERARGUMENT_TYPES),
                        description: 'Тип контраргумента'
                    },
                    author: {
                        bsonType: 'string',
                        maxLength: 200,
                        description: 'Автор контраргумента'
                    },
                    tradition: {
                        bsonType: 'string',
                        maxLength: 100,
                        description: 'Философская традиция'
                    },
                    response: {
                        bsonType: 'string',
                        maxLength: 2000,
                        description: 'Возможный ответ на контраргумент'
                    },
                    severity: {
                        bsonType: 'double',
                        minimum: 0,
                        maximum: 1,
                        description: 'Серьезность контраргумента (0-1)'
                    }
                }
            },
            description: 'Контраргументы против связи'
        },
        
        // Аналоги в других философских системах
        analogues: {
            bsonType: 'array',
            maxItems: 20,
            items: {
                bsonType: 'object',
                required: ['concept', 'categories', 'description'],
                properties: {
                    concept: {
                        bsonType: 'string',
                        maxLength: 200,
                        description: 'Название концепции с аналогичной связью'
                    },
                    categories: {
                        bsonType: 'array',
                        minItems: 2,
                        maxItems: 2,
                        items: {
                            bsonType: 'string',
                            maxLength: 200
                        },
                        description: 'Категории, между которыми существует аналогичная связь'
                    },
                    tradition: {
                        bsonType: 'string',
                        maxLength: 100,
                        description: 'Философская традиция'
                    },
                    description: {
                        bsonType: 'string',
                        maxLength: 1000,
                        description: 'Описание аналогичной связи'
                    },
                    similarity_score: {
                        bsonType: 'double',
                        minimum: 0,
                        maximum: 1,
                        description: 'Степень схожести (0-1)'
                    },
                    differences: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'string',
                            maxLength: 500
                        },
                        description: 'Ключевые отличия'
                    }
                }
            },
            description: 'Аналогичные связи в других философских системах'
        },
        
        // Примеры проявления связи
        manifestations: {
            bsonType: 'array',
            maxItems: 15,
            items: {
                bsonType: 'object',
                required: ['domain', 'example'],
                properties: {
                    domain: {
                        enum: ['theoretical', 'practical', 'historical', 'scientific', 'artistic', 'social'],
                        description: 'Область проявления'
                    },
                    example: {
                        bsonType: 'string',
                        maxLength: 1500,
                        description: 'Пример проявления связи'
                    },
                    significance: {
                        bsonType: 'string',
                        maxLength: 500,
                        description: 'Значимость примера'
                    }
                }
            },
            description: 'Примеры проявления связи в различных областях'
        },
        
        // Условия и ограничения
        conditions: {
            bsonType: 'object',
            properties: {
                necessary_conditions: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'string',
                        maxLength: 500
                    },
                    description: 'Необходимые условия для существования связи'
                },
                sufficient_conditions: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'string',
                        maxLength: 500
                    },
                    description: 'Достаточные условия для существования связи'
                },
                limitations: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'string',
                        maxLength: 500
                    },
                    description: 'Ограничения применимости связи'
                },
                contexts: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'string',
                        maxLength: 200
                    },
                    description: 'Контексты, в которых связь наиболее релевантна'
                }
            },
            description: 'Условия и ограничения связи'
        },
        
        // Эволюция понимания связи
        historical_evolution: {
            bsonType: 'array',
            items: {
                bsonType: 'object',
                required: ['period', 'understanding'],
                properties: {
                    period: {
                        bsonType: 'string',
                        maxLength: 100
                    },
                    understanding: {
                        bsonType: 'string',
                        maxLength: 1000
                    },
                    key_figures: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'string',
                            maxLength: 100
                        }
                    },
                    changes: {
                        bsonType: 'string',
                        maxLength: 500
                    }
                }
            },
            description: 'Историческая эволюция понимания связи'
        },
        
        // Метаданные генерации
        claude_generation_id: {
            bsonType: 'string',
            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            description: 'ID взаимодействия с Claude'
        },
        generation_context: {
            bsonType: 'object',
            properties: {
                prompt_strategy: {
                    bsonType: 'string',
                    description: 'Стратегия промпта'
                },
                source_materials: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'string'
                    },
                    description: 'Использованные источники'
                },
                confidence_score: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1
                }
            }
        },
        
        // Временные метки
        created_at: {
            bsonType: 'date',
            description: 'Дата создания'
        },
        last_modified: {
            bsonType: 'date',
            description: 'Дата последнего изменения'
        },
        
        // Оценки качества
        quality_metrics: {
            bsonType: 'object',
            properties: {
                argumentative_strength: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1,
                    description: 'Сила аргументации'
                },
                clarity: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1,
                    description: 'Ясность изложения'
                },
                comprehensiveness: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1,
                    description: 'Полнота описания'
                },
                scholarly_rigor: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1,
                    description: 'Научная строгость'
                }
            }
        }
    },
    additionalProperties: false
};

// Индексы для коллекции
const relationshipDescriptionIndexes = [
    // Уникальный индекс по relationship_id
    {
        keys: { relationship_id: 1 },
        options: { 
            name: 'idx_relationship_id',
            unique: true 
        }
    },
    
    // Индекс по категориям
    {
        keys: { 
            'relationship_info.from_category.id': 1,
            'relationship_info.to_category.id': 1
        },
        options: { name: 'idx_categories' }
    },
    
    // Индекс по типу связи
    {
        keys: { 'relationship_info.type': 1 },
        options: { name: 'idx_relationship_type' }
    },
    
    // Индекс по Claude generation
    {
        keys: { claude_generation_id: 1 },
        options: { 
            name: 'idx_claude_generation_id',
            sparse: true
        }
    },
    
    // Индекс по типу обоснования
    {
        keys: { foundation_type: 1 },
        options: { name: 'idx_foundation_type' }
    },
    
    // Индекс по дате модификации
    {
        keys: { last_modified: -1 },
        options: { name: 'idx_last_modified' }
    },
    
    // Полнотекстовый поиск
    {
        keys: { philosophical_foundation: 'text' },
        options: { 
            name: 'idx_foundation_text',
            default_language: 'russian'
        }
    },
    
    // Индекс для поиска по традициям в аналогах
    {
        keys: { 'analogues.tradition': 1 },
        options: { name: 'idx_analogue_traditions' }
    }
];

// Примеры запросов
const relationshipDescriptionQueries = {
    // Получить описание связи
    getByRelationship: (relationshipId) => ({
        relationship_id: relationshipId
    }),
    
    // Получить все описания связей между двумя категориями
    getBetweenCategories: (fromCategoryId, toCategoryId) => ({
        'relationship_info.from_category.id': fromCategoryId,
        'relationship_info.to_category.id': toCategoryId
    }),
    
    // Получить описания по типу связи
    getByType: (type) => ({
        'relationship_info.type': type
    }),
    
    // Получить описания по типу обоснования
    getByFoundationType: (foundationType) => ({
        foundation_type: foundationType
    }),
    
    // Поиск по тексту обоснования
    searchByFoundation: (searchText) => ({
        $text: { $search: searchText }
    }),
    
    // Агрегация для анализа контраргументов
    analyzeCounterarguments: () => [
        { $unwind: '$counterarguments' },
        {
            $group: {
                _id: '$counterarguments.type',
                count: { $sum: 1 },
                avgSeverity: { $avg: '$counterarguments.severity' },
                traditions: { 
                    $addToSet: '$counterarguments.tradition' 
                }
            }
        },
        { $sort: { count: -1 } }
    ],
    
    // Получить наиболее обоснованные связи
    getMostJustified: (limit = 10) => [
        { 
            $match: { 
                'quality_metrics.argumentative_strength': { $exists: true } 
            } 
        },
        { 
            $sort: { 
                'quality_metrics.argumentative_strength': -1,
                'quality_metrics.scholarly_rigor': -1
            } 
        },
        { $limit: limit }
    ]
};

// Экспорт схемы и вспомогательных объектов
module.exports = {
    schema: relationshipDescriptionSchema,
    indexes: relationshipDescriptionIndexes,
    foundationTypes: FOUNDATION_TYPES,
    counterargumentTypes: COUNTERARGUMENT_TYPES,
    queries: relationshipDescriptionQueries,
    
    // Функция валидации
    validateDescription: (description) => {
        if (!description.relationship_id || !description.philosophical_foundation) {
            return { valid: false, error: 'Missing required fields' };
        }
        
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        if (!uuidPattern.test(description.relationship_id)) {
            return { valid: false, error: 'Invalid relationship_id format' };
        }
        
        if (description.philosophical_foundation.length < 50 || 
            description.philosophical_foundation.length > 10000) {
            return { valid: false, error: 'Foundation length must be between 50 and 10000 characters' };
        }
        
        return { valid: true };
    },
    
    // Подготовка к сохранению
    prepareForSave: (description) => {
        const now = new Date();
        
        return {
            ...description,
            created_at: description.created_at || now,
            last_modified: now,
            quality_metrics: description.quality_metrics || {
                argumentative_strength: 0,
                clarity: 0,
                comprehensiveness: 0,
                scholarly_rigor: 0
            }
        };
    }
};