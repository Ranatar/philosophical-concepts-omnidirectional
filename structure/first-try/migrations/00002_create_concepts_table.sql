-- migrations/00002_create_concepts_table.sql

CREATE TABLE concepts (
    concept_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Информация о синтезе
    is_synthesis BOOLEAN DEFAULT false,
    parent_concepts UUID[] DEFAULT '{}',
    synthesis_method VARCHAR(50),
    synthesis_parameters JSONB DEFAULT '{}',
    
    -- Характеристики концепции
    focus VARCHAR(100),
    innovation_degree INTEGER CHECK (innovation_degree BETWEEN 1 AND 10),
    certainty_level INTEGER CHECK (certainty_level BETWEEN 1 AND 10),
    
    -- Исторический контекст
    historical_context TEXT,
    time_period VARCHAR(100),
    
    -- Статус и видимость
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_public BOOLEAN DEFAULT false,
    
    -- Метаданные
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    
    -- Внешние ключи
    CONSTRAINT fk_concepts_creator
        FOREIGN KEY (creator_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
);

-- Индексы для оптимизации
CREATE INDEX idx_concepts_creator_id ON concepts(creator_id);
CREATE INDEX idx_concepts_name ON concepts(name);
CREATE INDEX idx_concepts_status ON concepts(status);
CREATE INDEX idx_concepts_is_public ON concepts(is_public);
CREATE INDEX idx_concepts_creation_date ON concepts(creation_date);
CREATE INDEX idx_concepts_tags ON concepts USING GIN(tags);
CREATE INDEX idx_concepts_parent_concepts ON concepts USING GIN(parent_concepts);
CREATE INDEX idx_concepts_is_synthesis ON concepts(is_synthesis) WHERE is_synthesis = true;

-- Триггер для обновления last_modified
CREATE TRIGGER update_concepts_last_modified
    BEFORE UPDATE ON concepts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Комментарии
COMMENT ON TABLE concepts IS 'Метаданные философских концепций';
COMMENT ON COLUMN concepts.concept_id IS 'Уникальный идентификатор концепции';
COMMENT ON COLUMN concepts.creator_id IS 'ID создателя концепции';
COMMENT ON COLUMN concepts.is_synthesis IS 'Является ли концепция результатом синтеза';
COMMENT ON COLUMN concepts.parent_concepts IS 'Массив ID родительских концепций';
COMMENT ON COLUMN concepts.innovation_degree IS 'Степень инновационности (1-10)';
COMMENT ON COLUMN concepts.certainty_level IS 'Уровень определённости (1-10)';
COMMENT ON COLUMN concepts.tags IS 'Теги для категоризации и поиска';
