#!/bin/bash
# db/neo4j/scripts/docker-entrypoint.sh

# Запуск Neo4j и выполнение миграций

# Запуск Neo4j в фоновом режиме
/docker-entrypoint.sh neo4j &

# Ожидание запуска Neo4j
echo "Waiting for Neo4j to start..."
until cypher-shell -u neo4j -p "$NEO4J_AUTH" "RETURN 1;" > /dev/null 2>&1; do
    sleep 1
done

echo "Neo4j started, running migrations..."

# Выполнение миграций
/scripts/init.sh
/scripts/migrate.sh

# Передача управления Neo4j
wait
