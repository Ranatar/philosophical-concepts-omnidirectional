/**
 * MongoDB Schema: Category Descriptions
 * Схема для коллекции развернутых описаний философских категорий
 */

// Типы отношений с другими концептами
const RELATION_TYPES = {
    SIMILAR: 'similar',              // Схожие концепты
    OPPOSITE: 'opposite',            // Противоположные концепты
    DERIVED: 'derived',              // Производные концепты
    PARENT: 'parent',                // Родительские концепты
    CHILD: 'child',                  // Дочерние концепты
    ASSOCIATED: 'associated',        // Ассоциированные концепты
    CONTRADICTORY: 'contradictory'   // Противоречащие концепты
};

// Схема валидации для MongoDB
const categoryDescriptionSchema = {
    bsonType: 'object',
    required: ['category_id', 'detailed_description', 'created_at'],
    properties: {
        // Основные поля
        description_id: {
            bsonType: 'objectId',
            description: 'Уникальный идентификатор описания'
        },
        category_id: {
            bsonType: 'string',
            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            description: 'UUID категории из Neo4j'
        },
        
        // Описания
        detailed_description: {
            bsonType: 'string',
            minLength: 50,
            maxLength: 10000,
            description: 'Развернутое описание категории'
        },
        short_description: {
            bsonType: 'string',
            maxLength: 500,
            description: 'Краткое описание для предпросмотра'
        },
        
        // Альтернативные интерпретации
        alternative_interpretations: {
            bsonType: 'array',
            maxItems: 10,
            items: {
                bsonType: 'object',
                required: ['interpretation', 'tradition'],
                properties: {
                    interpretation: {
                        bsonType: 'string',
                        minLength: 20,
                        maxLength: 2000
                    },
                    tradition: {
                        bsonType: 'string',
                        maxLength: 100,
                        description: 'Философская традиция'
                    },
                    philosophers: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'string',
                            maxLength: 100
                        },
                        description: 'Философы, придерживающиеся этой интерпретации'
                    },
                    period: {
                        bsonType: 'string',
                        maxLength: 100,
                        description: 'Исторический период'
                    }
                }
            },
            description: 'Альтернативные трактовки категории'
        },
        
        // Исторические аналоги
        historical_analogues: {
            bsonType: 'array',
            maxItems: 20,
            items: {
                bsonType: 'object',
                required: ['name', 'tradition', 'description'],
                properties: {
                    name: {
                        bsonType: 'string',
                        maxLength: 200,
                        description: 'Название аналога'
                    },
                    tradition: {
                        bsonType: 'string',
                        maxLength: 100,
                        description: 'Философская традиция'
                    },
                    description: {
                        bsonType: 'string',
                        maxLength: 1000,
                        description: 'Описание аналога'
                    },
                    period: {
                        bsonType: 'string',
                        maxLength: 100,
                        description: 'Исторический период'
                    },
                    sources: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            required: ['title'],
                            properties: {
                                author: {
                                    bsonType: 'string',
                                    maxLength: 200
                                },
                                title: {
                                    bsonType: 'string',
                                    maxLength: 500
                                },
                                year: {
                                    bsonType: 'int'
                                },
                                quote: {
                                    bsonType: 'string',
                                    maxLength: 1000
                                }
                            }
                        },
                        description: 'Источники информации'
                    },
                    similarity_score: {
                        bsonType: 'double',
                        minimum: 0,
                        maximum: 1,
                        description: 'Степень схожести (0-1)'
                    }
                }
            },
            description: 'Исторические аналоги категории'
        },
        
        // Связанные концепты
        related_concepts: {
            bsonType: 'array',
            maxItems: 30,
            items: {
                bsonType: 'object',
                required: ['name', 'relation_type'],
                properties: {
                    concept_id: {
                        bsonType: 'string',
                        pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
                        description: 'UUID связанного концепта (если есть в системе)'
                    },
                    name: {
                        bsonType: 'string',
                        maxLength: 200,
                        description: 'Название связанного концепта'
                    },
                    relation_type: {
                        enum: Object.values(RELATION_TYPES),
                        description: 'Тип отношения'
                    },
                    description: {
                        bsonType: 'string',
                        maxLength: 500,
                        description: 'Описание связи'
                    },
                    strength: {
                        bsonType: 'double',
                        minimum: 0,
                        maximum: 1,
                        description: 'Сила связи (0-1)'
                    }
                }
            },
            description: 'Связанные философские концепты'
        },
        
        // Ключевые слова и метаданные
        keywords: {
            bsonType: 'array',
            uniqueItems: true,
            maxItems: 50,
            items: {
                bsonType: 'string',
                maxLength: 50
            },
            description: 'Ключевые слова для поиска'
        },
        
        // Примеры использования
        usage_examples: {
            bsonType: 'array',
            maxItems: 10,
            items: {
                bsonType: 'object',
                required: ['context', 'example'],
                properties: {
                    context: {
                        bsonType: 'string',
                        maxLength: 200,
                        description: 'Контекст использования'
                    },
                    example: {
                        bsonType: 'string',
                        maxLength: 1000,
                        description: 'Пример использования'
                    },
                    source: {
                        bsonType: 'string',
                        maxLength: 500,
                        description: 'Источник примера'
                    }
                }
            },
            description: 'Примеры использования категории'
        },
        
        // Критика и контраргументы
        critiques: {
            bsonType: 'array',
            maxItems: 15,
            items: {
                bsonType: 'object',
                required: ['critique', 'author'],
                properties: {
                    critique: {
                        bsonType: 'string',
                        maxLength: 2000,
                        description: 'Текст критики'
                    },
                    author: {
                        bsonType: 'string',
                        maxLength: 200,
                        description: 'Автор критики'
                    },
                    tradition: {
                        bsonType: 'string',
                        maxLength: 100,
                        description: 'Философская традиция критика'
                    },
                    response: {
                        bsonType: 'string',
                        maxLength: 2000,
                        description: 'Возможный ответ на критику'
                    }
                }
            },
            description: 'Критические замечания к категории'
        },
        
        // Библиография
        references: {
            bsonType: 'array',
            maxItems: 50,
            items: {
                bsonType: 'object',
                required: ['author', 'title'],
                properties: {
                    author: {
                        bsonType: 'string',
                        maxLength: 200
                    },
                    title: {
                        bsonType: 'string',
                        maxLength: 500
                    },
                    year: {
                        bsonType: 'int',
                        minimum: -500,
                        maximum: 2100
                    },
                    publisher: {
                        bsonType: 'string',
                        maxLength: 200
                    },
                    pages: {
                        bsonType: 'string',
                        maxLength: 50
                    },
                    url: {
                        bsonType: 'string',
                        pattern: '^https?://[\\w\\-]+(\\.[\\w\\-]+)+[/#?]?.*$'
                    },
                    doi: {
                        bsonType: 'string',
                        pattern: '^10\\.\\d{4,}/[-._;()/:a-zA-Z0-9]+$'
                    },
                    relevance: {
                        bsonType: 'string',
                        maxLength: 500,
                        description: 'Релевантность источника для понимания категории'
                    }
                }
            },
            description: 'Библиографические ссылки'
        },
        
        // Метаданные генерации
        claude_generation_id: {
            bsonType: 'string',
            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            description: 'ID взаимодействия с Claude при генерации'
        },
        generation_metadata: {
            bsonType: 'object',
            properties: {
                prompt_type: {
                    bsonType: 'string',
                    description: 'Тип использованного промпта'
                },
                model_version: {
                    bsonType: 'string',
                    description: 'Версия модели Claude'
                },
                generation_date: {
                    bsonType: 'date'
                },
                quality_score: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1
                }
            }
        },
        
        // Временные метки и версионирование
        created_at: {
            bsonType: 'date',
            description: 'Дата создания описания'
        },
        last_modified: {
            bsonType: 'date',
            description: 'Дата последнего изменения'
        },
        modified_by: {
            bsonType: 'string',
            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            description: 'UUID пользователя, внесшего последние изменения'
        },
        version: {
            bsonType: 'int',
            minimum: 1,
            description: 'Версия описания'
        },
        
        // Статус и модерация
        status: {
            enum: ['draft', 'published', 'archived', 'under_review'],
            description: 'Статус описания'
        },
        review_notes: {
            bsonType: 'array',
            items: {
                bsonType: 'object',
                required: ['note', 'reviewer_id', 'date'],
                properties: {
                    note: {
                        bsonType: 'string',
                        maxLength: 1000
                    },
                    reviewer_id: {
                        bsonType: 'string',
                        pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    },
                    date: {
                        bsonType: 'date'
                    }
                }
            }
        }
    },
    additionalProperties: false
};

// Индексы для коллекции
const categoryDescriptionIndexes = [
    // Уникальный индекс по category_id
    {
        keys: { category_id: 1 },
        options: { 
            name: 'idx_category_id',
            unique: true 
        }
    },
    
    // Индекс для поиска по Claude generation
    {
        keys: { claude_generation_id: 1 },
        options: { 
            name: 'idx_claude_generation_id',
            sparse: true
        }
    },
    
    // Индекс по дате модификации
    {
        keys: { last_modified: -1 },
        options: { name: 'idx_last_modified' }
    },
    
    // Составной индекс для версионирования
    {
        keys: { category_id: 1, version: -1 },
        options: { name: 'idx_category_version' }
    },
    
    // Индекс по статусу
    {
        keys: { status: 1, last_modified: -1 },
        options: { name: 'idx_status_modified' }
    },
    
    // Полнотекстовый поиск
    {
        keys: { 
            detailed_description: 'text',
            keywords: 'text'
        },
        options: { 
            name: 'idx_fulltext_search',
            weights: { 
                detailed_description: 10,
                keywords: 5
            },
            default_language: 'russian'
        }
    },
    
    // Индекс для поиска по связанным концептам
    {
        keys: { 'related_concepts.name': 1 },
        options: { name: 'idx_related_concepts' }
    },
    
    // Индекс для поиска по историческим аналогам
    {
        keys: { 'historical_analogues.tradition': 1 },
        options: { name: 'idx_historical_traditions' }
    }
];

// Примеры запросов
const categoryDescriptionQueries = {
    // Получить описание категории
    getByCategory: (categoryId) => ({
        category_id: categoryId,
        status: 'published'
    }),
    
    // Получить последнюю версию описания
    getLatestVersion: (categoryId) => ({
        category_id: categoryId
    }),
    
    // Поиск по ключевым словам
    searchByKeywords: (keywords) => ({
        $text: { $search: keywords.join(' ') },
        status: 'published'
    }),
    
    // Получить описания с определенными историческими аналогами
    getByHistoricalTradition: (tradition) => ({
        'historical_analogues.tradition': tradition,
        status: 'published'
    }),
    
    // Получить описания, требующие проверки
    getForReview: () => ({
        status: 'under_review'
    }),
    
    // Агрегация для анализа связей
    analyzeRelations: () => [
        { $match: { status: 'published' } },
        { $unwind: '$related_concepts' },
        {
            $group: {
                _id: '$related_concepts.relation_type',
                count: { $sum: 1 },
                avgStrength: { $avg: '$related_concepts.strength' },
                concepts: { 
                    $push: {
                        name: '$related_concepts.name',
                        strength: '$related_concepts.strength'
                    }
                }
            }
        },
        { $sort: { count: -1 } }
    ]
};

// Экспорт схемы и вспомогательных объектов
module.exports = {
    schema: categoryDescriptionSchema,
    indexes: categoryDescriptionIndexes,
    relationTypes: RELATION_TYPES,
    queries: categoryDescriptionQueries,
    
    // Функция валидации
    validateDescription: (description) => {
        if (!description.category_id || !description.detailed_description) {
            return { valid: false, error: 'Missing required fields' };
        }
        
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        if (!uuidPattern.test(description.category_id)) {
            return { valid: false, error: 'Invalid category_id format' };
        }
        
        if (description.detailed_description.length < 50 || 
            description.detailed_description.length > 10000) {
            return { valid: false, error: 'Description length must be between 50 and 10000 characters' };
        }
        
        return { valid: true };
    },
    
    // Подготовка к сохранению
    prepareForSave: (description) => {
        const now = new Date();
        
        // Автоматическое создание краткого описания
        if (!description.short_description && description.detailed_description) {
            description.short_description = description.detailed_description
                .substring(0, 497)
                .trim() + '...';
        }
        
        return {
            ...description,
            created_at: description.created_at || now,
            last_modified: now,
            version: description.version || 1,
            status: description.status || 'draft'
        };
    }
};