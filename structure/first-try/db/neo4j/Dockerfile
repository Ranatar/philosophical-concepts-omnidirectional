# db/neo4j/Dockerfile

FROM neo4j:5.12.0

# Установка необходимых инструментов
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Копирование скриптов
COPY ./scripts /scripts
RUN chmod +x /scripts/*.sh

# Копирование миграций
COPY ./migrations /migrations

# Установка плагинов Neo4j
ENV NEO4J_PLUGINS='["apoc", "graph-data-science"]'

# Конфигурация Neo4j
ENV NEO4J_dbms_memory_heap_initial__size='512m'
ENV NEO4J_dbms_memory_heap_max__size='2G'
ENV NEO4J_dbms_memory_pagecache_size='1G'

# Точка входа
ENTRYPOINT ["/scripts/docker-entrypoint.sh"]
