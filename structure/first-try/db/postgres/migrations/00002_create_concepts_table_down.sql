-- migrations/00002_create_concepts_table_down.sql

-- Удаление триггера
DROP TRIGGER IF EXISTS update_concepts_last_modified ON concepts;

-- Удаление таблицы
DROP TABLE IF EXISTS concepts;
