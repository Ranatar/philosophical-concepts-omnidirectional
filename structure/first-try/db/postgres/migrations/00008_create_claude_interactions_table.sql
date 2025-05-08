-- migrations/00008_create_claude_interactions_table.sql

-- Создание типа для запросов к Claude
CREATE TYPE claude_query_type AS ENUM (
    'graph_validation', 'graph_enrichment', 'thesis_generation',
    'synthesis_analysis', 'name_analysis', 'historical_context',
    'practical_application', 'dialogue_generation', 'evolution_analysis',
    'general_query'
);

CREATE TABLE claude_interactions (
    interaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    concept_id UUID,
    query_type claude_query_type NOT NULL,
    query_content TEXT NOT NULL,
    response_content TEXT,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_time FLOAT,
    token_count INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    model_version VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    
    -- Внешние ключи
    CONSTRAINT fk_claude_interactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_claude_interactions_concept
        FOREIGN KEY (concept_id)
        REFERENCES concepts(concept_id)
        ON DELETE SET NULL
);

-- Индексы
CREATE INDEX idx_claude_interactions_user_id ON claude_interactions(user_id);
CREATE INDEX idx_claude_interactions_concept_id ON claude_interactions(concept_id);
CREATE INDEX idx_claude_interactions_query_type ON claude_interactions(query_type);
CREATE INDEX idx_claude_interactions_interaction_date ON claude_interactions(interaction_date);
CREATE INDEX idx_claude_interactions_status ON claude_interactions(status);
CREATE INDEX idx_claude_interactions_processing_time ON claude_interactions(processing_time);

-- Комментарии
COMMENT ON TABLE claude_interactions IS 'История взаимодействий с Claude API';
COMMENT ON COLUMN claude_interactions.query_type IS 'Тип запроса к Claude';
COMMENT ON COLUMN claude_interactions.processing_time IS 'Время обработки запроса в секундах';
COMMENT ON COLUMN claude_interactions.token_count IS 'Количество использованных токенов';
