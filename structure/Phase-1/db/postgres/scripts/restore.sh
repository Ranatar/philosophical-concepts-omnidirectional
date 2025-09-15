#!/bin/bash

# PostgreSQL Restore Script
# Скрипт для восстановления базы данных PostgreSQL из резервной копии

set -e  # Выход при ошибке
set -o pipefail  # Выход при ошибке в пайплайне

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация по умолчанию
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-philosophy_concepts}"
DB_USER="${DB_USER:-postgres}"
RESTORE_JOBS="${RESTORE_JOBS:-2}"
CREATE_DB="${CREATE_DB:-true}"
CLEAN_RESTORE="${CLEAN_RESTORE:-true}"
NO_OWNER="${NO_OWNER:-true}"
VERBOSE="${VERBOSE:-true}"

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

# Функция для проверки зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    if ! command -v pg_restore &> /dev/null; then
        error "pg_restore не найден. Установите PostgreSQL client tools."
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        error "psql не найден. Установите PostgreSQL client tools."
        exit 1
    fi
}

# Функция для проверки подключения к БД
check_database_connection() {
    log "Проверка подключения к серверу PostgreSQL..."
    
    export PGPASSWORD="${DB_PASSWORD:-}"
    
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c '\q' 2>/dev/null; then
        error "Не удалось подключиться к серверу PostgreSQL на $DB_HOST:$DB_PORT"
        exit 1
    fi
    
    log "Подключение к серверу PostgreSQL успешно"
}

# Функция для проверки существования базы данных
database_exists() {
    local db_name=$1
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc \
        "SELECT 1 FROM pg_database WHERE datname='$db_name'" | grep -q 1
}

# Функция для получения списка доступных бэкапов
list_available_backups() {
    log "Доступные резервные копии:"
    echo ""
    
    local backups=()
    local index=1
    
    # Поиск файлов бэкапов
    while IFS= read -r file; do
        local basename=$(basename "$file")
        local size=$(ls -lh "$file" 2>/dev/null | awk '{print $5}')
        local date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || stat -f %Sm "$file" 2>/dev/null || echo "Unknown")
        
        # Читаем метаданные, если есть
        local metadata=""
        if [ -f "${file}.metadata" ]; then
            local db_size=$(grep -o '"size": "[^"]*"' "${file}.metadata" | head -1 | cut -d'"' -f4)
            [ -n "$db_size" ] && metadata=" (DB size: $db_size)"
        fi
        
        echo "  $index) $basename - $size - $date$metadata"
        backups+=("$file")
        ((index++))
    done < <(find "$BACKUP_DIR" -name "backup_*.dump" -o -name "backup_*.sql" -o -name "backup_*.tar" | sort -r)
    
    # Поиск директорий бэкапов
    while IFS= read -r dir; do
        local basename=$(basename "$dir")
        local size=$(du -sh "$dir" 2>/dev/null | cut -f1)
        local date=$(stat -c %y "$dir" 2>/dev/null | cut -d' ' -f1 || stat -f %Sm "$dir" 2>/dev/null || echo "Unknown")
        
        echo "  $index) $basename/ - $size - $date"
        backups+=("$dir")
        ((index++))
    done < <(find "$BACKUP_DIR" -name "backup_*" -type d | sort -r)
    
    echo ""
    echo "${backups[@]}"
}

# Функция для выбора файла бэкапа
select_backup_file() {
    local backup_file=""
    
    if [ -n "$1" ]; then
        # Если файл указан как аргумент
        backup_file="$1"
    else
        # Интерактивный выбор
        local backups_output=$(list_available_backups)
        local backups_array=($(echo "$backups_output" | tail -n 1))
        
        if [ ${#backups_array[@]} -eq 0 ]; then
            error "Резервные копии не найдены в $BACKUP_DIR"
            exit 1
        fi
        
        # Показываем список без последней строки (массив путей)
        echo "$backups_output" | head -n -1
        
        read -p "Выберите номер резервной копии для восстановления: " selection
        
        if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le ${#backups_array[@]} ]; then
            backup_file="${backups_array[$((selection-1))]}"
        else
            error "Неверный выбор"
            exit 1
        fi
    fi
    
    # Проверка существования файла
    if [ ! -e "$backup_file" ]; then
        error "Файл резервной копии не найден: $backup_file"
        exit 1
    fi
    
    echo "$backup_file"
}

# Функция для определения формата бэкапа
detect_backup_format() {
    local backup_file=$1
    
    if [ -d "$backup_file" ]; then
        echo "directory"
    elif [[ "$backup_file" == *.dump ]]; then
        echo "custom"
    elif [[ "$backup_file" == *.sql ]]; then
        echo "plain"
    elif [[ "$backup_file" == *.tar ]]; then
        echo "tar"
    else
        # Пытаемся определить по содержимому
        if file "$backup_file" | grep -q "PostgreSQL custom database dump"; then
            echo "custom"
        elif head -n 1 "$backup_file" 2>/dev/null | grep -q "PostgreSQL database dump"; then
            echo "plain"
        else
            echo "unknown"
        fi
    fi
}

# Функция для создания базы данных
create_database() {
    local db_name=$1
    
    if database_exists "$db_name"; then
        if [ "$CLEAN_RESTORE" = "true" ]; then
            warning "База данных $db_name существует и будет пересоздана"
            
            # Отключаем все подключения к БД
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres <<EOF
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$db_name' AND pid <> pg_backend_pid();
EOF
            
            # Удаляем базу данных
            log "Удаление существующей базы данных..."
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $db_name;"
            
            # Создаем базу данных заново
            log "Создание новой базы данных..."
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $db_name;"
        else
            log "База данных $db_name уже существует"
        fi
    else
        log "Создание базы данных $db_name..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $db_name;"
    fi
}

# Функция для восстановления из резервной копии
perform_restore() {
    local backup_file=$1
    local format=$2
    
    log "Начало восстановления из резервной копии..."
    log "Файл: $backup_file"
    log "Формат: $format"
    log "База данных: $DB_NAME"
    
    # Создание базы данных при необходимости
    if [ "$CREATE_DB" = "true" ]; then
        create_database "$DB_NAME"
    fi
    
    # Подготовка опций восстановления
    local restore_options="-h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
    
    # Дополнительные опции
    [ "$VERBOSE" = "true" ] && restore_options="$restore_options -v"
    [ "$NO_OWNER" = "true" ] && restore_options="$restore_options --no-owner"
    [ "$CLEAN_RESTORE" = "true" ] && restore_options="$restore_options --clean --if-exists"
    
    case $format in
        "custom"|"directory"|"tar")
            # Используем pg_restore для бинарных форматов
            restore_options="$restore_options -j$RESTORE_JOBS"
            
            # Восстановление только схемы (при необходимости)
            if [ "$SCHEMA_ONLY" = "true" ]; then
                restore_options="$restore_options --schema-only"
            elif [ "$DATA_ONLY" = "true" ]; then
                restore_options="$restore_options --data-only"
            fi
            
            log "Выполнение: pg_restore $restore_options $backup_file"
            
            if pg_restore $restore_options "$backup_file" 2>&1 | while read line; do
                echo "[pg_restore] $line"
            done; then
                log "Восстановление завершено успешно"
            else
                error "Ошибка при восстановлении"
                exit 1
            fi
            ;;
            
        "plain")
            # Используем psql для текстовых дампов
            log "Выполнение: psql $restore_options -f $backup_file"
            
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$backup_file" 2>&1 | while read line; do
                echo "[psql] $line"
            done; then
                log "Восстановление завершено успешно"
            else
                error "Ошибка при восстановлении"
                exit 1
            fi
            ;;
            
        *)
            error "Неизвестный формат резервной копии: $format"
            exit 1
            ;;
    esac
}

# Функция для восстановления глобальных объектов
restore_globals() {
    local globals_file="$1"
    
    if [ -f "$globals_file" ]; then
        log "Восстановление глобальных объектов из $globals_file..."
        
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -f "$globals_file" 2>&1 | while read line; do
            echo "[psql] $line"
        done; then
            log "Глобальные объекты восстановлены успешно"
        else
            warning "Некоторые глобальные объекты могли не восстановиться"
        fi
    fi
}

# Функция для анализа базы данных после восстановления
analyze_database() {
    log "Запуск ANALYZE для обновления статистики..."
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE;" 2>&1; then
        log "ANALYZE выполнен успешно"
    else
        warning "Не удалось выполнить ANALYZE"
    fi
}

# Функция для проверки восстановленной базы данных
verify_restoration() {
    log "Проверка восстановленной базы данных..."
    
    # Проверка подключения
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
        error "Не удалось подключиться к восстановленной базе данных"
        return 1
    fi
    
    # Получение статистики
    local stats=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t <<EOF
SELECT 
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')) as tables,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname NOT IN ('pg_catalog', 'information_schema')) as indexes,
    (SELECT COUNT(*) FROM pg_views WHERE schemaname NOT IN ('pg_catalog', 'information_schema')) as views,
    (SELECT COUNT(*) FROM pg_proc WHERE pronamespace NOT IN (
        SELECT oid FROM pg_namespace WHERE nspname IN ('pg_catalog', 'information_schema')
    )) as functions;
EOF
    )
    
    local tables=$(echo "$stats" | awk -F'|' '{print $1}' | xargs)
    local indexes=$(echo "$stats" | awk -F'|' '{print $2}' | xargs)
    local views=$(echo "$stats" | awk -F'|' '{print $3}' | xargs)
    local functions=$(echo "$stats" | awk -F'|' '{print $4}' | xargs)
    
    info "Статистика восстановленной базы данных:"
    info "  Таблиц: $tables"
    info "  Индексов: $indexes"
    info "  Представлений: $views"
    info "  Функций: $functions"
    
    # Размер базы данных
    local db_size=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
    info "  Размер БД: $db_size"
    
    return 0
}

# Функция для отправки уведомлений
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$NOTIFICATION_WEBHOOK_URL" ]; then
        local color="good"
        [ "$status" = "error" ] && color="danger"
        
        curl -X POST "$NOTIFICATION_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"PostgreSQL Restore: $message\", \"color\": \"$color\"}" \
            2>/dev/null || warning "Не удалось отправить уведомление"
    fi
}

# Основная функция
main() {
    log "=== Запуск скрипта восстановления PostgreSQL ==="
    
    local backup_file=""
    local globals_file=""
    
    # Обработка аргументов командной строки
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--file)
                backup_file="$2"
                shift 2
                ;;
            -d|--database)
                DB_NAME="$2"
                shift 2
                ;;
            -g|--globals)
                globals_file="$2"
                shift 2
                ;;
            --no-create)
                CREATE_DB="false"
                shift
                ;;
            --no-clean)
                CLEAN_RESTORE="false"
                shift
                ;;
            --data-only)
                DATA_ONLY="true"
                shift
                ;;
            --schema-only)
                SCHEMA_ONLY="true"
                shift
                ;;
            -j|--jobs)
                RESTORE_JOBS="$2"
                shift 2
                ;;
            -h|--help)
                echo "Использование: $0 [опции]"
                echo "Опции:"
                echo "  -f, --file FILE       Путь к файлу резервной копии"
                echo "  -d, --database NAME   Имя базы данных для восстановления"
                echo "  -g, --globals FILE    Путь к файлу с глобальными объектами"
                echo "  --no-create          Не создавать базу данных"
                echo "  --no-clean           Не очищать существующие объекты"
                echo "  --data-only          Восстановить только данные"
                echo "  --schema-only        Восстановить только схему"
                echo "  -j, --jobs N         Количество параллельных заданий"
                echo "  -h, --help           Показать эту справку"
                exit 0
                ;;
            *)
                error "Неизвестная опция: $1"
                exit 1
                ;;
        esac
    done
    
    # Проверки и подготовка
    check_dependencies
    check_database_connection
    
    # Выбор файла резервной копии
    backup_file=$(select_backup_file "$backup_file")
    
    # Определение формата
    local format=$(detect_backup_format "$backup_file")
    if [ "$format" = "unknown" ]; then
        error "Не удалось определить формат резервной копии"
        exit 1
    fi
    
    # Подтверждение восстановления
    echo ""
    warning "ВНИМАНИЕ: Восстановление базы данных может перезаписать существующие данные!"
    info "База данных: $DB_NAME"
    info "Файл бэкапа: $backup_file"
    info "Формат: $format"
    echo ""
    read -p "Продолжить восстановление? (y/N) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Восстановление отменено пользователем"
        exit 0
    fi
    
    # Восстановление глобальных объектов (если указано)
    [ -n "$globals_file" ] && restore_globals "$globals_file"
    
    # Выполнение восстановления
    perform_restore "$backup_file" "$format"
    
    # Анализ и проверка
    analyze_database
    
    if verify_restoration; then
        log "=== Восстановление завершено успешно ==="
        send_notification "success" "База данных $DB_NAME восстановлена успешно"
        exit 0
    else
        error "Восстановление завершено с ошибками"
        send_notification "error" "Ошибка при восстановлении базы данных $DB_NAME"
        exit 1
    fi
}

# Запуск основной функции
main "$@"