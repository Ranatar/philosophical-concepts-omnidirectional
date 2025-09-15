/**
 * MongoDB Schema: Theses
 * Схема для коллекции философских тезисов
 */

// Типы тезисов
const THESIS_TYPES = {
    ONTOLOGICAL: 'ontological',          // Онтологические тезисы
    EPISTEMOLOGICAL: 'epistemological',  // Эпистемологические тезисы
    AXIOLOGICAL: 'axiological',          // Аксиологические тезисы
    ETHICAL: 'ethical',                  // Этические тезисы
    AESTHETIC: 'aesthetic',              // Эстетические тезисы
    PRACTICAL: 'practical',              // Практические тезисы
    METHODOLOGICAL: 'methodological',    // Методологические тезисы
    ANTHROPOLOGICAL: 'anthropological',  // Антропологические тезисы
    SOCIAL: 'social',                    // Социальные тезисы
    POLITICAL: 'political'               // Политические тезисы
};

// Стили изложения
const THESIS_STYLES = {
    ACADEMIC: 'academic',        // Академический стиль
    POPULAR: 'popular',          // Популярный стиль
    APHORISTIC: 'aphoristic',   // Афористичный стиль
    DIALECTICAL: 'dialectical',  // Диалектический стиль
    ANALYTICAL: 'analytical'     // Аналитический стиль
};

// Схема валидации для MongoDB
const thesisSchema = {
    bsonType: 'object',
    required: ['concept_id', 'type', 'content', 'style', 'created_at'],
    properties: {
        // Основные поля
        thesis_id: {
            bsonType: 'objectId',
            description: 'Уникальный идентификатор тезиса'
        },
        concept_id: {
            bsonType: 'string',
            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            description: 'UUID концепции, к которой относится тезис'
        },
        type: {
            enum: Object.values(THESIS_TYPES),
            description: 'Тип философского тезиса'
        },
        content: {
            bsonType: 'string',
            minLength: 10,
            maxLength: 5000,
            description: 'Содержание тезиса'
        },
        
        // Связи и контекст
        related_categories: {
            bsonType: 'array',
            uniqueItems: true,
            maxItems: 20,
            items: {
                bsonType: 'string',
                pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
                description: 'UUID связанной категории'
            },
            description: 'Массив UUID категорий, связанных с тезисом'
        },
        
        // Стиль и форматирование
        style: {
            enum: Object.values(THESIS_STYLES),
            description: 'Стиль изложения тезиса'
        },
        
        // Параметры генерации (для тезисов, созданных Claude)
        generation_parameters: {
            bsonType: 'object',
            properties: {
                temperature: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 2,
                    description: 'Температура генерации (0-2)'
                },
                max_tokens: {
                    bsonType: 'int',
                    minimum: 1,
                    maximum: 4000,
                    description: 'Максимальное количество токенов'
                },
                prompt_template: {
                    bsonType: 'string',
                    description: 'Использованный шаблон промпта'
                },
                model: {
                    bsonType: 'string',
                    description: 'Модель Claude, использованная для генерации'
                },
                custom_parameters: {
                    bsonType: 'object',
                    description: 'Дополнительные параметры генерации'
                }
            },
            description: 'Параметры, использованные при генерации тезиса'
        },
        
        // Метрики качества
        quality_metrics: {
            bsonType: 'object',
            properties: {
                clarity: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1,
                    description: 'Ясность изложения (0-1)'
                },
                coherence: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1,
                    description: 'Связность и последовательность (0-1)'
                },
                relevance: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1,
                    description: 'Релевантность концепции (0-1)'
                },
                depth: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1,
                    description: 'Глубина философского анализа (0-1)'
                },
                originality: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1,
                    description: 'Оригинальность мысли (0-1)'
                }
            },
            description: 'Метрики качества тезиса'
        },
        
        // Временные метки
        created_at: {
            bsonType: 'date',
            description: 'Дата и время создания тезиса'
        },
        updated_at: {
            bsonType: 'date',
            description: 'Дата и время последнего обновления'
        },
        
        // Для синтезированных тезисов
        parent_theses: {
            bsonType: 'array',
            uniqueItems: true,
            items: {
                bsonType: 'objectId',
                description: 'ObjectId родительского тезиса'
            },
            description: 'Массив ObjectId родительских тезисов (для синтезированных)'
        },
        synthesis_method: {
            enum: ['dialectical', 'comparative', 'integrative', 'critical', 'constructive'],
            description: 'Метод синтеза, использованный для создания тезиса'
        },
        
        // Версионирование
        version: {
            bsonType: 'int',
            minimum: 1,
            description: 'Версия тезиса'
        },
        previous_version_id: {
            bsonType: 'objectId',
            description: 'ObjectId предыдущей версии тезиса'
        },
        
        // Статус и модерация
        is_active: {
            bsonType: 'bool',
            description: 'Активен ли тезис'
        },
        moderation_status: {
            enum: ['pending', 'approved', 'rejected', 'needs_revision'],
            description: 'Статус модерации'
        },
        moderation_notes: {
            bsonType: 'string',
            maxLength: 1000,
            description: 'Примечания модератора'
        },
        
        // Дополнительные метаданные
        tags: {
            bsonType: 'array',
            uniqueItems: true,
            maxItems: 30,
            items: {
                bsonType: 'string',
                maxLength: 50
            },
            description: 'Теги для категоризации и поиска'
        },
        references: {
            bsonType: 'array',
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
                    page: {
                        bsonType: 'string',
                        maxLength: 50
                    },
                    url: {
                        bsonType: 'string',
                        pattern: '^https?://[\\w\\-]+(\\.[\\w\\-]+)+[/#?]?.*$'
                    }
                }
            },
            description: 'Библиографические ссылки'
        },
        
        // Статистика использования
        usage_stats: {
            bsonType: 'object',
            properties: {
                view_count: {
                    bsonType: 'int',
                    minimum: 0
                },
                cite_count: {
                    bsonType: 'int',
                    minimum: 0
                },
                synthesis_count: {
                    bsonType: 'int',
                    minimum: 0,
                    description: 'Количество раз, когда тезис использовался в синтезе'
                },
                last_viewed_at: {
                    bsonType: 'date'
                }
            },
            description: 'Статистика использования тезиса'
        }
    },
    additionalProperties: false
};

// Индексы для коллекции
const thesisIndexes = [
    // Основные индексы для поиска
    {
        keys: { concept_id: 1 },
        options: { name: 'idx_concept_id' }
    },
    {
        keys: { concept_id: 1, type: 1 },
        options: { name: 'idx_concept_type' }
    },
    {
        keys: { related_categories: 1 },
        options: { name: 'idx_related_categories' }
    },
    
    // Индексы для временных запросов
    {
        keys: { created_at: -1 },
        options: { name: 'idx_created_at' }
    },
    {
        keys: { updated_at: -1 },
        options: { 
            name: 'idx_updated_at',
            sparse: true
        }
    },
    
    // Индекс для синтезированных тезисов
    {
        keys: { parent_theses: 1 },
        options: { 
            name: 'idx_parent_theses',
            sparse: true
        }
    },
    
    // Полнотекстовый поиск
    {
        keys: { content: 'text' },
        options: { 
            name: 'idx_content_text',
            weights: { content: 10 },
            default_language: 'russian'
        }
    },
    
    // Составной индекс для фильтрации
    {
        keys: { 
            is_active: 1, 
            moderation_status: 1, 
            type: 1, 
            created_at: -1 
        },
        options: { name: 'idx_active_moderated_typed' }
    },
    
    // Индекс для версионирования
    {
        keys: { version: -1, concept_id: 1 },
        options: { name: 'idx_version_concept' }
    },
    
    // Индекс для тегов
    {
        keys: { tags: 1 },
        options: { 
            name: 'idx_tags',
            sparse: true
        }
    }
];

// Примеры запросов
const thesisQueries = {
    // Получить все активные тезисы концепции
    getActiveThesesByConcept: (conceptId) => ({
        concept_id: conceptId,
        is_active: true,
        moderation_status: 'approved'
    }),
    
    // Получить тезисы определенного типа
    getThesesByType: (conceptId, type) => ({
        concept_id: conceptId,
        type: type,
        is_active: true
    }),
    
    // Получить тезисы, связанные с категорией
    getThesesByCategory: (categoryId) => ({
        related_categories: categoryId,
        is_active: true
    }),
    
    // Поиск по тексту
    searchTheses: (searchText) => ({
        $text: { $search: searchText },
        is_active: true,
        moderation_status: 'approved'
    }),
    
    // Получить синтезированные тезисы
    getSynthesizedTheses: (parentThesisId) => ({
        parent_theses: parentThesisId
    }),
    
    // Получить последние тезисы
    getRecentTheses: (limit = 10) => ({
        is_active: true,
        moderation_status: 'approved'
    }),
    
    // Агрегация для статистики по типам
    getTypeStatistics: (conceptId) => [
        {
            $match: {
                concept_id: conceptId,
                is_active: true
            }
        },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                avgClarity: { $avg: '$quality_metrics.clarity' },
                avgRelevance: { $avg: '$quality_metrics.relevance' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]
};

// Экспорт схемы и вспомогательных объектов
module.exports = {
    schema: thesisSchema,
    indexes: thesisIndexes,
    types: THESIS_TYPES,
    styles: THESIS_STYLES,
    queries: thesisQueries,
    
    // Вспомогательные функции
    validateThesis: (thesis) => {
        // Базовая валидация
        if (!thesis.concept_id || !thesis.type || !thesis.content || !thesis.style) {
            return { valid: false, error: 'Missing required fields' };
        }
        
        // Валидация UUID
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        if (!uuidPattern.test(thesis.concept_id)) {
            return { valid: false, error: 'Invalid concept_id format' };
        }
        
        // Валидация типа
        if (!Object.values(THESIS_TYPES).includes(thesis.type)) {
            return { valid: false, error: 'Invalid thesis type' };
        }
        
        // Валидация стиля
        if (!Object.values(THESIS_STYLES).includes(thesis.style)) {
            return { valid: false, error: 'Invalid thesis style' };
        }
        
        // Валидация длины контента
        if (thesis.content.length < 10 || thesis.content.length > 5000) {
            return { valid: false, error: 'Content length must be between 10 and 5000 characters' };
        }
        
        return { valid: true };
    },
    
    // Функция для подготовки тезиса к сохранению
    prepareForSave: (thesis) => {
        const now = new Date();
        
        return {
            ...thesis,
            created_at: thesis.created_at || now,
            updated_at: now,
            version: thesis.version || 1,
            is_active: thesis.is_active !== false,
            moderation_status: thesis.moderation_status || 'pending',
            usage_stats: thesis.usage_stats || {
                view_count: 0,
                cite_count: 0,
                synthesis_count: 0
            }
        };
    }
};