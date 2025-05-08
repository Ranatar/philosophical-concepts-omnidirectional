#!/bin/bash
# scripts/check-health.sh

# Проверка здоровья всех сервисов

check_service() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    echo -n "Checking $service health"
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps | grep $service | grep -q "healthy"; then
            echo " - OK"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo " - FAILED"
    return 1
}

# Проверка всех сервисов
services=("postgres" "neo4j" "mongodb" "redis")
failed=0

for service in "${services[@]}"; do
    if ! check_service $service; then
        failed=1
    fi
done

if [ $failed -eq 1 ]; then
    echo "Some services failed health check"
    exit 1
fi

echo "All services are healthy"
exit 0