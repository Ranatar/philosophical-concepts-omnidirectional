# Практические примеры реализации

После тщательного анализа архитектуры сервиса философских концепций рассмотрим практические примеры реализации ключевых компонентов системы. Эти примеры демонстрируют конкретную реализацию теоретических концепций, описанных в предыдущих разделах, и могут служить отправной точкой для разработки.

## 1. Реализация микросервиса Graph Service

Начнем с реализации одного из ключевых микросервисов системы – Graph Service, отвечающего за работу с графами философских концепций.

### Структура проекта

```
graph-service/
├── src/
│   ├── controllers/
│   │   ├── GraphController.js
│   │   ├── CategoryController.js
│   │   └── RelationshipController.js
│   ├── services/
│   │   ├── GraphService.js
│   │   ├── CategoryService.js
│   │   ├── RelationshipService.js
│   │   └── ValidationService.js
│   ├── repositories/
│   │   ├── GraphRepository.js
│   │   ├── CategoryRepository.js
│   │   └── RelationshipRepository.js
│   ├── models/
│   │   ├── Category.js
│   │   └── Relationship.js
│   ├── clients/
│   │   └── ClaudeClient.js
│   ├── utils/
│   │   ├── CypherQueryBuilder.js
│   │   └── GraphTransformer.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── requestLogger.js
│   ├── config/
│   │   ├── db.js
│   │   ├── redis.js
│   │   └── app.js
│   └── app.js
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── repositories/
│   └── integration/
├── Dockerfile
├── package.json
└── README.md
```

### Ключевые файлы

#### app.js

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { auth } = require('./middleware/auth');
const { initializeNeo4j } = require('./config/db');
const { initializeRedis } = require('./config/redis');

// Import controllers
const graphController = require('./controllers/GraphController');
const categoryController = require('./controllers/CategoryController');
const relationshipController = require('./controllers/RelationshipController');

// Initialize Express
const app = express();
const port = process.env.PORT || 4003;

// Initialize databases
initializeNeo4j();
initializeRedis();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/graphs', auth, graphController);
app.use('/api/categories', auth, categoryController);
app.use('/api/relationships', auth, relationshipController);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Graph Service listening on port ${port}`);
  });
}

module.exports = app;
```

#### GraphService.js

```javascript
const GraphRepository = require('../repositories/GraphRepository');
const CategoryService = require('./CategoryService');
const RelationshipService = require('./RelationshipService');
const ClaudeClient = require('../clients/ClaudeClient');
const GraphTransformer = require('../utils/GraphTransformer');
const redisClient = require('../config/redis').getClient();

class GraphService {
  constructor() {
    this.graphRepository = new GraphRepository();
    this.categoryService = new CategoryService();
    this.relationshipService = new RelationshipService();
    this.claudeClient = new ClaudeClient();
    this.graphTransformer = new GraphTransformer();
    this.cacheTTL = 3600; // 1 hour in seconds
  }

  /**
   * Get the full graph for a concept
   * @param {string} conceptId - The ID of the concept
   * @returns {Promise<Object>} The concept graph with nodes and edges
   */
  async getConceptGraph(conceptId) {
    const cacheKey = `graph:${conceptId}`;
    
    // Try to get from cache first
    try {
      const cachedGraph = await redisClient.get(cacheKey);
      if (cachedGraph) {
        console.log(`Cache hit for graph:${conceptId}`);
        return JSON.parse(cachedGraph);
      }
    } catch (error) {
      console.error('Redis error:', error);
      // Continue with database fetch if cache fails
    }
    
    // Get from database
    const result = await this.graphRepository.getConceptGraph(conceptId);
    
    // Transform database result to graph structure
    const graph = this.graphTransformer.transformToGraph(result);
    
    // Cache the result
    try {
      await redisClient.set(cacheKey, JSON.stringify(graph), 'EX', this.cacheTTL);
    } catch (error) {
      console.error('Redis caching error:', error);
      // Continue even if caching fails
    }
    
    return graph;
  }

  /**
   * Create a new category in the concept graph
   * @param {string} conceptId - The ID of the concept
   * @param {Object} categoryData - The category data
   * @returns {Promise<Object>} The created category
   */
  async createCategory(conceptId, categoryData) {
    const category = await this.categoryService.createCategory(conceptId, categoryData);
    
    // Invalidate cache
    try {
      await redisClient.del(`graph:${conceptId}`);
    } catch (error) {
      console.error('Redis error when invalidating cache:', error);
    }
    
    return category;
  }

  /**
   * Create a relationship between two categories
   * @param {string} conceptId - The ID of the concept
   * @param {Object} relationshipData - The relationship data
   * @returns {Promise<Object>} The created relationship
   */
  async createRelationship(conceptId, relationshipData) {
    const relationship = await this.relationshipService.createRelationship(
      conceptId,
      relationshipData.sourceId,
      relationshipData.targetId,
      relationshipData.type,
      relationshipData.direction,
      relationshipData.strength,
      relationshipData.certainty
    );
    
    // Invalidate cache
    try {
      await redisClient.del(`graph:${conceptId}`);
    } catch (error) {
      console.error('Redis error when invalidating cache:', error);
    }
    
    return relationship;
  }

  /**
   * Validate a concept graph using Claude
   * @param {string} conceptId - The ID of the concept
   * @returns {Promise<Object>} Validation results
   */
  async validateGraph(conceptId) {
    // Get the graph
    const graph = await this.getConceptGraph(conceptId);
    
    // Call Claude for validation
    const validationResult = await this.claudeClient.validateGraph(graph);
    
    return validationResult;
  }

  /**
   * Generate a graph from theses
   * @param {Array} theses - An array of thesis objects
   * @returns {Promise<Object>} The generated graph
   */
  async generateGraphFromTheses(theses) {
    // Call Claude to generate graph from theses
    const graphStructure = await this.claudeClient.generateGraphFromTheses(theses);
    
    // TODO: Create the graph in Neo4j based on the structure
    
    return graphStructure;
  }
}

module.exports = GraphService;
```

#### GraphRepository.js

```javascript
const neo4j = require('../config/db').getDriver();

class GraphRepository {
  /**
   * Get the full graph for a concept
   * @param {string} conceptId - The ID of the concept
   * @returns {Promise<Array>} The records from Neo4j
   */
  async getConceptGraph(conceptId) {
    const session = neo4j.session();
    
    try {
      const result = await session.run(`
        MATCH (c:Concept {concept_id: $conceptId})-[:INCLUDES]->(cat:Category)
        OPTIONAL MATCH (cat)-[r:RELATED_TO]->(cat2:Category)
        WHERE (c)-[:INCLUDES]->(cat2)
        RETURN c, cat, r, cat2
      `, { conceptId });
      
      return result.records;
    } finally {
      await session.close();
    }
  }

  /**
   * Create a category in Neo4j
   * @param {string} conceptId - The ID of the concept
   * @param {string} categoryId - The ID of the new category
   * @param {string} name - The name of the category
   * @param {string} definition - The definition of the category
   * @param {number} centrality - The centrality value (0-1)
   * @param {number} certainty - The certainty value (0-1)
   * @returns {Promise<Object>} The created category
   */
  async createCategory(conceptId, categoryId, name, definition, centrality, certainty) {
    const session = neo4j.session();
    
    try {
      const result = await session.run(`
        MATCH (c:Concept {concept_id: $conceptId})
        CREATE (cat:Category {
          category_id: $categoryId,
          name: $name,
          definition: $definition,
          centrality: $centrality,
          certainty: $certainty
        })
        CREATE (c)-[:INCLUDES]->(cat)
        RETURN cat
      `, {
        conceptId,
        categoryId,
        name,
        definition,
        centrality: neo4j.float(centrality),
        certainty: neo4j.float(certainty)
      });
      
      if (result.records.length === 0) {
        throw new Error('Failed to create category');
      }
      
      return result.records[0].get('cat').properties;
    } finally {
      await session.close();
    }
  }

  /**
   * Create a relationship between two categories
   * @param {string} sourceId - The ID of the source category
   * @param {string} targetId - The ID of the target category
   * @param {string} type - The type of relationship
   * @param {string} direction - The direction of the relationship
   * @param {number} strength - The strength value (0-1)
   * @param {number} certainty - The certainty value (0-1)
   * @returns {Promise<Object>} The created relationship
   */
  async createRelationship(sourceId, targetId, type, direction, strength, certainty) {
    const session = neo4j.session();
    
    try {
      // Creating a unique relationship ID
      const relationshipId = `rel_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const result = await session.run(`
        MATCH (source:Category {category_id: $sourceId})
        MATCH (target:Category {category_id: $targetId})
        CREATE (source)-[r:RELATED_TO {
          relationship_id: $relationshipId,
          type: $type,
          direction: $direction,
          strength: $strength,
          certainty: $certainty
        }]->(target)
        RETURN r, source, target
      `, {
        sourceId,
        targetId,
        relationshipId,
        type,
        direction,
        strength: neo4j.float(strength),
        certainty: neo4j.float(certainty)
      });
      
      if (result.records.length === 0) {
        throw new Error('Failed to create relationship');
      }
      
      const record = result.records[0];
      const relationship = record.get('r').properties;
      relationship.source = record.get('source').properties.category_id;
      relationship.target = record.get('target').properties.category_id;
      
      return relationship;
    } finally {
      await session.close();
    }
  }
}

module.exports = GraphRepository;
```

#### ClaudeClient.js

```javascript
const axios = require('axios');

class ClaudeClient {
  constructor() {
    this.baseUrl = process.env.CLAUDE_SERVICE_URL || 'http://claude-service:4006';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Validate a concept graph using Claude
   * @param {Object} graph - The concept graph with nodes and edges
   * @returns {Promise<Object>} Validation results
   */
  async validateGraph(graph) {
    try {
      const response = await this.client.post('/claude/query', {
        query_type: 'validate-graph',
        graph_data: graph
      });
      
      return response.data;
    } catch (error) {
      console.error('Claude validation error:', error.message);
      
      // Enhanced error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(`Claude service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('Claude service timeout or no response');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`Error setting up Claude request: ${error.message}`);
      }
    }
  }

  /**
   * Generate a graph from theses using Claude
   * @param {Array} theses - An array of thesis objects
   * @returns {Promise<Object>} The generated graph structure
   */
  async generateGraphFromTheses(theses) {
    try {
      const response = await this.client.post('/claude/query', {
        query_type: 'thesis-to-graph',
        theses_data: theses
      });
      
      return response.data;
    } catch (error) {
      console.error('Claude graph generation error:', error.message);
      
      // Enhanced error handling
      if (error.response) {
        throw new Error(`Claude service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('Claude service timeout or no response');
      } else {
        throw new Error(`Error setting up Claude request: ${error.message}`);
      }
    }
  }
}

module.exports = ClaudeClient;
```

#### GraphController.js

```javascript
const express = require('express');
const router = express.Router();
const GraphService = require('../services/GraphService');
const { v4: uuidv4 } = require('uuid');

const graphService = new GraphService();

/**
 * Get a concept graph
 */
router.get('/concepts/:conceptId', async (req, res, next) => {
  try {
    const { conceptId } = req.params;
    const graph = await graphService.getConceptGraph(conceptId);
    res.json(graph);
  } catch (error) {
    next(error);
  }
});

/**
 * Create a category in a concept graph
 */
router.post('/concepts/:conceptId/categories', async (req, res, next) => {
  try {
    const { conceptId } = req.params;
    const categoryData = {
      ...req.body,
      category_id: req.body.category_id || uuidv4()
    };
    
    const category = await graphService.createCategory(conceptId, categoryData);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

/**
 * Create a relationship between categories
 */
router.post('/relationships', async (req, res, next) => {
  try {
    const { conceptId, sourceId, targetId, type, direction, strength, certainty } = req.body;
    
    const relationshipData = {
      sourceId,
      targetId,
      type,
      direction,
      strength: strength || 0.5,
      certainty: certainty || 0.5
    };
    
    const relationship = await graphService.createRelationship(conceptId, relationshipData);
    res.status(201).json(relationship);
  } catch (error) {
    next(error);
  }
});

/**
 * Validate a concept graph
 */
router.post('/concepts/:conceptId/validate', async (req, res, next) => {
  try {
    const { conceptId } = req.params;
    const validationResult = await graphService.validateGraph(conceptId);
    res.json(validationResult);
  } catch (error) {
    next(error);
  }
});

/**
 * Generate a graph from theses
 */
router.post('/from-theses', async (req, res, next) => {
  try {
    const { theses } = req.body;
    const graphStructure = await graphService.generateGraphFromTheses(theses);
    res.json(graphStructure);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

## 2. Реализация интеграции с Claude

Далее рассмотрим пример реализации сервиса Claude, отвечающего за взаимодействие с Claude API.

### Структура проекта

```
claude-service/
├── src/
│   ├── controllers/
│   │   └── ClaudeController.js
│   ├── services/
│   │   ├── ClaudeService.js
│   │   └── QueueService.js
│   ├── formatters/
│   │   └── ClaudeRequestFormatter.js
│   ├── models/
│   │   ├── ClaudeInteraction.js
│   │   └── Task.js
│   ├── config/
│   │   ├── db.js
│   │   ├── rabbitmq.js
│   │   └── app.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── requestLogger.js
│   ├── utils/
│   │   └── responseParser.js
│   └── app.js
├── workers/
│   └── claudeTaskProcessor.js
├── tests/
│   ├── unit/
│   └── integration/
├── Dockerfile
├── package.json
└── README.md
```

### Ключевые файлы

#### ClaudeService.js

```javascript
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const ClaudeRequestFormatter = require('../formatters/ClaudeRequestFormatter');
const ClaudeInteraction = require('../models/ClaudeInteraction');
const QueueService = require('./QueueService');
const responseParser = require('../utils/responseParser');

class ClaudeService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.apiUrl = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
    this.formatter = new ClaudeRequestFormatter();
    this.queueService = new QueueService();
    
    // Initialize axios client
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 60000, // 60 seconds
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });
  }

  /**
   * Send a synchronous query to Claude
   * @param {string} userId - The ID of the user
   * @param {string} conceptId - The ID of the concept (optional)
   * @param {string} queryType - The type of query
   * @param {Object} queryData - The data for the query
   * @returns {Promise<Object>} The Claude response
   */
  async query(userId, conceptId, queryType, queryData) {
    const interactionId = uuidv4();
    
    // Format the query based on its type
    const prompt = this.formatQuery(queryType, queryData);
    
    try {
      // Prepare the request
      const requestPayload = {
        model: "claude-3-opus-20240229",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 4000
      };
      
      // Send the request to Claude API
      const response = await this.client.post('', requestPayload);
      
      // Process the response
      const claudeResponse = response.data;
      const parsedResponse = responseParser.parse(queryType, claudeResponse.content[0].text);
      
      // Save the interaction
      await this.saveInteraction(
        interactionId,
        userId,
        conceptId,
        queryType,
        prompt,
        claudeResponse.content[0].text,
        new Date(),
        (response.headers['x-request-id'] || 'unknown')
      );
      
      return {
        success: true,
        data: parsedResponse,
        interaction_id: interactionId
      };
    } catch (error) {
      console.error(`Claude API error: ${error.message}`);
      
      // Still save the failed interaction
      await this.saveInteraction(
        interactionId,
        userId,
        conceptId,
        queryType,
        prompt,
        error.message,
        new Date(),
        'failed',
        true
      );
      
      // Enhanced error handling
      if (error.response) {
        return {
          success: false,
          error: `Claude API error: ${error.response.status}`,
          details: error.response.data,
          interaction_id: interactionId
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'Claude API timeout or no response',
          interaction_id: interactionId
        };
      } else {
        return {
          success: false,
          error: `Error setting up Claude request: ${error.message}`,
          interaction_id: interactionId
        };
      }
    }
  }

  /**
   * Queue an asynchronous query to Claude
   * @param {string} userId - The ID of the user
   * @param {string} conceptId - The ID of the concept (optional)
   * @param {string} queryType - The type of query
   * @param {Object} queryData - The data for the query
   * @param {string} callbackUrl - The URL to call when processing is complete (optional)
   * @returns {Promise<Object>} The task information
   */
  async queueQuery(userId, conceptId, queryType, queryData, callbackUrl = null) {
    const taskId = uuidv4();
    
    // Format the query based on its type
    const prompt = this.formatQuery(queryType, queryData);
    
    // Create task data
    const taskData = {
      taskId,
      userId,
      conceptId,
      queryType,
      prompt,
      callbackUrl,
      createdAt: new Date()
    };
    
    // Add the task to the queue
    await this.queueService.addTask(taskData);
    
    return {
      success: true,
      task_id: taskId,
      status: 'queued',
      created_at: taskData.createdAt
    };
  }

  /**
   * Get the status of an asynchronous task
   * @param {string} taskId - The ID of the task
   * @returns {Promise<Object>} The task status
   */
  async getTaskStatus(taskId) {
    return await this.queueService.getTaskStatus(taskId);
  }

  /**
   * Format a query based on its type
   * @param {string} queryType - The type of query
   * @param {Object} queryData - The data for the query
   * @returns {string} The formatted prompt
   */
  formatQuery(queryType, queryData) {
    switch (queryType) {
      case 'validate-graph':
        return this.formatter.formatGraphValidationRequest(queryData.graph_data);
      
      case 'enrich-category':
        return this.formatter.formatCategoryEnrichmentRequest(
          queryData.category_data,
          queryData.concept_name,
          queryData.traditions || [],
          queryData.philosophers || []
        );
      
      case 'generate-theses':
        return this.formatter.formatThesisGenerationRequest(
          queryData.graph_data,
          queryData.quantity || 5,
          queryData.thesis_type || 'онтологические',
          queryData.style || 'академический'
        );
      
      case 'thesis-to-graph':
        return this.formatter.formatThesisToGraphRequest(queryData.theses_data);
      
      case 'concept-synthesis':
        return this.formatter.formatConceptSynthesisRequest(
          queryData.concept1,
          queryData.concept2,
          queryData.method,
          queryData.focus,
          queryData.innovation_degree
        );
      
      case 'free-form':
        return queryData.prompt;
      
      default:
        throw new Error(`Unknown query type: ${queryType}`);
    }
  }

  /**
   * Save an interaction to the database
   * @param {string} interactionId - The ID of the interaction
   * @param {string} userId - The ID of the user
   * @param {string} conceptId - The ID of the concept (optional)
   * @param {string} queryType - The type of query
   * @param {string} queryContent - The content of the query
   * @param {string} responseContent - The content of the response
   * @param {Date} interactionDate - The date of the interaction
   * @param {string} requestId - The request ID from Claude API
   * @param {boolean} isError - Whether this was an error response
   * @returns {Promise<void>}
   */
  async saveInteraction(
    interactionId,
    userId,
    conceptId,
    queryType,
    queryContent,
    responseContent,
    interactionDate,
    requestId,
    isError = false
  ) {
    try {
      await ClaudeInteraction.create({
        interaction_id: interactionId,
        user_id: userId,
        concept_id: conceptId,
        query_type: queryType,
        query_content: queryContent,
        response_content: responseContent,
        interaction_date: interactionDate,
        request_id: requestId,
        is_error: isError
      });
    } catch (error) {
      console.error(`Error saving Claude interaction: ${error.message}`);
      // Continue even if saving fails
    }
  }
}

module.exports = ClaudeService;
```

#### ClaudeRequestFormatter.js

```javascript
/**
 * Utility class for formatting requests to Claude
 */
class ClaudeRequestFormatter {
  /**
   * Format JSON to string
   * @param {Object} data - Data to format
   * @returns {string} - Formatted JSON string
   */
  _formatJSON(data) {
    if (!data) return '{}';
    return JSON.stringify(data, null, 2);
  }

  /**
   * Remove extra spaces from multi-line template strings
   * @param {string} str - String with indentation
   * @returns {string} - String without extra indentation
   */
  _removeExtraSpaces(str) {
    if (!str) return '';
    return str.replace(/\n\s+/g, '\n');
  }

  /**
   * Format a request to validate a graph
   * @param {Object} graphData - The graph data
   * @returns {string} - Formatted request
   */
  formatGraphValidationRequest(graphData) {
    if (!graphData) throw new Error('graphData is required');
    
    return this._removeExtraSpaces(`Проанализируй следующий граф категорий философской концепции ${this._formatJSON(graphData)}. 
Выяви возможные логические противоречия, пропущенные важные категории или 
связи, необычные отношения между категориями. Предложи возможные улучшения.

Формат ответа:
{
  "contradictions": [
    {
      "source": "Название категории 1",
      "target": "Название категории 2",
      "description": "Описание противоречия"
    }
  ],
  "missingCategories": [
    {
      "name": "Название предлагаемой категории",
      "description": "Описание и обоснование"
    }
  ],
  "missingRelationships": [
    {
      "source": "Название категории 1",
      "target": "Название категории 2",
      "type": "Тип связи",
      "description": "Обоснование"
    }
  ],
  "recommendations": [
    "Рекомендация 1",
    "Рекомендация 2"
  ]
}`);
  }

  /**
   * Format a request to enrich a category
   * @param {Object} categoryData - The category data
   * @param {string} conceptName - The name of the concept
   * @param {Array} traditions - List of traditions
   * @param {Array} philosophers - List of philosophers
   * @returns {string} - Formatted request
   */
  formatCategoryEnrichmentRequest(categoryData, conceptName, traditions = [], philosophers = []) {
    if (!categoryData) throw new Error('categoryData is required');
    if (!conceptName) throw new Error('conceptName is required');
    
    return this._removeExtraSpaces(`Для следующей категории "${categoryData.name}" с определением "${categoryData.definition}"
в контексте философской концепции "${conceptName}", предложи расширенное
описание, возможные альтернативные трактовки, исторические аналоги и связанные концепты.
${traditions.length > 0 ? `Категория используется в традициях: ${traditions.join(', ')}` : ''}
${philosophers.length > 0 ? `Категория связана с философами: ${philosophers.join(', ')}` : ''}
${(traditions.length > 0 || philosophers.length > 0) ? 'При обогащении учитывай указанные традиции и философов.' : ''}

Формат ответа:
{
  "detailedDescription": "Развернутое описание категории...",
  "alternativeInterpretations": [
    "Альтернативная трактовка 1...",
    "Альтернативная трактовка 2..."
  ],
  "historicalAnalogues": [
    {
      "philosopher": "Имя философа",
      "concept": "Название концепта",
      "description": "Описание аналога..."
    }
  ],
  "relatedConcepts": [
    "Связанный концепт 1",
    "Связанный концепт 2"
  ]
}`);
  }

  /**
   * Format a request to generate theses from a graph
   * @param {Object} graphData - The graph data
   * @param {number} quantity - Number of theses to generate
   * @param {string} thesisType - Type of theses
   * @param {string} style - Style of theses
   * @returns {string} - Formatted request
   */
  formatThesisGenerationRequest(graphData, quantity, thesisType, style) {
    if (!graphData) throw new Error('graphData is required');
    if (!quantity || quantity <= 0) throw new Error('quantity must be a positive number');
    if (!thesisType) throw new Error('thesisType is required');
    if (!style) throw new Error('style is required');
    
    return this._removeExtraSpaces(`На основе следующего графа философской концепции ${this._formatJSON(graphData)} 
сформулируй ${quantity} ключевых тезисов в области ${thesisType}. 
Тезисы должны отражать структурные отношения между категориями и быть 
выражены в ${style} стиле. Для каждого тезиса укажи, из каких именно 
элементов графа он логически следует.

Формат ответа:
{
  "theses": [
    {
      "content": "Текст тезиса...",
      "relatedCategories": ["Категория1", "Категория2"],
      "explanation": "Объяснение логической связи тезиса с элементами графа..."
    }
  ]
}`);
  }

  /**
   * Format a request to generate a graph from theses
   * @param {Array} theses - List of theses
   * @returns {string} - Formatted request
   */
  formatThesisToGraphRequest(theses) {
    if (!theses || !Array.isArray(theses)) throw new Error('theses must be an array');
    
    return this._removeExtraSpaces(`На основе следующих философских тезисов ${this._formatJSON(theses)} создай 
структурированный граф концепции. Выдели ключевые категории, установи связи 
между ними и предложи иерархию. Для каждого элемента графа укажи, из каких 
именно тезисов он логически следует.

Формат ответа:
{
  "categories": [
    {
      "name": "Название категории",
      "definition": "Определение категории",
      "centrality": 0.8,
      "certainty": 0.7,
      "sourceTezises": [1, 3]
    }
  ],
  "relationships": [
    {
      "source": "Название категории 1",
      "target": "Название категории 2",
      "type": "Тип связи",
      "direction": "directed",
      "strength": 0.6,
      "sourceTezises": [2, 4]
    }
  ]
}`);
  }

  /**
   * Format a request for concept synthesis
   * @param {Object} concept1 - First concept data
   * @param {Object} concept2 - Second concept data
   * @param {string} method - Synthesis method
   * @param {string} focus - Synthesis focus
   * @param {string} innovationDegree - Degree of innovation
   * @returns {string} - Formatted request
   */
  formatConceptSynthesisRequest(concept1, concept2, method, focus, innovationDegree) {
    if (!concept1 || !concept2) throw new Error('Both concepts are required');
    if (!method) throw new Error('method is required');
    if (!focus) throw new Error('focus is required');
    if (!innovationDegree) throw new Error('innovationDegree is required');
    
    return this._removeExtraSpaces(`На основе графов философских концепций ${this._formatJSON(concept1)} и ${this._formatJSON(concept2)} 
разработай граф синтетической концепции, используя метод ${method}. 
Фокус синтеза: ${focus}. Степень инновационности: ${innovationDegree}. 
Для каждого элемента нового графа укажи его происхождение (из какой исходной 
концепции он взят или как трансформирован) и обоснование включения.

Формат ответа:
{
  "name": "Предлагаемое название синтезированной концепции",
  "description": "Общее описание синтезированной концепции",
  "categories": [
    {
      "name": "Название категории",
      "definition": "Определение категории",
      "origin": "Concept1",
      "transformationType": "unchanged/modified/new",
      "justification": "Обоснование включения или трансформации"
    }
  ],
  "relationships": [
    {
      "source": "Название категории 1",
      "target": "Название категории 2",
      "type": "Тип связи",
      "origin": "Concept2",
      "transformationType": "unchanged/modified/new",
      "justification": "Обоснование включения или трансформации"
    }
  ]
}`);
  }
}

module.exports = ClaudeRequestFormatter;
```

#### QueueService.js

```javascript
const amqp = require('amqplib');
const Task = require('../models/Task');

class QueueService {
  constructor() {
    this.connectionUrl = process.env.RABBITMQ_URL || 'amqp://philos:password@rabbitmq:5672';
    this.queueName = 'claude_tasks';
    this.connection = null;
    this.channel = null;
    this.initialized = false;
  }

  /**
   * Initialize the connection to RabbitMQ
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      this.connection = await amqp.connect(this.connectionUrl);
      this.channel = await this.connection.createChannel();
      
      // Ensure the queue exists
      await this.channel.assertQueue(this.queueName, {
        durable: true
      });
      
      this.initialized = true;
      console.log('RabbitMQ connection initialized');
    } catch (error) {
      console.error('Error initializing RabbitMQ connection:', error.message);
      throw error;
    }
  }

  /**
   * Add a task to the queue
   * @param {Object} taskData - The data for the task
   * @returns {Promise<void>}
   */
  async addTask(taskData) {
    // Ensure connection is initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Save task to database
      await Task.create({
        task_id: taskData.taskId,
        user_id: taskData.userId,
        concept_id: taskData.conceptId,
        query_type: taskData.queryType,
        prompt: taskData.prompt,
        callback_url: taskData.callbackUrl,
        status: 'queued',
        created_at: taskData.createdAt
      });
      
      // Add to RabbitMQ queue
      await this.channel.sendToQueue(
        this.queueName,
        Buffer.from(JSON.stringify({ taskId: taskData.taskId })),
        { persistent: true }
      );
      
      console.log(`Task ${taskData.taskId} added to queue`);
    } catch (error) {
      console.error(`Error adding task to queue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the status of a task
   * @param {string} taskId - The ID of the task
   * @returns {Promise<Object>} The task status
   */
  async getTaskStatus(taskId) {
    try {
      const task = await Task.findOne({ where: { task_id: taskId } });
      
      if (!task) {
        return {
          success: false,
          error: 'Task not found'
        };
      }
      
      return {
        success: true,
        task_id: task.task_id,
        status: task.status,
        created_at: task.created_at,
        updated_at: task.updated_at,
        completed_at: task.completed_at,
        result: task.result ? JSON.parse(task.result) : null,
        error: task.error
      };
    } catch (error) {
      console.error(`Error getting task status: ${error.message}`);
      return {
        success: false,
        error: `Error getting task status: ${error.message}`
      };
    }
  }
}

module.exports = QueueService;
```

#### claudeTaskProcessor.js

```javascript
const amqp = require('amqplib');
const axios = require('axios');
const Task = require('../src/models/Task');
const { Sequelize } = require('sequelize');
const ClaudeRequestFormatter = require('../src/formatters/ClaudeRequestFormatter');
const responseParser = require('../src/utils/responseParser');
const { initializeDB } = require('../src/config/db');

// Initialize database connection
initializeDB();

// Configuration
const rabbitMqUrl = process.env.RABBITMQ_URL || 'amqp://philos:password@rabbitmq:5672';
const queueName = 'claude_tasks';
const claudeApiKey = process.env.CLAUDE_API_KEY;
const claudeApiUrl = process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
const formatter = new ClaudeRequestFormatter();

// Create Axios client for Claude API
const claudeClient = axios.create({
  baseURL: claudeApiUrl,
  timeout: 120000, // 2 minutes
  headers: {
    'x-api-key': claudeApiKey,
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01'
  }
});

/**
 * Process a task from the queue
 * @param {string} taskId - The ID of the task to process
 * @returns {Promise<void>}
 */
async function processTask(taskId) {
  console.log(`Processing task ${taskId}`);
  
  try {
    // Get task from database
    const task = await Task.findOne({ where: { task_id: taskId } });
    
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }
    
    // Update task status to processing
    await task.update({
      status: 'processing',
      updated_at: new Date()
    });
    
    // Prepare the request
    const requestPayload = {
      model: "claude-3-opus-20240229",
      messages: [
        { role: "user", content: task.prompt }
      ],
      max_tokens: 4000
    };
    
    // Send request to Claude API
    const response = await claudeClient.post('', requestPayload);
    
    // Process the response
    const claudeResponse = response.data;
    const parsedResponse = responseParser.parse(task.query_type, claudeResponse.content[0].text);
    
    // Update task as completed
    await task.update({
      status: 'completed',
      result: JSON.stringify(parsedResponse),
      updated_at: new Date(),
      completed_at: new Date()
    });
    
    // Send webhook if callback URL is provided
    if (task.callback_url) {
      try {
        await axios.post(task.callback_url, {
          task_id: task.task_id,
          status: 'completed',
          result: parsedResponse
        });
        console.log(`Webhook sent for task ${taskId}`);
      } catch (webhookError) {
        console.error(`Error sending webhook for task ${taskId}:`, webhookError.message);
      }
    }
    
    console.log(`Task ${taskId} processed successfully`);
  } catch (error) {
    console.error(`Error processing task ${taskId}:`, error.message);
    
    // Update task as failed
    try {
      const task = await Task.findOne({ where: { task_id: taskId } });
      if (task) {
        await task.update({
          status: 'failed',
          error: error.message,
          updated_at: new Date()
        });
        
        // Send webhook for failure if callback URL is provided
        if (task.callback_url) {
          try {
            await axios.post(task.callback_url, {
              task_id: task.task_id,
              status: 'failed',
              error: error.message
            });
          } catch (webhookError) {
            console.error(`Error sending failure webhook for task ${taskId}:`, webhookError.message);
          }
        }
      }
    } catch (updateError) {
      console.error(`Error updating failed task ${taskId}:`, updateError.message);
    }
  }
}

/**
 * Start the task processor
 */
async function startProcessor() {
  try {
    console.log('Starting Claude task processor...');
    
    // Connect to RabbitMQ
    const connection = await amqp.connect(rabbitMqUrl);
    const channel = await connection.createChannel();
    
    // Ensure the queue exists
    await channel.assertQueue(queueName, {
      durable: true
    });
    
    // Set prefetch to 1 to process one message at a time
    channel.prefetch(1);
    
    console.log('Waiting for tasks...');
    
    // Consume messages from the queue
    channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          await processTask(content.taskId);
          
          // Acknowledge the message
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error.message);
          
          // Reject the message and requeue
          channel.nack(msg, false, true);
        }
      }
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('Gracefully shutting down...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting processor:', error.message);
    process.exit(1);
  }
}

// Start the processor
startProcessor();
```

## 3. Реализация фронтенд-компонента для визуализации графа

Наконец, рассмотрим пример реализации React-компонента для визуализации графа философской концепции (упрощенная версия `concept-graph-visualization.tsx`).

```typescript
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ZoomIn, ZoomOut, CheckCircle, Edit, Save, Trash, Plus, Link } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  definition: string;
  centrality: number;
  certainty: number;
  x?: number;
  y?: number;
}

interface Relationship {
  id: string;
  source: string;
  target: string;
  type: string;
  direction: string;
  strength: number;
  certainty: number;
  sourceX?: number;
  sourceY?: number;
  targetX?: number;
  targetY?: number;
}

interface ConceptGraph {
  nodes: Category[];
  edges: Relationship[];
}

interface ValidationResult {
  contradictions: {
    source: string;
    target: string;
    description: string;
  }[];
  missingCategories: {
    name: string;
    description: string;
  }[];
  missingRelationships: {
    source: string;
    target: string;
    type: string;
    description: string;
  }[];
  recommendations: string[];
}

interface ConceptGraphVisualizationProps {
  conceptId: string;
  readOnly?: boolean;
}

const ConceptGraphVisualization: React.FC<ConceptGraphVisualizationProps> = ({ 
  conceptId, 
  readOnly = false 
}) => {
  // State variables
  const [graph, setGraph] = useState<ConceptGraph>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<Category | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Relationship | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Fetch graph data on component mount
  useEffect(() => {
    fetchGraphData();
  }, [conceptId]);
  
  // Fetch graph data from API
  const fetchGraphData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/graphs/concepts/${conceptId}`);
      setGraph(response.data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка загрузки графа концепции');
      setLoading(false);
    }
  };
  
  // Request graph validation from Claude
  const requestGraphValidation = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/graphs/concepts/${conceptId}/validate`);
      setValidationResult(response.data);
      setLoading(false);
    } catch (err) {
      setError('Ошибка при валидации графа');
      setLoading(false);
    }
  };
  
  // Zoom functions
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  
  // Node selection
  const handleNodeClick = (node: Category) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  };
  
  // Edge selection
  const handleEdgeClick = (edge: Relationship) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  };
  
  // Create new category
  const createCategory = async (categoryData: Omit<Category, 'id'>) => {
    try {
      const response = await axios.post(`/api/graphs/concepts/${conceptId}/categories`, categoryData);
      fetchGraphData(); // Refresh the graph
      return response.data;
    } catch (err) {
      setError('Ошибка при создании категории');
      throw err;
    }
  };
  
  // Create new relationship
  const createRelationship = async (relationshipData: {
    conceptId: string;
    sourceId: string;
    targetId: string;
    type: string;
    direction: string;
    strength: number;
    certainty: number;
  }) => {
    try {
      const response = await axios.post('/api/graphs/relationships', relationshipData);
      fetchGraphData(); // Refresh the graph
      return response.data;
    } catch (err) {
      setError('Ошибка при создании связи');
      throw err;
    }
  };
  
  // Prepare nodes with coordinates for visualization
  const prepareNodesWithCoordinates = (nodes: Category[]) => {
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const nodeRadius = 40;
    const radius = Math.min(width, height) / 2 - nodeRadius * 2;
    
    return nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      return {
        ...node,
        x,
        y
      };
    });
  };
  
  // Prepare edges with coordinates for visualization
  const prepareEdgesWithCoordinates = (edges: Relationship[], nodes: Category[]) => {
    return edges.map(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      
      if (!source || !target) {
        return null;
      }
      
      return {
        ...edge,
        sourceX: source.x,
        sourceY: source.y,
        targetX: target.x,
        targetY: target.y
      };
    }).filter(edge => edge !== null) as Relationship[];
  };
  
  // Render graph nodes
  const renderNodes = (nodes: Category[]) => {
    return nodes.map(node => (
      <g 
        key={`node-${node.id}`} 
        transform={`translate(${node.x}, ${node.y})`}
        onClick={() => handleNodeClick(node)}
        className="cursor-pointer"
      >
        <circle
          r={40 * (0.8 + (node.centrality || 0.5) * 0.4)}
          fill={selectedNode && selectedNode.id === node.id ? "#EBF8FF" : "#F7FAFC"}
          stroke={selectedNode && selectedNode.id === node.id ? "#3182CE" : "#E2E8F0"}
          strokeWidth={selectedNode && selectedNode.id === node.id ? 3 : 1}
        />
        
        <text
          textAnchor="middle" 
          dy=".3em"
          className="text-sm font-medium"
          fill="#4A5568"
        >
          {node.name}
        </text>
      </g>
    ));
  };
  
  // Render graph edges
  const renderEdges = (edges: Relationship[]) => {
    return edges.map(edge => (
      <g key={`edge-${edge.id}`} onClick={() => handleEdgeClick(edge)}>
        <line
          x1={edge.sourceX}
          y1={edge.sourceY}
          x2={edge.targetX}
          y2={edge.targetY}
          strokeWidth={2 + (edge.strength || 1) * 3}
          stroke={selectedEdge && selectedEdge.id === edge.id ? "#3182CE" : "#A0AEC0"}
          className="cursor-pointer"
          markerEnd={edge.direction !== 'bidirectional' ? "url(#arrowhead)" : null}
          markerStart={edge.direction === 'bidirectional' ? "url(#arrowhead-start)" : null}
        />
        
        <text
          x={(edge.sourceX! + edge.targetX!) / 2}
          y={(edge.sourceY! + edge.targetY!) / 2 - 10}
          textAnchor="middle"
          fill="#4A5568"
          className="text-sm"
        >
          {edge.type}
        </text>
      </g>
    ));
  };
  
  // Main render function for the graph
  const renderGraph = () => {
    if (loading) return <div className="flex items-center justify-center h-full">Загрузка графа...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    
    const width = 800;
    const height = 600;
    
    // Prepare nodes with coordinates
    const nodesWithCoordinates = prepareNodesWithCoordinates(graph.nodes);
    
    // Prepare edges with coordinates
    const edgesWithCoordinates = prepareEdgesWithCoordinates(graph.edges, nodesWithCoordinates);
    
    return (
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`}
        style={{ transform: `scale(${zoomLevel})` }}
        className="transition-transform duration-300"
      >
        {/* Definitions for arrowheads */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#A0AEC0" />
          </marker>
          <marker
            id="arrowhead-start"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto-start-reverse"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#A0AEC0" />
          </marker>
        </defs>
        
        {/* Render edges */}
        {renderEdges(edgesWithCoordinates)}
        
        {/* Render nodes */}
        {renderNodes(nodesWithCoordinates)}
      </svg>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between p-4 border-b">
        <div className="text-lg font-medium">Граф концепции</div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={zoomOut}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Уменьшить"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm">{Math.round(zoomLevel * 100)}%</span>
          <button 
            onClick={zoomIn}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Увеличить"
          >
            <ZoomIn size={20} />
          </button>
          <button 
            onClick={requestGraphValidation}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Валидировать граф через Claude"
          >
            <CheckCircle size={20} />
          </button>
          
          {!readOnly && (
            <>
              <button className="p-2 rounded hover:bg-gray-100" aria-label="Добавить категорию">
                <Plus size={20} />
              </button>
              <button className="p-2 rounded hover:bg-gray-100" aria-label="Добавить связь">
                <Link size={20} />
              </button>
            </>
          )}
          
          <button className="p-2 rounded hover:bg-gray-100" aria-label="Сохранить">
            <Save size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="h-full flex items-center justify-center">
          {renderGraph()}
        </div>
      </div>
      
      {/* Details panel for selected node */}
      {selectedNode && (
        <div className="p-4 border-t">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Категория: {selectedNode.name}</h3>
            {!readOnly && (
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Edit size={16} />
                </button>
                <button className="text-red-600 hover:text-red-800">
                  <Trash size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 text-sm">
            <p>{selectedNode.definition}</p>
            
            {/* Quantitative characteristics */}
            <div className="mt-3 border-b pb-2">
              <div className="font-medium mb-1">Количественные характеристики:</div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600">Центральность:</label>
                  <div className="flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={selectedNode.centrality} 
                      onChange={(e) => {
                        // Update centrality logic
                      }}
                      disabled={readOnly}
                      className="w-28 mr-2" 
                    />
                    <span>{selectedNode.centrality.toFixed(2)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600">Определённость:</label>
                  <div className="flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={selectedNode.certainty} 
                      onChange={(e) => {
                        // Update certainty logic
                      }}
                      disabled={readOnly}
                      className="w-28 mr-2" 
                    />
                    <span>{selectedNode.certainty.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-2">
              <button className="text-blue-600 hover:underline text-sm">
                Сгенерировать обогащенное описание
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Details panel for selected edge */}
      {selectedEdge && (
        <div className="p-4 border-t">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Связь: {selectedEdge.type}</h3>
            {!readOnly && (
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800">
                  <Edit size={16} />
                </button>
                <button className="text-red-600 hover:text-red-800">
                  <Trash size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 text-sm">
            <div>
              Между категориями: {
                graph.nodes.find(n => n.id === selectedEdge.source)?.name
              } и {
                graph.nodes.find(n => n.id === selectedEdge.target)?.name
              }
            </div>
            
            {/* Quantitative characteristics */}
            <div className="my-3 border-b pb-2">
              <div className="font-medium mb-1">Количественные характеристики:</div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600">Сила связи:</label>
                  <div className="flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={selectedEdge.strength} 
                      onChange={(e) => {
                        // Update strength logic
                      }}
                      disabled={readOnly}
                      className="w-28 mr-2" 
                    />
                    <span>{selectedEdge.strength.toFixed(2)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600">Очевидность/спорность:</label>
                  <div className="flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={selectedEdge.certainty} 
                      onChange={(e) => {
                        // Update certainty logic
                      }}
                      disabled={readOnly}
                      className="w-28 mr-2" 
                    />
                    <span>{selectedEdge.certainty.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>Направленность: {
              selectedEdge.direction === 'bidirectional' ? 'Двунаправленная' : 
              selectedEdge.direction === 'directed' ? 'Однонаправленная' : 
              'Не указана'
            }</div>
            <div className="mt-2">
              <button className="text-blue-600 hover:underline text-sm">
                Сгенерировать философское обоснование
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Validation results panel */}
      {validationResult && (
        <div className="border-t p-4 bg-white">
          <h3 className="font-medium">Результаты валидации графа</h3>
          <div className="mt-2 text-sm">
            {validationResult.contradictions.length > 0 && (
              <div className="mb-2">
                <div className="font-medium">Обнаруженные противоречия:</div>
                <ul className="list-disc pl-5">
                  {validationResult.contradictions.map((item, index) => (
                    <li key={`contradiction-${index}`}>{item.description}</li>
                  ))}
                </ul>
              </div>
            )}
            {validationResult.recommendations.length > 0 && (
              <div>
                <div className="font-medium">Рекомендации:</div>
                <ul className="list-disc pl-5">
                  {validationResult.recommendations.map((item, index) => (
                    <li key={`recommendation-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConceptGraphVisualization;
```

## 4. Реализация интеграции с базами данных

### Neo4j Configuration (для Graph Service)

```javascript
// config/db.js
const neo4j = require('neo4j-driver');

let driver = null;

/**
 * Initialize the Neo4j driver
 */
function initializeNeo4j() {
  const url = process.env.NEO4J_URL || 'bolt://neo4j:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';
  
  try {
    driver = neo4j.driver(url, neo4j.auth.basic(user, password), {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 30 * 1000, // 30 seconds
      disableLosslessIntegers: true
    });
    
    console.log('Neo4j driver initialized');
    
    // Test the connection
    testConnection();
  } catch (error) {
    console.error('Error initializing Neo4j driver:', error.message);
    throw error;
  }
}

/**
 * Test the Neo4j connection
 */
async function testConnection() {
  const session = driver.session();
  try {
    const result = await session.run('RETURN 1 AS num');
    console.log('Neo4j connection test successful:', result.records[0].get('num').toNumber());
  } catch (error) {
    console.error('Neo4j connection test failed:', error.message);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Get the Neo4j driver
 * @returns {neo4j.Driver} The Neo4j driver
 */
function getDriver() {
  if (!driver) {
    initializeNeo4j();
  }
  return driver;
}

/**
 * Close the Neo4j driver
 */
async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('Neo4j driver closed');
  }
}

module.exports = {
  initializeNeo4j,
  getDriver,
  closeDriver
};
```

### MongoDB Configuration (для Thesis Service)

```javascript
// config/mongodb.js
const { MongoClient } = require('mongodb');

let client = null;
let db = null;

/**
 * Initialize MongoDB connection
 */
async function initializeMongoDB() {
  const url = process.env.MONGODB_URL || 'mongodb://philos:password@mongodb:27017/philos_concepts';
  const dbName = process.env.MONGODB_DB || 'philos_concepts';
  
  try {
    client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    await client.connect();
    db = client.db(dbName);
    
    console.log('MongoDB connection initialized');
    
    // Test the connection
    await testConnection();
  } catch (error) {
    console.error('Error initializing MongoDB connection:', error.message);
    throw error;
  }
}

/**
 * Test the MongoDB connection
 */
async function testConnection() {
  try {
    const result = await db.command({ ping: 1 });
    console.log('MongoDB connection test successful:', result);
  } catch (error) {
    console.error('MongoDB connection test failed:', error.message);
    throw error;
  }
}

/**
 * Get the MongoDB database
 * @returns {mongodb.Db} The MongoDB database
 */
function getDB() {
  if (!db) {
    throw new Error('MongoDB not initialized. Call initializeMongoDB first.');
  }
  return db;
}

/**
 * Get a MongoDB collection
 * @param {string} collectionName - The name of the collection
 * @returns {mongodb.Collection} The MongoDB collection
 */
function getCollection(collectionName) {
  if (!db) {
    throw new Error('MongoDB not initialized. Call initializeMongoDB first.');
  }
  return db.collection(collectionName);
}

/**
 * Close the MongoDB connection
 */
async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

module.exports = {
  initializeMongoDB,
  getDB,
  getCollection,
  closeConnection
};
```

### Sequelize Configuration (для PostgreSQL)

```javascript
// config/postgres.js
const { Sequelize } = require('sequelize');

let sequelize = null;

/**
 * Initialize Sequelize connection to PostgreSQL
 */
function initializeSequelize() {
  const dbUrl = process.env.POSTGRES_URL || 'postgres://philos:password@postgres:5432/philos_concepts';
  
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
  
  console.log('Sequelize initialized');
  
  // Test the connection
  testConnection();
}

/**
 * Test the Sequelize connection
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection test successful');
  } catch (error) {
    console.error('PostgreSQL connection test failed:', error.message);
    throw error;
  }
}

/**
 * Get the Sequelize instance
 * @returns {Sequelize} The Sequelize instance
 */
function getSequelize() {
  if (!sequelize) {
    initializeSequelize();
  }
  return sequelize;
}

/**
 * Close the Sequelize connection
 */
async function closeSequelize() {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
    console.log('Sequelize connection closed');
  }
}

module.exports = {
  initializeSequelize,
  getSequelize,
  closeSequelize
};
```

## Заключение

Представленные практические примеры демонстрируют конкретную реализацию ключевых компонентов системы и позволяют лучше понять, как теоретические концепции архитектуры воплощаются в реальном коде. Обратите внимание на следующие аспекты:

1. **Модульность и разделение ответственности** - каждый микросервис имеет четкую ответственность и структуру, что облегчает понимание, тестирование и поддержку кода.

2. **Работа с различными базами данных** - каждый микросервис использует оптимальную для своих задач базу данных (Neo4j для графов, MongoDB для тезисов, PostgreSQL для метаданных).

3. **Интеграция с Claude** - централизованный сервис для взаимодействия с Claude API, поддерживающий как синхронные, так и асинхронные запросы.

4. **Кэширование и оптимизация** - использование Redis для кэширования часто запрашиваемых данных и оптимизации производительности.

5. **Асинхронная обработка** - использование RabbitMQ для обработки длительных операций и снижения нагрузки на систему.

6. **Структурированные форматы запросов и ответов** - использование форматтера для создания стандартизированных запросов к Claude и ожидание ответов в определенном формате.

7. **Реактивный пользовательский интерфейс** - интерактивная визуализация графа концепции с возможностью выбора элементов, изменения масштаба и отображения деталей.

Эти примеры могут служить отправной точкой для разработки системы и могут быть адаптированы и расширены в соответствии с конкретными требованиями и особенностями проекта.