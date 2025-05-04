#!/bin/bash
# db/mongodb/scripts/docker-entrypoint.sh

# Запуск MongoDB и выполнение миграций

# Запуск MongoDB в фоновом режиме
mongod --config /etc/mongod.conf &

# Ожидание запуска MongoDB
echo "Waiting for MongoDB to start..."
until mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    sleep 1
done

echo "MongoDB started, running initialization..."

# Инициализация базы данных
/scripts/init.sh

# Выполнение миграций
cd /scripts
node migration-runner.js

# Передача управления MongoDB
wait
