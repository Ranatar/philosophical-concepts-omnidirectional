#!/bin/bash

# Neo4j Restore Script
# Скрипт для восстановления базы данных Neo4j из резервной копии

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
RESTORE_STRATEGY="${RESTORE_STRATEGY:-replace}" # replace, import
FORCE="${FORCE:-false}"
VERBOSE="${VERBOSE:-false}"

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

# Функция для получения списка доступных бэкапов
list_available_backups() {
    log "Доступные резервные копии:"
    echo ""
    
    local backups=()
    local index=1
    
    # Поиск сжатых бэкапов
    while IFS= read -r file; do
        local basename=$(basename "$file")
        local size=$(ls -lh "$file" 2>/dev/null | awk '{print $5}')
        local date=$(stat -c %y "$file" 2>/dev/null | cut -d' ' -f1 || stat -f %Sm "$file" 2>/dev/null || echo "Unknown")
        
        # Читаем метаданные
        local metadata=""
        if [ -f "${file%.tar.gz}.metadata" ]; then
            local db_name=$(grep -o '"name": "[^"]*"' "${file%.tar.gz}.metadata" | head -1 | cut -d'"' -f4)
            local backup_type=$(grep -o '"type": "[^"]*"' "${file%.tar.gz}.metadata" | head -1 | cut -d'"' -f4)
            [ -n "$db_name" ] && metadata=" (DB: $db_name, Type: $backup_type)"
        fi
        
        echo "  $index) $basename - $size - $date$metadata"
        backups+=("$file")
        ((index++))
    done < <(find "$BACKUP_DIR" -name "neo4j_backup_*.tar.gz" | sort -r)
    
    # Поиск несжатых бэкапов (директорий)
    while IFS= read -r dir; do
        local basename=$(basename "$dir")
        local size=$(du -sh "$dir" 2>/dev/null | cut -f1)
        local date=$(stat -c %y "$dir" 2>/dev/null | cut -d' ' -f1 || stat -f %Sm "$dir" 2>/dev/null || echo "Unknown")
        
        echo "  $index) $basename/ - $size - $date"
        backups+=("$dir")
        ((index++))
    done < <(find "$BACKUP_DIR" -name "neo4j_backup_*" -type d | sort -r)
    
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
        
        # Показываем список без последней строки
        echo "$backups_output" | head -n -1
        
        read -p "Выберите номер резервной копии для восстановления: " selection
        
        if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le ${#backups_array[@]} ]; then
            backup_file="${backups_array[$((selection-1))]}"
        else
            error "Неверный выбор"
            exit 1
        fi
    fi
    
    # Проверка существования
    if [ ! -e "$backup_file" ]; then
        error "Файл резервной копии не найден: $backup_file"
        exit 1
    fi
    
    echo "$backup_file"
}

# Функция для распаковки архива
extract_backup() {
    local backup_file=$1
    local extract_dir=""
    
    if [[ "$backup_file" == *.tar.gz ]]; then
        log "Распаковка архива..."
        extract_dir="/tmp/neo4j_restore_$(date +%s)"
        mkdir -p "$extract_dir"
        
        if tar -xzf "$backup_file" -C "$extract_dir"; then
            log "Архив распакован в: $extract_dir"
            # Находим директорию с бэкапом
            backup_file=$(find "$extract_dir" -name "neo4j_backup_*" -type d | head -1)
            if [ -z "$backup_file" ]; then
                error "Не найдена директория бэкапа в архиве"
                rm -rf "$extract_dir"
                exit 1
            fi
        else
            error "Ошибка при распаковке архива"
            exit 1
        fi
    fi
    
    echo "$backup_file"
}

# Функция для остановки Neo4j
stop_neo4j() {
    log "Остановка Neo4j..."
    
    if command -v systemctl &> /dev/null && systemctl is-active neo4j &>/dev/null; then
        sudo systemctl stop neo4j
        sleep 5
    elif [ -x "$NEO4J_HOME/bin/neo4j" ]; then
        "$NEO4J_HOME/bin/neo4j" stop
        sleep 5
    else
        warning "Не удалось остановить Neo4j автоматически"
        warning "Убедитесь, что Neo4j остановлен перед продолжением"
        read -p "Нажмите Enter для продолжения..."
    fi
}

# Функция для запуска Neo4j
start_neo4j() {
    log "Запуск Neo4j..."
    
    if command -v systemctl &> /dev/null && systemctl is-enabled neo4j &>/dev/null; then
        sudo systemctl start neo4j
    elif [ -x "$NEO4J_HOME/bin/neo4j" ]; then
        "$NEO4J_HOME/bin/neo4j" start
    else
        warning "Не удалось запустить Neo4j автоматически"
        warning "Запустите Neo4j вручную"
    fi
    
    # Ждем запуска
    log "Ожидание запуска Neo4j..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if command -v cypher-shell &> /dev/null; then
            if echo "RETURN 1;" | cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
                -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" --format plain 2>/dev/null | grep -q "1"; then
                log "Neo4j успешно запущен"
                break
            fi
        else
            # Простая проверка порта
            if nc -z "$NEO4J_HOST" "$NEO4J_PORT" 2>/dev/null; then
                log "Neo4j запущен (порт открыт)"
                break
            fi
        fi
        
        ((attempt++))
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        error "Neo4j не запустился в течение ожидаемого времени"
        exit 1
    fi
}

# Функция для создания резервной копии текущей БД
backup_current_database() {
    if [ "$CREATE_BACKUP" = "true" ]; then
        log "Создание резервной копии текущей базы данных..."
        
        local current_backup="$BACKUP_DIR/pre_restore_backup_$(date +%Y%m%d_%H%M%S)"
        
        if $NEO4J_ADMIN backup --database="$NEO4J_DATABASE" --to-path="$current_backup" 2>&1; then
            log "Резервная копия текущей БД создана: $current_backup"
        else
            warning "Не удалось создать резервную копию текущей БД"
        fi
    fi
}

# Функция для восстановления базы данных
perform_restore() {
    local backup_path=$1
    
    log "Начало восстановления из резервной копии..."
    log "Источник: $backup_path"
    log "База данных: $NEO4J_DATABASE"
    log "Стратегия: $RESTORE_STRATEGY"
    
    # Остановка Neo4j
    stop_neo4j
    
    # Создание резервной копии текущей БД
    backup_current_database
    
    local restore_options="--database=$NEO4J_DATABASE --from-path=$backup_path"
    
    # Дополнительные опции
    [ "$FORCE" = "true" ] && restore_options="$restore_options --force"
    [ "$VERBOSE" = "true" ] && restore_options="$restore_options --verbose"
    
    case $RESTORE_STRATEGY in
        "replace")
            log "Выполнение: $NEO4J_ADMIN restore $restore_options"
            
            if $NEO4J_ADMIN restore $restore_options 2>&1 | while read line; do
                echo "[neo4j-admin] $line"
            done; then
                log "Восстановление завершено успешно"
            else
                error "Ошибка при восстановлении"
                exit 1
            fi
            ;;
            
        "import")
            # Импорт данных в существующую БД
            warning "Стратегия 'import' требует дополнительной настройки"
            error "Используйте стратегию 'replace' для полного восстановления"
            exit 1
            ;;
            
        *)
            error "Неизвестная стратегия восстановления: $RESTORE_STRATEGY"
            exit 1
            ;;
    esac
    
    # Запуск Neo4j
    start_neo4j
}

# Функция для проверки восстановленной базы данных
verify_restoration() {
    log "Проверка восстановленной базы данных..."
    
    if command -v cypher-shell &> /dev/null; then
        # Получение статистики
        local stats=$(echo "
        MATCH (n) WITH count(n) as nodeCount
        MATCH ()-[r]->() WITH count(r) as relCount, nodeCount
        RETURN nodeCount, relCount;
        " | cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
            -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
            --format plain 2>/dev/null | tail -n 1)
        
        if [ -n "$stats" ]; then
            info "Статистика восстановленной базы данных:"
            info "  Узлов: $(echo "$stats" | cut -d',' -f1)"
            info "  Связей: $(echo "$stats" | cut -d',' -f2)"
            
            # Проверка наличия данных концепций
            local concepts=$(echo "MATCH (c:Concept) RETURN count(c);" | \
                cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
                -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
                --format plain 2>/dev/null | tail -n 1)
            
            local categories=$(echo "MATCH (cat:Category) RETURN count(cat);" | \
                cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
                -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
                --format plain 2>/dev/null | tail -n 1)
            
            info "  Концепций: $concepts"
            info "  Категорий: $categories"
            
            return 0
        else
            error "Не удалось получить статистику БД"
            return 1
        fi
    else
        warning "cypher-shell не доступен, пропуск детальной проверки"
        return 0
    fi
}

# Функция для очистки временных файлов
cleanup_temp_files() {
    if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
        log "Очистка временных файлов..."
        rm -rf "$TEMP_DIR"
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
            -d "{\"text\": \"Neo4j Restore: $message\", \"color\": \"$color\"}" \
            2>/dev/null || warning "Не удалось отправить уведомление"
    fi
}

# Обработчик сигналов для очистки
trap cleanup_temp_files EXIT INT TERM

# Основная функция
main() {
    log "=== Запуск скрипта восстановления Neo4j ==="
    
    local backup_file=""
    
    # Обработка аргументов командной строки
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--file)
                backup_file="$2"
                shift 2
                ;;
            -d|--database)
                NEO4J_DATABASE="$2"
                shift 2
                ;;
            -s|--strategy)
                RESTORE_STRATEGY="$2"
                shift 2
                ;;
            --create-backup)
                CREATE_BACKUP="true"
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
            -h|--help)
                echo "Использование: $0 [опции]"
                echo "Опции:"
                echo "  -f, --file FILE         Путь к файлу резервной копии"
                echo "  -d, --database NAME     Имя базы данных для восстановления"
                echo "  -s, --strategy TYPE     Стратегия восстановления: replace, import"
                echo "  --create-backup        Создать резервную копию перед восстановлением"
                echo "  --force                Принудительное восстановление"
                echo "  -v, --verbose          Подробный вывод"
                echo "  -h, --help             Показать эту справку"
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
    
    # Выбор файла резервной копии
    backup_file=$(select_backup_file "$backup_file")
    
    # Подтверждение восстановления
    echo ""
    warning "ВНИМАНИЕ: Восстановление базы данных перезапишет существующие данные!"
    info "База данных: $NEO4J_DATABASE"
    info "Файл бэкапа: $backup_file"
    echo ""
    read -p "Продолжить восстановление? (y/N) " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Восстановление отменено пользователем"
        exit 0
    fi
    
    # Распаковка архива при необходимости
    original_backup=$backup_file
    backup_file=$(extract_backup "$backup_file")
    
    # Сохраняем путь для очистки
    if [ "$backup_file" != "$original_backup" ]; then
        TEMP_DIR=$(dirname "$backup_file")
    fi
    
    # Выполнение восстановления
    perform_restore "$backup_file"
    
    # Проверка
    if verify_restoration; then
        log "=== Восстановление завершено успешно ==="
        send_notification "success" "База данных Neo4j восстановлена успешно"
        exit 0
    else
        error "Восстановление завершено с ошибками"
        send_notification "error" "Ошибка при восстановлении базы данных Neo4j"
        exit 1
    fi
}

# Запуск основной функции
main "$@"