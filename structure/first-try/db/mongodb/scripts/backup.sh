#!/bin/bash
# db/mongodb/scripts/backup.sh

# Создание резервной копии MongoDB

BACKUP_DIR=${BACKUP_DIR:-"./backups"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="mongodb_backup_$TIMESTAMP"
MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017"}
MONGODB_DB=${MONGODB_DB:-"philosophy_service"}

echo "Creating MongoDB backup: $BACKUP_NAME"

# Создание директории для резервных копий
mkdir -p "$BACKUP_DIR"

# Создание дампа базы данных
mongodump --uri="$MONGODB_URI" \
          --db="$MONGODB_DB" \
          --out="$BACKUP_DIR/$BACKUP_NAME"

if [ $? -eq 0 ]; then
    echo "Backup created successfully"
    
    # Архивация резервной копии
    tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
    rm -rf "$BACKUP_DIR/$BACKUP_NAME"
    
    echo "Backup archived: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
    
    # Удаление старых резервных копий (оставляем последние 5)
    ls -t "$BACKUP_DIR"/mongodb_backup_*.tar.gz | tail -n +6 | xargs -r rm
    echo "Old backups cleaned up"
else
    echo "Error creating backup"
    exit 1
fi
