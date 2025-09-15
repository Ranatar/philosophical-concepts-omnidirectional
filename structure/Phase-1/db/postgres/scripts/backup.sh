#!/bin/bash

# PostgreSQL Backup Script
# Скрипт для создания резервных копий базы данных PostgreSQL

set -e  # Выход при ошибке
set -o pipefail  # Выход при ошибке в пайплайне

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Конфигурация по умолчанию
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-philosophy_concepts}"
DB_USER="${DB_USER:-postgres}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
BACKUP_TYPE="${BACKUP_TYPE:-full}" # full, schema-only, data-only
BACKUP_FORMAT="${BACKUP_FORMAT:-custom}" # custom, plain, directory, tar
COMPRESSION_LEVEL="${COMPRESSION_LEVEL:-6}" # 0-9
PARALLEL_JOBS="${PARALLEL_JOBS:-2}"

# Временная метка для имени файла
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_${DB_NAME}_${BACKUP_TYPE}_${TIMESTAMP}"

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

# Функция для проверки зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump не найден. Установите PostgreSQL client tools."
        exit 1
    fi
    
    if ! command -v pg_dumpall &> /dev/null; then
        error "pg_dumpall не найден. Установите PostgreSQL client tools."
        exit 1
    fi
}

# Функция для создания директории бэкапов
create_backup_directory() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log "Создание директории для бэкапов: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
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

# Функция для получения размера БД
get_database_size() {
    local size=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
    echo "$size"
}

# Функция для создания резервной копии
perform_backup() {
    log "Начало резервного копирования..."
    log "База данных: $DB_NAME"
    log "Тип бэкапа: $BACKUP_TYPE"
    log "Формат: $BACKUP_FORMAT"
    log "Размер БД: $(get_database_size)"
    
    local backup_file=""
    local pg_dump_options="-h $DB_HOST -p $DB_PORT -U $DB_USER"
    
    # Дополнительные опции в зависимости от типа бэкапа
    case $BACKUP_TYPE in
        "schema-only")
            pg_dump_options="$pg_dump_options -s"
            ;;
        "data-only")
            pg_dump_options="$pg_dump_options -a"
            ;;
        "full")
            # Полный бэкап - опции по умолчанию
            ;;
        *)
            error "Неизвестный тип бэкапа: $BACKUP_TYPE"
            exit 1
            ;;
    esac
    
    # Дополнительные опции в зависимости от формата
    case $BACKUP_FORMAT in
        "custom")
            backup_file="$BACKUP_DIR/${BACKUP_NAME}.dump"
            pg_dump_options="$pg_dump_options -Fc -Z$COMPRESSION_LEVEL"
            ;;
        "plain")
            backup_file="$BACKUP_DIR/${BACKUP_NAME}.sql"
            pg_dump_options="$pg_dump_options -Fp"
            ;;
        "directory")
            backup_file="$BACKUP_DIR/${BACKUP_NAME}"
            pg_dump_options="$pg_dump_options -Fd -j$PARALLEL_JOBS -Z$COMPRESSION_LEVEL"
            ;;
        "tar")
            backup_file="$BACKUP_DIR/${BACKUP_NAME}.tar"
            pg_dump_options="$pg_dump_options -Ft"
            ;;
        *)
            error "Неизвестный формат бэкапа: $BACKUP_FORMAT"
            exit 1
            ;;
    esac
    
    # Добавляем verbose для отслеживания прогресса
    pg_dump_options="$pg_dump_options -v"
    
    # Выполнение резервного копирования
    log "Выполнение: pg_dump $pg_dump_options -f $backup_file $DB_NAME"
    
    if pg_dump $pg_dump_options -f "$backup_file" "$DB_NAME" 2>&1 | while read line; do
        echo "[pg_dump] $line"
    done; then
        log "Резервное копирование завершено успешно"
        
        # Получение информации о созданном файле
        if [ -d "$backup_file" ]; then
            local size=$(du -sh "$backup_file" | cut -f1)
            log "Создана директория бэкапа: $backup_file (размер: $size)"
        else
            local size=$(ls -lh "$backup_file" | awk '{print $5}')
            log "Создан файл бэкапа: $backup_file (размер: $size)"
        fi
    else
        error "Ошибка при создании резервной копии"
        exit 1
    fi
    
    echo "$backup_file"
}

# Функция для создания бэкапа глобальных объектов
backup_globals() {
    if [ "$BACKUP_GLOBALS" = "true" ]; then
        log "Создание резервной копии глобальных объектов..."
        
        local globals_file="$BACKUP_DIR/globals_${TIMESTAMP}.sql"
        
        if pg_dumpall -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" --globals-only > "$globals_file" 2>&1; then
            log "Глобальные объекты сохранены в: $globals_file"
        else
            warning "Не удалось создать резервную копию глобальных объектов"
        fi
    fi
}

# Функция для создания метаданных бэкапа
create_backup_metadata() {
    local backup_file=$1
    local metadata_file="${backup_file}.metadata"
    
    log "Создание метаданных резервной копии..."
    
    cat > "$metadata_file" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "database": {
    "name": "$DB_NAME",
    "host": "$DB_HOST",
    "port": "$DB_PORT",
    "size": "$(get_database_size | xargs)"
  },
  "backup": {
    "type": "$BACKUP_TYPE",
    "format": "$BACKUP_FORMAT",
    "compression_level": "$COMPRESSION_LEVEL",
    "file": "$(basename "$backup_file")",
    "size": "$(du -sh "$backup_file" 2>/dev/null | cut -f1 || echo 'N/A')"
  },
  "system": {
    "hostname": "$(hostname)",
    "pg_version": "$(psql --version | head -n1)",
    "os": "$(uname -a)"
  }
}
EOF
    
    log "Метаданные сохранены в: $metadata_file"
}

# Функция для проверки целостности бэкапа
verify_backup() {
    local backup_file=$1
    
    log "Проверка целостности резервной копии..."
    
    case $BACKUP_FORMAT in
        "custom"|"directory")
            # Используем pg_restore для проверки
            if pg_restore --list "$backup_file" > /dev/null 2>&1; then
                log "Проверка целостности пройдена успешно"
                return 0
            else
                error "Проверка целостности не пройдена"
                return 1
            fi
            ;;
        "plain")
            # Проверяем, что файл не пустой и содержит SQL
            if [ -s "$backup_file" ] && grep -q "PostgreSQL database dump" "$backup_file"; then
                log "Проверка целостности пройдена успешно"
                return 0
            else
                error "Проверка целостности не пройдена"
                return 1
            fi
            ;;
        "tar")
            # Проверяем tar архив
            if tar -tf "$backup_file" > /dev/null 2>&1; then
                log "Проверка целостности пройдена успешно"
                return 0
            else
                error "Проверка целостности не пройдена"
                return 1
            fi
            ;;
    esac
}

# Функция для удаления старых бэкапов
cleanup_old_backups() {
    if [ "$BACKUP_RETENTION_DAYS" -gt 0 ]; then
        log "Удаление резервных копий старше $BACKUP_RETENTION_DAYS дней..."
        
        local count=0
        while IFS= read -r -d '' file; do
            log "Удаление: $(basename "$file")"
            rm -rf "$file"
            # Удаляем также метаданные
            [ -f "${file}.metadata" ] && rm -f "${file}.metadata"
            ((count++))
        done < <(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*" -type f -mtime +$BACKUP_RETENTION_DAYS -print0)
        
        # Удаление старых директорий (для directory format)
        while IFS= read -r -d '' dir; do
            log "Удаление директории: $(basename "$dir")"
            rm -rf "$dir"
            [ -f "${dir}.metadata" ] && rm -f "${dir}.metadata"
            ((count++))
        done < <(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*" -type d -mtime +$BACKUP_RETENTION_DAYS -print0)
        
        if [ $count -gt 0 ]; then
            log "Удалено старых резервных копий: $count"
        else
            log "Старых резервных копий не найдено"
        fi
    fi
}

# Функция для отправки уведомлений (если настроено)
send_notification() {
    local status=$1
    local message=$2
    
    # Webhook для уведомлений (Slack, Discord, etc.)
    if [ -n "$NOTIFICATION_WEBHOOK_URL" ]; then
        local color="good"
        [ "$status" = "error" ] && color="danger"
        
        curl -X POST "$NOTIFICATION_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"PostgreSQL Backup: $message\", \"color\": \"$color\"}" \
            2>/dev/null || warning "Не удалось отправить уведомление"
    fi
}

# Основная функция
main() {
    log "=== Запуск скрипта резервного копирования PostgreSQL ==="
    
    # Проверка аргументов командной строки
    while [[ $# -gt 0 ]]; do
        case $1 in
            --type)
                BACKUP_TYPE="$2"
                shift 2
                ;;
            --format)
                BACKUP_FORMAT="$2"
                shift 2
                ;;
            --retention)
                BACKUP_RETENTION_DAYS="$2"
                shift 2
                ;;
            --help)
                echo "Использование: $0 [опции]"
                echo "Опции:"
                echo "  --type TYPE        Тип бэкапа: full, schema-only, data-only (по умолчанию: full)"
                echo "  --format FORMAT    Формат: custom, plain, directory, tar (по умолчанию: custom)"
                echo "  --retention DAYS   Количество дней хранения бэкапов (по умолчанию: 7)"
                echo "  --help            Показать эту справку"
                exit 0
                ;;
            *)
                error "Неизвестная опция: $1"
                exit 1
                ;;
        esac
    done
    
    # Выполнение резервного копирования
    check_dependencies
    create_backup_directory
    check_database_connection
    
    # Создание бэкапа
    backup_file=$(perform_backup)
    
    # Дополнительные операции
    backup_globals
    create_backup_metadata "$backup_file"
    
    # Проверка целостности
    if verify_backup "$backup_file"; then
        cleanup_old_backups
        
        log "=== Резервное копирование завершено успешно ==="
        send_notification "success" "Бэкап $DB_NAME создан успешно"
        exit 0
    else
        error "Резервное копирование завершено с ошибками"
        send_notification "error" "Ошибка при создании бэкапа $DB_NAME"
        exit 1
    fi
}

# Запуск основной функции
main "$@"