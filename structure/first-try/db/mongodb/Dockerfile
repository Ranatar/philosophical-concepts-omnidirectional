# db/mongodb/Dockerfile

FROM mongo:6.0

# Установка необходимых инструментов
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Установка MongoDB tools
RUN npm install -g mongodb

# Копирование скриптов
COPY ./scripts /scripts
RUN chmod +x /scripts/*.sh

# Копирование миграций
COPY ./migrations /migrations
COPY ./schemas /schemas

# Копирование конфигурации
COPY ./mongod.conf /etc/mongod.conf

# Установка переменных окружения
ENV MONGODB_DB=philosophy_service

# Точка входа
ENTRYPOINT ["/scripts/docker-entrypoint.sh"]
CMD ["mongod", "--config", "/etc/mongod.conf"]
