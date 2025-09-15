#!/bin/bash

# Neo4j Initialization Script
# Скрипт для инициализации базы данных Neo4j

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
NEO4J_HOME="${NEO4J_HOME:-/var/lib/neo4j}"
NEO4J_HOST="${NEO4J_HOST:-localhost}"
NEO4J_PORT="${NEO4J_PORT:-7687}"
NEO4J_USERNAME="${NEO4J_USERNAME:-neo4j}"
NEO4J_DATABASE="${NEO4J_DATABASE:-neo4j}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-/app/db/neo4j/migrations}"
SEEDS_DIR="${SEEDS_DIR:-/app/db/neo4j/seeds}"
WAIT_FOR_NEO4J="${WAIT_FOR_NEO4J:-true}"
MAX_WAIT_TIME="${MAX_WAIT_TIME:-60}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-true}"
RUN_SEEDS="${RUN_SEEDS:-false}"
ENABLE_APOC="${ENABLE_APOC:-true}"
ENABLE_GDS="${ENABLE_GDS:-false}"

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

# Функция для проверки зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    if ! command -v cypher-shell &> /dev/null; then
        error "cypher-shell не найден. Установите Neo4j client tools"
        exit 1
    fi
}

# Функция для ожидания запуска Neo4j
wait_for_neo4j() {
    if [ "$WAIT_FOR_NEO4J" != "true" ]; then
        return 0
    fi
    
    log "Ожидание запуска Neo4j..."
    
    local elapsed=0
    while [ $elapsed -lt $MAX_WAIT_TIME ]; do
        if echo "RETURN 1;" | cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
            -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-neo4j}" \
            --format plain 2>/dev/null | grep -q "1"; then
            log "Neo4j доступен"
            return 0
        fi
        
        sleep 2
        elapsed=$((elapsed + 2))
        debug "Ожидание... ($elapsed/$MAX_WAIT_TIME сек)"
    done
    
    error "Neo4j не запустился в течение $MAX_WAIT_TIME секунд"
    exit 1
}

# Функция для изменения пароля по умолчанию
change_default_password() {
    log "Проверка пароля по умолчанию..."
    
    # Проверяем, используется ли пароль по умолчанию
    if echo "RETURN 1;" | cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
        -u "$NEO4J_USERNAME" -p "neo4j" \
        --format plain 2>&1 | grep -q "credentials have not been changed"; then
        
        log "Изменение пароля по умолчанию..."
        
        if [ -z "$NEO4J_PASSWORD" ]; then
            error "NEO4J_PASSWORD не установлен. Установите переменную окружения"
            exit 1
        fi
        
        # Меняем пароль
        echo "ALTER CURRENT USER SET PASSWORD FROM 'neo4j' TO '$NEO4J_PASSWORD';" | \
            cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
            -u "$NEO4J_USERNAME" -p "neo4j" 2>&1
        
        log "Пароль успешно изменен"
    else
        debug "Используется не дефолтный пароль"
    fi
}

# Функция для установки расширений
install_extensions() {
    log "Проверка расширений Neo4j..."
    
    # APOC
    if [ "$ENABLE_APOC" = "true" ]; then
        local apoc_exists=$(echo "RETURN apoc.version();" | \
            cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
            -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
            --format plain 2>&1 | grep -v "Unknown function")
        
        if [ -z "$apoc_exists" ]; then
            warning "APOC не установлен. Установите его для расширенной функциональности"
            info "Скачайте APOC с https://github.com/neo4j-contrib/neo4j-apoc-procedures"
            info "и поместите JAR файл в $NEO4J_HOME/plugins/"
        else
            log "APOC установлен: $apoc_exists"
        fi
    fi
    
    # Graph Data Science
    if [ "$ENABLE_GDS" = "true" ]; then
        local gds_exists=$(echo "RETURN gds.version();" | \
            cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
            -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
            --format plain 2>&1 | grep -v "Unknown function")
        
        if [ -z "$gds_exists" ]; then
            warning "Graph Data Science не установлен"
            info "Скачайте GDS с https://neo4j.com/graph-data-science-software/"
        else
            log "GDS установлен: $gds_exists"
        fi
    fi
}

# Функция для создания базовых индексов и ограничений
create_base_schema() {
    log "Создание базовой схемы..."
    
    # Проверяем, существует ли уже схема
    local constraints=$(echo "SHOW CONSTRAINTS;" | \
        cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
        -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
        --format plain 2>/dev/null | wc -l)
    
    if [ "$constraints" -gt 1 ]; then
        log "Схема уже существует, пропускаем создание"
        return 0
    fi
    
    # Базовые ограничения для системных узлов
    echo "
    // Ограничения для узла Migration
    CREATE CONSTRAINT constraint_migration_version_unique IF NOT EXISTS
    FOR (m:Migration)
    REQUIRE m.version IS UNIQUE;
    
    // Индекс для Migration
    CREATE INDEX idx_migration_status IF NOT EXISTS
    FOR (m:Migration)
    ON (m.status);
    " | cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
        -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" 2>&1
    
    log "Базовая схема создана"
}

# Функция для выполнения миграций
run_migrations() {
    if [ "$RUN_MIGRATIONS" != "true" ]; then
        log "Пропуск миграций (RUN_MIGRATIONS=false)"
        return 0
    fi
    
    if [ ! -d "$MIGRATIONS_DIR" ]; then
        warning "Директория миграций не найдена: $MIGRATIONS_DIR"
        return 0
    fi
    
    log "Выполнение миграций..."
    
    local count=0
    local errors=0
    
    # Получаем список выполненных миграций
    local applied_migrations=$(echo "MATCH (m:Migration) RETURN m.version ORDER BY m.version;" | \
        cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
        -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
        --format plain 2>/dev/null | tail -n +2)
    
    # Выполняем миграции
    for migration_file in $(find "$MIGRATIONS_DIR" -name "*.cypher" | sort); do
        local filename=$(basename "$migration_file")
        local version=$(echo "$filename" | cut -d'_' -f1)
        
        # Проверяем, применена ли уже миграция
        if echo "$applied_migrations" | grep -q "^$version$"; then
            debug "Миграция $version уже применена, пропускаем"
            continue
        fi
        
        info "Применение миграции: $filename"
        
        if cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
            -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
            -f "$migration_file" 2>&1 | while read line; do
                debug "  $line"
            done; then
            log "Миграция $filename применена успешно"
            ((count++))
        else
            error "Ошибка при применении миграции $filename"
            ((errors++))
        fi
    done
    
    log "Применено миграций: $count"
    [ $errors -gt 0 ] && warning "Миграций с ошибками: $errors"
}

# Функция для выполнения seed-файлов
run_seeds() {
    if [ "$RUN_SEEDS" != "true" ]; then
        log "Пропуск seed-файлов (RUN_SEEDS=false)"
        return 0
    fi
    
    if [ ! -d "$SEEDS_DIR" ]; then
        warning "Директория seed-файлов не найдена: $SEEDS_DIR"
        return 0
    fi
    
    log "Выполнение seed-файлов..."
    
    # Проверяем, есть ли уже данные
    local node_count=$(echo "MATCH (n) RETURN count(n);" | \
        cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
        -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
        --format plain 2>/dev/null | tail -n 1)
    
    if [ "$node_count" -gt 100 ]; then
        warning "База данных уже содержит данные ($node_count узлов), пропускаем seeds"
        return 0
    fi
    
    local count=0
    
    for seed_file in $(find "$SEEDS_DIR" -name "*.cypher" | sort); do
        local filename=$(basename "$seed_file")
        info "Выполнение seed: $filename"
        
        if cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
            -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
            -f "$seed_file" 2>&1 | while read line; do
                debug "  $line"
            done; then
            log "Seed $filename выполнен успешно"
            ((count++))
        else
            error "Ошибка при выполнении seed $filename"
        fi
    done
    
    log "Выполнено seed-файлов: $count"
}

# Функция для настройки производительности
configure_performance() {
    log "Проверка настроек производительности..."
    
    # Получаем информацию о памяти
    local memory_info=$(echo "
    CALL dbms.listConfig() YIELD name, value
    WHERE name IN ['dbms.memory.heap.initial_size', 'dbms.memory.heap.max_size', 
                   'dbms.memory.pagecache.size', 'dbms.tx_state.memory_allocation']
    RETURN name, value;
    " | cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
        -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
        --format plain 2>/dev/null)
    
    if [ -n "$memory_info" ]; then
        info "Текущие настройки памяти:"
        echo "$memory_info" | while read line; do
            info "  $line"
        done
    fi
    
    # Рекомендации по настройке
    local total_memory=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$total_memory" -lt 8 ]; then
        warning "Обнаружено менее 8GB RAM. Рекомендуется увеличить память для оптимальной производительности"
    fi
}

# Функция для создания отчета об инициализации
create_init_report() {
    log "Создание отчета об инициализации..."
    
    local report_file="/tmp/neo4j_init_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== Neo4j Initialization Report ==="
        echo "Date: $(date)"
        echo "Host: $NEO4J_HOST:$NEO4J_PORT"
        echo "Database: $NEO4J_DATABASE"
        echo ""
        
        echo "=== Database Statistics ==="
        echo "MATCH (n) RETURN count(n) as nodes;" | \
            cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
            -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
            --format plain 2>/dev/null
        
        echo "MATCH ()-[r]->() RETURN count(r) as relationships;" | \
            cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
            -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
            --format plain 2>/dev/null
        
        echo ""
        echo "=== Constraints ==="
        echo "SHOW CONSTRAINTS;" | \
            cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
            -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
            --format plain 2>/dev/null
        
        echo ""
        echo "=== Indexes ==="
        echo "SHOW INDEXES;" | \
            cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
            -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
            --format plain 2>/dev/null
    } > "$report_file"
    
    log "Отчет сохранен в: $report_file"
}

# Основная функция
main() {
    log "=== Neo4j Initialization Script ==="
    
    # Обработка аргументов командной строки
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-wait)
                WAIT_FOR_NEO4J="false"
                shift
                ;;
            --skip-migrations)
                RUN_MIGRATIONS="false"
                shift
                ;;
            --run-seeds)
                RUN_SEEDS="true"
                shift
                ;;
            --password)
                NEO4J_PASSWORD="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE="true"
                shift
                ;;
            -h|--help)
                echo "Использование: $0 [опции]"
                echo "Опции:"
                echo "  --no-wait           Не ждать запуска Neo4j"
                echo "  --skip-migrations   Пропустить выполнение миграций"
                echo "  --run-seeds        Выполнить seed-файлы"
                echo "  --password PASS    Установить пароль Neo4j"
                echo "  -v, --verbose      Подробный вывод"
                echo "  -h, --help         Показать эту справку"
                exit 0
                ;;
            *)
                error "Неизвестная опция: $1"
                exit 1
                ;;
        esac
    done
    
    # Выполнение инициализации
    check_dependencies
    wait_for_neo4j
    change_default_password
    install_extensions
    create_base_schema
    run_migrations
    run_seeds
    configure_performance
    create_init_report
    
    log "=== Инициализация Neo4j завершена ==="
    
    # Финальная статистика
    local final_stats=$(echo "
    MATCH (n) WITH count(n) as nodes
    MATCH ()-[r]->() WITH count(r) as relationships, nodes
    MATCH (c:Concept) WITH count(c) as concepts, relationships, nodes
    MATCH (cat:Category) WITH count(cat) as categories, concepts, relationships, nodes
    RETURN nodes, relationships, concepts, categories;
    " | cypher-shell -a "$NEO4J_HOST:$NEO4J_PORT" \
        -u "$NEO4J_USERNAME" -p "${NEO4J_PASSWORD:-}" \
        --format plain 2>/dev/null | tail -n 1)
    
    if [ -n "$final_stats" ]; then
        info "Итоговая статистика:"
        info "  Всего узлов: $(echo "$final_stats" | cut -d',' -f1)"
        info "  Всего связей: $(echo "$final_stats" | cut -d',' -f2)"
        info "  Концепций: $(echo "$final_stats" | cut -d',' -f3)"
        info "  Категорий: $(echo "$final_stats" | cut -d',' -f4)"
    fi
}

# Запуск основной функции
main "$@"