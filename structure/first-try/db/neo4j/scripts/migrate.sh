#!/bin/bash
# db/neo4j/scripts/migrate.sh

# Выполнение миграций Neo4j

NEO4J_URI=${NEO4J_URI:-"bolt://localhost:7687"}
NEO4J_USER=${NEO4J_USER:-"neo4j"}
NEO4J_PASSWORD=${NEO4J_PASSWORD:-"password"}
MIGRATIONS_DIR=${MIGRATIONS_DIR:-"./migrations"}

echo "Running Neo4j migrations..."

# Получение списка выполненных миграций
executed_migrations=$(cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "$NEO4J_URI" \
    "MATCH (m:Migration) RETURN m.name ORDER BY m.executed_at" --format plain)

# Выполнение новых миграций
for migration_file in $(ls $MIGRATIONS_DIR/*.cypher | sort); do
    migration_name=$(basename "$migration_file")
    
    if echo "$executed_migrations" | grep -q "$migration_name"; then
        echo "Skipping already executed migration: $migration_name"
        continue
    fi
    
    echo "Executing migration: $migration_name"
    
    # Выполнение миграции
    if cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "$NEO4J_URI" -f "$migration_file"; then
        # Регистрация успешной миграции
        cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" -a "$NEO4J_URI" <<EOF
CREATE (m:Migration {
    name: '$migration_name',
    executed_at: datetime(),
    status: 'completed'
});
EOF
        echo "Migration $migration_name completed successfully"
    else
        echo "Error executing migration: $migration_name"
        exit 1
    fi
done

echo "All migrations completed"
