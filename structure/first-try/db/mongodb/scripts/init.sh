#!/bin/bash
# db/mongodb/scripts/init.sh

# Инициализация MongoDB

MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017"}
MONGODB_DB=${MONGODB_DB:-"philosophy_service"}

echo "Initializing MongoDB database..."

# Проверка подключения
mongosh "$MONGODB_URI" --eval "db.version()" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Error: Cannot connect to MongoDB at $MONGODB_URI"
    exit 1
fi

# Создание базы данных и пользователя (если необходимо)
mongosh "$MONGODB_URI" <<EOF
use $MONGODB_DB

// Создание пользователя для приложения (если не существует)
if (!db.getUser("app_user")) {
  db.createUser({
    user: "app_user",
    pwd: "${MONGODB_APP_PASSWORD:-password}",
    roles: [
      { role: "readWrite", db: "$MONGODB_DB" }
    ]
  });
}

// Создание коллекции для миграций
db.createCollection("migrations");

// Создание начальных индексов для миграций
db.migrations.createIndex({ filename: 1 }, { unique: true });
db.migrations.createIndex({ executedAt: 1 });

print("MongoDB initialized successfully");
EOF
