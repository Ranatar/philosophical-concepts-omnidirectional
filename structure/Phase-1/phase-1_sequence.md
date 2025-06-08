# Последовательность разработки файлов Фазы 1

## 1. Инфраструктура для разработки

### Docker-конфигурация
1. `docker-compose.yml` - Основной файл для локальной разработки
2. `docker-compose.override.yml` - Переопределения для разработки
3. `Dockerfile.dev` - Шаблон Dockerfile для разработки
4. `Dockerfile.prod` - Шаблон Dockerfile для продакшн

### Инициализация баз данных
5. `init/postgres/init.sql` - Скрипт инициализации PostgreSQL
6. `init/neo4j/init.sh` - Скрипт инициализации Neo4j
7. `init/mongo/init.js` - Скрипт инициализации MongoDB

## 2. Общие библиотеки и утилиты

### Константы (базовые определения)
8. `shared/constants/errorCodes.js` - Коды ошибок
9. `shared/constants/statuses.js` - Статусы
10. `shared/constants/roles.js` - Роли
11. `shared/constants/philosophyConstants.js` - Константы для философских понятий

### Обработка ошибок
12. `shared/lib/errors/AppError.js` - Базовый класс ошибки
13. `shared/lib/errors/HttpErrors.js` - HTTP-ошибки
14. `shared/lib/errors/ValidationError.js` - Ошибки валидации
15. `shared/lib/errors/NotFoundError.js` - Ошибки не найденных ресурсов

### Логирование и метрики
16. `shared/lib/logging/logger.js` - Общий логгер
17. `shared/lib/logging/requestLogger.js` - Логирование запросов
18. `shared/lib/metrics/prometheus.js` - Интеграция с Prometheus
19. `shared/lib/metrics/counters.js` - Счётчики метрик

### Форматирование (базовые утилиты)
20. `shared/lib/formatting/dateFormatters.js` - Форматирование дат
21. `shared/lib/formatting/stringFormatters.js` - Форматирование строк

### Работа с базами данных
22. `shared/lib/db/postgres/client.js` - Клиент PostgreSQL
23. `shared/lib/db/postgres/queryBuilder.js` - Построитель запросов
24. `shared/lib/db/neo4j/driver.js` - Драйвер Neo4j
25. `shared/lib/db/neo4j/cypherBuilder.js` - Построитель Cypher-запросов
26. `shared/lib/db/mongodb/client.js` - Клиент MongoDB
27. `shared/lib/db/mongodb/queryBuilder.js` - Построитель запросов
28. `shared/lib/db/redis/client.js` - Клиент Redis
29. `shared/lib/db/redis/cacheHelper.js` - Помощник для кэширования

### HTTP-утилиты
30. `shared/lib/http/client.js` - HTTP-клиент
31. `shared/lib/http/responseFormatter.js` - Форматирование ответов

### Общие модели (доменные объекты)
32. `shared/models/User.js` - Модель пользователя
33. `shared/models/Concept.js` - Модель концепции
34. `shared/models/Graph.js` - Модель графа
35. `shared/models/Thesis.js` - Модель тезиса

### Валидация
36. `shared/lib/validation/validators.js` - Общие валидаторы
37. `shared/lib/validation/schemas/conceptSchemas.js` - Схемы для концепций
38. `shared/lib/validation/schemas/graphSchemas.js` - Схемы для графов
39. `shared/lib/validation/schemas/thesisSchemas.js` - Схемы для тезисов

### Аутентификация
40. `shared/lib/auth/jwtHelper.js` - Утилиты для работы с JWT
41. `shared/lib/auth/roleHelper.js` - Утилиты для работы с ролями

### Безопасность
42. `shared/lib/security/apiKeyEncryption.js` - Утилиты для шифрования ключей API
43. `shared/lib/security/apiKeyValidator.js` - Валидация ключей API

### Обмен сообщениями
44. `shared/lib/messaging/rabbitmq/connection.js` - Соединение с RabbitMQ
45. `shared/lib/messaging/rabbitmq/channelManager.js` - Управление каналами
46. `shared/lib/messaging/producers.js` - Продюсеры сообщений
47. `shared/lib/messaging/consumers.js` - Потребители сообщений

## 3. Шаблоны компонентов

### Шаблоны для бэкенда
48. `templates/backend/controllers/crud-controller-template.js` - Шаблон CRUD-контроллера
49. `templates/backend/controllers/specialized-controller-template.js` - Шаблон специализированного контроллера
50. `templates/backend/services/crud-service-template.js` - Шаблон CRUD-сервиса
51. `templates/backend/services/specialized-service-template.js` - Шаблон специализированного сервиса
52. `templates/backend/repositories/postgres-repository-template.js` - Шаблон репозитория PostgreSQL
53. `templates/backend/repositories/neo4j-repository-template.js` - Шаблон репозитория Neo4j
54. `templates/backend/repositories/mongodb-repository-template.js` - Шаблон репозитория MongoDB
55. `templates/backend/clients/service-client-template.js` - Шаблон клиента сервиса
56. `templates/backend/tests/unit-test-template.js` - Шаблон юнит-теста
57. `templates/backend/tests/integration-test-template.js` - Шаблон интеграционного теста

### Шаблоны для фронтенда
58. `templates/frontend/components/base-component-template.tsx` - Шаблон базового компонента
59. `templates/frontend/components/form-component-template.tsx` - Шаблон компонента формы
60. `templates/frontend/components/list-component-template.tsx` - Шаблон компонента списка
61. `templates/frontend/hooks/use-api-template.ts` - Шаблон хука для работы с API
62. `templates/frontend/hooks/use-form-template.ts` - Шаблон хука для работы с формами
63. `templates/frontend/services/api-service-template.ts` - Шаблон сервиса API
64. `templates/frontend/services/entity-service-template.ts` - Шаблон сервиса для работы с сущностями

### Шаблоны для тестирования API
65. `templates/api-tests/api-test-template.js` - Шаблон для тестирования API

### Шаблоны для документации
66. `templates/docs/api-documentation-template.md` - Шаблон документации API

## 4. Проектирование базы данных

### PostgreSQL миграции
67. `db/postgres/migrations/00001_create_users_table.sql`
68. `db/postgres/migrations/00002_create_concepts_table.sql`
69. `db/postgres/migrations/00003_create_philosophers_table.sql`
70. `db/postgres/migrations/00004_create_traditions_table.sql`
71. `db/postgres/migrations/00005_create_concept_philosophers_table.sql`
72. `db/postgres/migrations/00006_create_concept_traditions_table.sql`
73. `db/postgres/migrations/00007_create_user_activity_table.sql`
74. `db/postgres/migrations/00008_create_claude_interactions_table.sql`
75. `db/postgres/migrations/00009_create_concept_names_table.sql`
76. `db/postgres/migrations/00010_create_concept_origins_table.sql`
77. `db/postgres/migrations/00011_create_transformations_table.sql`
78. `db/postgres/migrations/00012_create_concept_evolutions_table.sql`
79. `db/postgres/migrations/00013_create_historical_contexts_table.sql`
80. `db/postgres/migrations/00014_create_practical_applications_table.sql`
81. `db/postgres/migrations/00015_create_dialogue_interpretations_table.sql`
82. `db/postgres/migrations/00016_create_dialogue_participants_table.sql`
83. `db/postgres/migrations/00017_create_category_templates_table.sql`
84. `db/postgres/migrations/00018_create_relationship_type_templates_table.sql`
85. `db/postgres/migrations/00019_add_api_key_to_users.sql`
86. `db/postgres/migrations/00020_create_shared_api_keys_table.sql`
87. `db/postgres/migrations/00021_create_api_key_usage_table.sql`

### PostgreSQL скрипты
88. `db/postgres/scripts/backup.sh` - Скрипт резервного копирования
89. `db/postgres/scripts/restore.sh` - Скрипт восстановления
90. `db/postgres/scripts/migrate.sh` - Скрипт миграции

### Neo4j миграции
91. `db/neo4j/migrations/00001_create_constraints.cypher`
92. `db/neo4j/migrations/00002_create_indexes.cypher`
93. `db/neo4j/migrations/00003_concept_nodes.cypher`
94. `db/neo4j/migrations/00004_category_nodes.cypher`
95. `db/neo4j/migrations/00005_relationship_types.cypher`

### Neo4j скрипты
96. `db/neo4j/scripts/backup.sh`
97. `db/neo4j/scripts/restore.sh`
98. `db/neo4j/scripts/init.sh`

### MongoDB миграции и схемы
99. `db/mongodb/migrations/00001_create_collections.js`
100. `db/mongodb/migrations/00002_create_indexes.js`
101. `db/mongodb/migrations/00003_add_validations.js`
102. `db/mongodb/schemas/theses.js`
103. `db/mongodb/schemas/categoryDescriptions.js`
104. `db/mongodb/schemas/relationshipDescriptions.js`
105. `db/mongodb/schemas/conceptAnalyses.js`
106. `db/mongodb/schemas/dialogues.js`
107. `db/mongodb/schemas/historicalContexts.js`
108. `db/mongodb/schemas/practicalApplications.js`
109. `db/mongodb/schemas/conceptEvolutions.js`
110. `db/mongodb/schemas/generatedElements.js`

### MongoDB скрипты
111. `db/mongodb/scripts/backup.sh`
112. `db/mongodb/scripts/restore.sh`
113. `db/mongodb/scripts/init.sh`

## 5. Сидеры (начальные данные)

### PostgreSQL сидеры
114. `db/postgres/seeds/00001_philosophers.sql`
115. `db/postgres/seeds/00002_traditions.sql`
116. `db/postgres/seeds/00003_test_users.sql`
117. `db/postgres/seeds/00004_test_concepts.sql`
118. `db/postgres/seeds/00005_system_categories.sql`
119. `db/postgres/seeds/00006_system_relationship_types.sql`

### Neo4j сидеры
120. `db/neo4j/seeds/00001_test_graphs.cypher`

### MongoDB сидеры
121. `db/mongodb/seeds/00001_test_theses.js`