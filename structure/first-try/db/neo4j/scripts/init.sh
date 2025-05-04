#!/bin/bash
# db/neo4j/scripts/init.sh

# Инициализация Neo4j базы данных

NEO4J_URI=${NEO4J_URI:-"bolt://localhost:7687"}
NEO4J_USER=${NEO4J_USER:-"neo4j"}
NEO4J_PASSWORD=${NEO4J_PASSWORD:-"password"}
MIGRATIONS_DIR=${MIGRATIONS_DIR:-"./migrations"}

echo "Initializing Neo4j database..."

# Проверка подключения
cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "$NEO4J_URI" "RETURN 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Error: Cannot connect to Neo4j at $NEO4J_URI"
    exit 1
fi

# Создание таблицы для отслеживания миграций
cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "$NEO4J_URI" <<EOF
CREATE CONSTRAINT migration_name_unique IF NOT EXISTS
FOR (m:Migration) REQUIRE m.name IS UNIQUE;

MERGE (db:DatabaseInfo {name: 'philosophy_service'})
ON CREATE SET db.created_at = datetime(), db.version = '0.0.0'
RETURN db;
EOF

echo "Neo4j database initialized successfully"
