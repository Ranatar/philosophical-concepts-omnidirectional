-- migrations/00001_create_users_table_down.sql

-- Удаление триггера
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Удаление функции
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Удаление таблицы
DROP TABLE IF EXISTS users;

-- Удаление типа
DROP TYPE IF EXISTS user_role;
