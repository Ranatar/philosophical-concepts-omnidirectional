#!/bin/bash
# db/mongodb/scripts/restore.sh

# Восстановление MongoDB из резервной копии

BACKUP_FILE=$1
MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017"}
MONGODB_DB=${MONGODB_DB:-"philosophy_service"}

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Restoring MongoDB from backup: $BACKUP_FILE"

# Создание временной директории
TEMP_DIR=$(mktemp -d)

# Распаковка архива
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Поиск директории с дампом
DUMP_DIR=$(find "$TEMP_DIR" -name "$MONGODB_DB" -type d | head -n 1)

if [ -z "$DUMP_DIR" ]; then
    echo "Error: Database dump not found in backup"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Восстановление из дампа
mongorestore --uri="$MONGODB_URI" \
             --db="$MONGODB_DB" \
             --drop \
             "$DUMP_DIR"

if [ $? -eq 0 ]; then
    echo "MongoDB restored successfully"
else
    echo "Error restoring MongoDB"
fi

# Очистка временных файлов
rm -rf "$TEMP_DIR"
