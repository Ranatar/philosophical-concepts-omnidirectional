# Стратегия разработки Фазы 2 с использованием Claude 3.7

## Общий подход к разработке

### 1. Оптимальная последовательность разработки компонентов

1. **User Service** (30 файлов, 7-10 сессий)
2. **Claude Service** (36 файлов, 10-15 сессий)  
3. **Graph Service** (35 файлов, 10-15 сессий)
4. **Thesis Service** (32 файла, 8-12 сессий)
5. **Concept Service** (30 файлов, 8-12 сессий)
6. **API Gateway** (21 файл, 7-10 сессий)
7. **Frontend** (66 файлов, 15-20 сессий)

**Итого: 250 файлов, 65-100 сессий**

### 2. Принципы работы с Claude 3.7

- Разработка по 2-5 связанных файлов за сессию
- Обязательное предоставление контекста из Фазы 1
- Использование шаблонов для ускорения разработки
- Поэтапное тестирование компонентов

## Детальная стратегия по компонентам

### 1. User Service

#### Зависимости
- Независимый сервис, но критически важен для аутентификации всей системы

#### Архитектурный контекст (обязательно для всех компонентов)
- `architecture/philosophy-service-architecture.md` - общее описание системы
- `architecture/system-architecture.mmd` - высокоуровневая архитектура
- `architecture/relational-db-schema.mmd` - схема реляционной БД
- `architecture/user-flow.mmd` - потоки взаимодействия пользователя
- `structure/file-structure.md` - структура файлов проекта

#### Последовательность разработки
1. **Конфигурация и основа** (1-2 сессии)
   - `package.json`, `Dockerfile`, `server.js`
   - `config/index.js`, `config/db.js`
   
2. **Модели и репозитории** (2 сессии)
   - `models/userModel.js`, `models/activityModel.js`
   - `repositories/userRepository.js`, `repositories/activityRepository.js`
   
3. **Сервисы** (2-3 сессии)
   - `services/userService.js`, `services/authService.js`
   - `services/tokenService.js`, `services/passwordService.js`
   - `services/activityService.js`
   
4. **Контроллеры и маршруты** (2 сессии)
   - `controllers/*Controller.js`
   - `routes/*Routes.js`
   
5. **Middleware и утилиты** (1 сессия)
   - `middleware/auth.js`, `middleware/validation.js`
   - `utils/passwordUtil.js`, `utils/tokenUtil.js`

#### Контекст из Фазы 1
- `shared/models/User.js` - базовая модель пользователя
- `shared/lib/db/postgres/client.js` - клиент PostgreSQL
- `shared/lib/db/postgres/queryBuilder.js` - построитель запросов
- `shared/lib/auth/jwtHelper.js` - утилиты для работы с JWT
- `shared/lib/auth/roleHelper.js` - утилиты для работы с ролями
- `shared/lib/validation/validators.js` - общие валидаторы
- `shared/lib/validation/schemas/conceptSchemas.js` - схемы для концепций
- `shared/lib/errors/AppError.js` - базовый класс ошибки
- `shared/lib/errors/HttpErrors.js` - HTTP-ошибки
- `shared/lib/errors/ValidationError.js` - ошибки валидации
- `shared/lib/errors/NotFoundError.js` - ошибки не найденных ресурсов
- `shared/lib/logging/logger.js` - общий логгер
- `shared/lib/logging/requestLogger.js` - логирование запросов
- `templates/backend/controllers/crud-controller-template.js` - шаблон CRUD-контроллера
- `templates/backend/controllers/specialized-controller-template.js` - шаблон специализированного контроллера
- `templates/backend/services/crud-service-template.js` - шаблон CRUD-сервиса
- `templates/backend/services/specialized-service-template.js` - шаблон специализированного сервиса
- `templates/backend/repositories/postgres-repository-template.js` - шаблон репозитория PostgreSQL
- `templates/backend/tests/unit-test-template.js` - шаблон юнит-теста
- `templates/backend/tests/integration-test-template.js` - шаблон интеграционного теста
- `templates/docs/api-documentation-template.md` - шаблон документации API
- `db/postgres/migrations/*users*` - миграции для таблиц пользователей

### 2. Claude Service

#### Зависимости
- Независимый сервис, используется всеми остальными сервисами

#### Архитектурный контекст
- `architecture/philosophy-service-architecture.md` - раздел 5.6 "Сервис Claude"
- `architecture/claude-interaction.mmd` - диаграмма взаимодействия с Claude
- `architecture/deployment-architecture.mmd` - схема развертывания
- Общие архитектурные документы (как в User Service)

#### Последовательность разработки
1. **Конфигурация и основа** (1-2 сессии)
   - `package.json`, `Dockerfile`, `server.js`
   - `config/index.js`, `config/queues.js`, `config/claude.js`
   
2. **Модели и репозитории** (2 сессии)
   - `models/interactionModel.js`, `models/taskModel.js`, `models/templateModel.js`
   - `repositories/interactionRepository.js`, `repositories/taskRepository.js`, `repositories/templateRepository.js`
   
3. **Базовые сервисы** (3-4 сессии)
   - `services/claudeService.js` - основная логика
   - `services/requestFormatterService.js`, `services/responseProcessorService.js`
   - `services/taskQueueService.js`, `services/templateService.js`
   
4. **Контроллеры и маршруты** (2 сессии)
   - Все контроллеры и маршруты
   
5. **Клиенты и утилиты** (2-3 сессии)
   - `clients/claudeApiClient.js`
   - `utils/formatters/*` - базовые форматтеры
   - `utils/responseProcessors.js`, `utils/queueHelpers.js`
   
6. **Messaging** (1-2 сессии)
   - `messaging/rabbitMQClient.js`, `messaging/queueConsumer.js`, `messaging/queueProducer.js`
   
7. **Шаблоны** (1 сессия)
   - `templates/synthesisTemplates.js` - базовые шаблоны

#### Контекст из Фазы 1
- `shared/lib/messaging/rabbitmq/connection.js` - соединение с RabbitMQ
- `shared/lib/messaging/rabbitmq/channelManager.js` - управление каналами
- `shared/lib/messaging/producers.js` - продюсеры сообщений
- `shared/lib/messaging/consumers.js` - потребители сообщений
- `shared/lib/db/postgres/client.js` - клиент PostgreSQL
- `shared/lib/db/postgres/queryBuilder.js` - построитель запросов
- `shared/lib/errors/AppError.js` - базовый класс ошибки
- `shared/lib/errors/HttpErrors.js` - HTTP-ошибки
- `shared/lib/errors/ValidationError.js` - ошибки валидации
- `shared/lib/logging/logger.js` - общий логгер
- `shared/lib/logging/requestLogger.js` - логирование запросов
- `templates/backend/controllers/specialized-controller-template.js` - шаблон специализированного контроллера
- `templates/backend/services/specialized-service-template.js` - шаблон специализированного сервиса
- `templates/backend/repositories/postgres-repository-template.js` - шаблон репозитория PostgreSQL
- `templates/backend/clients/service-client-template.js` - шаблон клиента сервиса
- `templates/backend/tests/unit-test-template.js` - шаблон юнит-теста
- `templates/backend/tests/integration-test-template.js` - шаблон интеграционного теста
- `templates/docs/api-documentation-template.md` - шаблон документации API
- `db/postgres/migrations/*claude*` - миграции для таблиц claude_interactions

### 3. Graph Service

#### Зависимости
- Зависит от Claude Service для валидации и обогащения

#### Архитектурный контекст
- `architecture/philosophy-service-architecture.md` - раздел 4.3 "Сервис графов"
- `architecture/graph-db-schema.mmd` - схема графовой БД
- `architecture/db-schema.mmd` - общая схема данных
- Общие архитектурные документы (как в User Service)

#### Последовательность разработки
1. **Конфигурация и основа** (1-2 сессии)
   - `package.json`, `Dockerfile`, `server.js`
   - `config/index.js`, `config/neo4j.js`
   
2. **Модели и репозитории** (3 сессии)
   - Все модели (`graphModel.js`, `categoryModel.js`, `relationshipModel.js`)
   - Все репозитории (включая специфичный `neo4jRepository.js`)
   
3. **Сервисы** (3-4 сессии)
   - `services/graphService.js`, `services/categoryService.js`
   - `services/relationshipService.js`, `services/characteristicService.js`
   - `services/validationService.js`, `services/enrichmentService.js`
   
4. **Контроллеры и маршруты** (2 сессии)
   - Все контроллеры и маршруты
   
5. **Клиенты и утилиты** (2 сессии)
   - `clients/claudeServiceClient.js`
   - `utils/graphConverter.js`, `utils/cypher.js`, `utils/graphFormatter.js`

#### Контекст из Фазы 1
- `shared/models/Graph.js` - базовая модель графа
- `shared/lib/db/neo4j/driver.js` - драйвер Neo4j
- `shared/lib/db/neo4j/cypherBuilder.js` - построитель Cypher-запросов
- `shared/lib/validation/schemas/graphSchemas.js` - схемы валидации
- `templates/backend/controllers/crud-controller-template.js` - шаблон CRUD-контроллера
- `templates/backend/controllers/specialized-controller-template.js` - шаблон специализированного контроллера
- `templates/backend/services/crud-service-template.js` - шаблон CRUD-сервиса
- `templates/backend/services/specialized-service-template.js` - шаблон специализированного сервиса
- `templates/backend/repositories/neo4j-repository-template.js` - шаблон репозитория Neo4j
- `templates/backend/clients/service-client-template.js` - шаблон клиента сервиса
- `templates/backend/tests/unit-test-template.js` - шаблон юнит-теста
- `templates/backend/tests/integration-test-template.js` - шаблон интеграционного теста
- `templates/docs/api-documentation-template.md` - шаблон документации API
- `db/neo4j/migrations/*` - миграции для Neo4j
- `shared/constants/philosophyConstants.js` - константы философских понятий

### 4. Thesis Service

#### Зависимости
- Зависит от Graph Service и Claude Service

#### Архитектурный контекст
- `architecture/philosophy-service-architecture.md` - раздел 4.4 "Сервис тезисов"
- `architecture/document-db-schema.json` - схема документной БД
- `architecture/db-schema.mmd` - общая схема данных
- Общие архитектурные документы (как в User Service)

#### Последовательность разработки
1. **Конфигурация и основа** (1-2 сессии)
   - `package.json`, `Dockerfile`, `server.js`
   - `config/index.js`, `config/mongodb.js`
   
2. **Модели и репозитории** (2-3 сессии)
   - Все модели и репозитории
   - Особое внимание на `mongoRepository.js`
   
3. **Сервисы** (3 сессии)
   - Все сервисы, включая генерацию и анализ
   
4. **Контроллеры и маршруты** (2 сессии)
   - Все контроллеры и маршруты
   
5. **Клиенты и утилиты** (1 сессия)
   - `clients/graphServiceClient.js`, `clients/claudeServiceClient.js`
   - `utils/thesisFormatter.js`, `utils/thesisAnalyzer.js`

#### Контекст из Фазы 1
- `shared/models/Thesis.js` - базовая модель тезиса
- `shared/lib/db/mongodb/client.js` - клиент MongoDB
- `shared/lib/db/mongodb/queryBuilder.js` - построитель запросов
- `shared/lib/validation/schemas/thesisSchemas.js` - схемы валидации
- `templates/backend/controllers/crud-controller-template.js` - шаблон CRUD-контроллера
- `templates/backend/controllers/specialized-controller-template.js` - шаблон специализированного контроллера
- `templates/backend/services/crud-service-template.js` - шаблон CRUD-сервиса
- `templates/backend/services/specialized-service-template.js` - шаблон специализированного сервиса
- `templates/backend/repositories/mongodb-repository-template.js` - шаблон репозитория MongoDB
- `templates/backend/clients/service-client-template.js` - шаблон клиента сервиса
- `templates/backend/tests/unit-test-template.js` - шаблон юнит-теста
- `templates/backend/tests/integration-test-template.js` - шаблон интеграционного теста
- `templates/docs/api-documentation-template.md` - шаблон документации API
- `db/mongodb/schemas/theses.js` - схема тезисов
- `db/mongodb/migrations/*` - миграции для MongoDB

### 5. Concept Service

#### Зависимости
- Зависит от Graph Service и Thesis Service

#### Архитектурный контекст
- `architecture/philosophy-service-architecture.md` - раздел 4.2 "Сервис концепций"
- `architecture/relational-db-schema.mmd` - схема реляционной БД
- `architecture/user-flow.mmd` - потоки работы с концепциями
- Общие архитектурные документы (как в User Service)

#### Последовательность разработки
1. **Конфигурация и основа** (1 сессии)
   - Базовая конфигурация
   
2. **Модели и репозитории** (2-3 сессии)
   - Все модели, включая связи между концепциями и философами/традициями
   - Все репозитории
   
3. **Сервисы** (2-3 сессии)
   - Все сервисы, особое внимание на `coordinationService.js`
   
4. **Контроллеры и маршруты** (2 сессии)
   - Все контроллеры и маршруты
   
5. **Клиенты** (1 сессия)
   - `clients/graphServiceClient.js`, `clients/thesisServiceClient.js`

#### Контекст из Фазы 1
- `shared/models/Concept.js` - базовая модель концепции
- `shared/lib/db/postgres/client.js` - клиент PostgreSQL
- `shared/lib/db/postgres/queryBuilder.js` - построитель запросов
- `shared/lib/validation/schemas/conceptSchemas.js` - схемы валидации
- `templates/backend/controllers/crud-controller-template.js` - шаблон CRUD-контроллера
- `templates/backend/services/crud-service-template.js` - шаблон CRUD-сервиса
- `templates/backend/services/specialized-service-template.js` - шаблон специализированного сервиса
- `templates/backend/repositories/postgres-repository-template.js` - шаблон репозитория PostgreSQL
- `templates/backend/clients/service-client-template.js` - шаблон клиента сервиса
- `templates/backend/tests/unit-test-template.js` - шаблон юнит-теста
- `templates/backend/tests/integration-test-template.js` - шаблон интеграционного теста
- `templates/docs/api-documentation-template.md` - шаблон документации API
- `db/postgres/migrations/*concepts*` - миграции для таблиц концепций
- `db/postgres/seeds/*philosophers*`, `db/postgres/seeds/*traditions*` - начальные данные

### 6. API Gateway

#### Зависимости
- Зависит от всех основных сервисов

#### Архитектурный контекст
- `architecture/philosophy-service-architecture.md` - описание API Gateway
- `architecture/system-architecture.mmd` - роль Gateway в системе
- `architecture/deployment-architecture.mmd` - схема развертывания
- Общие архитектурные документы (как в User Service)

#### Последовательность разработки
1. **Конфигурация и основа** (1 сессии)
   - `package.json`, `Dockerfile`, `server.js`
   - `config/index.js`, `config/routes.js`
   
2. **Маршруты** (2-3 сессии)
   - Все маршруты для проксирования к микросервисам
   
3. **Middleware** (2 сессии)
   - Все middleware (auth, errorHandler, logging, rateLimit)
   
4. **Сервисы и утилиты** (1-2 сессии)
   - `services/serviceRegistry.js`, `services/serviceDiscovery.js`
   - `utils/responseFormatter.js`, `utils/healthCheck.js`

#### Контекст из Фазы 1
- `shared/lib/auth/jwtHelper.js` - утилиты для работы с JWT
- `shared/lib/auth/roleHelper.js` - утилиты для работы с ролями
- `shared/lib/errors/AppError.js` - базовый класс ошибки
- `shared/lib/errors/HttpErrors.js` - HTTP-ошибки
- `shared/lib/errors/ValidationError.js` - ошибки валидации
- `shared/lib/logging/logger.js` - общий логгер
- `shared/lib/logging/requestLogger.js` - логирование запросов
- `shared/lib/http/client.js` - HTTP-клиент
- `shared/lib/http/responseFormatter.js` - форматирование ответов
- `templates/backend/tests/unit-test-template.js` - шаблон юнит-теста
- `templates/backend/tests/integration-test-template.js` - шаблон интеграционного теста
- `templates/api-tests/api-test-template.js` - шаблон для тестирования API
- `templates/docs/api-documentation-template.md` - шаблон документации API

### 7. Frontend

#### Зависимости
- Зависит от API Gateway

#### Архитектурный контекст
- `architecture/philosophy-service-architecture.md` - раздел 6 "Пользовательский интерфейс"
- `architecture/ui-architecture.mmd` - архитектура UI
- `architecture/concept-graph-visualization.tsx` - пример компонента визуализации
- `architecture/claude-interface.tsx` - пример интерфейса Claude
- Общие архитектурные документы (как в User Service)

#### Последовательность разработки
1. **Проект и конфигурация** (1-2 сессии)
   - Основные файлы проекта
   - Типы и интерфейсы
   
2. **Базовые компоненты и контексты** (3-4 сессии)
   - Общие компоненты UI
   - Компоненты разметки
   - Контексты
   
3. **Сервисы и хуки** (3-4 сессии)
   - API-клиент и сервисы
   - Пользовательские хуки
   
4. **Компоненты для работы с графом** (3-4 сессии)
   - Визуализация и управление графом
   
5. **Компоненты для работы с тезисами** (2-3 сессии)
   - Список, детали, генерация
   
6. **Компоненты для Claude** (1-2 сессии)
   - Интерфейс взаимодействия
   
7. **Страницы приложения** (2-3 сессии)
   - Основные страницы
   
8. **Утилиты и тесты** (1-2 сессии)
   - Вспомогательные функции
   - Базовые тесты

#### Контекст из Фазы 1
- `templates/frontend/components/base-component-template.tsx` - шаблон базового компонента
- `templates/frontend/components/form-component-template.tsx` - шаблон компонента формы
- `templates/frontend/components/list-component-template.tsx` - шаблон компонента списка
- `templates/frontend/hooks/use-api-template.ts` - шаблон хука для работы с API
- `templates/frontend/hooks/use-form-template.ts` - шаблон хука для работы с формами
- `templates/frontend/services/api-service-template.ts` - шаблон сервиса API
- `templates/frontend/services/entity-service-template.ts` - шаблон сервиса для работы с сущностями
- `shared/constants/errorCodes.js` - коды ошибок
- `shared/constants/statuses.js` - статусы
- `shared/constants/roles.js` - роли
- `shared/constants/philosophyConstants.js` - константы философских понятий
- Схемы данных из TypeScript-типов, созданных в процессе разработки

## Рекомендации по работе с Claude 3.7

### 1. Стиль запросов для каждого этапа

#### Пример запроса для разработки сервисов Claude:
```
Разработай основные сервисы для Claude Service.
Создай:
1. services/claudeService.js - основная бизнес-логика
2. services/requestFormatterService.js - форматирование запросов
3. services/responseProcessorService.js - обработка ответов

Используй контекст:

Архитектурный контекст:
- architecture/philosophy-service-architecture.md - раздел 5.6
- architecture/claude-interaction.mmd - диаграмма взаимодействия

Шаблоны и утилиты из Фазы 1:
- templates/backend/services/specialized-service-template.js - шаблон сервиса
- shared/lib/errors/* - обработка ошибок
- shared/lib/logging/* - логирование

Сервисы должны:
- Следовать архитектурному описанию из документации
- Использовать паттерны из шаблонов сервисов
- Правильно форматировать запросы согласно спецификации Claude API
- Включать обработку ошибок и логирование из шаблона
```
```
Разработай базовую структуру User Service для философского приложения.
Создай файлы:
1. package.json с необходимыми зависимостями
2. Dockerfile для контейнеризации
3. src/server.js - точка входа сервиса
4. src/config/index.js - основная конфигурация
5. src/config/db.js - конфигурация PostgreSQL

Используй следующий контекст:

Архитектурный контекст:
- architecture/philosophy-service-architecture.md - раздел 4.1 "Сервис пользователей"
- architecture/system-architecture.mmd - общая архитектура
- architecture/relational-db-schema.mmd - схема БД с таблицами пользователей
- structure/file-structure.md - структура файлов проекта

Контекст из Фазы 1:
- shared/lib/db/postgres/client.js - клиент PostgreSQL
- shared/lib/logging/logger.js - система логирования
- shared/lib/errors/AppError.js - базовый класс ошибок

Сервис должен:
- Соответствовать описанию в архитектурной документации
- Реализовывать API эндпоинты согласно спецификации
- Работать на порту, определенном в переменных окружения
- Подключаться к PostgreSQL согласно схеме БД
- Иметь базовую обработку ошибок
- Логировать важные события
```

#### Пример запроса для разработки моделей и репозиториев:
```
Разработай модели и репозитории для User Service.
Создай:
1. models/userModel.js - модель пользователя
2. models/activityModel.js - модель активности
3. repositories/userRepository.js - репозиторий пользователей
4. repositories/activityRepository.js - репозиторий активности

Используй контекст:
- shared/models/User.js - базовая модель
- db/postgres/migrations/00001_create_users_table.sql - структура таблицы
- templates/backend/repositories/postgres-repository-template.js - шаблон репозитория
- shared/lib/db/postgres/queryBuilder.js - построитель запросов

Репозитории должны:
- Следовать паттерну из шаблона
- Поддерживать CRUD-операции
- Использовать подготовленные запросы
- Иметь правильную обработку ошибок согласно шаблону
```

#### Пример запроса для разработки контроллеров:
```
Разработай контроллеры для User Service.
Создай:
1. controllers/userController.js - CRUD операции с пользователями
2. controllers/authController.js - аутентификация и авторизация

Используй контекст:
- templates/backend/controllers/crud-controller-template.js - для userController
- templates/backend/controllers/specialized-controller-template.js - для authController
- Архитектурная документация с описанием API эндпоинтов

Контроллеры должны:
- Следовать структуре из шаблонов
- Реализовывать все API эндпоинты из документации
- Включать валидацию входных данных
- Иметь правильную обработку ошибок
```

### 2. Тестирование компонентов

- После каждого этапа разработки сервиса создавать базовые тесты
- Использовать docker-compose для локального тестирования
- Проверять интеграцию между сервисами после их создания

### 3. Управление зависимостями

- Начинать с независимых сервисов (User, Claude)
- Создавать заглушки (stubs) для еще не разработанных сервисов
- Постепенно заменять заглушки реальными клиентами

### 4. Документирование

- Создавать базовую документацию API для каждого сервиса
- Обновлять docker-compose.yml после создания каждого сервиса
- Документировать особенности конфигурации и развертывания

## Контрольные точки и метрики успеха

### 1. После User Service
- Работающая аутентификация
- Возможность регистрации и входа

### 2. После Claude Service
- Успешные запросы к Claude API
- Работающая очередь задач

### 3. После Graph Service
- Создание и визуализация графов
- Валидация структуры графа

### 4. После Thesis Service
- Генерация тезисов из графа
- Сохранение и получение тезисов

### 5. После Concept Service
- Полный CRUD для концепций
- Координация между графами и тезисами

### 6. После API Gateway
- Единая точка входа для всех API
- Работающая аутентификация на уровне gateway

### 7. После Frontend
- Базовый интерфейс для работы с концепциями
- Визуализация графов
- Генерация и просмотр тезисов

## Итог

Следуя данной стратегии и используя контекст из Фазы 1, можно эффективно разработать Фазу 2 за 65-100 сессий с Claude 3.7, создав работающий MVP системы философских концепций.
