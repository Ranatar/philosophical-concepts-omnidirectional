-- migrations/00004_create_traditions_table.sql

CREATE TABLE traditions (
    tradition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    time_period VARCHAR(100),
    description TEXT,
    key_principles TEXT[],
    geographical_origin VARCHAR(100),
    key_figures UUID[],
    parent_tradition UUID,
    child_traditions UUID[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Внешние ключи
    CONSTRAINT fk_traditions_parent
        FOREIGN KEY (parent_tradition)
        REFERENCES traditions(tradition_id)
        ON DELETE SET NULL
);

-- Индексы
CREATE INDEX idx_traditions_name ON traditions(name);
CREATE INDEX idx_traditions_time_period ON traditions(time_period);
CREATE INDEX idx_traditions_parent_tradition ON traditions(parent_tradition);
CREATE INDEX idx_traditions_key_figures ON traditions USING GIN(key_figures);

-- Триггер для обновления updated_at
CREATE TRIGGER update_traditions_updated_at
    BEFORE UPDATE ON traditions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Комментарии
COMMENT ON TABLE traditions IS 'Философские традиции и школы';
COMMENT ON COLUMN traditions.tradition_id IS 'Уникальный идентификатор традиции';
COMMENT ON COLUMN traditions.key_principles IS 'Основные принципы традиции';
COMMENT ON COLUMN traditions.geographical_origin IS 'Географическое происхождение традиции';
COMMENT ON COLUMN traditions.key_figures IS 'Ключевые философы традиции';
