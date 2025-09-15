/**
 * MongoDB Schema: Concept Analyses
 * Схема для коллекции анализов философских концепций
 */

// Типы анализов
const ANALYSIS_TYPES = {
    CRITICAL: 'critical',            // Критический анализ
    HISTORICAL: 'historical',        // Исторический анализ
    COMPARATIVE: 'comparative',      // Сравнительный анализ
    SYSTEMATIC: 'systematic',        // Систематический анализ
    APPLIED: 'applied',              // Прикладной анализ
    GENEALOGICAL: 'genealogical',    // Генеалогический анализ
    DECONSTRUCTIVE: 'deconstructive', // Деконструктивный анализ
    PHENOMENOLOGICAL: 'phenomenological', // Феноменологический анализ
    HERMENEUTICAL: 'hermeneutical'  // Герменевтический анализ
};

// Методологические подходы
const METHODOLOGICAL_APPROACHES = {
    ANALYTICAL: 'analytical',
    DIALECTICAL: 'dialectical',
    STRUCTURAL: 'structural',
    POSTSTRUCTURAL: 'poststructural',
    PRAGMATIC: 'pragmatic',
    CRITICAL_THEORY: 'critical_theory',
    SYSTEMS_THEORY: 'systems_theory'
};

// Схема валидации для MongoDB
const conceptAnalysisSchema = {
    bsonType: 'object',
    required: ['concept_id', 'analysis_type', 'content', 'created_at'],
    properties: {
        // Основные поля
        analysis_id: {
            bsonType: 'objectId',
            description: 'Уникальный идентификатор анализа'
        },
        concept_id: {
            bsonType: 'string',
            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            description: 'UUID анализируемой концепции'
        },
        
        // Тип и методология анализа
        analysis_type: {
            enum: Object.values(ANALYSIS_TYPES),
            description: 'Тип анализа'
        },
        methodological_approach: {
            enum: Object.values(METHODOLOGICAL_APPROACHES),
            description: 'Методологический подход'
        },
        
        // Метаданные концепции
        concept_info: {
            bsonType: 'object',
            required: ['name', 'description'],
            properties: {
                name: {
                    bsonType: 'string',
                    maxLength: 200
                },
                description: {
                    bsonType: 'string',
                    maxLength: 1000
                },
                creator: {
                    bsonType: 'string',
                    maxLength: 200
                },
                tradition: {
                    bsonType: 'string',
                    maxLength: 100
                }
            },
            description: 'Базовая информация о концепции'
        },
        
        // Основное содержание анализа
        content: {
            bsonType: 'string',
            minLength: 100,
            maxLength: 50000,
            description: 'Полное содержание анализа'
        },
        
        // Структурированные разделы анализа
        sections: {
            bsonType: 'array',
            maxItems: 20,
            items: {
                bsonType: 'object',
                required: ['title', 'content'],
                properties: {
                    title: {
                        bsonType: 'string',
                        maxLength: 200
                    },
                    content: {
                        bsonType: 'string',
                        maxLength: 10000
                    },
                    subsections: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'object',
                            required: ['title', 'content'],
                            properties: {
                                title: {
                                    bsonType: 'string',
                                    maxLength: 200
                                },
                                content: {
                                    bsonType: 'string',
                                    maxLength: 5000
                                }
                            }
                        }
                    }
                }
            },
            description: 'Структурированные разделы анализа'
        },
        
        // Ключевые выводы
        key_findings: {
            bsonType: 'array',
            maxItems: 15,
            items: {
                bsonType: 'object',
                required: ['finding', 'significance'],
                properties: {
                    finding: {
                        bsonType: 'string',
                        maxLength: 1000,
                        description: 'Описание вывода'
                    },
                    significance: {
                        enum: ['major', 'moderate', 'minor'],
                        description: 'Значимость вывода'
                    },
                    evidence: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'string',
                            maxLength: 500
                        },
                        description: 'Подтверждающие доказательства'
                    },
                    implications: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'string',
                            maxLength: 500
                        },
                        description: 'Последствия и импликации'
                    }
                }
            },
            description: 'Ключевые выводы анализа'
        },
        
        // Сильные и слабые стороны концепции
        strengths_weaknesses: {
            bsonType: 'object',
            properties: {
                strengths: {
                    bsonType: 'array',
                    maxItems: 20,
                    items: {
                        bsonType: 'object',
                        required: ['aspect', 'description'],
                        properties: {
                            aspect: {
                                bsonType: 'string',
                                maxLength: 200
                            },
                            description: {
                                bsonType: 'string',
                                maxLength: 1000
                            },
                            rating: {
                                bsonType: 'int',
                                minimum: 1,
                                maximum: 5
                            }
                        }
                    }
                },
                weaknesses: {
                    bsonType: 'array',
                    maxItems: 20,
                    items: {
                        bsonType: 'object',
                        required: ['aspect', 'description'],
                        properties: {
                            aspect: {
                                bsonType: 'string',
                                maxLength: 200
                            },
                            description: {
                                bsonType: 'string',
                                maxLength: 1000
                            },
                            severity: {
                                bsonType: 'int',
                                minimum: 1,
                                maximum: 5
                            },
                            possible_solutions: {
                                bsonType: 'array',
                                items: {
                                    bsonType: 'string',
                                    maxLength: 500
                                }
                            }
                        }
                    }
                },
                opportunities: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        required: ['opportunity', 'description'],
                        properties: {
                            opportunity: {
                                bsonType: 'string',
                                maxLength: 200
                            },
                            description: {
                                bsonType: 'string',
                                maxLength: 1000
                            },
                            potential_impact: {
                                enum: ['high', 'medium', 'low']
                            }
                        }
                    }
                },
                threats: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'object',
                        required: ['threat', 'description'],
                        properties: {
                            threat: {
                                bsonType: 'string',
                                maxLength: 200
                            },
                            description: {
                                bsonType: 'string',
                                maxLength: 1000
                            },
                            likelihood: {
                                enum: ['high', 'medium', 'low']
                            }
                        }
                    }
                }
            },
            description: 'SWOT-анализ концепции'
        },
        
        // Сравнения с другими концепциями
        comparisons: {
            bsonType: 'array',
            maxItems: 10,
            items: {
                bsonType: 'object',
                required: ['concept_name', 'similarities', 'differences'],
                properties: {
                    concept_id: {
                        bsonType: 'string',
                        pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    },
                    concept_name: {
                        bsonType: 'string',
                        maxLength: 200
                    },
                    tradition: {
                        bsonType: 'string',
                        maxLength: 100
                    },
                    similarities: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'string',
                            maxLength: 500
                        }
                    },
                    differences: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'string',
                            maxLength: 500
                        }
                    },
                    overall_similarity: {
                        bsonType: 'double',
                        minimum: 0,
                        maximum: 1
                    }
                }
            },
            description: 'Сравнения с другими концепциями'
        },
        
        // Рекомендации
        recommendations: {
            bsonType: 'array',
            maxItems: 15,
            items: {
                bsonType: 'object',
                required: ['recommendation', 'justification'],
                properties: {
                    recommendation: {
                        bsonType: 'string',
                        maxLength: 1000
                    },
                    justification: {
                        bsonType: 'string',
                        maxLength: 1500
                    },
                    priority: {
                        enum: ['high', 'medium', 'low']
                    },
                    target_audience: {
                        bsonType: 'array',
                        items: {
                            bsonType: 'string',
                            maxLength: 100
                        }
                    },
                    implementation_complexity: {
                        enum: ['simple', 'moderate', 'complex']
                    }
                }
            },
            description: 'Рекомендации по развитию или применению концепции'
        },
        
        // Параметры генерации
        generation_parameters: {
            bsonType: 'object',
            properties: {
                depth_level: {
                    enum: ['surface', 'intermediate', 'deep', 'comprehensive'],
                    description: 'Глубина анализа'
                },
                focus_areas: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'string',
                        maxLength: 100
                    },
                    description: 'Области фокуса анализа'
                },
                excluded_aspects: {
                    bsonType: 'array',
                    items: {
                        bsonType: 'string',
                        maxLength: 100
                    },
                    description: 'Исключенные аспекты'
                },
                target_length: {
                    bsonType: 'int',
                    minimum: 1000,
                    maximum: 50000
                }
            },
            description: 'Параметры, использованные при генерации анализа'
        },
        
        // Источники и ссылки
        sources: {
            bsonType: 'array',
            maxItems: 100,
            items: {
                bsonType: 'object',
                required: ['type', 'reference'],
                properties: {
                    type: {
                        enum: ['primary', 'secondary', 'tertiary'],
                        description: 'Тип источника'
                    },
                    reference: {
                        bsonType: 'string',
                        maxLength: 500
                    },
                    relevance: {
                        bsonType: 'string',
                        maxLength: 200
                    },
                    reliability: {
                        enum: ['high', 'medium', 'low', 'uncertain']
                    }
                }
            },
            description: 'Использованные источники'
        },
        
        // Метаданные Claude
        claude_generation_id: {
            bsonType: 'string',
            pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            description: 'ID взаимодействия с Claude'
        },
        
        // Временные метки
        created_at: {
            bsonType: 'date',
            description: 'Дата создания анализа'
        },
        updated_at: {
            bsonType: 'date',
            description: 'Дата последнего обновления'
        },
        
        // Метрики качества
        quality_metrics: {
            bsonType: 'object',
            properties: {
                comprehensiveness: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1
                },
                analytical_depth: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1
                },
                objectivity: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1
                },
                clarity: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1
                },
                usefulness: {
                    bsonType: 'double',
                    minimum: 0,
                    maximum: 1
                }
            }
        },
        
        // Статус и версионирование
        status: {
            enum: ['draft', 'in_review', 'published', 'archived'],
            description: 'Статус анализа'
        },
        version: {
            bsonType: 'int',
            minimum: 1,
            description: 'Версия анализа'
        },
        reviewer_notes: {
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
const conceptAnalysisIndexes = [
    // Составной индекс по концепции и типу анализа
    {
        keys: { concept_id: 1, analysis_type: 1 },
        options: { name: 'idx_concept_type' }
    },
    
    // Индекс по дате создания
    {
        keys: { created_at: -1 },
        options: { name: 'idx_created_at' }
    },
    
    // Индекс по статусу
    {
        keys: { status: 1, updated_at: -1 },
        options: { name: 'idx_status_updated' }
    },
    
    // Индекс по методологическому подходу
    {
        keys: { methodological_approach: 1 },
        options: { name: 'idx_methodology' }
    },
    
    // Полнотекстовый поиск по содержанию
    {
        keys: { content: 'text' },
        options: { 
            name: 'idx_content_text',
            default_language: 'russian'
        }
    },
    
    // Индекс по Claude generation
    {
        keys: { claude_generation_id: 1 },
        options: { 
            name: 'idx_claude_generation',
            sparse: true
        }
    },
    
    // Составной индекс для качественных анализов
    {
        keys: { 
            'quality_metrics.comprehensiveness': -1,
            'quality_metrics.analytical_depth': -1
        },
        options: { name: 'idx_quality_metrics' }
    }
];

// Примеры запросов
const conceptAnalysisQueries = {
    // Получить все анализы концепции
    getByConceptId: (conceptId) => ({
        concept_id: conceptId,
        status: 'published'
    }),
    
    // Получить анализ определенного типа
    getByType: (conceptId, analysisType) => ({
        concept_id: conceptId,
        analysis_type: analysisType,
        status: 'published'
    }),
    
    // Получить последние анализы
    getRecent: (limit = 10) => ({
        status: 'published'
    }),
    
    // Поиск по тексту
    searchByContent: (searchText) => ({
        $text: { $search: searchText },
        status: 'published'
    }),
    
    // Получить высококачественные анализы
    getHighQuality: (minScore = 0.8) => ({
        'quality_metrics.comprehensiveness': { $gte: minScore },
        'quality_metrics.analytical_depth': { $gte: minScore },
        status: 'published'
    }),
    
    // Агрегация для статистики по типам анализов
    getTypeStatistics: () => [
        { $match: { status: 'published' } },
        {
            $group: {
                _id: '$analysis_type',
                count: { $sum: 1 },
                avgComprehensiveness: { $avg: '$quality_metrics.comprehensiveness' },
                avgDepth: { $avg: '$quality_metrics.analytical_depth' },
                concepts: { $addToSet: '$concept_id' }
            }
        },
        { $sort: { count: -1 } }
    ]
};

// Экспорт схемы и вспомогательных объектов
module.exports = {
    schema: conceptAnalysisSchema,
    indexes: conceptAnalysisIndexes,
    analysisTypes: ANALYSIS_TYPES,
    methodologicalApproaches: METHODOLOGICAL_APPROACHES,
    queries: conceptAnalysisQueries,
    
    // Функция валидации
    validateAnalysis: (analysis) => {
        if (!analysis.concept_id || !analysis.analysis_type || !analysis.content) {
            return { valid: false, error: 'Missing required fields' };
        }
        
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        if (!uuidPattern.test(analysis.concept_id)) {
            return { valid: false, error: 'Invalid concept_id format' };
        }
        
        if (!Object.values(ANALYSIS_TYPES).includes(analysis.analysis_type)) {
            return { valid: false, error: 'Invalid analysis type' };
        }
        
        if (analysis.content.length < 100 || analysis.content.length > 50000) {
            return { valid: false, error: 'Content length must be between 100 and 50000 characters' };
        }
        
        return { valid: true };
    },
    
    // Подготовка к сохранению
    prepareForSave: (analysis) => {
        const now = new Date();
        
        return {
            ...analysis,
            created_at: analysis.created_at || now,
            updated_at: now,
            version: analysis.version || 1,
            status: analysis.status || 'draft',
            quality_metrics: analysis.quality_metrics || {
                comprehensiveness: 0,
                analytical_depth: 0,
                objectivity: 0,
                clarity: 0,
                usefulness: 0
            }
        };
    }
};