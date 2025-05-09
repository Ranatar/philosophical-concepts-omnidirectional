# Фаза 1: Подготовка и основа

## Инфраструктура для разработки

### Docker-конфигурация
- `docker-compose.yml` - Основной файл для локальной разработки 
- `docker-compose.override.yml` - Переопределения для разработки
- `Dockerfile.dev` - Шаблон Dockerfile для разработки (для всех сервисов)
- `Dockerfile.prod` - Шаблон Dockerfile для продакшн (для всех сервисов)

### Инициализация баз данных
- `init/postgres/init.sql` - Скрипт инициализации PostgreSQL
- `init/neo4j/init.sh` - Скрипт инициализации Neo4j
- `init/mongo/init.js` - Скрипт инициализации MongoDB

## Общие библиотеки и утилиты

### Обработка ошибок
- `shared/lib/errors/AppError.js` - Базовый класс ошибки
- `shared/lib/errors/HttpErrors.js` - HTTP-ошибки
- `shared/lib/errors/ValidationError.js` - Ошибки валидации
- `shared/lib/errors/NotFoundError.js` - Ошибки не найденных ресурсов

### Валидация
- `shared/lib/validation/validators.js` - Общие валидаторы
- `shared/lib/validation/schemas/conceptSchemas.js` - Схемы для концепций
- `shared/lib/validation/schemas/graphSchemas.js` - Схемы для графов
- `shared/lib/validation/schemas/thesisSchemas.js` - Схемы для тезисов

### Логирование и метрики
- `shared/lib/logging/logger.js` - Общий логгер
- `shared/lib/logging/requestLogger.js` - Логирование запросов
- `shared/lib/metrics/prometheus.js` - Интеграция с Prometheus
- `shared/lib/metrics/counters.js` - Счётчики метрик

### Аутентификация
- `shared/lib/auth/jwtHelper.js` - Утилиты для работы с JWT
- `shared/lib/auth/roleHelper.js` - Утилиты для работы с ролями

### Работа с базами данных
- `shared/lib/db/postgres/client.js` - Клиент PostgreSQL
- `shared/lib/db/postgres/queryBuilder.js` - Построитель запросов
- `shared/lib/db/neo4j/driver.js` - Драйвер Neo4j
- `shared/lib/db/neo4j/cypherBuilder.js` - Построитель Cypher-запросов
- `shared/lib/db/mongodb/client.js` - Клиент MongoDB
- `shared/lib/db/mongodb/queryBuilder.js` - Построитель запросов
- `shared/lib/db/redis/client.js` - Клиент Redis
- `shared/lib/db/redis/cacheHelper.js` - Помощник для кэширования

### Обмен сообщениями
- `shared/lib/messaging/rabbitmq/connection.js` - Соединение с RabbitMQ
- `shared/lib/messaging/rabbitmq/channelManager.js` - Управление каналами
- `shared/lib/messaging/producers.js` - Продюсеры сообщений
- `shared/lib/messaging/consumers.js` - Потребители сообщений

### HTTP-утилиты
- `shared/lib/http/client.js` - HTTP-клиент
- `shared/lib/http/responseFormatter.js` - Форматирование ответов

### Форматирование
- `shared/lib/formatting/dateFormatters.js` - Форматирование дат
- `shared/lib/formatting/stringFormatters.js` - Форматирование строк

### Общие модели
- `shared/models/Concept.js` - Модель концепции
- `shared/models/Graph.js` - Модель графа
- `shared/models/Thesis.js` - Модель тезиса
- `shared/models/User.js` - Модель пользователя

### Константы
- `shared/constants/errorCodes.js` - Коды ошибок
- `shared/constants/statuses.js` - Статусы
- `shared/constants/roles.js` - Роли
- `shared/constants/philosophyConstants.js` - Константы для философских понятий

## Шаблоны компонентов

### Шаблоны для бэкенда
- `templates/backend/controllers/crud-controller-template.js` - Шаблон CRUD-контроллера
- `templates/backend/controllers/specialized-controller-template.js` - Шаблон специализированного контроллера
- `templates/backend/services/crud-service-template.js` - Шаблон CRUD-сервиса
- `templates/backend/services/specialized-service-template.js` - Шаблон специализированного сервиса
- `templates/backend/repositories/postgres-repository-template.js` - Шаблон репозитория PostgreSQL
- `templates/backend/repositories/neo4j-repository-template.js` - Шаблон репозитория Neo4j
- `templates/backend/repositories/mongodb-repository-template.js` - Шаблон репозитория MongoDB
- `templates/backend/clients/service-client-template.js` - Шаблон клиента сервиса
- `templates/backend/tests/unit-test-template.js` - Шаблон юнит-теста
- `templates/backend/tests/integration-test-template.js` - Шаблон интеграционного теста

### Шаблоны для фронтенда
- `templates/frontend/components/base-component-template.tsx` - Шаблон базового компонента
- `templates/frontend/components/form-component-template.tsx` - Шаблон компонента формы
- `templates/frontend/components/list-component-template.tsx` - Шаблон компонента списка
- `templates/frontend/hooks/use-api-template.ts` - Шаблон хука для работы с API
- `templates/frontend/hooks/use-form-template.ts` - Шаблон хука для работы с формами
- `templates/frontend/services/api-service-template.ts` - Шаблон сервиса API
- `templates/frontend/services/entity-service-template.ts` - Шаблон сервиса для работы с сущностями

### Шаблоны для тестирования API
- `templates/api-tests/api-test-template.js` - Шаблон для тестирования API

### Шаблоны для документации
- `templates/docs/api-documentation-template.md` - Шаблон документации API

## Проектирование базы данных

### PostgreSQL миграции
- `db/postgres/migrations/00001_create_users_table.sql`
- `db/postgres/migrations/00002_create_concepts_table.sql`
- `db/postgres/migrations/00003_create_philosophers_table.sql`
- `db/postgres/migrations/00004_create_traditions_table.sql`
- `db/postgres/migrations/00005_create_concept_philosophers_table.sql`
- `db/postgres/migrations/00006_create_concept_traditions_table.sql`
- `db/postgres/migrations/00007_create_user_activity_table.sql`
- `db/postgres/migrations/00008_create_claude_interactions_table.sql`
- `db/postgres/migrations/00009_create_concept_names_table.sql`
- `db/postgres/migrations/00010_create_concept_origins_table.sql`
- `db/postgres/migrations/00011_create_transformations_table.sql`
- `db/postgres/migrations/00012_create_concept_evolutions_table.sql`
- `db/postgres/migrations/00013_create_historical_contexts_table.sql`
- `db/postgres/migrations/00014_create_practical_applications_table.sql`
- `db/postgres/migrations/00015_create_dialogue_interpretations_table.sql`
- `db/postgres/migrations/00016_create_dialogue_participants_table.sql`

### PostgreSQL скрипты
- `db/postgres/scripts/backup.sh` - Скрипт резервного копирования
- `db/postgres/scripts/restore.sh` - Скрипт восстановления
- `db/postgres/scripts/migrate.sh` - Скрипт миграции

### Neo4j миграции
- `db/neo4j/migrations/00001_create_constraints.cypher`
- `db/neo4j/migrations/00002_create_indexes.cypher`
- `db/neo4j/migrations/00003_concept_nodes.cypher`
- `db/neo4j/migrations/00004_category_nodes.cypher`
- `db/neo4j/migrations/00005_relationship_types.cypher`

### Neo4j скрипты
- `db/neo4j/scripts/backup.sh`
- `db/neo4j/scripts/restore.sh`
- `db/neo4j/scripts/init.sh`

### MongoDB миграции и схемы
- `db/mongodb/migrations/00001_create_collections.js`
- `db/mongodb/migrations/00002_create_indexes.js`
- `db/mongodb/migrations/00003_add_validations.js`
- `db/mongodb/schemas/theses.js`
- `db/mongodb/schemas/categoryDescriptions.js`
- `db/mongodb/schemas/relationshipDescriptions.js`
- `db/mongodb/schemas/conceptAnalyses.js`
- `db/mongodb/schemas/dialogues.js`
- `db/mongodb/schemas/historicalContexts.js`
- `db/mongodb/schemas/practicalApplications.js`
- `db/mongodb/schemas/conceptEvolutions.js`

### MongoDB скрипты
- `db/mongodb/scripts/backup.sh`
- `db/mongodb/scripts/restore.sh`
- `db/mongodb/scripts/init.sh`

## Сидеры (начальные данные)
- `db/postgres/seeds/00001_philosophers.sql`
- `db/postgres/seeds/00002_traditions.sql`
- `db/postgres/seeds/00003_test_users.sql`
- `db/postgres/seeds/00004_test_concepts.sql`
- `db/neo4j/seeds/00001_test_graphs.cypher`
- `db/mongodb/seeds/00001_test_theses.js`

# Фаза 2: Ядро системы

## API Gateway

### Основная структура
- `api-gateway/src/server.js` - Точка входа
- `api-gateway/package.json` - Зависимости
- `api-gateway/Dockerfile` - Докерфайл для сервиса

### Маршруты
- `api-gateway/src/routes/index.js` - Общий маршрутизатор
- `api-gateway/src/routes/userRoutes.js` - Маршруты для пользователей
- `api-gateway/src/routes/conceptRoutes.js` - Маршруты для концепций
- `api-gateway/src/routes/graphRoutes.js` - Маршруты для графов
- `api-gateway/src/routes/thesisRoutes.js` - Маршруты для тезисов
- `api-gateway/src/routes/claudeRoutes.js` - Маршруты для Claude

### Middleware
- `api-gateway/src/middleware/auth.js` - Аутентификация
- `api-gateway/src/middleware/errorHandler.js` - Обработка ошибок
- `api-gateway/src/middleware/logging.js` - Логирование
- `api-gateway/src/middleware/rateLimit.js` - Ограничение частоты запросов

### Сервисы
- `api-gateway/src/services/serviceRegistry.js` - Реестр сервисов
- `api-gateway/src/services/serviceDiscovery.js` - Обнаружение сервисов

### Конфигурация и утилиты
- `api-gateway/src/config/index.js` - Основная конфигурация
- `api-gateway/src/config/routes.js` - Конфигурация маршрутов
- `api-gateway/src/utils/responseFormatter.js` - Форматирование ответов
- `api-gateway/src/utils/healthCheck.js` - Проверка состояния

### Тесты
- `api-gateway/tests/routes.test.js` - Тесты маршрутов
- `api-gateway/tests/middleware.test.js` - Тесты middleware

## Сервис пользователей (User Service)

### Основная структура
- `user-service/src/server.js` - Точка входа
- `user-service/package.json` - Зависимости
- `user-service/Dockerfile` - Докерфайл

### Контроллеры
- `user-service/src/controllers/userController.js` - Управление пользователями
- `user-service/src/controllers/authController.js` - Аутентификация
- `user-service/src/controllers/profileController.js` - Управление профилями
- `user-service/src/controllers/activityController.js` - Управление активностью

### Сервисы
- `user-service/src/services/userService.js` - Бизнес-логика пользователей
- `user-service/src/services/authService.js` - Бизнес-логика аутентификации
- `user-service/src/services/tokenService.js` - Управление токенами
- `user-service/src/services/passwordService.js` - Управление паролями
- `user-service/src/services/activityService.js` - Управление активностью

### Модели и репозитории
- `user-service/src/models/userModel.js` - Модель пользователя
- `user-service/src/models/activityModel.js` - Модель активности
- `user-service/src/repositories/userRepository.js` - Доступ к данным пользователей
- `user-service/src/repositories/activityRepository.js` - Доступ к данным активности

### Маршруты
- `user-service/src/routes/userRoutes.js` - Маршруты пользователей
- `user-service/src/routes/authRoutes.js` - Маршруты аутентификации
- `user-service/src/routes/profileRoutes.js` - Маршруты профилей
- `user-service/src/routes/activityRoutes.js` - Маршруты активностей

### Middleware и утилиты
- `user-service/src/middleware/auth.js` - Промежуточный слой аутентификации
- `user-service/src/middleware/validation.js` - Валидация запросов
- `user-service/src/utils/passwordUtil.js` - Утилиты для работы с паролями
- `user-service/src/utils/tokenUtil.js` - Утилиты для работы с токенами

### Конфигурация
- `user-service/src/config/index.js` - Основная конфигурация
- `user-service/src/config/db.js` - Конфигурация БД

### Тесты
- `user-service/tests/controllers/userController.test.js`
- `user-service/tests/services/userService.test.js`
- `user-service/tests/repositories/userRepository.test.js`
- `user-service/tests/routes/userRoutes.test.js`

## Сервис концепций (Concept Service)

### Основная структура
- `concept-service/src/server.js` - Точка входа
- `concept-service/package.json` - Зависимости
- `concept-service/Dockerfile` - Докерфайл

### Контроллеры
- `concept-service/src/controllers/conceptController.js` - Управление концепциями
- `concept-service/src/controllers/metadataController.js` - Управление метаданными
- `concept-service/src/controllers/philosopherController.js` - Управление философами
- `concept-service/src/controllers/traditionController.js` - Управление традициями

### Сервисы
- `concept-service/src/services/conceptService.js` - Бизнес-логика концепций
- `concept-service/src/services/metadataService.js` - Управление метаданными
- `concept-service/src/services/philosopherService.js` - Управление философами
- `concept-service/src/services/traditionService.js` - Управление традициями
- `concept-service/src/services/coordinationService.js` - Координация с другими сервисами

### Модели
- `concept-service/src/models/conceptModel.js` - Модель концепции
- `concept-service/src/models/philosopherModel.js` - Модель философа
- `concept-service/src/models/traditionModel.js` - Модель традиции
- `concept-service/src/models/conceptPhilosopherModel.js` - Связь между концепциями и философами
- `concept-service/src/models/conceptTraditionModel.js` - Связь между концепциями и традициями

### Репозитории
- `concept-service/src/repositories/conceptRepository.js` - Доступ к данным концепций
- `concept-service/src/repositories/philosopherRepository.js` - Доступ к данным философов
- `concept-service/src/repositories/traditionRepository.js` - Доступ к данным традиций

### Маршруты
- `concept-service/src/routes/conceptRoutes.js` - Маршруты концепций
- `concept-service/src/routes/philosopherRoutes.js` - Маршруты философов
- `concept-service/src/routes/traditionRoutes.js` - Маршруты традиций

### Клиенты
- `concept-service/src/clients/graphServiceClient.js` - Клиент сервиса графов
- `concept-service/src/clients/thesisServiceClient.js` - Клиент сервиса тезисов

### Конфигурация
- `concept-service/src/config/index.js` - Основная конфигурация
- `concept-service/src/config/db.js` - Конфигурация БД

### Тесты
- `concept-service/tests/controllers/conceptController.test.js`
- `concept-service/tests/services/conceptService.test.js`
- `concept-service/tests/repositories/conceptRepository.test.js`

## Сервис графов (Graph Service)

### Основная структура
- `graph-service/src/server.js` - Точка входа
- `graph-service/package.json` - Зависимости
- `graph-service/Dockerfile` - Докерфайл

### Контроллеры
- `graph-service/src/controllers/graphController.js` - Управление графами
- `graph-service/src/controllers/categoryController.js` - Управление категориями
- `graph-service/src/controllers/relationshipController.js` - Управление связями
- `graph-service/src/controllers/visualizationController.js` - Визуализация графов
- `graph-service/src/controllers/characteristicController.js` - Управление характеристиками

### Сервисы
- `graph-service/src/services/graphService.js` - Бизнес-логика графов
- `graph-service/src/services/categoryService.js` - Управление категориями
- `graph-service/src/services/relationshipService.js` - Управление связями
- `graph-service/src/services/characteristicService.js` - Управление количественными характеристиками
- `graph-service/src/services/validationService.js` - Валидация графов
- `graph-service/src/services/enrichmentService.js` - Обогащение графов

### Модели
- `graph-service/src/models/graphModel.js` - Модель графа
- `graph-service/src/models/categoryModel.js` - Модель категории
- `graph-service/src/models/relationshipModel.js` - Модель связи

### Репозитории
- `graph-service/src/repositories/neo4jRepository.js` - Общий репозиторий для Neo4j
- `graph-service/src/repositories/graphRepository.js` - Доступ к данным графов
- `graph-service/src/repositories/categoryRepository.js` - Доступ к данным категорий
- `graph-service/src/repositories/relationshipRepository.js` - Доступ к данным связей

### Маршруты
- `graph-service/src/routes/graphRoutes.js` - Маршруты графов
- `graph-service/src/routes/categoryRoutes.js` - Маршруты категорий
- `graph-service/src/routes/relationshipRoutes.js` - Маршруты связей
- `graph-service/src/routes/characteristicRoutes.js` - Маршруты характеристик
- `graph-service/src/routes/validationRoutes.js` - Маршруты валидации

### Клиенты
- `graph-service/src/clients/claudeServiceClient.js` - Клиент сервиса Claude

### Утилиты
- `graph-service/src/utils/graphConverter.js` - Конвертация графа
- `graph-service/src/utils/cypher.js` - Утилиты для работы с Cypher
- `graph-service/src/utils/graphFormatter.js` - Форматирование графа

### Конфигурация
- `graph-service/src/config/index.js` - Основная конфигурация
- `graph-service/src/config/neo4j.js` - Конфигурация Neo4j

### Тесты
- `graph-service/tests/controllers/graphController.test.js`
- `graph-service/tests/services/graphService.test.js`
- `graph-service/tests/repositories/graphRepository.test.js`

## Сервис тезисов (Thesis Service)

### Основная структура
- `thesis-service/src/server.js` - Точка входа
- `thesis-service/package.json` - Зависимости
- `thesis-service/Dockerfile` - Докерфайл

### Контроллеры
- `thesis-service/src/controllers/thesisController.js` - Управление тезисами
- `thesis-service/src/controllers/generationController.js` - Генерация тезисов
- `thesis-service/src/controllers/analysisController.js` - Анализ тезисов
- `thesis-service/src/controllers/descriptionController.js` - Управление описаниями

### Сервисы
- `thesis-service/src/services/thesisService.js` - Бизнес-логика тезисов
- `thesis-service/src/services/generationService.js` - Генерация тезисов
- `thesis-service/src/services/analysisService.js` - Анализ тезисов
- `thesis-service/src/services/comparisonService.js` - Сравнение тезисов
- `thesis-service/src/services/descriptionService.js` - Управление описаниями категорий и связей

### Модели
- `thesis-service/src/models/thesisModel.js` - Модель тезиса
- `thesis-service/src/models/categoryDescriptionModel.js` - Модель описания категории
- `thesis-service/src/models/relationshipDescriptionModel.js` - Модель описания связи

### Репозитории
- `thesis-service/src/repositories/mongoRepository.js` - Общий репозиторий для MongoDB
- `thesis-service/src/repositories/thesisRepository.js` - Доступ к данным тезисов
- `thesis-service/src/repositories/categoryDescriptionRepository.js` - Доступ к данным описаний категорий
- `thesis-service/src/repositories/relationshipDescriptionRepository.js` - Доступ к данным описаний связей

### Маршруты
- `thesis-service/src/routes/thesisRoutes.js` - Маршруты тезисов
- `thesis-service/src/routes/generationRoutes.js` - Маршруты генерации
- `thesis-service/src/routes/analysisRoutes.js` - Маршруты анализа
- `thesis-service/src/routes/descriptionRoutes.js` - Маршруты описаний

### Клиенты
- `thesis-service/src/clients/graphServiceClient.js` - Клиент сервиса графов
- `thesis-service/src/clients/claudeServiceClient.js` - Клиент сервиса Claude

### Утилиты
- `thesis-service/src/utils/thesisFormatter.js` - Форматирование тезисов
- `thesis-service/src/utils/thesisAnalyzer.js` - Анализ тезисов

### Конфигурация
- `thesis-service/src/config/index.js` - Основная конфигурация
- `thesis-service/src/config/mongodb.js` - Конфигурация MongoDB

### Тесты
- `thesis-service/tests/controllers/thesisController.test.js`
- `thesis-service/tests/services/thesisService.test.js`
- `thesis-service/tests/repositories/thesisRepository.test.js`

## Сервис Claude (Claude Service)

### Основная структура
- `claude-service/src/server.js` - Точка входа
- `claude-service/package.json` - Зависимости
- `claude-service/Dockerfile` - Докерфайл

### Контроллеры
- `claude-service/src/controllers/claudeController.js` - Управление запросами к Claude
- `claude-service/src/controllers/taskController.js` - Управление задачами
- `claude-service/src/controllers/templateController.js` - Управление шаблонами

### Сервисы
- `claude-service/src/services/claudeService.js` - Бизнес-логика работы с Claude
- `claude-service/src/services/requestFormatterService.js` - Форматирование запросов
- `claude-service/src/services/responseProcessorService.js` - Обработка ответов
- `claude-service/src/services/taskQueueService.js` - Управление очередью задач
- `claude-service/src/services/templateService.js` - Управление шаблонами

### Модели
- `claude-service/src/models/interactionModel.js` - Модель взаимодействия
- `claude-service/src/models/taskModel.js` - Модель задачи
- `claude-service/src/models/templateModel.js` - Модель шаблона

### Репозитории
- `claude-service/src/repositories/interactionRepository.js` - Доступ к данным взаимодействий
- `claude-service/src/repositories/taskRepository.js` - Доступ к данным задач
- `claude-service/src/repositories/templateRepository.js` - Доступ к данным шаблонов

### Маршруты
- `claude-service/src/routes/claudeRoutes.js` - Маршруты Claude
- `claude-service/src/routes/taskRoutes.js` - Маршруты задач
- `claude-service/src/routes/templateRoutes.js` - Маршруты шаблонов

### Клиенты
- `claude-service/src/clients/claudeApiClient.js` - Клиент API Claude

### Утилиты и форматтеры
- `claude-service/src/utils/formatters/graphFormatters.js` - Форматтеры для графов
- `claude-service/src/utils/formatters/thesisFormatters.js` - Форматтеры для тезисов
- `claude-service/src/utils/responseProcessors.js` - Обработчики ответов
- `claude-service/src/utils/queueHelpers.js` - Утилиты для работы с очередями

### Обмен сообщениями
- `claude-service/src/messaging/rabbitMQClient.js` - Клиент RabbitMQ
- `claude-service/src/messaging/queueConsumer.js` - Потребитель сообщений
- `claude-service/src/messaging/queueProducer.js` - Производитель сообщений

### Конфигурация
- `claude-service/src/config/index.js` - Основная конфигурация
- `claude-service/src/config/queues.js` - Конфигурация очередей
- `claude-service/src/config/claude.js` - Конфигурация Claude API

### Тесты
- `claude-service/tests/controllers/claudeController.test.js`
- `claude-service/tests/services/claudeService.test.js`
- `claude-service/tests/formatters/formatters.test.js`

## Базовый фронтенд

### Основная структура
- `frontend/src/App.tsx` - Главный компонент приложения
- `frontend/src/index.tsx` - Точка входа
- `frontend/public/index.html` - Шаблон HTML
- `frontend/package.json` - Зависимости
- `frontend/tsconfig.json` - Конфигурация TypeScript
- `frontend/.eslintrc.js` - Конфигурация ESLint
- `frontend/.prettierrc` - Конфигурация Prettier
- `frontend/Dockerfile` - Dockerfile для приложения

### Общие компоненты
- `frontend/src/components/common/Button.tsx`
- `frontend/src/components/common/Input.tsx`
- `frontend/src/components/common/Select.tsx`
- `frontend/src/components/common/Modal.tsx`
- `frontend/src/components/common/Loader.tsx`
- `frontend/src/components/common/ErrorBoundary.tsx`
- `frontend/src/components/common/Notification.tsx`

### Компоненты разметки
- `frontend/src/components/layout/Header.tsx`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/components/layout/Footer.tsx`
- `frontend/src/components/layout/MainLayout.tsx`

### Компоненты для работы с графом концепций
- `frontend/src/components/conceptGraph/ConceptGraphVisualization.tsx`
- `frontend/src/components/conceptGraph/CategoryManager.tsx`
- `frontend/src/components/conceptGraph/RelationshipManager.tsx`
- `frontend/src/components/conceptGraph/GraphControls.tsx`
- `frontend/src/components/conceptGraph/NodeDetails.tsx`
- `frontend/src/components/conceptGraph/EdgeDetails.tsx`

### Компоненты для работы с тезисами
- `frontend/src/components/theses/ThesisList.tsx`
- `frontend/src/components/theses/ThesisDetails.tsx`
- `frontend/src/components/theses/ThesisGenerator.tsx`
- `frontend/src/components/theses/ThesisFilter.tsx`

### Компоненты для работы с Claude
- `frontend/src/components/claude/ClaudeInterface.tsx`
- `frontend/src/components/claude/TemplateSelector.tsx`

### Страницы
- `frontend/src/pages/home/HomePage.tsx`
- `frontend/src/pages/concepts/ConceptsListPage.tsx`
- `frontend/src/pages/concepts/ConceptEditorPage.tsx`
- `frontend/src/pages/concepts/ConceptViewPage.tsx`
- `frontend/src/pages/user/ProfilePage.tsx`
- `frontend/src/pages/user/LoginPage.tsx`
- `frontend/src/pages/user/RegisterPage.tsx`

### Контексты, хуки и состояние
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/context/NotificationContext.tsx`
- `frontend/src/context/ConceptContext.tsx`
- `frontend/src/hooks/useApi.ts`
- `frontend/src/hooks/useAuth.ts`
- `frontend/src/hooks/useGraph.ts`
- `frontend/src/hooks/useThesis.ts`
- `frontend/src/hooks/useClaude.ts`

### Сервисы для работы с API
- `frontend/src/services/api.ts`
- `frontend/src/services/authService.ts`
- `frontend/src/services/conceptService.ts`
- `frontend/src/services/graphService.ts`
- `frontend/src/services/thesisService.ts`
- `frontend/src/services/claudeService.ts`

### Утилиты и типы
- `frontend/src/utils/formatters.ts`
- `frontend/src/utils/validators.ts`
- `frontend/src/utils/graphHelpers.ts`
- `frontend/src/utils/thesisHelpers.ts`
- `frontend/src/types/concept.types.ts`
- `frontend/src/types/graph.types.ts`
- `frontend/src/types/thesis.types.ts`
- `frontend/src/types/user.types.ts`
- `frontend/src/types/claude.types.ts`

### Тесты
- `frontend/src/tests/components/common/Button.test.tsx`
- `frontend/src/tests/components/conceptGraph/ConceptGraphVisualization.test.tsx`
- `frontend/src/tests/hooks/useAuth.test.ts`
- `frontend/src/tests/services/api.test.ts`

# Фаза 3: Расширенная функциональность

## Сервис синтеза (Synthesis Service)

### Основная структура
- `synthesis-service/src/server.js` - Точка входа
- `synthesis-service/package.json` - Зависимости
- `synthesis-service/Dockerfile` - Докерфайл

### Контроллеры
- `synthesis-service/src/controllers/synthesisController.js` - Управление синтезом
- `synthesis-service/src/controllers/compatibilityController.js` - Анализ совместимости
- `synthesis-service/src/controllers/critiqueController.js` - Критический анализ

### Сервисы
- `synthesis-service/src/services/synthesisService.js` - Бизнес-логика синтеза
- `synthesis-service/src/services/compatibilityService.js` - Анализ совместимости
- `synthesis-service/src/services/critiqueService.js` - Критический анализ
- `synthesis-service/src/services/coordinationService.js` - Координация с другими сервисами
- `synthesis-service/src/services/characteristicMergingService.js` - Слияние количественных характеристик

### Модели
- `synthesis-service/src/models/synthesisModel.js` - Модель синтеза
- `synthesis-service/src/models/compatibilityModel.js` - Модель совместимости
- `synthesis-service/src/models/critiqueModel.js` - Модель критического анализа

### Репозитории
- `synthesis-service/src/repositories/synthesisRepository.js` - Доступ к данным синтеза
- `synthesis-service/src/repositories/compatibilityRepository.js` - Доступ к данным совместимости

### Маршруты
- `synthesis-service/src/routes/synthesisRoutes.js` - Маршруты синтеза
- `synthesis-service/src/routes/compatibilityRoutes.js` - Маршруты совместимости
- `synthesis-service/src/routes/critiqueRoutes.js` - Маршруты критики

### Клиенты
- `synthesis-service/src/clients/graphServiceClient.js` - Клиент сервиса графов
- `synthesis-service/src/clients/thesisServiceClient.js` - Клиент сервиса тезисов
- `synthesis-service/src/clients/claudeServiceClient.js` - Клиент сервиса Claude

### Утилиты
- `synthesis-service/src/utils/synthesisStrategies.js` - Стратегии синтеза
- `synthesis-service/src/utils/compatibilityAnalyzer.js` - Анализ совместимости

### Конфигурация
- `synthesis-service/src/config/index.js` - Основная конфигурация

### Тесты
- `synthesis-service/tests/controllers/synthesisController.test.js`
- `synthesis-service/tests/services/synthesisService.test.js`
- `synthesis-service/tests/repositories/synthesisRepository.test.js`
- `synthesis-service/tests/utils/synthesisStrategies.test.js`

## Сервис анализа названий (Name Analysis Service)

### Основная структура
- `name-analysis-service/src/server.js` - Точка входа
- `name-analysis-service/package.json` - Зависимости
- `name-analysis-service/Dockerfile` - Докерфайл

### Контроллеры
- `name-analysis-service/src/controllers/nameAnalysisController.js` - Управление анализом названий
- `name-analysis-service/src/controllers/alternativeController.js` - Управление альтернативными названиями

### Сервисы
- `name-analysis-service/src/services/nameAnalysisService.js` - Бизнес-логика анализа названий
- `name-analysis-service/src/services/alternativeService.js` - Управление альтернативными названиями

### Модели
- `name-analysis-service/src/models/nameAnalysisModel.js` - Модель анализа названия

### Репозитории
- `name-analysis-service/src/repositories/nameAnalysisRepository.js` - Доступ к данным анализа названий

### Маршруты
- `name-analysis-service/src/routes/nameAnalysisRoutes.js` - Маршруты анализа названий
- `name-analysis-service/src/routes/alternativeRoutes.js` - Маршруты альтернатив

### Клиенты
- `name-analysis-service/src/clients/conceptServiceClient.js` - Клиент сервиса концепций
- `name-analysis-service/src/clients/graphServiceClient.js` - Клиент сервиса графов
- `name-analysis-service/src/clients/thesisServiceClient.js` - Клиент сервиса тезисов
- `name-analysis-service/src/clients/claudeServiceClient.js` - Клиент сервиса Claude

### Конфигурация
- `name-analysis-service/src/config/index.js` - Основная конфигурация

### Тесты
- `name-analysis-service/tests/controllers/nameAnalysisController.test.js`
- `name-analysis-service/tests/services/nameAnalysisService.test.js`
- `name-analysis-service/tests/repositories/nameAnalysisRepository.test.js`

## Сервис определения происхождения (Origin Detection Service)

### Основная структура
- `origin-detection-service/src/server.js` - Точка входа
- `origin-detection-service/package.json` - Зависимости
- `origin-detection-service/Dockerfile` - Докерфайл

### Контроллеры
- `origin-detection-service/src/controllers/originController.js` - Управление определением происхождения

### Сервисы
- `origin-detection-service/src/services/originService.js` - Бизнес-логика определения происхождения
- `origin-detection-service/src/services/parentConceptService.js` - Управление родительскими концепциями

### Модели
- `origin-detection-service/src/models/originModel.js` - Модель происхождения
- `origin-detection-service/src/models/parentConceptModel.js` - Модель родительской концепции

### Репозитории
- `origin-detection-service/src/repositories/originRepository.js` - Доступ к данным происхождения
- `origin-detection-service/src/repositories/parentConceptRepository.js` - Доступ к данным родительских концепций

### Маршруты
- `origin-detection-service/src/routes/originRoutes.js` - Маршруты происхождения

### Клиенты
- `origin-detection-service/src/clients/conceptServiceClient.js` - Клиент сервиса концепций
- `origin-detection-service/src/clients/graphServiceClient.js` - Клиент сервиса графов
- `origin-detection-service/src/clients/thesisServiceClient.js` - Клиент сервиса тезисов
- `origin-detection-service/src/clients/claudeServiceClient.js` - Клиент сервиса Claude

### Утилиты
- `origin-detection-service/src/utils/originAnalyzer.js` - Анализ происхождения

### Конфигурация
- `origin-detection-service/src/config/index.js` - Основная конфигурация

### Тесты
- `origin-detection-service/tests/controllers/originController.test.js`
- `origin-detection-service/tests/services/originService.test.js`
- `origin-detection-service/tests/repositories/originRepository.test.js`
- `origin-detection-service/tests/utils/originAnalyzer.test.js`

## Расширение API Gateway

### Маршруты для новых сервисов
- `api-gateway/src/routes/synthesisRoutes.js` - Маршруты для синтеза
- `api-gateway/src/routes/nameRoutes.js` - Маршруты для анализа названий
- `api-gateway/src/routes/originRoutes.js` - Маршруты для определения происхождения

### Обновления конфигурации
- `api-gateway/src/config/routes.js` - Обновление конфигурации маршрутов

## Расширение Claude Service

### Форматтеры для новых типов запросов
- `claude-service/src/utils/formatters/synthesisFormatters.js` - Форматтеры для синтеза
- `claude-service/src/utils/formatters/nameFormatters.js` - Форматтеры для анализа названий
- `claude-service/src/utils/formatters/originFormatters.js` - Форматтеры для происхождения

### Обновления шаблонов
- `claude-service/src/templates/synthesisTemplates.js` - Шаблоны для синтеза
- `claude-service/src/templates/nameAnalysisTemplates.js` - Шаблоны для анализа названий
- `claude-service/src/templates/originDetectionTemplates.js` - Шаблоны для происхождения

## Расширение фронтенда

### Компоненты для синтеза
- `frontend/src/components/synthesis/ConceptSelector.tsx` - Выбор концепций для синтеза
- `frontend/src/components/synthesis/SynthesisParameters.tsx` - Параметры синтеза
- `frontend/src/components/synthesis/SynthesisPreview.tsx` - Предпросмотр синтеза
- `frontend/src/components/synthesis/SynthesisHistory.tsx` - История синтезов
- `frontend/src/components/synthesis/CompatibilityAnalysis.tsx` - Анализ совместимости

### Компоненты для анализа названий
- `frontend/src/components/names/NameAnalyzer.tsx` - Анализатор названий
- `frontend/src/components/names/NameGenerator.tsx` - Генератор названий
- `frontend/src/components/names/AlternativesList.tsx` - Список альтернативных названий

### Компоненты для определения происхождения
- `frontend/src/components/origin/OriginAnalysis.tsx` - Анализ происхождения
- `frontend/src/components/origin/ParentConceptList.tsx` - Список родительских концепций
- `frontend/src/components/origin/InfluenceWeights.tsx` - Веса влияния

### Страницы
- `frontend/src/pages/synthesis/SynthesisPage.tsx` - Страница синтеза
- `frontend/src/pages/synthesis/SynthesisResultPage.tsx` - Страница результатов синтеза
- `frontend/src/pages/names/NameAnalysisPage.tsx` - Страница анализа названий
- `frontend/src/pages/origin/OriginAnalysisPage.tsx` - Страница анализа происхождения

### Контексты и хуки
- `frontend/src/context/SynthesisContext.tsx` - Контекст для синтеза
- `frontend/src/hooks/useSynthesis.ts` - Хук для работы с синтезом
- `frontend/src/hooks/useNameAnalysis.ts` - Хук для работы с анализом названий
- `frontend/src/hooks/useOriginDetection.ts` - Хук для работы с происхождением

### Сервисы для работы с API
- `frontend/src/services/synthesisService.ts` - Сервис для работы с API синтеза
- `frontend/src/services/nameService.ts` - Сервис для работы с API анализа названий
- `frontend/src/services/originService.ts` - Сервис для работы с API происхождения

### Типы
- `frontend/src/types/synthesis.types.ts` - Типы для синтеза
- `frontend/src/types/name.types.ts` - Типы для анализа названий
- `frontend/src/types/origin.types.ts` - Типы для происхождения

### Утилиты
- `frontend/src/utils/synthesisHelpers.ts` - Вспомогательные функции для синтеза
- `frontend/src/utils/nameHelpers.ts` - Вспомогательные функции для анализа названий
- `frontend/src/utils/originHelpers.ts` - Вспомогательные функции для происхождения

### Тесты
- `frontend/src/tests/components/synthesis/ConceptSelector.test.tsx`
- `frontend/src/tests/components/names/NameAnalyzer.test.tsx`
- `frontend/src/tests/services/synthesisService.test.ts`
- `frontend/src/tests/services/nameService.test.ts`
- `frontend/src/tests/services/originService.test.ts`

# Фаза 4: Специализированные сервисы

## Сервис исторической контекстуализации (Historical Context Service)

### Основная структура
- `historical-context-service/src/server.js` - Точка входа
- `historical-context-service/package.json` - Зависимости
- `historical-context-service/Dockerfile` - Докерфайл

### Контроллеры
- `historical-context-service/src/controllers/historicalContextController.js` - Управление историческим контекстом
- `historical-context-service/src/controllers/influenceController.js` - Управление влияниями
- `historical-context-service/src/controllers/contemporaryController.js` - Управление современниками

### Сервисы
- `historical-context-service/src/services/historicalContextService.js` - Бизнес-логика исторического контекста
- `historical-context-service/src/services/influenceService.js` - Управление влияниями
- `historical-context-service/src/services/contemporaryService.js` - Управление современниками
- `historical-context-service/src/services/timelineService.js` - Управление временной шкалой

### Модели
- `historical-context-service/src/models/historicalContextModel.js` - Модель исторического контекста
- `historical-context-service/src/models/influenceModel.js` - Модель влияния
- `historical-context-service/src/models/contemporaryModel.js` - Модель современника

### Репозитории
- `historical-context-service/src/repositories/historicalContextRepository.js` - Доступ к данным исторического контекста

### Маршруты
- `historical-context-service/src/routes/historicalContextRoutes.js` - Маршруты исторического контекста
- `historical-context-service/src/routes/influenceRoutes.js` - Маршруты влияний
- `historical-context-service/src/routes/contemporaryRoutes.js` - Маршруты современников

### Клиенты
- `historical-context-service/src/clients/conceptServiceClient.js` - Клиент сервиса концепций
- `historical-context-service/src/clients/graphServiceClient.js` - Клиент сервиса графов
- `historical-context-service/src/clients/thesisServiceClient.js` - Клиент сервиса тезисов
- `historical-context-service/src/clients/claudeServiceClient.js` - Клиент сервиса Claude

### Утилиты
- `historical-context-service/src/utils/timelineFormatter.js` - Форматирование временной шкалы
- `historical-context-service/src/utils/philosophyPeriods.js` - Данные о философских периодах

### Конфигурация
- `historical-context-service/src/config/index.js` - Основная конфигурация

### Тесты
- `historical-context-service/tests/controllers/historicalContextController.test.js`
- `historical-context-service/tests/services/historicalContextService.test.js`
- `historical-context-service/tests/repositories/historicalContextRepository.test.js`

## Сервис практического применения (Practical Application Service)

### Основная структура
- `practical-application-service/src/server.js` - Точка входа
- `practical-application-service/package.json` - Зависимости
- `practical-application-service/Dockerfile` - Докерфайл

### Контроллеры
- `practical-application-service/src/controllers/practicalApplicationController.js` - Управление практическим применением
- `practical-application-service/src/controllers/domainController.js` - Управление областями применения
- `practical-application-service/src/controllers/implementationController.js` - Управление методами реализации

### Сервисы
- `practical-application-service/src/services/practicalApplicationService.js` - Бизнес-логика практического применения
- `practical-application-service/src/services/domainService.js` - Управление областями применения
- `practical-application-service/src/services/implementationService.js` - Управление методами реализации
- `practical-application-service/src/services/relevanceMappingService.js` - Управление сопоставлениями релевантности

### Модели
- `practical-application-service/src/models/practicalApplicationModel.js` - Модель практического применения
- `practical-application-service/src/models/domainModel.js` - Модель области применения
- `practical-application-service/src/models/implementationMethodModel.js` - Модель метода реализации

### Репозитории
- `practical-application-service/src/repositories/practicalApplicationRepository.js` - Доступ к данным практического применения

### Маршруты
- `practical-application-service/src/routes/practicalApplicationRoutes.js` - Маршруты практического применения
- `practical-application-service/src/routes/domainRoutes.js` - Маршруты областей применения
- `practical-application-service/src/routes/implementationRoutes.js` - Маршруты методов реализации

### Клиенты
- `practical-application-service/src/clients/conceptServiceClient.js` - Клиент сервиса концепций
- `practical-application-service/src/clients/graphServiceClient.js` - Клиент сервиса графов
- `practical-application-service/src/clients/thesisServiceClient.js` - Клиент сервиса тезисов
- `practical-application-service/src/clients/claudeServiceClient.js` - Клиент сервиса Claude

### Утилиты
- `practical-application-service/src/utils/domainClassification.js` - Классификация областей применения
- `practical-application-service/src/utils/relevanceCalculator.js` - Расчёт релевантности

### Конфигурация
- `practical-application-service/src/config/index.js` - Основная конфигурация

### Тесты
- `practical-application-service/tests/controllers/practicalApplicationController.test.js`
- `practical-application-service/tests/services/practicalApplicationService.test.js`
- `practical-application-service/tests/repositories/practicalApplicationRepository.test.js`

## Сервис диалогической интерпретации (Dialogue Service)

### Основная структура
- `dialogue-service/src/server.js` - Точка входа
- `dialogue-service/package.json` - Зависимости
- `dialogue-service/Dockerfile` - Докерфайл

### Контроллеры
- `dialogue-service/src/controllers/dialogueController.js` - Управление диалогами
- `dialogue-service/src/controllers/questionController.js` - Управление философскими вопросами
- `dialogue-service/src/controllers/argumentController.js` - Управление аргументами

### Сервисы
- `dialogue-service/src/services/dialogueService.js` - Бизнес-логика диалогов
- `dialogue-service/src/services/questionService.js` - Управление философскими вопросами
- `dialogue-service/src/services/argumentService.js` - Управление аргументами
- `dialogue-service/src/services/convergenceService.js` - Управление точками сближения

### Модели
- `dialogue-service/src/models/dialogueModel.js` - Модель диалога
- `dialogue-service/src/models/participantModel.js` - Модель участника диалога
- `dialogue-service/src/models/argumentModel.js` - Модель аргумента

### Репозитории
- `dialogue-service/src/repositories/dialogueRepository.js` - Доступ к данным диалогов
- `dialogue-service/src/repositories/participantRepository.js` - Доступ к данным участников

### Маршруты
- `dialogue-service/src/routes/dialogueRoutes.js` - Маршруты диалогов
- `dialogue-service/src/routes/questionRoutes.js` - Маршруты вопросов
- `dialogue-service/src/routes/argumentRoutes.js` - Маршруты аргументов

### Клиенты
- `dialogue-service/src/clients/conceptServiceClient.js` - Клиент сервиса концепций
- `dialogue-service/src/clients/thesisServiceClient.js` - Клиент сервиса тезисов
- `dialogue-service/src/clients/claudeServiceClient.js` - Клиент сервиса Claude

### Утилиты
- `dialogue-service/src/utils/dialogueFormatter.js` - Форматирование диалогов
- `dialogue-service/src/utils/argumentAnalyzer.js` - Анализ аргументации

### Конфигурация
- `dialogue-service/src/config/index.js` - Основная конфигурация

### Тесты
- `dialogue-service/tests/controllers/dialogueController.test.js`
- `dialogue-service/tests/services/dialogueService.test.js`
- `dialogue-service/tests/repositories/dialogueRepository.test.js`

## Сервис эволюции концепций (Evolution Service)

### Основная структура
- `evolution-service/src/server.js` - Точка входа
- `evolution-service/package.json` - Зависимости
- `evolution-service/Dockerfile` - Докерфайл

### Контроллеры
- `evolution-service/src/controllers/evolutionController.js` - Управление эволюцией
- `evolution-service/src/controllers/directionController.js` - Управление направлениями эволюции
- `evolution-service/src/controllers/changeController.js` - Управление изменениями

### Сервисы
- `evolution-service/src/services/evolutionService.js` - Бизнес-логика эволюции
- `evolution-service/src/services/directionService.js` - Управление направлениями эволюции
- `evolution-service/src/services/changeService.js` - Управление изменениями
- `evolution-service/src/services/nameEvolutionService.js` - Управление эволюцией названия

### Модели
- `evolution-service/src/models/evolutionModel.js` - Модель эволюции
- `evolution-service/src/models/directionModel.js` - Модель направления эволюции
- `evolution-service/src/models/changeModel.js` - Модель изменения

### Репозитории
- `evolution-service/src/repositories/evolutionRepository.js` - Доступ к данным эволюции

### Маршруты
- `evolution-service/src/routes/evolutionRoutes.js` - Маршруты эволюции
- `evolution-service/src/routes/directionRoutes.js` - Маршруты направлений
- `evolution-service/src/routes/changeRoutes.js` - Маршруты изменений

### Клиенты
- `evolution-service/src/clients/conceptServiceClient.js` - Клиент сервиса концепций
- `evolution-service/src/clients/graphServiceClient.js` - Клиент сервиса графов
- `evolution-service/src/clients/thesisServiceClient.js` - Клиент сервиса тезисов
- `evolution-service/src/clients/claudeServiceClient.js` - Клиент сервиса Claude

### Утилиты
- `evolution-service/src/utils/evolutionAnalyzer.js` - Анализ эволюции
- `evolution-service/src/utils/changeApplier.js` - Применение изменений

### Конфигурация
- `evolution-service/src/config/index.js` - Основная конфигурация

### Тесты
- `evolution-service/tests/controllers/evolutionController.test.js`
- `evolution-service/tests/services/evolutionService.test.js`
- `evolution-service/tests/repositories/evolutionRepository.test.js`

## Расширение API Gateway

### Маршруты для новых сервисов
- `api-gateway/src/routes/historicalRoutes.js` - Маршруты для исторической контекстуализации
- `api-gateway/src/routes/practicalRoutes.js` - Маршруты для практического применения
- `api-gateway/src/routes/dialogueRoutes.js` - Маршруты для диалогов
- `api-gateway/src/routes/evolutionRoutes.js` - Маршруты для эволюции

### Обновления конфигурации
- `api-gateway/src/config/routes.js` - Обновление конфигурации маршрутов

## Расширение Claude Service

### Форматтеры для новых типов запросов
- `claude-service/src/utils/formatters/historicalFormatters.js` - Форматтеры для исторического контекста
- `claude-service/src/utils/formatters/practicalFormatters.js` - Форматтеры для практического применения
- `claude-service/src/utils/formatters/dialogueFormatters.js` - Форматтеры для диалогов
- `claude-service/src/utils/formatters/evolutionFormatters.js` - Форматтеры для эволюции

### Обновления шаблонов
- `claude-service/src/templates/historicalContextTemplates.js` - Шаблоны для исторического контекста
- `claude-service/src/templates/practicalApplicationTemplates.js` - Шаблоны для практического применения
- `claude-service/src/templates/dialogueTemplates.js` - Шаблоны для диалогов
- `claude-service/src/templates/evolutionTemplates.js` - Шаблоны для эволюции

## Расширение фронтенда

### Компоненты для исторической контекстуализации
- `frontend/src/components/historical/HistoricalContextView.tsx` - Отображение исторического контекста
- `frontend/src/components/historical/InfluenceGraph.tsx` - Граф влияний
- `frontend/src/components/historical/Timeline.tsx` - Временная шкала
- `frontend/src/components/historical/PeriodSelector.tsx` - Выбор исторического периода
- `frontend/src/components/historical/InfluenceManager.tsx` - Управление влияниями

### Компоненты для практического применения
- `frontend/src/components/practical/DomainsView.tsx` - Отображение областей применения
- `frontend/src/components/practical/ImplementationMethods.tsx` - Методы реализации
- `frontend/src/components/practical/RelevanceMap.tsx` - Карта релевантности
- `frontend/src/components/practical/DomainSelector.tsx` - Выбор области применения
- `frontend/src/components/practical/OperationalizationTools.tsx` - Инструменты операционализации

### Компоненты для диалогов
- `frontend/src/components/dialogue/DialogueGenerator.tsx` - Генератор диалогов
- `frontend/src/components/dialogue/PhilosophicalQuestionEditor.tsx` - Редактор философских вопросов
- `frontend/src/components/dialogue/DialogueView.tsx` - Отображение диалога
- `frontend/src/components/dialogue/ArgumentAnalysis.tsx` - Анализ аргументации
- `frontend/src/components/dialogue/ConceptPositionEditor.tsx` - Редактор позиций концепций

### Компоненты для эволюции концепций
- `frontend/src/components/evolution/EvolutionAnalysis.tsx` - Анализ эволюции
- `frontend/src/components/evolution/EvolutionVisualizer.tsx` - Визуализация эволюции
- `frontend/src/components/evolution/SuggestedChanges.tsx` - Предложенные изменения
- `frontend/src/components/evolution/DirectionSelector.tsx` - Выбор направления эволюции
- `frontend/src/components/evolution/ChangeApplicator.tsx` - Применение изменений

### Страницы
- `frontend/src/pages/historical/HistoricalContextPage.tsx` - Страница исторического контекста
- `frontend/src/pages/practical/PracticalApplicationPage.tsx` - Страница практического применения
- `frontend/src/pages/dialogue/DialoguePage.tsx` - Страница диалогов
- `frontend/src/pages/dialogue/DialogueResultPage.tsx` - Страница результатов диалога
- `frontend/src/pages/evolution/EvolutionPage.tsx` - Страница эволюции
- `frontend/src/pages/evolution/EvolutionResultPage.tsx` - Страница результатов эволюции

### Контексты и хуки
- `frontend/src/context/HistoricalContext.tsx` - Контекст для исторического контекста
- `frontend/src/context/PracticalContext.tsx` - Контекст для практического применения
- `frontend/src/context/DialogueContext.tsx` - Контекст для диалогов
- `frontend/src/context/EvolutionContext.tsx` - Контекст для эволюции
- `frontend/src/hooks/useHistoricalContext.ts` - Хук для работы с историческим контекстом
- `frontend/src/hooks/usePracticalApplication.ts` - Хук для работы с практическим применением
- `frontend/src/hooks/useDialogue.ts` - Хук для работы с диалогами
- `frontend/src/hooks/useEvolution.ts` - Хук для работы с эволюцией

### Сервисы для работы с API
- `frontend/src/services/historicalService.ts` - Сервис для работы с API исторического контекста
- `frontend/src/services/practicalService.ts` - Сервис для работы с API практического применения
- `frontend/src/services/dialogueService.ts` - Сервис для работы с API диалогов
- `frontend/src/services/evolutionService.ts` - Сервис для работы с API эволюции

### Типы
- `frontend/src/types/historical.types.ts` - Типы для исторического контекста
- `frontend/src/types/practical.types.ts` - Типы для практического применения
- `frontend/src/types/dialogue.types.ts` - Типы для диалогов
- `frontend/src/types/evolution.types.ts` - Типы для эволюции

### Утилиты
- `frontend/src/utils/historicalHelpers.ts` - Вспомогательные функции для исторического контекста
- `frontend/src/utils/practicalHelpers.ts` - Вспомогательные функции для практического применения
- `frontend/src/utils/dialogueHelpers.ts` - Вспомогательные функции для диалогов
- `frontend/src/utils/evolutionHelpers.ts` - Вспомогательные функции для эволюции

# Фаза 5: Интеграция и DevOps

## Kubernetes-манифесты

### Деплойменты

#### Деплойменты для фронтенда
- `kubernetes/deployments/frontend-deployment.yaml` - Деплоймент для фронтенда

#### Деплойменты для API Gateway
- `kubernetes/deployments/api-gateway-deployment.yaml` - Деплоймент для API Gateway

#### Деплойменты для микросервисов
- `kubernetes/deployments/user-service-deployment.yaml` - Деплоймент для сервиса пользователей
- `kubernetes/deployments/concept-service-deployment.yaml` - Деплоймент для сервиса концепций
- `kubernetes/deployments/graph-service-deployment.yaml` - Деплоймент для сервиса графов
- `kubernetes/deployments/thesis-service-deployment.yaml` - Деплоймент для сервиса тезисов
- `kubernetes/deployments/synthesis-service-deployment.yaml` - Деплоймент для сервиса синтеза
- `kubernetes/deployments/claude-service-deployment.yaml` - Деплоймент для сервиса Claude
- `kubernetes/deployments/name-service-deployment.yaml` - Деплоймент для сервиса анализа названий
- `kubernetes/deployments/origin-service-deployment.yaml` - Деплоймент для сервиса определения происхождения
- `kubernetes/deployments/historical-service-deployment.yaml` - Деплоймент для сервиса исторической контекстуализации
- `kubernetes/deployments/practical-service-deployment.yaml` - Деплоймент для сервиса практического применения
- `kubernetes/deployments/dialogue-service-deployment.yaml` - Деплоймент для сервиса диалогической интерпретации
- `kubernetes/deployments/evolution-service-deployment.yaml` - Деплоймент для сервиса эволюции концепций

#### Деплойменты для баз данных и очередей
- `kubernetes/deployments/postgres-deployment.yaml` - Деплоймент для PostgreSQL
- `kubernetes/deployments/neo4j-deployment.yaml` - Деплоймент для Neo4j
- `kubernetes/deployments/mongodb-deployment.yaml` - Деплоймент для MongoDB
- `kubernetes/deployments/redis-deployment.yaml` - Деплоймент для Redis
- `kubernetes/deployments/rabbitmq-deployment.yaml` - Деплоймент для RabbitMQ

#### Деплойменты для мониторинга
- `kubernetes/deployments/prometheus-deployment.yaml` - Деплоймент для Prometheus
- `kubernetes/deployments/grafana-deployment.yaml` - Деплоймент для Grafana
- `kubernetes/deployments/elasticsearch-deployment.yaml` - Деплоймент для Elasticsearch
- `kubernetes/deployments/logstash-deployment.yaml` - Деплоймент для Logstash
- `kubernetes/deployments/kibana-deployment.yaml` - Деплоймент для Kibana

### Сервисы

#### Сервисы для фронтенда
- `kubernetes/services/frontend-service.yaml` - Сервис для фронтенда

#### Сервисы для API Gateway
- `kubernetes/services/api-gateway-service.yaml` - Сервис для API Gateway

#### Сервисы для микросервисов
- `kubernetes/services/user-service-service.yaml` - Сервис для сервиса пользователей
- `kubernetes/services/concept-service-service.yaml` - Сервис для сервиса концепций
- `kubernetes/services/graph-service-service.yaml` - Сервис для сервиса графов
- `kubernetes/services/thesis-service-service.yaml` - Сервис для сервиса тезисов
- `kubernetes/services/synthesis-service-service.yaml` - Сервис для сервиса синтеза
- `kubernetes/services/claude-service-service.yaml` - Сервис для сервиса Claude
- `kubernetes/services/name-service-service.yaml` - Сервис для сервиса анализа названий
- `kubernetes/services/origin-service-service.yaml` - Сервис для сервиса определения происхождения
- `kubernetes/services/historical-service-service.yaml` - Сервис для сервиса исторической контекстуализации
- `kubernetes/services/practical-service-service.yaml` - Сервис для сервиса практического применения
- `kubernetes/services/dialogue-service-service.yaml` - Сервис для сервиса диалогической интерпретации
- `kubernetes/services/evolution-service-service.yaml` - Сервис для сервиса эволюции концепций

#### Сервисы для баз данных и очередей
- `kubernetes/services/postgres-service.yaml` - Сервис для PostgreSQL
- `kubernetes/services/neo4j-service.yaml` - Сервис для Neo4j
- `kubernetes/services/mongodb-service.yaml` - Сервис для MongoDB
- `kubernetes/services/redis-service.yaml` - Сервис для Redis
- `kubernetes/services/rabbitmq-service.yaml` - Сервис для RabbitMQ

#### Сервисы для мониторинга
- `kubernetes/services/prometheus-service.yaml` - Сервис для Prometheus
- `kubernetes/services/grafana-service.yaml` - Сервис для Grafana
- `kubernetes/services/elasticsearch-service.yaml` - Сервис для Elasticsearch
- `kubernetes/services/logstash-service.yaml` - Сервис для Logstash
- `kubernetes/services/kibana-service.yaml` - Сервис для Kibana

### Ingress
- `kubernetes/ingress/ingress.yaml` - Основной Ingress-манифест

### ConfigMaps
- `kubernetes/config-maps/env-config.yaml` - ConfigMap для переменных окружения
- `kubernetes/config-maps/postgres-config.yaml` - ConfigMap для PostgreSQL
- `kubernetes/config-maps/neo4j-config.yaml` - ConfigMap для Neo4j
- `kubernetes/config-maps/mongodb-config.yaml` - ConfigMap для MongoDB
- `kubernetes/config-maps/redis-config.yaml` - ConfigMap для Redis
- `kubernetes/config-maps/rabbitmq-config.yaml` - ConfigMap для RabbitMQ
- `kubernetes/config-maps/logging-config.yaml` - ConfigMap для логирования
- `kubernetes/config-maps/prometheus-config.yaml` - ConfigMap для Prometheus
- `kubernetes/config-maps/grafana-config.yaml` - ConfigMap для Grafana

### Secrets
- `kubernetes/secrets/secret-template.yaml` - Шаблон для секретов
- `kubernetes/secrets/db-secrets-template.yaml` - Шаблон для секретов баз данных
- `kubernetes/secrets/api-keys-template.yaml` - Шаблон для секретов API-ключей

### Persistent Volumes
- `kubernetes/persistent-volumes/postgres-pv.yaml` - PV для PostgreSQL
- `kubernetes/persistent-volumes/neo4j-pv.yaml` - PV для Neo4j
- `kubernetes/persistent-volumes/mongodb-pv.yaml` - PV для MongoDB
- `kubernetes/persistent-volumes/rabbitmq-pv.yaml` - PV для RabbitMQ
- `kubernetes/persistent-volumes/elasticsearch-pv.yaml` - PV для Elasticsearch

### Horizontal Pod Autoscalers (HPA)
- `kubernetes/hpa/frontend-hpa.yaml` - HPA для фронтенда
- `kubernetes/hpa/api-gateway-hpa.yaml` - HPA для API Gateway
- `kubernetes/hpa/user-service-hpa.yaml` - HPA для сервиса пользователей
- `kubernetes/hpa/concept-service-hpa.yaml` - HPA для сервиса концепций
- `kubernetes/hpa/graph-service-hpa.yaml` - HPA для сервиса графов
- `kubernetes/hpa/thesis-service-hpa.yaml` - HPA для сервиса тезисов
- `kubernetes/hpa/synthesis-service-hpa.yaml` - HPA для сервиса синтеза
- `kubernetes/hpa/claude-service-hpa.yaml` - HPA для сервиса Claude

## CI/CD пайплайны

### GitHub Actions
- `.github/workflows/build.yml` - Сборка образов
- `.github/workflows/test.yml` - Тестирование
- `.github/workflows/deploy.yml` - Деплой
- `.github/workflows/lint.yml` - Линтинг кода
- `.github/workflows/pr-checks.yml` - Проверки для Pull Request

### Скрипты для CI/CD
- `scripts/ci/build-services.sh` - Скрипт для сборки сервисов
- `scripts/ci/run-tests.sh` - Скрипт для запуска тестов
- `scripts/ci/push-images.sh` - Скрипт для публикации образов
- `scripts/ci/deploy.sh` - Скрипт для деплоя
- `scripts/ci/update-config.sh` - Скрипт для обновления конфигурации

## Мониторинг и логирование

### Prometheus
- `monitoring/prometheus/prometheus.yml` - Конфигурация Prometheus
- `monitoring/prometheus/rules/alert-rules.yml` - Правила оповещений
- `monitoring/prometheus/rules/recording-rules.yml` - Правила записи

### Grafana
- `monitoring/grafana/dashboards/overview.json` - Дашборд общего обзора
- `monitoring/grafana/dashboards/frontend.json` - Дашборд фронтенда
- `monitoring/grafana/dashboards/api-gateway.json` - Дашборд API Gateway
- `monitoring/grafana/dashboards/services.json` - Дашборд сервисов
- `monitoring/grafana/dashboards/databases.json` - Дашборд баз данных
- `monitoring/grafana/dashboards/rabbitmq.json` - Дашборд RabbitMQ
- `monitoring/grafana/dashboards/claude.json` - Дашборд взаимодействия с Claude
- `monitoring/grafana/dashboards/business-metrics.json` - Дашборд бизнес-метрик
- `monitoring/grafana/provisioning/datasources/prometheus.yml` - Конфигурация источника данных Prometheus

### ELK Stack
- `monitoring/logstash/pipeline/logstash.conf` - Конфигурация пайплайна Logstash
- `monitoring/logstash/config/logstash.yml` - Конфигурация Logstash
- `monitoring/elasticsearch/config/elasticsearch.yml` - Конфигурация Elasticsearch
- `monitoring/kibana/config/kibana.yml` - Конфигурация Kibana
- `monitoring/kibana/dashboards/logs-dashboard.json` - Дашборд логов в Kibana

## Конфигурация для продакшн-окружения

### Docker Compose для продакшн
- `docker-compose.prod.yml` - Файл Docker Compose для продакшн-окружения

### Nginx конфигурация
- `nginx/nginx.conf` - Основная конфигурация Nginx
- `nginx/conf.d/frontend.conf` - Конфигурация для фронтенда
- `nginx/conf.d/api-gateway.conf` - Конфигурация для API Gateway

## Документация и руководства

### Документация по развертыванию
- `docs/deployment/README.md` - Общая информация о развертывании
- `docs/deployment/kubernetes.md` - Развертывание в Kubernetes
- `docs/deployment/docker-compose.md` - Развертывание с помощью Docker Compose
- `docs/deployment/scaling.md` - Масштабирование системы
- `docs/deployment/monitoring.md` - Настройка мониторинга и логирования
- `docs/deployment/backup-restore.md` - Резервное копирование и восстановление

### Документация по архитектуре
- `docs/architecture/README.md` - Общая информация об архитектуре
- `docs/architecture/microservices.md` - Описание микросервисов
- `docs/architecture/communication.md` - Коммуникация между сервисами
- `docs/architecture/databases.md` - Структура баз данных
- `docs/architecture/caching.md` - Стратегии кэширования
- `docs/architecture/messaging.md` - Обмен сообщениями

### Документация по API
- `docs/api/README.md` - Общая информация об API
- `docs/api/user-service.md` - API сервиса пользователей
- `docs/api/concept-service.md` - API сервиса концепций
- `docs/api/graph-service.md` - API сервиса графов
- `docs/api/thesis-service.md` - API сервиса тезисов
- `docs/api/synthesis-service.md` - API сервиса синтеза
- `docs/api/claude-service.md` - API сервиса Claude
- `docs/api/name-service.md` - API сервиса анализа названий
- `docs/api/origin-service.md` - API сервиса определения происхождения
- `docs/api/historical-service.md` - API сервиса исторической контекстуализации
- `docs/api/practical-service.md` - API сервиса практического применения
- `docs/api/dialogue-service.md` - API сервиса диалогической интерпретации
- `docs/api/evolution-service.md` - API сервиса эволюции концепций

### Руководства для разработчиков
- `docs/development/README.md` - Общая информация для разработчиков
- `docs/development/setup.md` - Настройка окружения разработки
- `docs/development/coding-standards.md` - Стандарты кодирования
- `docs/development/testing.md` - Тестирование
- `docs/development/debugging.md` - Отладка
- `docs/development/contributing.md` - Руководство по вкладу в проект

### Руководства для пользователей
- `docs/user-guides/README.md` - Общая информация для пользователей
- `docs/user-guides/getting-started.md` - Начало работы
- `docs/user-guides/concept-creation.md` - Создание концепций
- `docs/user-guides/graph-editing.md` - Редактирование графов
- `docs/user-guides/thesis-generation.md` - Генерация тезисов
- `docs/user-guides/synthesis.md` - Синтез концепций
- `docs/user-guides/advanced-features.md` - Продвинутые функции