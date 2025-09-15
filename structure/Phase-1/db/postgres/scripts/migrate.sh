#!/bin/bash

# PostgreSQL Migration Script
# Скрипт для выполнения миграций базы данных PostgreSQL

set -e  # Выход при ошибке
set -o pipefail  # Выход при ошибке в пайплайне

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Конфигурация по умолчанию
MIGRATIONS_DIR="${MIGRATIONS_DIR:-/app/db/postgres/migrations}"
SEEDS_DIR="${SEEDS_DIR:-/app/db/postgres/seeds}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-philosophy_concepts}"
DB_USER="${DB_USER:-postgres}"
MIGRATION_TABLE="${MIGRATION_TABLE:-schema_migrations}"
DRY_RUN="${DRY_RUN:-false}"
FORCE="${FORCE:-false}"
DIRECTION="${DIRECTION:-up}"
TARGET_VERSION=""

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

debug() {
    if [ "$VERBOSE" = "true" ]; then
        echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] DEBUG:${NC} $1"
    fi
}

# Функция для проверки подключения к БД
check_database_connection() {
    log "Проверка подключения к базе данных..."
    
    export PGPASSWORD="${DB_PASSWORD:-}"
    
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
        error "Не удалось подключиться к базе данных $DB_NAME на $DB_HOST:$DB_PORT"
        exit 1
    fi
    
    log "Подключение к базе данных успешно"
}

# Функция для создания таблицы миграций
create_migration_table() {
    log "Проверка таблицы миграций..."
    
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
CREATE TABLE IF NOT EXISTS $MIGRATION_TABLE (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time INTEGER,
    checksum VARCHAR(64),
    description TEXT
);

-- Создаем индекс для быстрой сортировки
CREATE INDEX IF NOT EXISTS idx_${MIGRATION_TABLE}_applied_at 
ON $MIGRATION_TABLE(applied_at DESC);

-- Добавляем комментарий к таблице
COMMENT ON TABLE $MIGRATION_TABLE IS 'История выполненных миграций базы данных';
COMMENT ON COLUMN $MIGRATION_TABLE.version IS 'Версия миграции (имя файла без расширения)';
COMMENT ON COLUMN $MIGRATION_TABLE.applied_at IS 'Время применения миграции';
COMMENT ON COLUMN $MIGRATION_TABLE.execution_time IS 'Время выполнения в миллисекундах';
COMMENT ON COLUMN $MIGRATION_TABLE.checksum IS 'SHA256 хеш содержимого миграции';
COMMENT ON COLUMN $MIGRATION_TABLE.description IS 'Описание миграции';
EOF
    
    log "Таблица миграций готова"
}

# Функция для получения списка применённых миграций
get_applied_migrations() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c \
        "SELECT version FROM $MIGRATION_TABLE ORDER BY version;"
}

# Функция для проверки, применена ли миграция
is_migration_applied() {
    local version=$1
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c \
        "SELECT 1 FROM $MIGRATION_TABLE WHERE version = '$version';" | grep -q 1
}

# Функция для вычисления контрольной суммы файла
calculate_checksum() {
    local file=$1
    if command -v sha256sum &> /dev/null; then
        sha256sum "$file" | awk '{print $1}'
    else
        shasum -a 256 "$file" | awk '{print $1}'
    fi
}

# Функция для проверки контрольной суммы миграции
verify_migration_checksum() {
    local version=$1
    local file=$2
    local current_checksum=$(calculate_checksum "$file")
    
    local stored_checksum=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c \
        "SELECT checksum FROM $MIGRATION_TABLE WHERE version = '$version';")
    
    if [ -n "$stored_checksum" ] && [ "$stored_checksum" != "$current_checksum" ]; then
        error "Контрольная сумма миграции $version изменилась!"
        error "Сохранённая: $stored_checksum"
        error "Текущая: $current_checksum"
        return 1
    fi
    
    return 0
}

# Функция для извлечения описания миграции из файла
extract_migration_description() {
    local file=$1
    # Ищем комментарий с описанием в начале файла
    local description=$(grep -m 1 "^-- Description:" "$file" 2>/dev/null | sed 's/^-- Description: *//')
    if [ -z "$description" ]; then
        # Пытаемся найти первый комментарий
        description=$(grep -m 1 "^--" "$file" 2>/dev/null | sed 's/^-- *//')
    fi
    echo "$description"
}

# Функция для применения миграции
apply_migration() {
    local migration_file=$1
    local version=$(basename "$migration_file" .sql)
    local description=$(extract_migration_description "$migration_file")
    
    if is_migration_applied "$version"; then
        debug "Миграция $version уже применена, пропускаем"
        return 0
    fi
    
    info "Применение миграции: $version"
    [ -n "$description" ] && info "  Описание: $description"
    
    if [ "$DRY_RUN" = "true" ]; then
        warning "DRY RUN: Миграция $version будет применена"
        return 0
    fi
    
    # Измеряем время выполнения
    local start_time=$(date +%s%3N)
    
    # Начинаем транзакцию
    {
        echo "BEGIN;"
        cat "$migration_file"
        echo "COMMIT;"
    } | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 2>&1 | while read line; do
        debug "  $line"
    done
    
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        error "Ошибка при применении миграции $version"
        return 1
    fi
    
    local end_time=$(date +%s%3N)
    local execution_time=$((end_time - start_time))
    
    # Записываем информацию о миграции
    local checksum=$(calculate_checksum "$migration_file")
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
INSERT INTO $MIGRATION_TABLE (version, execution_time, checksum, description)
VALUES ('$version', $execution_time, '$checksum', '$description');
EOF
    
    log "Миграция $version применена успешно (${execution_time}ms)"
}

# Функция для отката миграции
rollback_migration() {
    local version=$1
    
    if ! is_migration_applied "$version"; then
        debug "Миграция $version не применена, пропускаем откат"
        return 0
    fi
    
    info "Откат миграции: $version"
    
    if [ "$DRY_RUN" = "true" ]; then
        warning "DRY RUN: Миграция $version будет откачена"
        return 0
    fi
    
    # Ищем файл отката
    local rollback_file="${MIGRATIONS_DIR}/${version}_rollback.sql"
    if [ ! -f "$rollback_file" ]; then
        error "Файл отката не найден: $rollback_file"
        if [ "$FORCE" != "true" ]; then
            error "Используйте --force для принудительного удаления записи о миграции"
            return 1
        fi
        warning "Принудительное удаление записи о миграции $version"
    else
        # Выполняем откат
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$rollback_file" 2>&1 | while read line; do
            debug "  $line"
        done
        
        if [ ${PIPESTATUS[0]} -ne 0 ]; then
            error "Ошибка при откате миграции $version"
            return 1
        fi
    fi
    
    # Удаляем запись о миграции
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
        "DELETE FROM $MIGRATION_TABLE WHERE version = '$version';"
    
    log "Миграция $version откачена успешно"
}

# Функция для выполнения всех миграций
migrate_up() {
    log "Выполнение миграций (UP)..."
    
    local count=0
    local errors=0
    
    # Получаем список файлов миграций
    for migration_file in $(find "$MIGRATIONS_DIR" -name "*.sql" ! -name "*_rollback.sql" | sort); do
        local version=$(basename "$migration_file" .sql)
        
        # Пропускаем, если указана целевая версия и она уже достигнута
        if [ -n "$TARGET_VERSION" ] && [[ "$version" > "$TARGET_VERSION" ]]; then
            debug "Достигнута целевая версия $TARGET_VERSION, останавливаем"
            break
        fi
        
        # Проверяем контрольную сумму для уже применённых миграций
        if is_migration_applied "$version"; then
            if ! verify_migration_checksum "$version" "$migration_file"; then
                ((errors++))
                if [ "$FORCE" != "true" ]; then
                    error "Остановка миграции из-за изменения контрольной суммы"
                    break
                fi
                warning "Продолжаем несмотря на изменение контрольной суммы (--force)"
            fi
            continue
        fi
        
        # Применяем миграцию
        if apply_migration "$migration_file"; then
            ((count++))
        else
            ((errors++))
            if [ "$FORCE" != "true" ]; then
                error "Остановка миграции из-за ошибки"
                break
            fi
            warning "Продолжаем несмотря на ошибку (--force)"
        fi
    done
    
    log "Применено миграций: $count"
    [ $errors -gt 0 ] && warning "Миграций с ошибками: $errors"
    
    return $errors
}

# Функция для отката миграций
migrate_down() {
    log "Откат миграций (DOWN)..."
    
    local count=0
    local errors=0
    
    # Получаем список применённых миграций в обратном порядке
    local applied_migrations=$(get_applied_migrations | tac)
    
    for version in $applied_migrations; do
        # Останавливаемся, если достигли целевой версии
        if [ -n "$TARGET_VERSION" ] && [[ "$version" = "$TARGET_VERSION" ]]; then
            debug "Достигнута целевая версия $TARGET_VERSION, останавливаем"
            break
        fi
        
        # Откатываем миграцию
        if rollback_migration "$version"; then
            ((count++))
        else
            ((errors++))
            if [ "$FORCE" != "true" ]; then
                error "Остановка отката из-за ошибки"
                break
            fi
            warning "Продолжаем несмотря на ошибку (--force)"
        fi
        
        # Если откатываем только одну миграцию
        if [ "$count" -eq 1 ] && [ -z "$TARGET_VERSION" ]; then
            break
        fi
    done
    
    log "Откачено миграций: $count"
    [ $errors -gt 0 ] && warning "Откатов с ошибками: $errors"
    
    return $errors
}

# Функция для показа статуса миграций
show_status() {
    log "Статус миграций"
    echo ""
    
    # Получаем список всех миграций
    local all_migrations=$(find "$MIGRATIONS_DIR" -name "*.sql" ! -name "*_rollback.sql" | sort)
    local applied_migrations=$(get_applied_migrations)
    
    echo -e "${CYAN}Версия\t\t\tСтатус\t\tПрименена\t\tОписание${NC}"
    echo "────────────────────────────────────────────────────────────────────────"
    
    for migration_file in $all_migrations; do
        local version=$(basename "$migration_file" .sql)
        local description=$(extract_migration_description "$migration_file")
        local status="Ожидает"
        local applied_at=""
        
        if echo "$applied_migrations" | grep -q "^$version$"; then
            status="${GREEN}Применена${NC}"
            applied_at=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c \
                "SELECT to_char(applied_at, 'YYYY-MM-DD HH24:MI:SS') FROM $MIGRATION_TABLE WHERE version = '$version';")
        else
            status="${YELLOW}Ожидает${NC}"
        fi
        
        printf "%-25s\t%b\t%-20s\t%s\n" "$version" "$status" "$applied_at" "$description"
    done
    
    echo ""
    
    # Статистика
    local total=$(echo "$all_migrations" | wc -l)
    local applied=$(echo "$applied_migrations" | wc -l)
    local pending=$((total - applied))
    
    info "Всего миграций: $total"
    info "Применено: $applied"
    info "Ожидает: $pending"
}

# Функция для выполнения seed-файлов
run_seeds() {
    log "Выполнение seed-файлов..."
    
    if [ ! -d "$SEEDS_DIR" ]; then
        warning "Директория с seed-файлами не найдена: $SEEDS_DIR"
        return 0
    fi
    
    local count=0
    
    for seed_file in $(find "$SEEDS_DIR" -name "*.sql" | sort); do
        local seed_name=$(basename "$seed_file")
        info "Выполнение seed: $seed_name"
        
        if [ "$DRY_RUN" = "true" ]; then
            warning "DRY RUN: Seed $seed_name будет выполнен"
            continue
        fi
        
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$seed_file" 2>&1 | while read line; do
            debug "  $line"
        done; then
            log "Seed $seed_name выполнен успешно"
            ((count++))
        else
            error "Ошибка при выполнении seed $seed_name"
        fi
    done
    
    log "Выполнено seed-файлов: $count"
}

# Функция для создания новой миграции
create_migration() {
    local name=$1
    
    if [ -z "$name" ]; then
        error "Необходимо указать имя миграции"
        exit 1
    fi
    
    # Генерируем версию миграции
    local version=$(date +"%Y%m%d%H%M%S")
    local filename="${version}_${name}.sql"
    local rollback_filename="${version}_${name}_rollback.sql"
    local filepath="$MIGRATIONS_DIR/$filename"
    local rollback_filepath="$MIGRATIONS_DIR/$rollback_filename"
    
    log "Создание новой миграции: $filename"
    
    # Создаем файл миграции
    cat > "$filepath" <<EOF
-- Migration: $name
-- Description: TODO: Добавьте описание миграции
-- Author: $(whoami)
-- Date: $(date)

-- Миграция UP
BEGIN;

-- TODO: Добавьте SQL команды для применения миграции

COMMIT;
EOF
    
    # Создаем файл отката
    cat > "$rollback_filepath" <<EOF
-- Rollback for migration: $name
-- Description: Откат миграции $name
-- Author: $(whoami)
-- Date: $(date)

-- Миграция DOWN
BEGIN;

-- TODO: Добавьте SQL команды для отката миграции

COMMIT;
EOF
    
    log "Созданы файлы:"
    log "  - $filepath"
    log "  - $rollback_filepath"
    
    # Открываем в редакторе, если указан
    if [ -n "$EDITOR" ]; then
        $EDITOR "$filepath" "$rollback_filepath"
    fi
}

# Основная функция
main() {
    log "=== PostgreSQL Migration Tool ==="
    
    # Обработка команд
    case "${1:-status}" in
        up)
            shift
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --target)
                        TARGET_VERSION="$2"
                        shift 2
                        ;;
                    --dry-run)
                        DRY_RUN="true"
                        shift
                        ;;
                    --force)
                        FORCE="true"
                        shift
                        ;;
                    -v|--verbose)
                        VERBOSE="true"
                        shift
                        ;;
                    *)
                        error "Неизвестная опция: $1"
                        exit 1
                        ;;
                esac
            done
            
            check_database_connection
            create_migration_table
            migrate_up
            ;;
            
        down)
            shift
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --target)
                        TARGET_VERSION="$2"
                        shift 2
                        ;;
                    --dry-run)
                        DRY_RUN="true"
                        shift
                        ;;
                    --force)
                        FORCE="true"
                        shift
                        ;;
                    -v|--verbose)
                        VERBOSE="true"
                        shift
                        ;;
                    *)
                        error "Неизвестная опция: $1"
                        exit 1
                        ;;
                esac
            done
            
            check_database_connection
            create_migration_table
            migrate_down
            ;;
            
        status)
            check_database_connection
            create_migration_table
            show_status
            ;;
            
        seed)
            shift
            while [[ $# -gt 0 ]]; do
                case $1 in
                    --dry-run)
                        DRY_RUN="true"
                        shift
                        ;;
                    -v|--verbose)
                        VERBOSE="true"
                        shift
                        ;;
                    *)
                        error "Неизвестная опция: $1"
                        exit 1
                        ;;
                esac
            done
            
            check_database_connection
            run_seeds
            ;;
            
        create)
            shift
            create_migration "$@"
            ;;
            
        help|--help|-h)
            echo "Использование: $0 [команда] [опции]"
            echo ""
            echo "Команды:"
            echo "  up              Применить все ожидающие миграции"
            echo "  down            Откатить последнюю миграцию"
            echo "  status          Показать статус миграций"
            echo "  seed            Выполнить seed-файлы"
            echo "  create NAME     Создать новую миграцию"
            echo ""
            echo "Опции:"
            echo "  --target VERSION    Мигрировать до указанной версии"
            echo "  --dry-run          Показать что будет сделано без выполнения"
            echo "  --force            Продолжать при ошибках"
            echo "  -v, --verbose      Подробный вывод"
            echo "  -h, --help         Показать эту справку"
            echo ""
            echo "Переменные окружения:"
            echo "  DB_HOST            Хост БД (по умолчанию: localhost)"
            echo "  DB_PORT            Порт БД (по умолчанию: 5432)"
            echo "  DB_NAME            Имя БД (по умолчанию: philosophy_concepts)"
            echo "  DB_USER            Пользователь БД (по умолчанию: postgres)"
            echo "  DB_PASSWORD        Пароль БД"
            echo "  MIGRATIONS_DIR     Директория с миграциями"
            echo "  SEEDS_DIR          Директория с seed-файлами"
            exit 0
            ;;
            
        *)
            error "Неизвестная команда: $1"
            echo "Используйте '$0 help' для справки"
            exit 1
            ;;
    esac
}

# Запуск основной функции
main "$@"