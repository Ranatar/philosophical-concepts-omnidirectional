#!/bin/bash
# db/neo4j/scripts/restore.sh

# Восстановление Neo4j из резервной копии

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Restoring Neo4j from backup: $BACKUP_FILE"

# Остановка Neo4j
neo4j stop

# Распаковка резервной копии, если она сжата
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
    BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# Восстановление из дампа
neo4j-admin load --from="$BACKUP_FILE" --database=neo4j --force

# Запуск Neo4j
neo4j start

echo "Neo4j restored successfully"
