#!/bin/bash
# db/neo4j/scripts/backup.sh

# Создание резервной копии Neo4j

BACKUP_DIR=${BACKUP_DIR:-"./backups"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="neo4j_backup_$TIMESTAMP"

echo "Creating Neo4j backup: $BACKUP_NAME"

# Создание директории для резервных копий
mkdir -p "$BACKUP_DIR"

# Создание дампа базы данных
neo4j-admin dump --database=neo4j --to="$BACKUP_DIR/$BACKUP_NAME.dump"

if [ $? -eq 0 ]; then
    echo "Backup created successfully: $BACKUP_DIR/$BACKUP_NAME.dump"
    
    # Сжатие резервной копии
    gzip "$BACKUP_DIR/$BACKUP_NAME.dump"
    echo "Backup compressed: $BACKUP_DIR/$BACKUP_NAME.dump.gz"
    
    # Удаление старых резервных копий (оставляем последние 5)
    ls -t "$BACKUP_DIR"/neo4j_backup_*.dump.gz | tail -n +6 | xargs -r rm
    echo "Old backups cleaned up"
else
    echo "Error creating backup"
    exit 1
fi
