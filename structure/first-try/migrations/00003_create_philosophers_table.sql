-- migrations/00003_create_philosophers_table.sql

CREATE TABLE philosophers (
    philosopher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    birth_year INTEGER,
    death_year INTEGER,
    nationality VARCHAR(100),
    description TEXT,
    key_works TEXT[],
    influences TEXT[],
    influenced TEXT[],
    traditions JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ограничения
    CONSTRAINT philosophers_years_check CHECK (
        death_year IS NULL OR birth_year IS NULL OR death_year >= birth_year
    )
);

-- Индексы
CREATE INDEX idx_philosophers_name ON philosophers(name);
CREATE INDEX idx_philosophers_birth_year ON philosophers(birth_year);
CREATE INDEX idx_philosophers_death_year ON philosophers(death_year);
CREATE INDEX idx_philosophers_nationality ON philosophers(nationality);
CREATE INDEX idx_philosophers_traditions ON philosophers USING GIN(traditions);

-- Триггер для обновления updated_at
CREATE TRIGGER update_philosophers_updated_at
    BEFORE UPDATE ON philosophers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Комментарии
COMMENT ON TABLE philosophers IS 'Информация о философах';
COMMENT ON COLUMN philosophers.philosopher_id IS 'Уникальный идентификатор философа';
COMMENT ON COLUMN philosophers.key_works IS 'Основные работы философа';
COMMENT ON COLUMN philosophers.influences IS 'Философы, повлиявшие на данного философа';
COMMENT ON COLUMN philosophers.influenced IS 'Философы, на которых повлиял данный философ';
