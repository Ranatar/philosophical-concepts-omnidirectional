-- migrations/00006_create_concept_traditions_table.sql

CREATE TABLE concept_traditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concept_id UUID NOT NULL,
    tradition_id UUID NOT NULL,
    relationship_strength DECIMAL(3,2) CHECK (relationship_strength BETWEEN 0 AND 1),
    description TEXT,
    historical_context TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Внешние ключи
    CONSTRAINT fk_concept_traditions_concept
        FOREIGN KEY (concept_id)
        REFERENCES concepts(concept_id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_concept_traditions_tradition
        FOREIGN KEY (tradition_id)
        REFERENCES traditions(tradition_id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_concept_traditions_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT,
    
    -- Уникальность связи
    CONSTRAINT unique_concept_tradition
        UNIQUE (concept_id, tradition_id)
);

-- Индексы
CREATE INDEX idx_concept_traditions_concept_id ON concept_traditions(concept_id);
CREATE INDEX idx_concept_traditions_tradition_id ON concept_traditions(tradition_id);
CREATE INDEX idx_concept_traditions_relationship_strength ON concept_traditions(relationship_strength);
CREATE INDEX idx_concept_traditions_created_by ON concept_traditions(created_by);

-- Триггер для обновления updated_at
CREATE TRIGGER update_concept_traditions_updated_at
    BEFORE UPDATE ON concept_traditions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Комментарии
COMMENT ON TABLE concept_traditions IS 'Связи между концепциями и философскими традициями';
COMMENT ON COLUMN concept_traditions.relationship_strength IS 'Сила связи с традицией (0-1)';
COMMENT ON COLUMN concept_traditions.historical_context IS 'Исторический контекст связи';
