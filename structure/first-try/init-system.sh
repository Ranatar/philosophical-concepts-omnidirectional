#!/bin/bash
# init-system.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Проверка зависимостей
check_dependencies() {
    log "Checking dependencies..."
    
    command -v docker >/dev/null 2>&1 || error "Docker is not installed"
    command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is not installed"
    
    docker info >/dev/null 2>&1 || error "Docker daemon is not running"
    
    log "All dependencies are satisfied"
}

# Создание необходимых директорий
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p db/{postgres,neo4j,mongodb}/{migrations,scripts,seeds}
    mkdir -p monitoring/{prometheus/alerts,grafana/{dashboards,provisioning}}
    mkdir -p logs
    mkdir -p backups
    
    log "Directories created successfully"
}

# Проверка и создание .env файла
setup_environment() {
    log "Setting up environment..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# Database passwords
POSTGRES_PASSWORD=philosophy_pg_2024
NEO4J_PASSWORD=philosophy_neo4j_2024
MONGODB_PASSWORD=philosophy_mongo_2024
GRAFANA_PASSWORD=philosophy_grafana_2024

# Service configuration
NODE_ENV=development
LOG_LEVEL=info

# Database connections
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=philosophy_db
POSTGRES_USER=postgres

NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j

MONGODB_URI=mongodb://root:philosophy_mongo_2024@mongodb:27017
MONGODB_DB=philosophy_service

REDIS_HOST=redis
REDIS_PORT=6379
EOF
        log "Created .env file with default values"
    else
        log ".env file already exists"
    fi
}

# Запуск базовых сервисов
start_base_services() {
    log "Starting base services..."
    
    docker-compose up -d postgres neo4j mongodb redis
    
    log "Waiting for services to be healthy..."
    sleep 10
    
    # Проверка здоровья сервисов
    ./scripts/check-health.sh || error "Services health check failed"
    
    log "Base services started successfully"
}

# Запуск миграций
run_migrations() {
    log "Running database migrations..."
    
    docker-compose up postgres-migrate
    docker-compose up neo4j-migrate
    docker-compose up mongodb-migrate
    
    log "Migrations completed successfully"
}

# Запуск мониторинга
start_monitoring() {
    log "Starting monitoring services..."
    
    docker-compose up -d prometheus grafana
    docker-compose up -d node-exporter postgres-exporter mongodb-exporter redis-exporter
    
    log "Monitoring services started successfully"
    log "Grafana available at: http://localhost:3001 (admin/${GRAFANA_PASSWORD:-admin})"
    log "Prometheus available at: http://localhost:9090"
}

# Создание тестовых данных
create_test_data() {
    log "Creating test data..."
    
    docker-compose run --rm diagnostics node /app/scripts/create-test-data.js
    
    log "Test data created successfully"
}

# Главная функция
main() {
    log "Starting Philosophy Service Database System initialization..."
    
    check_dependencies
    create_directories
    setup_environment
    
    # Загрузка переменных окружения
    export $(cat .env | grep -v '^#' | xargs)
    
    start_base_services
    run_migrations
    start_monitoring
    
    # Опциональное создание тестовых данных
    read -p "Create test data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_test_data
    fi
    
    log "System initialization completed successfully!"
    log "You can now start the application services"
    
    # Вывод информации о доступе
    echo
    echo "Access information:"
    echo "-------------------"
    echo "PostgreSQL: localhost:5432 (postgres/${POSTGRES_PASSWORD})"
    echo "Neo4j Browser: http://localhost:7474 (neo4j/${NEO4J_PASSWORD})"
    echo "MongoDB: localhost:27017 (root/${MONGODB_PASSWORD})"
    echo "Redis: localhost:6379"
    echo "Grafana: http://localhost:3001 (admin/${GRAFANA_PASSWORD})"
    echo "Prometheus: http://localhost:9090"
    echo "Diagnostics: http://localhost:3002"
}

# Запуск скрипта
main