/**
 * MongoDB Migration: Create Indexes
 * Description: Создание индексов для оптимизации запросов
 * Version: 00002
 * Date: 2024
 */

// Переключаемся на нужную базу данных
db = db.getSiblingDB('philosophy_concepts');

print('=== Starting MongoDB Indexes Creation ===');
print(`Database: ${db.getName()}`);
print(`Timestamp: ${new Date().toISOString()}`);

// Функция для безопасного создания индекса
function createIndexSafely(collection, keys, options = {}) {
    try {
        const indexName = options.name || Object.keys(keys).join('_');
        
        // Проверяем существование коллекции
        const collections = db.getCollectionNames();
        if (!collections.includes(collection)) {
            print(`✗ Collection '${collection}' does not exist, skipping index creation`);
            return false;
        }
        
        // Создаем индекс
        const result = db[collection].createIndex(keys, options);
        print(`✓ Created index '${indexName}' on collection '${collection}'`);
        return true;
    } catch (error) {
        // Проверяем, не является ли ошибка дубликатом индекса
        if (error.code === 86 || error.message.includes('already exists')) {
            print(`⚠ Index already exists on '${collection}': ${options.name || JSON.stringify(keys)}`);
            return true;
        }
        print(`✗ Error creating index on '${collection}': ${error}`);
        return false;
    }
}

// Счетчики для статистики
let indexesCreated = 0;
let indexesFailed = 0;

// ==========================================
// Индексы для коллекции theses
// ==========================================

print('\n--- Creating indexes for theses collection ---');

// Индекс по concept_id для быстрого поиска тезисов концепции
if (createIndexSafely('theses', 
    { concept_id: 1 }, 
    { name: 'idx_theses_concept_id' }
)) indexesCreated++;

// Составной индекс для фильтрации по концепции и типу
if (createIndexSafely('theses', 
    { concept_id: 1, type: 1 }, 
    { name: 'idx_theses_concept_type' }
)) indexesCreated++;

// Индекс по связанным категориям
if (createIndexSafely('theses', 
    { related_categories: 1 }, 
    { name: 'idx_theses_related_categories' }
)) indexesCreated++;

// Индекс по дате создания для сортировки
if (createIndexSafely('theses', 
    { created_at: -1 }, 
    { name: 'idx_theses_created_at' }
)) indexesCreated++;

// Индекс по родительским тезисам для синтезированных
if (createIndexSafely('theses', 
    { parent_theses: 1 }, 
    { 
        name: 'idx_theses_parent_theses',
        sparse: true // Только для документов с parent_theses
    }
)) indexesCreated++;

// Полнотекстовый индекс для поиска по содержанию
if (createIndexSafely('theses', 
    { content: 'text' }, 
    { 
        name: 'idx_theses_content_text',
        weights: { content: 10 },
        default_language: 'russian'
    }
)) indexesCreated++;

// ==========================================
// Индексы для коллекции categoryDescriptions
// ==========================================

print('\n--- Creating indexes for categoryDescriptions collection ---');

// Уникальный индекс по category_id (одно описание на категорию)
if (createIndexSafely('categoryDescriptions', 
    { category_id: 1 }, 
    { 
        name: 'idx_category_descriptions_category_id',
        unique: true 
    }
)) indexesCreated++;

// Индекс по claude_generation_id для отслеживания источника
if (createIndexSafely('categoryDescriptions', 
    { claude_generation_id: 1 }, 
    { 
        name: 'idx_category_descriptions_claude_id',
        sparse: true
    }
)) indexesCreated++;

// Индекс по дате модификации
if (createIndexSafely('categoryDescriptions', 
    { last_modified: -1 }, 
    { name: 'idx_category_descriptions_modified' }
)) indexesCreated++;

// ==========================================
// Индексы для коллекции relationshipDescriptions
// ==========================================

print('\n--- Creating indexes for relationshipDescriptions collection ---');

// Уникальный индекс по relationship_id
if (createIndexSafely('relationshipDescriptions', 
    { relationship_id: 1 }, 
    { 
        name: 'idx_relationship_descriptions_rel_id',
        unique: true 
    }
)) indexesCreated++;

// Индекс по claude_generation_id
if (createIndexSafely('relationshipDescriptions', 
    { claude_generation_id: 1 }, 
    { 
        name: 'idx_relationship_descriptions_claude_id',
        sparse: true
    }
)) indexesCreated++;

// ==========================================
// Индексы для коллекции conceptAnalyses
// ==========================================

print('\n--- Creating indexes for conceptAnalyses collection ---');

// Составной индекс по концепции и типу анализа
if (createIndexSafely('conceptAnalyses', 
    { concept_id: 1, analysis_type: 1 }, 
    { name: 'idx_concept_analyses_concept_type' }
)) indexesCreated++;

// Индекс по дате создания
if (createIndexSafely('conceptAnalyses', 
    { created_at: -1 }, 
    { name: 'idx_concept_analyses_created_at' }
)) indexesCreated++;

// ==========================================
// Индексы для коллекции dialogues
// ==========================================

print('\n--- Creating indexes for dialogues collection ---');

// Индекс по участвующим концепциям
if (createIndexSafely('dialogues', 
    { concept_ids: 1 }, 
    { name: 'idx_dialogues_concept_ids' }
)) indexesCreated++;

// Индекс по теме диалога
if (createIndexSafely('dialogues', 
    { topic: 1 }, 
    { name: 'idx_dialogues_topic' }
)) indexesCreated++;

// Индекс по дате генерации
if (createIndexSafely('dialogues', 
    { generated_at: -1 }, 
    { name: 'idx_dialogues_generated_at' }
)) indexesCreated++;

// ==========================================
// Индексы для коллекции historicalContexts
// ==========================================

print('\n--- Creating indexes for historicalContexts collection ---');

// Уникальный индекс по концепции (один контекст на концепцию)
if (createIndexSafely('historicalContexts', 
    { concept_id: 1 }, 
    { 
        name: 'idx_historical_contexts_concept_id',
        unique: true 
    }
)) indexesCreated++;

// Индекс по временному периоду
if (createIndexSafely('historicalContexts', 
    { time_period: 1 }, 
    { name: 'idx_historical_contexts_period' }
)) indexesCreated++;

// Индекс для поиска по влияниям
if (createIndexSafely('historicalContexts', 
    { 'influences.philosopher': 1 }, 
    { name: 'idx_historical_contexts_influences' }
)) indexesCreated++;

// ==========================================
// Индексы для коллекции practicalApplications
// ==========================================

print('\n--- Creating indexes for practicalApplications collection ---');

// Уникальный индекс по концепции
if (createIndexSafely('practicalApplications', 
    { concept_id: 1 }, 
    { 
        name: 'idx_practical_applications_concept_id',
        unique: true 
    }
)) indexesCreated++;

// Индекс по доменам применения
if (createIndexSafely('practicalApplications', 
    { 'domains.name': 1 }, 
    { name: 'idx_practical_applications_domains' }
)) indexesCreated++;

// Составной индекс для поиска по релевантности
if (createIndexSafely('practicalApplications', 
    { 'domains.name': 1, 'domains.relevance_score': -1 }, 
    { name: 'idx_practical_applications_domain_relevance' }
)) indexesCreated++;

// ==========================================
// Индексы для коллекции dialogueInterpretations
// ==========================================

print('\n--- Creating indexes for dialogueInterpretations collection ---');

// Индекс по участвующим концепциям
if (createIndexSafely('dialogueInterpretations', 
    { concept_ids: 1 }, 
    { name: 'idx_dialogue_interpretations_concepts' }
)) indexesCreated++;

// Полнотекстовый индекс для поиска по вопросу
if (createIndexSafely('dialogueInterpretations', 
    { philosophical_question: 'text' }, 
    { 
        name: 'idx_dialogue_interpretations_question_text',
        default_language: 'russian'
    }
)) indexesCreated++;

// Индекс по дате создания
if (createIndexSafely('dialogueInterpretations', 
    { created_at: -1 }, 
    { name: 'idx_dialogue_interpretations_created' }
)) indexesCreated++;

// ==========================================
// Индексы для коллекции conceptEvolutions
// ==========================================

print('\n--- Creating indexes for conceptEvolutions collection ---');

// Индекс по концепции
if (createIndexSafely('conceptEvolutions', 
    { concept_id: 1 }, 
    { name: 'idx_concept_evolutions_concept_id' }
)) indexesCreated++;

// Индекс по направлению эволюции
if (createIndexSafely('conceptEvolutions', 
    { evolution_direction: 1 }, 
    { name: 'idx_concept_evolutions_direction' }
)) indexesCreated++;

// Составной индекс для поиска по концепции и дате
if (createIndexSafely('conceptEvolutions', 
    { concept_id: 1, created_at: -1 }, 
    { name: 'idx_concept_evolutions_concept_date' }
)) indexesCreated++;

// ==========================================
// Индексы для коллекции generatedElements
// ==========================================

print('\n--- Creating indexes for generatedElements collection ---');

// Составной индекс по концепции и типу элемента
if (createIndexSafely('generatedElements', 
    { concept_id: 1, element_type: 1 }, 
    { name: 'idx_generated_elements_concept_type' }
)) indexesCreated++;

// Индекс по статусу одобрения
if (createIndexSafely('generatedElements', 
    { is_approved: 1 }, 
    { name: 'idx_generated_elements_approved' }
)) indexesCreated++;

// Индекс для поиска новых неодобренных элементов
if (createIndexSafely('generatedElements', 
    { is_new: 1, is_approved: 1 }, 
    { name: 'idx_generated_elements_new_pending' }
)) indexesCreated++;

// Индекс по дате создания
if (createIndexSafely('generatedElements', 
    { created_at: -1 }, 
    { name: 'idx_generated_elements_created' }
)) indexesCreated++;

// ==========================================
// Индексы для коллекции migrations
// ==========================================

print('\n--- Creating indexes for migrations collection ---');

// Уникальный индекс по версии
if (createIndexSafely('migrations', 
    { version: 1 }, 
    { 
        name: 'idx_migrations_version',
        unique: true 
    }
)) indexesCreated++;

// Индекс по статусу
if (createIndexSafely('migrations', 
    { status: 1 }, 
    { name: 'idx_migrations_status' }
)) indexesCreated++;

// ==========================================
// Создание TTL индексов для автоматического удаления старых данных
// ==========================================

print('\n--- Creating TTL indexes ---');

// TTL индекс для generatedElements - удаление отклоненных через 30 дней
if (createIndexSafely('generatedElements', 
    { approved_at: 1 }, 
    { 
        name: 'idx_generated_elements_ttl',
        expireAfterSeconds: 2592000, // 30 дней
        partialFilterExpression: { is_approved: false } // Только для отклоненных
    }
)) indexesCreated++;

// ==========================================
// Обновление метаданных миграции
// ==========================================

print('\n--- Recording Migration Metadata ---');

db.migrations.insertOne({
    version: '00002',
    name: 'create_indexes',
    description: 'Создание индексов для оптимизации запросов',
    applied_at: new Date(),
    status: 'completed',
    indexes_created: indexesCreated,
    indexes_failed: indexesFailed
});

// ==========================================
// Финальная статистика
// ==========================================

print('\n=== Migration Summary ===');
print(`Total indexes created: ${indexesCreated}`);
print(`Total indexes failed: ${indexesFailed}`);

// Показываем все индексы по коллекциям
print('\nIndexes by collection:');
db.getCollectionNames().forEach(collection => {
    if (collection.startsWith('system.')) return;
    
    const indexes = db[collection].getIndexes();
    if (indexes.length > 1) { // Больше чем только _id индекс
        print(`\n  ${collection}:`);
        indexes.forEach(idx => {
            if (idx.name !== '_id_') {
                print(`    - ${idx.name} on ${JSON.stringify(idx.key)}`);
            }
        });
    }
});

print('\n✓ Index creation completed successfully');
print(`Timestamp: ${new Date().toISOString()}`);