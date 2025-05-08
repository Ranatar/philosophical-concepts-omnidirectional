-- migrations/00007_create_user_activity_table.sql

-- Создание типа для активности пользователя
CREATE TYPE activity_type AS ENUM (
    'login', 'logout', 'create_concept', 'update_concept', 'delete_concept',
    'create_graph', 'update_graph', 'create_thesis', 'update_thesis',
    'synthesis_start', 'synthesis_complete', 'claude_interaction',
    'export_data', 'import_data', 'share_concept', 'view_concept'
);

CREATE TABLE user_activity (
    activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    activity_type activity_type NOT NULL,
    target_id UUID,
    target_type VARCHAR(50),
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    
    -- Внешние ключи
    CONSTRAINT fk_user_activity_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- Индексы для аналитики
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_activity_date ON user_activity(activity_date);
CREATE INDEX idx_user_activity_target_id ON user_activity(target_id);
CREATE INDEX idx_user_activity_user_date ON user_activity(user_id, activity_date);

-- Индекс для поиска по JSONB
CREATE INDEX idx_user_activity_details ON user_activity USING GIN(details);

-- Комментарии
COMMENT ON TABLE user_activity IS 'Журнал активности пользователей';
COMMENT ON COLUMN user_activity.target_id IS 'ID объекта, с которым производилось действие';
COMMENT ON COLUMN user_activity.target_type IS 'Тип объекта (concept, graph, thesis и т.д.)';
COMMENT ON COLUMN user_activity.details IS 'Дополнительные детали активности в JSON';
