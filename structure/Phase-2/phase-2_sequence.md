# Последовательность разработки файлов Фазы 2

## 1. Сервис пользователей (User Service)

### Конфигурация и основа
1. `user-service/package.json` - Зависимости
2. `user-service/Dockerfile` - Dockerfile для сервиса
3. `user-service/src/server.js` - Точка входа
4. `user-service/src/config/index.js` - Основная конфигурация
5. `user-service/src/config/db.js` - Конфигурация БД

### Модели и репозитории
6. `user-service/src/models/userModel.js` - Модель пользователя
7. `user-service/src/models/activityModel.js` - Модель активности
8. `user-service/src/repositories/userRepository.js` - Доступ к данным пользователей
9. `user-service/src/repositories/activityRepository.js` - Доступ к данным активности

### Сервисы
10. `user-service/src/services/userService.js` - Бизнес-логика пользователей
11. `user-service/src/services/authService.js` - Бизнес-логика аутентификации
12. `user-service/src/services/tokenService.js` - Управление токенами
13. `user-service/src/services/passwordService.js` - Управление паролями
14. `user-service/src/services/activityService.js` - Управление активностью

### Контроллеры и маршруты
15. `user-service/src/controllers/userController.js` - Управление пользователями
16. `user-service/src/controllers/authController.js` - Аутентификация
17. `user-service/src/controllers/profileController.js` - Управление профилями
18. `user-service/src/controllers/activityController.js` - Управление активностью
19. `user-service/src/routes/userRoutes.js` - Маршруты пользователей
20. `user-service/src/routes/authRoutes.js` - Маршруты аутентификации
21. `user-service/src/routes/profileRoutes.js` - Маршруты профилей
22. `user-service/src/routes/activityRoutes.js` - Маршруты активностей

### Middleware и утилиты
23. `user-service/src/middleware/auth.js` - Промежуточный слой аутентификации
24. `user-service/src/middleware/validation.js` - Валидация запросов
25. `user-service/src/utils/passwordUtil.js` - Утилиты для работы с паролями
26. `user-service/src/utils/tokenUtil.js` - Утилиты для работы с токенами

### Тесты
27. `user-service/tests/controllers/userController.test.js`
28. `user-service/tests/services/userService.test.js`
29. `user-service/tests/repositories/userRepository.test.js`
30. `user-service/tests/routes/userRoutes.test.js`

## 2. Сервис Claude (Claude Service)

### Конфигурация и основа
31. `claude-service/package.json` - Зависимости
32. `claude-service/Dockerfile` - Dockerfile для сервиса
33. `claude-service/src/server.js` - Точка входа
34. `claude-service/src/config/index.js` - Основная конфигурация
35. `claude-service/src/config/queues.js` - Конфигурация очередей
36. `claude-service/src/config/claude.js` - Конфигурация Claude API

### Модели и репозитории
37. `claude-service/src/models/interactionModel.js` - Модель взаимодействия
38. `claude-service/src/models/taskModel.js` - Модель задачи
39. `claude-service/src/models/templateModel.js` - Модель шаблона
40. `claude-service/src/repositories/interactionRepository.js` - Доступ к данным взаимодействий
41. `claude-service/src/repositories/taskRepository.js` - Доступ к данным задач
42. `claude-service/src/repositories/templateRepository.js` - Доступ к данным шаблонов

### Сервисы
43. `claude-service/src/services/claudeService.js` - Бизнес-логика работы с Claude
44. `claude-service/src/services/requestFormatterService.js` - Форматирование запросов
45. `claude-service/src/services/responseProcessorService.js` - Обработка ответов
46. `claude-service/src/services/taskQueueService.js` - Управление очередью задач
47. `claude-service/src/services/templateService.js` - Управление шаблонами

### Контроллеры и маршруты
48. `claude-service/src/controllers/claudeController.js` - Управление запросами к Claude
49. `claude-service/src/controllers/taskController.js` - Управление задачами
50. `claude-service/src/controllers/templateController.js` - Управление шаблонами
51. `claude-service/src/routes/claudeRoutes.js` - Маршруты Claude
52. `claude-service/src/routes/taskRoutes.js` - Маршруты задач
53. `claude-service/src/routes/templateRoutes.js` - Маршруты шаблонов

### Клиенты и утилиты
54. `claude-service/src/clients/claudeApiClient.js` - Клиент API Claude
55. `claude-service/src/utils/formatters/graphFormatters.js` - Форматтеры для графов
56. `claude-service/src/utils/formatters/thesisFormatters.js` - Форматтеры для тезисов
57. `claude-service/src/utils/formatters/synthesisFormatters.js` - Форматтеры для синтеза (базовые)
58. `claude-service/src/utils/responseProcessors.js` - Обработчики ответов
59. `claude-service/src/utils/queueHelpers.js` - Утилиты для работы с очередями

### Messaging
60. `claude-service/src/messaging/rabbitMQClient.js` - Клиент RabbitMQ
61. `claude-service/src/messaging/queueConsumer.js` - Потребитель сообщений
62. `claude-service/src/messaging/queueProducer.js` - Производитель сообщений

### Шаблоны
63. `claude-service/src/templates/synthesisTemplates.js` - Шаблоны для синтеза (базовые)

### Тесты
64. `claude-service/tests/controllers/claudeController.test.js`
65. `claude-service/tests/services/claudeService.test.js`
66. `claude-service/tests/formatters/formatters.test.js`

## 3. Сервис графов (Graph Service)

### Конфигурация и основа
67. `graph-service/package.json` - Зависимости
68. `graph-service/Dockerfile` - Dockerfile для сервиса
69. `graph-service/src/server.js` - Точка входа
70. `graph-service/src/config/index.js` - Основная конфигурация
71. `graph-service/src/config/neo4j.js` - Конфигурация Neo4j

### Модели и репозитории
72. `graph-service/src/models/graphModel.js` - Модель графа
73. `graph-service/src/models/categoryModel.js` - Модель категории
74. `graph-service/src/models/relationshipModel.js` - Модель связи
75. `graph-service/src/repositories/neo4jRepository.js` - Общий репозиторий для Neo4j
76. `graph-service/src/repositories/graphRepository.js` - Доступ к данным графов
77. `graph-service/src/repositories/categoryRepository.js` - Доступ к данным категорий
78. `graph-service/src/repositories/relationshipRepository.js` - Доступ к данным связей

### Сервисы
79. `graph-service/src/services/graphService.js` - Бизнес-логика графов
80. `graph-service/src/services/categoryService.js` - Управление категориями
81. `graph-service/src/services/relationshipService.js` - Управление связями
82. `graph-service/src/services/characteristicService.js` - Управление количественными характеристиками
83. `graph-service/src/services/validationService.js` - Валидация графов
84. `graph-service/src/services/enrichmentService.js` - Обогащение графов

### Контроллеры и маршруты
85. `graph-service/src/controllers/graphController.js` - Управление графами
86. `graph-service/src/controllers/categoryController.js` - Управление категориями
87. `graph-service/src/controllers/relationshipController.js` - Управление связями
88. `graph-service/src/controllers/visualizationController.js` - Визуализация графов
89. `graph-service/src/controllers/characteristicController.js` - Управление характеристиками
90. `graph-service/src/routes/graphRoutes.js` - Маршруты графов
91. `graph-service/src/routes/categoryRoutes.js` - Маршруты категорий
92. `graph-service/src/routes/relationshipRoutes.js` - Маршруты связей
93. `graph-service/src/routes/characteristicRoutes.js` - Маршруты характеристик
94. `graph-service/src/routes/validationRoutes.js` - Маршруты валидации

### Клиенты и утилиты
95. `graph-service/src/clients/claudeServiceClient.js` - Клиент сервиса Claude
96. `graph-service/src/utils/graphConverter.js` - Конвертация графа
97. `graph-service/src/utils/cypher.js` - Утилиты для работы с Cypher
98. `graph-service/src/utils/graphFormatter.js` - Форматирование графа

### Тесты
99. `graph-service/tests/controllers/graphController.test.js`
100. `graph-service/tests/services/graphService.test.js`
101. `graph-service/tests/repositories/graphRepository.test.js`

## 4. Сервис тезисов (Thesis Service)

### Конфигурация и основа
102. `thesis-service/package.json` - Зависимости
103. `thesis-service/Dockerfile` - Dockerfile для сервиса
104. `thesis-service/src/server.js` - Точка входа
105. `thesis-service/src/config/index.js` - Основная конфигурация
106. `thesis-service/src/config/mongodb.js` - Конфигурация MongoDB

### Модели и репозитории
107. `thesis-service/src/models/thesisModel.js` - Модель тезиса
108. `thesis-service/src/models/categoryDescriptionModel.js` - Модель описания категории
109. `thesis-service/src/models/relationshipDescriptionModel.js` - Модель описания связи
110. `thesis-service/src/repositories/mongoRepository.js` - Общий репозиторий для MongoDB
111. `thesis-service/src/repositories/thesisRepository.js` - Доступ к данным тезисов
112. `thesis-service/src/repositories/categoryDescriptionRepository.js` - Доступ к данным описаний категорий
113. `thesis-service/src/repositories/relationshipDescriptionRepository.js` - Доступ к данным описаний связей

### Сервисы
114. `thesis-service/src/services/thesisService.js` - Бизнес-логика тезисов
115. `thesis-service/src/services/generationService.js` - Генерация тезисов
116. `thesis-service/src/services/analysisService.js` - Анализ тезисов
117. `thesis-service/src/services/comparisonService.js` - Сравнение тезисов
118. `thesis-service/src/services/descriptionService.js` - Управление описаниями категорий и связей

### Контроллеры и маршруты
119. `thesis-service/src/controllers/thesisController.js` - Управление тезисами
120. `thesis-service/src/controllers/generationController.js` - Генерация тезисов
121. `thesis-service/src/controllers/analysisController.js` - Анализ тезисов
122. `thesis-service/src/controllers/descriptionController.js` - Управление описаниями
123. `thesis-service/src/routes/thesisRoutes.js` - Маршруты тезисов
124. `thesis-service/src/routes/generationRoutes.js` - Маршруты генерации
125. `thesis-service/src/routes/analysisRoutes.js` - Маршруты анализа
126. `thesis-service/src/routes/descriptionRoutes.js` - Маршруты описаний

### Клиенты и утилиты
127. `thesis-service/src/clients/graphServiceClient.js` - Клиент сервиса графов
128. `thesis-service/src/clients/claudeServiceClient.js` - Клиент сервиса Claude
129. `thesis-service/src/utils/thesisFormatter.js` - Форматирование тезисов
130. `thesis-service/src/utils/thesisAnalyzer.js` - Анализ тезисов

### Тесты
131. `thesis-service/tests/controllers/thesisController.test.js`
132. `thesis-service/tests/services/thesisService.test.js`
133. `thesis-service/tests/repositories/thesisRepository.test.js`

## 5. Сервис концепций (Concept Service)

### Конфигурация и основа
134. `concept-service/package.json` - Зависимости
135. `concept-service/Dockerfile` - Dockerfile для сервиса
136. `concept-service/src/server.js` - Точка входа
137. `concept-service/src/config/index.js` - Основная конфигурация
138. `concept-service/src/config/db.js` - Конфигурация БД

### Модели и репозитории
139. `concept-service/src/models/conceptModel.js` - Модель концепции
140. `concept-service/src/models/philosopherModel.js` - Модель философа
141. `concept-service/src/models/traditionModel.js` - Модель традиции
142. `concept-service/src/models/conceptPhilosopherModel.js` - Связь между концепциями и философами
143. `concept-service/src/models/conceptTraditionModel.js` - Связь между концепциями и традициями
144. `concept-service/src/repositories/conceptRepository.js` - Доступ к данным концепций
145. `concept-service/src/repositories/philosopherRepository.js` - Доступ к данным философов
146. `concept-service/src/repositories/traditionRepository.js` - Доступ к данным традиций

### Сервисы
147. `concept-service/src/services/conceptService.js` - Бизнес-логика концепций
148. `concept-service/src/services/metadataService.js` - Управление метаданными
149. `concept-service/src/services/philosopherService.js` - Управление философами
150. `concept-service/src/services/traditionService.js` - Управление традициями
151. `concept-service/src/services/coordinationService.js` - Координация с другими сервисами

### Контроллеры и маршруты
152. `concept-service/src/controllers/conceptController.js` - Управление концепциями
153. `concept-service/src/controllers/metadataController.js` - Управление метаданными
154. `concept-service/src/controllers/philosopherController.js` - Управление философами
155. `concept-service/src/controllers/traditionController.js` - Управление традициями
156. `concept-service/src/routes/conceptRoutes.js` - Маршруты концепций
157. `concept-service/src/routes/philosopherRoutes.js` - Маршруты философов
158. `concept-service/src/routes/traditionRoutes.js` - Маршруты традиций

### Клиенты
159. `concept-service/src/clients/graphServiceClient.js` - Клиент сервиса графов
160. `concept-service/src/clients/thesisServiceClient.js` - Клиент сервиса тезисов

### Тесты
161. `concept-service/tests/controllers/conceptController.test.js`
162. `concept-service/tests/services/conceptService.test.js`
163. `concept-service/tests/repositories/conceptRepository.test.js`

## 6. API Gateway

### Конфигурация и основа
164. `api-gateway/package.json` - Зависимости
165. `api-gateway/Dockerfile` - Dockerfile для сервиса
166. `api-gateway/src/server.js` - Точка входа
167. `api-gateway/src/config/index.js` - Основная конфигурация
168. `api-gateway/src/config/routes.js` - Конфигурация маршрутов

### Маршруты
169. `api-gateway/src/routes/index.js` - Основной файл маршрутов
170. `api-gateway/src/routes/userRoutes.js` - Маршруты для пользователей
171. `api-gateway/src/routes/conceptRoutes.js` - Маршруты для концепций
172. `api-gateway/src/routes/graphRoutes.js` - Маршруты для графов
173. `api-gateway/src/routes/thesisRoutes.js` - Маршруты для тезисов
174. `api-gateway/src/routes/claudeRoutes.js` - Маршруты для Claude

### Middleware
175. `api-gateway/src/middleware/auth.js` - Аутентификация и авторизация
176. `api-gateway/src/middleware/errorHandler.js` - Обработка ошибок
177. `api-gateway/src/middleware/logging.js` - Логирование
178. `api-gateway/src/middleware/rateLimit.js` - Ограничение частоты запросов

### Сервисы и утилиты
179. `api-gateway/src/services/serviceRegistry.js` - Реестр сервисов
180. `api-gateway/src/services/serviceDiscovery.js` - Обнаружение сервисов
181. `api-gateway/src/utils/responseFormatter.js` - Форматирование ответов
182. `api-gateway/src/utils/healthCheck.js` - Проверка состояния

### Тесты
183. `api-gateway/tests/routes.test.js` - Тесты маршрутов
184. `api-gateway/tests/middleware.test.js` - Тесты middleware

## 7. Frontend

### Проект и конфигурация
185. `frontend/package.json` - Зависимости
186. `frontend/tsconfig.json` - Конфигурация TypeScript
187. `frontend/jest.config.js` - Конфигурация Jest для тестирования
188. `frontend/.eslintrc.js` - Конфигурация ESLint
189. `frontend/.prettierrc` - Конфигурация Prettier
190. `frontend/Dockerfile` - Dockerfile для приложения
191. `frontend/public/index.html` - Шаблон HTML
192. `frontend/src/App.tsx` - Главный компонент приложения
193. `frontend/src/index.tsx` - Точка входа

### Типы и интерфейсы
194. `frontend/src/types/concept.types.ts` - Типы концепций
195. `frontend/src/types/graph.types.ts` - Типы графов
196. `frontend/src/types/thesis.types.ts` - Типы тезисов
197. `frontend/src/types/user.types.ts` - Типы пользователей
198. `frontend/src/types/claude.types.ts` - Типы для взаимодействия с Claude

### Базовые компоненты и контексты
199. `frontend/src/context/AuthContext.tsx`
200. `frontend/src/context/NotificationContext.tsx`
201. `frontend/src/context/ConceptContext.tsx`
202. `frontend/src/components/common/Button.tsx`
203. `frontend/src/components/common/Input.tsx`
204. `frontend/src/components/common/Select.tsx`
205. `frontend/src/components/common/Modal.tsx`
206. `frontend/src/components/common/Loader.tsx`
207. `frontend/src/components/common/ErrorBoundary.tsx`
208. `frontend/src/components/common/Notification.tsx`
209. `frontend/src/components/layout/Header.tsx`
210. `frontend/src/components/layout/Sidebar.tsx`
211. `frontend/src/components/layout/Footer.tsx`
212. `frontend/src/components/layout/MainLayout.tsx`

### Сервисы и хуки
213. `frontend/src/services/api.ts` - Базовый API-клиент
214. `frontend/src/services/authService.ts` - Сервис аутентификации
215. `frontend/src/services/conceptService.ts` - Сервис концепций
216. `frontend/src/services/graphService.ts` - Сервис графов
217. `frontend/src/services/thesisService.ts` - Сервис тезисов
218. `frontend/src/services/claudeService.ts` - Сервис Claude
219. `frontend/src/hooks/useApi.ts` - Хук для работы с API
220. `frontend/src/hooks/useAuth.ts` - Хук для аутентификации
221. `frontend/src/hooks/useGraph.ts` - Хук для работы с графом
222. `frontend/src/hooks/useThesis.ts` - Хук для работы с тезисами
223. `frontend/src/hooks/useClaude.ts` - Хук для работы с Claude

### Компоненты для работы с графом
224. `frontend/src/components/conceptGraph/ConceptGraphVisualization.tsx` - Визуализация графа
225. `frontend/src/components/conceptGraph/CategoryManager.tsx` - Управление категориями
226. `frontend/src/components/conceptGraph/RelationshipManager.tsx` - Управление связями
227. `frontend/src/components/conceptGraph/GraphControls.tsx` - Элементы управления графом
228. `frontend/src/components/conceptGraph/NodeDetails.tsx` - Детали узла
229. `frontend/src/components/conceptGraph/EdgeDetails.tsx` - Детали связи

### Компоненты для работы с тезисами
230. `frontend/src/components/theses/ThesisList.tsx` - Список тезисов
231. `frontend/src/components/theses/ThesisDetails.tsx` - Детали тезиса
232. `frontend/src/components/theses/ThesisGenerator.tsx` - Генератор тезисов
233. `frontend/src/components/theses/ThesisFilter.tsx` - Фильтрация тезисов

### Компоненты для Claude
234. `frontend/src/components/claude/ClaudeInterface.tsx` - Интерфейс взаимодействия с Claude
235. `frontend/src/components/claude/TemplateSelector.tsx` - Селектор шаблонов
236. `frontend/src/components/claude/AsyncTasksList.tsx` - Список асинхронных задач

### Страницы приложения
237. `frontend/src/pages/home/HomePage.tsx`
238. `frontend/src/pages/concepts/ConceptsListPage.tsx`
239. `frontend/src/pages/concepts/ConceptEditorPage.tsx`
240. `frontend/src/pages/concepts/ConceptViewPage.tsx`
241. `frontend/src/pages/user/ProfilePage.tsx`
242. `frontend/src/pages/user/LoginPage.tsx`
243. `frontend/src/pages/user/RegisterPage.tsx`

### Утилиты и тесты
244. `frontend/src/utils/formatters.ts` - Форматирование данных
245. `frontend/src/utils/validators.ts` - Валидация данных
246. `frontend/src/utils/graphHelpers.ts` - Вспомогательные функции для работы с графами
247. `frontend/src/utils/thesisHelpers.ts` - Вспомогательные функции для работы с тезисами
248. `frontend/tests/components/common/Button.test.tsx`
249. `frontend/tests/hooks/useAuth.test.ts`
250. `frontend/tests/services/api.test.ts`