#!/bin/bash

# Neo4j Backup Script
# Скрипт для создания резервных копий базы данных Neo4j

set -e  # Выход при ошибке
set -o pipefail  # Выход при ошибке в пайплайне

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация по умолчанию
BACKUP_DIR="${BACKUP_DIR:-/backups/neo4j}"
NEO4J_HOME="${NEO4J_HOME:-/var/lib/neo4j}"
NEO4J_ADMIN="${NEO4J_ADMIN:-neo4j-admin}"
NEO4J_HOST="${NEO4J_HOST:-localhost}"
NEO4J_PORT="${NEO4J_PORT:-7687}"
NEO4J_USERNAME="${NEO4J_USERNAME:-neo4j}"
NEO4J_DATABASE="${NEO4J_DATABASE:-neo4j}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
BACKUP_TYPE="${BACKUP_TYPE:-full}" # full, incremental, differential
CONSISTENCY_CHECK="${CONSISTENCY_CHECK:-true}"
PARALLEL_RECOVERY="${PARALLEL_RECOVERY:-true}"
COMPRESS="${COMPRESS:-true}"

# Временная метка для имени файла
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="neo4j_backup_${NEO4J_DATABASE}_${BACKUP_TYPE}_${TIMESTAMP}"

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
    
    # Проверка neo4j-admin
    if ! command -v "$NEO4J_ADMIN" &> /dev/null; then
        # Пытаемся найти neo4j-admin в стандартных местах
        if [ -x "$NEO4J_HOME/bin/neo4j-admin" ]; then
            NEO4J_ADMIN="$NEO4J_HOME/bin/neo4j-admin"
        elif [ -x "/usr/bin/neo4j-admin" ]; then
            NEO4J_ADMIN="/usr/bin/neo4j-admin"
        else
            error "neo4j-admin не найден. Установите Neo4j или укажите путь в NEO4J_ADMIN"
            exit 1
        fi
    fi
    
    # Проверка cypher-shell
    if ! command -v cypher-shell &> /dev/null; then
        warning "cypher-shell не найден. Некоторые проверки будут пропущены"
    fi
}

# Функция для создания директории бэкапов
create_backup_directory() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log "Создание директории для бэкапов: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Функция для проверки подключения к Neo4j
check_neo4j_connection() {
    log "Проверка подключения к Neo4j..."
    
    if command -v cypher-shell &> /dev/null; then
        if echo "RETURN 1;" | cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
            -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" --format plain 2>/dev/null | grep -q "1"; then
            log "Подключение к Neo4j успешно"
        else
            error "Не удалось подключиться к Neo4j на $NEO4J_HOST:$NEO4J_PORT"
            exit 1
        fi
    else
        warning "Пропуск проверки подключения (cypher-shell не установлен)"
    fi
}

# Функция для получения статистики базы данных
get_database_stats() {
    if command -v cypher-shell &> /dev/null; then
        local stats=$(echo "
        CALL apoc.meta.stats() YIELD labels, relTypesCount, nodeCount, relCount
        RETURN nodeCount, relCount, size(keys(labels)) as labelCount, relTypesCount;
        " | cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
            -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
            --format plain 2>/dev/null | tail -n 1)
        
        if [ -n "$stats" ]; then
            info "Статистика базы данных:"
            info "  Узлов: $(echo "$stats" | cut -d',' -f1)"
            info "  Связей: $(echo "$stats" | cut -d',' -f2)"
            info "  Меток: $(echo "$stats" | cut -d',' -f3)"
            info "  Типов связей: $(echo "$stats" | cut -d',' -f4)"
        fi
    fi
}

# Функция для остановки базы данных (если требуется)
stop_database_if_needed() {
    if [ "$STOP_DATABASE" = "true" ]; then
        log "Остановка базы данных для консистентного бэкапа..."
        
        if command -v systemctl &> /dev/null && systemctl is-active neo4j &>/dev/null; then
            sudo systemctl stop neo4j
            NEED_RESTART="true"
        elif [ -x "$NEO4J_HOME/bin/neo4j" ]; then
            "$NEO4J_HOME/bin/neo4j" stop
            NEED_RESTART="true"
        else
            warning "Не удалось остановить Neo4j автоматически"
        fi
    fi
}

# Функция для создания резервной копии
perform_backup() {
    log "Начало резервного копирования..."
    log "База данных: $NEO4J_DATABASE"
    log "Тип бэкапа: $BACKUP_TYPE"
    
    local backup_path="$BACKUP_DIR/$BACKUP_NAME"
    local backup_options="--database=$NEO4J_DATABASE"
    
    # Дополнительные опции
    [ "$CONSISTENCY_CHECK" = "true" ] && backup_options="$backup_options --consistency-check"
    [ "$PARALLEL_RECOVERY" = "true" ] && backup_options="$backup_options --parallel-recovery"
    [ "$VERBOSE" = "true" ] && backup_options="$backup_options --verbose"
    
    # Опции в зависимости от типа бэкапа
    case $BACKUP_TYPE in
        "incremental")
            # Для инкрементального бэкапа нужен путь к предыдущему бэкапу
            local latest_backup=$(find "$BACKUP_DIR" -name "neo4j_backup_${NEO4J_DATABASE}_*" -type d | sort -r | head -n 1)
            if [ -n "$latest_backup" ]; then
                backup_options="$backup_options --incremental --from-path=$latest_backup"
                log "Инкрементальный бэкап от: $latest_backup"
            else
                warning "Предыдущий бэкап не найден, выполняется полный бэкап"
                BACKUP_TYPE="full"
            fi
            ;;
        "differential")
            # Для дифференциального бэкапа нужен путь к полному бэкапу
            local full_backup=$(find "$BACKUP_DIR" -name "neo4j_backup_${NEO4J_DATABASE}_full_*" -type d | sort -r | head -n 1)
            if [ -n "$full_backup" ]; then
                backup_options="$backup_options --differential --from-path=$full_backup"
                log "Дифференциальный бэкап от: $full_backup"
            else
                warning "Полный бэкап не найден, выполняется полный бэкап"
                BACKUP_TYPE="full"
            fi
            ;;
    esac
    
    # Выполнение резервного копирования
    log "Выполнение: $NEO4J_ADMIN backup $backup_options --to-path=$backup_path"
    
    if $NEO4J_ADMIN backup $backup_options --to-path="$backup_path" 2>&1 | while read line; do
        echo "[neo4j-admin] $line"
    done; then
        log "Резервное копирование завершено успешно"
        
        # Сжатие бэкапа если требуется
        if [ "$COMPRESS" = "true" ]; then
            log "Сжатие резервной копии..."
            tar -czf "${backup_path}.tar.gz" -C "$BACKUP_DIR" "$(basename "$backup_path")"
            rm -rf "$backup_path"
            backup_path="${backup_path}.tar.gz"
            log "Бэкап сжат: $backup_path"
        fi
        
        # Получение информации о созданном файле
        local size=$(du -sh "$backup_path" | cut -f1)
        log "Создан бэкап: $backup_path (размер: $size)"
    else
        error "Ошибка при создании резервной копии"
        exit 1
    fi
    
    echo "$backup_path"
}

# Функция для создания метаданных бэкапа
create_backup_metadata() {
    local backup_file=$1
    local metadata_file="${backup_file}.metadata"
    
    log "Создание метаданных резервной копии..."
    
    # Получение версии Neo4j
    local neo4j_version="unknown"
    if [ -x "$NEO4J_HOME/bin/neo4j" ]; then
        neo4j_version=$($NEO4J_HOME/bin/neo4j version 2>/dev/null || echo "unknown")
    fi
    
    cat > "$metadata_file" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "database": {
    "name": "$NEO4J_DATABASE",
    "host": "$NEO4J_HOST",
    "port": "$NEO4J_PORT",
    "version": "$neo4j_version"
  },
  "backup": {
    "type": "$BACKUP_TYPE",
    "compressed": "$COMPRESS",
    "consistency_check": "$CONSISTENCY_CHECK",
    "file": "$(basename "$backup_file")",
    "size": "$(du -sh "$backup_file" 2>/dev/null | cut -f1 || echo 'N/A')"
  },
  "system": {
    "hostname": "$(hostname)",
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
    
    # Для сжатых бэкапов
    if [[ "$backup_file" == *.tar.gz ]]; then
        if tar -tzf "$backup_file" > /dev/null 2>&1; then
            log "Проверка архива пройдена успешно"
            return 0
        else
            error "Проверка архива не пройдена"
            return 1
        fi
    fi
    
    # Для несжатых бэкапов можно использовать neo4j-admin check-consistency
    # но это требует дополнительных ресурсов
    if [ "$CONSISTENCY_CHECK" = "true" ] && [ -d "$backup_file" ]; then
        log "Запуск проверки консистентности (может занять время)..."
        if $NEO4J_ADMIN check-consistency --database="$backup_file" 2>&1 | grep -q "Consistency check completed"; then
            log "Проверка консистентности пройдена"
        else
            warning "Проблемы при проверке консистентности"
        fi
    fi
    
    return 0
}

# Функция для удаления старых бэкапов
cleanup_old_backups() {
    if [ "$BACKUP_RETENTION_DAYS" -gt 0 ]; then
        log "Удаление резервных копий старше $BACKUP_RETENTION_DAYS дней..."
        
        local count=0
        
        # Удаление старых файлов
        while IFS= read -r -d '' file; do
            log "Удаление: $(basename "$file")"
            rm -rf "$file"
            # Удаляем также метаданные
            [ -f "${file}.metadata" ] && rm -f "${file}.metadata"
            ((count++))
        done < <(find "$BACKUP_DIR" -name "neo4j_backup_${NEO4J_DATABASE}_*" \( -type f -o -type d \) -mtime +$BACKUP_RETENTION_DAYS -print0)
        
        if [ $count -gt 0 ]; then
            log "Удалено старых резервных копий: $count"
        else
            log "Старых резервных копий не найдено"
        fi
    fi
}

# Функция для запуска базы данных
start_database_if_needed() {
    if [ "$NEED_RESTART" = "true" ]; then
        log "Запуск базы данных..."
        
        if command -v systemctl &> /dev/null && systemctl is-enabled neo4j &>/dev/null; then
            sudo systemctl start neo4j
        elif [ -x "$NEO4J_HOME/bin/neo4j" ]; then
            "$NEO4J_HOME/bin/neo4j" start
        fi
        
        # Ждем запуска
        sleep 10
    fi
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
            -d "{\"text\": \"Neo4j Backup: $message\", \"color\": \"$color\"}" \
            2>/dev/null || warning "Не удалось отправить уведомление"
    fi
}

# Основная функция
main() {
    log "=== Запуск скрипта резервного копирования Neo4j ==="
    
    # Проверка аргументов командной строки
    while [[ $# -gt 0 ]]; do
        case $1 in
            --type)
                BACKUP_TYPE="$2"
                shift 2
                ;;
            --retention)
                BACKUP_RETENTION_DAYS="$2"
                shift 2
                ;;
            --no-compress)
                COMPRESS="false"
                shift
                ;;
            --no-consistency-check)
                CONSISTENCY_CHECK="false"
                shift
                ;;
            --stop-database)
                STOP_DATABASE="true"
                shift
                ;;
            -v|--verbose)
                VERBOSE="true"
                shift
                ;;
            --help)
                echo "Использование: $0 [опции]"
                echo "Опции:"
                echo "  --type TYPE              Тип бэкапа: full, incremental, differential (по умолчанию: full)"
                echo "  --retention DAYS         Количество дней хранения бэкапов (по умолчанию: 7)"
                echo "  --no-compress           Не сжимать бэкап"
                echo "  --no-consistency-check  Пропустить проверку консистентности"
                echo "  --stop-database         Остановить БД для консистентного бэкапа"
                echo "  -v, --verbose           Подробный вывод"
                echo "  --help                  Показать эту справку"
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
    check_neo4j_connection
    get_database_stats
    
    # Остановка БД если требуется
    stop_database_if_needed
    
    # Создание бэкапа
    backup_file=$(perform_backup)
    
    # Дополнительные операции
    create_backup_metadata "$backup_file"
    
    # Запуск БД если была остановлена
    start_database_if_needed
    
    # Проверка целостности
    if verify_backup "$backup_file"; then
        cleanup_old_backups
        
        log "=== Резервное копирование завершено успешно ==="
        send_notification "success" "Бэкап Neo4j создан успешно"
        exit 0
    else
        error "Резервное копирование завершено с ошибками"
        send_notification "error" "Ошибка при создании бэкапа Neo4j"
        exit 1
    fi
}

# Запуск основной функции
main "$@"