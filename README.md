# Руководство по развертыванию сервиса философских концепций

Данное руководство предоставляет пошаговые инструкции по развертыванию и запуску сервиса философских концепций - комплексной микросервисной платформы для работы с философскими идеями, их анализа и синтеза.

## Содержание

1. [Требования и предварительная настройка](#1-требования-и-предварительная-настройка)
2. [Получение исходного кода](#2-получение-исходного-кода)
3. [Настройка переменных окружения](#3-настройка-переменных-окружения)
4. [Локальное развертывание (Разработка)](#4-локальное-развертывание-разработка)
5. [Проверка работоспособности](#5-проверка-работоспособности)
6. [Базовые операции](#6-базовые-операции)
7. [Продакшн-развертывание с Kubernetes](#7-продакшн-развертывание-с-kubernetes)
8. [Настройка интеграции с Claude API](#8-настройка-интеграции-с-claude-api)
9. [Управление данными и миграции](#9-управление-данными-и-миграции)
10. [Мониторинг и логирование](#10-мониторинг-и-логирование)
11. [Устранение типичных проблем](#11-устранение-типичных-проблем)
12. [Полезные команды](#12-полезные-команды)

## 1. Требования и предварительная настройка

### 1.1 Системные требования

- **ОС**: Linux (рекомендуется Ubuntu 22.04 LTS или Debian 11), macOS, Windows с WSL2
- **RAM**: минимум 16 ГБ для локальной разработки, 32+ ГБ для продакшн
- **CPU**: 4+ ядра для разработки, 8+ ядер для продакшн
- **Дисковое пространство**: минимум 50 ГБ SSD

### 1.2 Необходимое программное обеспечение

Установите следующие компоненты:

- **Docker**: версия 20.10.0 или выше
- **Docker Compose**: версия 2.0.0 или выше
- **Git**: последняя стабильная версия
- **Node.js**: версия 18 LTS или выше (для локальной разработки фронтенда)
- **kubectl**: соответствующая вашему кластеру Kubernetes версия (для продакшн)
- **helm**: версия 3.8 или выше (для продакшн)

#### Установка на Ubuntu/Debian:

```bash
# Обновление списка пакетов
sudo apt update

# Установка базовых пакетов
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common git

# Установка Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Добавление текущего пользователя в группу docker
sudo usermod -aG docker $USER

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установка kubectl (для продакшн)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Установка helm (для продакшн)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

#### Для macOS (с использованием Homebrew):

```bash
# Установка Homebrew (если не установлен)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установка Docker Desktop (включает Docker и Docker Compose)
brew install --cask docker

# Установка Git
brew install git

# Установка Node.js
brew install node@18

# Установка kubectl (для продакшн)
brew install kubectl

# Установка helm (для продакшн)
brew install helm
```

### 1.3 Настройка Docker

После установки Docker:

1. Запустите Docker daemon:
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

2. Проверьте установку:
```bash
docker --version
docker-compose --version
```

3. Увеличьте лимиты ресурсов Docker (для Docker Desktop):
   - Откройте Docker Desktop > Settings
   - Перейдите в Resources > Advanced
   - Увеличьте Memory до 8-12 ГБ
   - Увеличьте CPUs до 4-6
   - Увеличьте Swap до 4 ГБ
   - Нажмите Apply & Restart

## 2. Получение исходного кода

1. Клонируйте репозиторий проекта:
```bash
git clone <URL-репозитория> philosophy-service
cd philosophy-service
```

2. Если проект использует подмодули, инициализируйте их:
```bash
git submodule update --init --recursive
```

## 3. Настройка переменных окружения

1. Создайте файлы переменных окружения для каждого компонента:

```bash
# Скопируйте шаблоны для всех сервисов
cp .env.example .env
cp api-gateway/.env.example api-gateway/.env
cp user-service/.env.example user-service/.env
cp concept-service/.env.example concept-service/.env
cp graph-service/.env.example graph-service/.env
cp thesis-service/.env.example thesis-service/.env
cp synthesis-service/.env.example synthesis-service/.env
cp claude-service/.env.example claude-service/.env
cp name-analysis-service/.env.example name-analysis-service/.env
cp historical-context-service/.env.example historical-context-service/.env
cp practical-application-service/.env.example practical-application-service/.env
cp dialogue-service/.env.example dialogue-service/.env
cp evolution-service/.env.example evolution-service/.env
cp frontend/.env.example frontend/.env
```

2. Отредактируйте созданные .env файлы, установив необходимые значения для:

### Основные настройки (.env)

```
# Общие настройки
NODE_ENV=development
LOG_LEVEL=debug

# Параметры базы данных PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=philosophy
POSTGRES_USER=philosophy_user
POSTGRES_PASSWORD=<сгенерируйте_сложный_пароль>

# Параметры Neo4j
NEO4J_HOST=neo4j
NEO4J_PORT=7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=<сгенерируйте_сложный_пароль>

# Параметры MongoDB
MONGO_HOST=mongodb
MONGO_PORT=27017
MONGO_DB=philosophy
MONGO_USER=philosophy_user
MONGO_PASSWORD=<сгенерируйте_сложный_пароль>

# Параметры Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<сгенерируйте_сложный_пароль>

# Параметры RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=philosophy_user
RABBITMQ_PASSWORD=<сгенерируйте_сложный_пароль>

# Настройки JWT
JWT_SECRET=<сгенерируйте_длинный_случайный_ключ>
JWT_EXPIRATION=86400

# Интеграция с Claude API
CLAUDE_API_KEY=<ваш_ключ_API_Claude>
CLAUDE_API_URL=https://api.anthropic.com/v1
```

### Для Claude Service (.env)

```
CLAUDE_API_KEY=<ваш_ключ_API_Claude>
CLAUDE_API_URL=https://api.anthropic.com/v1
CLAUDE_MODEL=claude-3-opus-20240229
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=philosophy_user
RABBITMQ_PASSWORD=<тот_же_пароль_что_и_в_основном_файле>
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=philosophy
POSTGRES_USER=philosophy_user
POSTGRES_PASSWORD=<тот_же_пароль_что_и_в_основном_файле>
```

### Для Frontend (.env)

```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000/ws
NODE_ENV=development
```

3. Создайте пароли для баз данных и служб:

```bash
# Для генерации безопасных паролей и ключей
# Замените значения в соответствующих .env файлах
openssl rand -base64 32  # Для JWT_SECRET
openssl rand -base64 24  # Для паролей баз данных
```

## 4. Локальное развертывание (Разработка)

### 4.1 Создание и запуск контейнеров с Docker Compose

1. Соберите и запустите все сервисы с помощью Docker Compose:

```bash
# Запуск всех сервисов в фоновом режиме
docker-compose up -d
```

Этот процесс может занять несколько минут при первом запуске, так как Docker будет скачивать базовые образы и собирать контейнеры.

2. Для запуска только определенных сервисов:

```bash
# Запуск только баз данных и инфраструктурных сервисов
docker-compose up -d postgres neo4j mongodb redis rabbitmq

# Запуск основных сервисов
docker-compose up -d api-gateway user-service concept-service graph-service thesis-service claude-service

# Запуск фронтенда
docker-compose up -d frontend
```

### 4.2 Инициализация баз данных

1. Запустите скрипты инициализации для каждой базы данных:

```bash
# Инициализация PostgreSQL
docker-compose exec postgres sh -c "cd /docker-entrypoint-initdb.d && ./init-scripts.sh"

# Инициализация Neo4j
docker-compose exec neo4j sh -c "cd /docker-entrypoint-initdb.d && ./init-neo4j.sh"

# Инициализация MongoDB
docker-compose exec mongodb sh -c "cd /docker-entrypoint-initdb.d && ./init-mongo.sh"
```

2. Выполните миграции для настройки схем баз данных:

```bash
# Миграции PostgreSQL
docker-compose exec user-service npm run migrate

# Миграции Neo4j
docker-compose exec graph-service npm run migrate

# Миграции MongoDB
docker-compose exec thesis-service npm run migrate
```

### 4.3 Загрузка тестовых данных (опционально)

Для загрузки тестовых данных:

```bash
# PostgreSQL
docker-compose exec postgres psql -U philosophy_user -d philosophy -f /seed/postgres/seed-all.sql

# Neo4j
docker-compose exec neo4j cypher-shell -u neo4j -p <ваш_пароль> -f /seed/neo4j/seed-all.cypher

# MongoDB
docker-compose exec mongodb mongosh -u philosophy_user -p <ваш_пароль> philosophy --eval "load('/seed/mongodb/seed-all.js')"
```

## 5. Проверка работоспособности

### 5.1 Проверка статуса контейнеров

```bash
# Проверка статуса всех контейнеров
docker-compose ps

# Просмотр логов всех контейнеров
docker-compose logs

# Просмотр логов конкретного контейнера (например, api-gateway)
docker-compose logs -f api-gateway
```

### 5.2 Проверка доступности сервисов

1. **API Gateway**:
```bash
curl http://localhost:3000/api/health
# Должен вернуть {"status":"ok"}
```

2. **Фронтенд**:
   - Откройте в браузере [http://localhost:8080](http://localhost:8080)

3. **Проверка обращения к микросервису через API Gateway**:
```bash
# Получение списка концепций (требуется аутентификация)
curl -X GET http://localhost:3000/api/concepts \
  -H "Authorization: Bearer <ваш_JWT_токен>"
```

4. **Получение JWT-токена** (для доступа к защищенным эндпоинтам):
```bash
# Аутентификация и получение токена
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword"}'
# Ответ будет содержать JWT токен
```

### 5.3 Диагностика проблем

Если какой-либо из сервисов не запускается или недоступен:

1. **Проверьте логи контейнера**:
```bash
docker-compose logs -f <имя_сервиса>
```

2. **Войдите в контейнер для диагностики**:
```bash
docker-compose exec <имя_сервиса> bash
```

3. **Проверьте сетевые соединения внутри контейнера**:
```bash
# Установка netcat в контейнер (если нужно)
apt-get update && apt-get install -y netcat

# Проверка соединения с другим сервисом
nc -zv <имя_сервиса> <порт>

# Например, проверка соединения с PostgreSQL
nc -zv postgres 5432
```

## 6. Базовые операции

### 6.1 Управление отдельными сервисами

```bash
# Перезапуск конкретного сервиса
docker-compose restart <имя_сервиса>

# Остановка конкретного сервиса
docker-compose stop <имя_сервиса>

# Запуск конкретного сервиса
docker-compose start <имя_сервиса>

# Пересборка и запуск сервиса (при изменении кода)
docker-compose up -d --build <имя_сервиса>
```

### 6.2 Работа с логами

```bash
# Просмотр логов всех сервисов в реальном времени
docker-compose logs -f

# Просмотр логов конкретного сервиса с ограничением количества строк
docker-compose logs --tail=100 <имя_сервиса>

# Просмотр логов нескольких сервисов одновременно
docker-compose logs -f <сервис1> <сервис2>
```

### 6.3 Локальная разработка фронтенда (опционально)

Для более удобной разработки фронтенда можно запустить его локально:

```bash
cd frontend
npm install
npm start
```

Фронтенд будет доступен по адресу [http://localhost:3000](http://localhost:3000) и будет автоматически обновляться при изменении кода.

### 6.4 Полная остановка и удаление системы

```bash
# Остановка всех контейнеров
docker-compose down

# Остановка и удаление контейнеров, сетей и томов
docker-compose down -v

# Полная очистка (включая образы)
docker-compose down -v --rmi all
```

## 7. Продакшн-развертывание с Kubernetes

### 7.1 Подготовка кластера Kubernetes

1. Создайте и настройте кластер Kubernetes в выбранном облачном провайдере (AWS, GCP, Azure) или локально с помощью Minikube/k3s.

2. Настройте kubectl для работы с вашим кластером:
```bash
# Проверка соединения с кластером
kubectl cluster-info
```

### 7.2 Настройка Helm

1. Добавьте репозитории Helm:
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add neo4j https://helm.neo4j.com/neo4j
helm repo add elastic https://helm.elastic.co
helm repo update
```

2. Установите необходимые зависимости:
```bash
# PostgreSQL
helm install postgres bitnami/postgresql -f kubernetes/values/postgres-values.yaml

# MongoDB
helm install mongodb bitnami/mongodb -f kubernetes/values/mongodb-values.yaml

# Neo4j
helm install neo4j neo4j/neo4j -f kubernetes/values/neo4j-values.yaml

# Redis
helm install redis bitnami/redis -f kubernetes/values/redis-values.yaml

# RabbitMQ
helm install rabbitmq bitnami/rabbitmq -f kubernetes/values/rabbitmq-values.yaml
```

### 7.3 Развертывание микросервисов

1. Создайте секреты и ConfigMaps:
```bash
# Создание секретов из переменных окружения
kubectl create secret generic db-credentials \
  --from-literal=postgres-password=<пароль_postgres> \
  --from-literal=mongo-password=<пароль_mongodb> \
  --from-literal=neo4j-password=<пароль_neo4j> \
  --from-literal=redis-password=<пароль_redis> \
  --from-literal=rabbitmq-password=<пароль_rabbitmq>

kubectl create secret generic jwt-secret \
  --from-literal=jwt-key=<ваш_jwt_секрет>

kubectl create secret generic claude-api \
  --from-literal=api-key=<ваш_ключ_api_claude>

# Применение ConfigMaps
kubectl apply -f kubernetes/config-maps/
```

2. Разверните инфраструктурные компоненты:
```bash
kubectl apply -f kubernetes/persistent-volumes/
```

3. Разверните микросервисы:
```bash
# Применение всех деплойментов
kubectl apply -f kubernetes/deployments/

# Применение всех сервисов
kubectl apply -f kubernetes/services/

# Применение Ingress
kubectl apply -f kubernetes/ingress/
```

4. Настройте автомасштабирование:
```bash
kubectl apply -f kubernetes/hpa/
```

### 7.4 Проверка развертывания в Kubernetes

```bash
# Проверка статуса подов
kubectl get pods

# Проверка статуса сервисов
kubectl get services

# Проверка статуса деплойментов
kubectl get deployments

# Проверка логов конкретного пода
kubectl logs <имя_пода>
```

## 8. Настройка интеграции с Claude API

### 8.1 Получение ключа API Claude

1. Зарегистрируйтесь на [сайте Anthropic](https://www.anthropic.com/)
2. Создайте API ключ в панели управления
3. Скопируйте API ключ и добавьте его в файлы .env или в секреты Kubernetes

### 8.2 Конфигурация Claude Service

Отредактируйте файл `claude-service/.env`:

```
CLAUDE_API_KEY=<ваш_ключ_API_Claude>
CLAUDE_API_URL=https://api.anthropic.com/v1
CLAUDE_MODEL=claude-3-opus-20240229  # или другая доступная модель
MAX_TOKENS=100000
REQUEST_TIMEOUT=300000  # таймаут в миллисекундах (5 минут)
```

### 8.3 Тестирование интеграции с Claude

```bash
# Проверка работы Claude Service
curl -X POST http://localhost:3000/api/claude/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ваш_JWT_токен>" \
  -d '{"query": "Что такое философия?", "maxTokens": 1000}'
```

## 9. Управление данными и миграции

### 9.1 Работа с миграциями PostgreSQL

```bash
# Запуск всех миграций
docker-compose exec user-service npm run migrate

# Создание новой миграции
docker-compose exec user-service npm run migrate:create -- <название_миграции>

# Откат последней миграции
docker-compose exec user-service npm run migrate:down
```

### 9.2 Работа с миграциями Neo4j

```bash
# Запуск миграций Neo4j
docker-compose exec graph-service npm run migrate

# Создание новой миграции
docker-compose exec graph-service npm run migrate:create -- <название_миграции>
```

### 9.3 Работа с миграциями MongoDB

```bash
# Запуск миграций MongoDB
docker-compose exec thesis-service npm run migrate

# Создание новой миграции
docker-compose exec thesis-service npm run migrate:create -- <название_миграции>
```

### 9.4 Резервное копирование и восстановление данных

#### PostgreSQL

```bash
# Создание резервной копии
docker-compose exec postgres pg_dump -U philosophy_user -d philosophy > backup/postgres_backup_$(date +%Y%m%d).sql

# Восстановление из резервной копии
cat backup/postgres_backup_YYYYMMDD.sql | docker-compose exec -T postgres psql -U philosophy_user -d philosophy
```

#### Neo4j

```bash
# Остановка Neo4j
docker-compose stop neo4j

# Резервное копирование данных
docker run --rm -v philosophy-service_neo4j-data:/data -v $(pwd)/backup:/backup ubuntu tar -czvf /backup/neo4j_backup_$(date +%Y%m%d).tar.gz /data

# Восстановление данных
docker run --rm -v philosophy-service_neo4j-data:/data -v $(pwd)/backup:/backup ubuntu bash -c "rm -rf /data/* && tar -xzvf /backup/neo4j_backup_YYYYMMDD.tar.gz -C /"

# Запуск Neo4j
docker-compose start neo4j
```

#### MongoDB

```bash
# Создание резервной копии
docker-compose exec mongodb mongodump --username philosophy_user --password <ваш_пароль> --db philosophy --out /backup/mongo_backup_$(date +%Y%m%d)

# Копирование на хост
docker cp $(docker-compose ps -q mongodb):/backup/mongo_backup_$(date +%Y%m%d) ./backup/

# Восстановление из резервной копии
docker cp ./backup/mongo_backup_YYYYMMDD $(docker-compose ps -q mongodb):/backup/
docker-compose exec mongodb mongorestore --username philosophy_user --password <ваш_пароль> --db philosophy /backup/mongo_backup_YYYYMMDD/philosophy
```

## 10. Мониторинг и логирование

### 10.1 Настройка Prometheus и Grafana

1. Разверните Prometheus и Grafana с помощью Docker Compose:

```bash
docker-compose -f monitoring/docker-compose.yml up -d
```

2. Доступ к панелям управления:
   - Prometheus: [http://localhost:9090](http://localhost:9090)
   - Grafana: [http://localhost:3000](http://localhost:3000) (логин: admin, пароль: admin)

3. Импортируйте дашборды в Grafana из файлов `monitoring/grafana/dashboards/`.

### 10.2 Настройка ELK Stack (Elasticsearch, Logstash, Kibana)

1. Разверните ELK Stack:

```bash
docker-compose -f monitoring/elk-docker-compose.yml up -d
```

2. Доступ к Kibana: [http://localhost:5601](http://localhost:5601)

3. Настройте индексы в Kibana для просмотра логов.

### 10.3 Добавление сервисов в мониторинг

Все микросервисы уже настроены для экспорта метрик Prometheus и отправки логов в ELK Stack. Метрики доступны по эндпоинту `/metrics` на каждом сервисе.

## 11. Устранение типичных проблем

### 11.1 Проблемы с подключением к базам данных

**Проблема**: Микросервисы не могут подключиться к базам данных.

**Решение**:
1. Проверьте, запущены ли контейнеры баз данных:
```bash
docker-compose ps postgres mongodb neo4j
```

2. Проверьте правильность учетных данных в файлах .env:
```bash
# Пример для PostgreSQL
docker-compose exec postgres psql -U philosophy_user -d philosophy -c "SELECT 1"
```

3. Проверьте сетевые правила и маршрутизацию:
```bash
docker network inspect philosophy-service_default
```

### 11.2 Проблемы с API Gateway

**Проблема**: API Gateway не маршрутизирует запросы к микросервисам.

**Решение**:
1. Проверьте логи API Gateway:
```bash
docker-compose logs -f api-gateway
```

2. Проверьте доступность микросервисов из контейнера API Gateway:
```bash
docker-compose exec api-gateway curl -I http://user-service:3001/health
```

3. Проверьте конфигурацию маршрутов в API Gateway:
```bash
docker-compose exec api-gateway cat /app/src/config/routes.js
```

### 11.3 Проблемы с интеграцией Claude API

**Проблема**: Ошибки при обращении к Claude API.

**Решение**:
1. Проверьте валидность API ключа
2. Проверьте логи Claude Service:
```bash
docker-compose logs -f claude-service
```

3. Проверьте доступность API Claude:
```bash
curl -I https://api.anthropic.com/v1/health
```

### 11.4 Проблемы с фронтендом

**Проблема**: Фронтенд не загружается или не отображается корректно.

**Решение**:
1. Проверьте логи фронтенда:
```bash
docker-compose logs -f frontend
```

2. Проверьте настройки CORS в API Gateway:
```bash
docker-compose exec api-gateway cat /app/src/middleware/cors.js
```

3. Проверьте переменные окружения фронтенда:
```bash
docker-compose exec frontend cat /app/.env
```

## 12. Полезные команды

### 12.1 Работа с Docker

```bash
# Просмотр всех контейнеров (включая остановленные)
docker-compose ps -a

# Просмотр использования ресурсов контейнерами
docker stats

# Удаление неиспользуемых образов и ресурсов
docker system prune -a

# Просмотр логов контейнера с временными метками
docker-compose logs -f --timestamps <имя_сервиса>
```

### 12.2 Доступ к базам данных

```bash
# PostgreSQL CLI
docker-compose exec postgres psql -U philosophy_user -d philosophy

# MongoDB CLI
docker-compose exec mongodb mongosh --username philosophy_user --password <ваш_пароль> philosophy

# Neo4j CLI
docker-compose exec neo4j cypher-shell -u neo4j -p <ваш_пароль>

# Redis CLI
docker-compose exec redis redis-cli -a <ваш_пароль>
```

### 12.3 Работа с RabbitMQ

```bash
# Просмотр очередей RabbitMQ
docker-compose exec rabbitmq rabbitmqctl list_queues

# Просмотр соединений
docker-compose exec rabbitmq rabbitmqctl list_connections

# Доступ к веб-интерфейсу RabbitMQ
# Откройте в браузере http://localhost:15672
# Логин: philosophy_user, пароль: <ваш_пароль>
```

### 12.4 Операции с JWT токенами

```bash
# Создание тестового JWT токена (для отладки)
docker-compose exec user-service node -e "console.log(require('jsonwebtoken').sign({userId: 'test-user', role: 'admin'}, process.env.JWT_SECRET, {expiresIn: '1h'}))"

# Декодирование JWT токена
docker-compose exec user-service node -e "console.log(JSON.stringify(require('jsonwebtoken').decode('<токен>'), null, 2))"
```

---

Поздравляем! Теперь вы успешно развернули и настроили сервис философских концепций. При возникновении дополнительных вопросов или проблем обращайтесь к документации или в техническую поддержку.

**Примечание**: Данное руководство предполагает базовую структуру проекта. Возможно, потребуется адаптировать команды и инструкции в зависимости от конкретной реализации и версий компонентов.