-- migrations/00005_create_concept_philosophers_table.sql

CREATE TABLE concept_philosophers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concept_id UUID NOT NULL,
    philosopher_id UUID NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    relationship_strength DECIMAL(3,2) CHECK (relationship_strength BETWEEN 0 AND 1),
    description TEXT,
    citations TEXT[],
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Внешние ключи
    CONSTRAINT fk_concept_philosophers_concept
        FOREIGN KEY (concept_id)
        REFERENCES concepts(concept_id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_concept_philosophers_philosopher
        FOREIGN KEY (philosopher_id)
        REFERENCES philosophers(philosopher_id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_concept_philosophers_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT,
    
    -- Уникальность связи
    CONSTRAINT unique_concept_philosopher
        UNIQUE (concept_id, philosopher_id, relationship_type)
);

-- Индексы
CREATE INDEX idx_concept_philosophers_concept_id ON concept_philosophers(concept_id);
CREATE INDEX idx_concept_philosophers_philosopher_id ON concept_philosophers(philosopher_id);
CREATE INDEX idx_concept_philosophers_relationship_type ON concept_philosophers(relationship_type);
CREATE INDEX idx_concept_philosophers_created_by ON concept_philosophers(created_by);

-- Триггер для обновления updated_at
CREATE TRIGGER update_concept_philosophers_updated_at
    BEFORE UPDATE ON concept_philosophers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Комментарии
COMMENT ON TABLE concept_philosophers IS 'Связи между концепциями и философами';
COMMENT ON COLUMN concept_philosophers.relationship_type IS 'Тип связи (автор, влияние, критика и т.д.)';
COMMENT ON COLUMN concept_philosophers.relationship_strength IS 'Сила связи (0-1)';
COMMENT ON COLUMN concept_philosophers.citations IS 'Цитаты и ссылки, подтверждающие связь';
