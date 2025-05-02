# Philosophical Concepts Service Architecture - Component Interactions

## Architecture Overview

The Philosophical Concepts Service employs a modern microservices architecture designed to support the creation, analysis, and evolution of philosophical concepts. Below is a detailed explanation of how the components interact with each other.

## Core Architectural Layers

### 1. Frontend Layer

The frontend is built using React with TypeScript and is organized into:

- **Components** - Reusable UI elements organized by domain (concept graph, theses, Claude integration, etc.)
- **Pages** - User-facing screens that combine components
- **Hooks** - Custom React hooks that abstract API interactions (`useGraph`, `useThesis`, etc.)
- **Services** - API client abstractions that make HTTP requests to the backend
- **Context** - React context providers for global state management

**Key Interaction Flow:**
1. UI Components use custom hooks like `useGraph.ts` or `useThesis.ts`
2. Hooks use services like `graphService.ts` or `thesisService.ts`
3. Services make HTTP requests to the API Gateway

### 2. API Gateway Layer

The API Gateway serves as the entry point for all client requests and handles:

- Request routing to appropriate microservices
- Authentication and authorization
- Error handling and logging
- Rate limiting

**Key Interaction Flow:**
1. Receive requests from frontend services
2. Apply middleware (`auth.js`, `errorHandler.js`, etc.)
3. Route to appropriate microservice endpoints
4. Return aggregated responses to the client

### 3. Microservice Layer

The system consists of multiple domain-specific microservices, each with:

- **Controllers** - Handle HTTP requests and responses
- **Services** - Contain business logic
- **Repositories** - Manage data access
- **Models** - Define data structures
- **Routes** - Define API endpoints
- **Clients** - Allow communication with other services

#### Core Services

1. **User Service**
   - Manages user authentication, profiles, and activity tracking
   - Primary database: PostgreSQL
   - Interactions: Provides authentication for all other services

2. **Concept Service**
   - Manages philosophical concepts, traditions, and philosophers
   - Primary database: PostgreSQL
   - Dependencies: Graph Service, Thesis Service
   - Interactions:
     - Uses `graphServiceClient.js` to interact with Graph Service
     - Uses `thesisServiceClient.js` to interact with Thesis Service

3. **Graph Service**
   - Manages concept graphs, categories, relationships, and visualization
   - Primary database: Neo4j (graph database)
   - Dependencies: Claude Service
   - Interactions:
     - Uses `claudeServiceClient.js` to get AI assistance for graph enrichment
     - Provides graph data to Concept Service
     - Supplies graph structures to Thesis Service for thesis generation

4. **Thesis Service**
   - Manages philosophical theses, generation, and analysis
   - Primary database: MongoDB
   - Dependencies: Graph Service, Claude Service
   - Interactions:
     - Uses `graphServiceClient.js` to retrieve graph data
     - Uses `claudeServiceClient.js` for thesis generation and analysis

5. **Synthesis Service**
   - Manages the synthesis of multiple philosophical concepts
   - Dependencies: Graph Service, Thesis Service, Claude Service
   - Interactions:
     - Uses `graphServiceClient.js` to retrieve graph data
     - Uses `thesisServiceClient.js` to get thesis information
     - Uses `claudeServiceClient.js` for synthesis operations

6. **Claude Service**
   - Core AI integration service that provides natural language capabilities
   - Primary storage: Redis (for caching responses)
   - Dependencies: Claude AI API
   - Interactions:
     - Uses `claudeApiClient.js` to interact with external Claude API
     - Provides specialized formatters for different types of requests:
       - `graphFormatters.js` for Graph Service requests
       - `thesisFormatters.js` for Thesis Service requests
       - Additional formatters for other specialized services

#### Specialized Analysis Services

Each specialized service follows a similar pattern and depends on the core services:

1. **Name Analysis Service**
   - Analyzes and generates concept names
   - Dependencies: Concept Service, Graph Service, Thesis Service, Claude Service

2. **Origin Detection Service**
   - Determines philosophical origins of concepts
   - Dependencies: Concept Service, Graph Service, Thesis Service, Claude Service

3. **Historical Context Service**
   - Provides historical contextualization of concepts
   - Dependencies: Concept Service, Graph Service, Thesis Service, Claude Service

4. **Practical Application Service**
   - Identifies practical domains for philosophical concepts
   - Dependencies: Concept Service, Graph Service, Thesis Service, Claude Service

5. **Dialogue Service**
   - Generates and analyzes philosophical dialogues
   - Dependencies: Concept Service, Thesis Service, Claude Service

6. **Evolution Service**
   - Manages the evolution of philosophical concepts over time
   - Dependencies: Concept Service, Graph Service, Thesis Service, Claude Service

### 4. Data Storage Layer

The system uses multiple database technologies optimized for different data requirements:

1. **PostgreSQL**
   - Stores structured data: users, concepts, philosophers, traditions
   - Used by: User Service, Concept Service

2. **Neo4j**
   - Stores graph data: concept graphs, categories, relationships
   - Used by: Graph Service

3. **MongoDB**
   - Stores document data: theses, descriptions, analyses
   - Used by: Thesis Service

4. **Redis**
   - Provides caching and message queuing
   - Used by: Claude Service for caching responses and managing task queues

### 5. Shared Libraries Layer

Shared libraries provide common functionality across all services:

- Error handling
- Validation
- Logging
- Metrics
- Authentication utilities
- Database utilities
- Messaging utilities
- HTTP utilities
- Formatting utilities

## Key Data Flows

### 1. Concept Creation Flow

1. User interacts with concept editor components in frontend
2. Frontend calls API Gateway through concept service
3. API Gateway routes to Concept Service
4. Concept Service stores basic concept data in PostgreSQL
5. Concept Service requests Graph Service to create graph representation
6. Graph Service creates nodes and relationships in Neo4j
7. Concept Service requests Thesis Service to generate theses
8. Thesis Service uses Claude Service to generate theses
9. Thesis Service stores theses in MongoDB
10. Results flow back through the chain to frontend

### 2. Concept Analysis Flow

1. User requests concept analysis in frontend
2. Request flows through API Gateway to appropriate specialized service
3. Specialized service retrieves concept data from Concept Service
4. Specialized service retrieves graph data from Graph Service
5. Specialized service retrieves theses from Thesis Service
6. Specialized service uses Claude Service for analysis
7. Results are stored and returned to frontend

### 3. Concept Synthesis Flow

1. User selects multiple concepts for synthesis in frontend
2. Request flows through API Gateway to Synthesis Service
3. Synthesis Service retrieves concept data from Concept Service
4. Synthesis Service retrieves graph data from Graph Service
5. Synthesis Service checks compatibility through internal service
6. Synthesis Service uses Claude Service for synthesis operation
7. Synthesis Service creates new concept via Concept Service
8. Results flow back to frontend

## Asynchronous Processing

For long-running operations, the system uses asynchronous processing:

1. Request is received by service
2. Task is created and queued in Redis via messaging
3. Response with task ID is returned to client
4. Client polls for task status using task ID
5. When task completes, results are stored and available for retrieval

## Integration with Claude AI

The Claude Service is central to the system's AI capabilities:

1. Services format requests using specialized formatters in Claude Service
2. Claude Service queues requests to external Claude API
3. Responses are processed and transformed for requesting service
4. Claude Service caches common responses in Redis
5. Services use processed responses for their specific domain needs

## Cross-Cutting Concerns

Several components handle cross-cutting concerns:

1. **Authentication** - User Service provides authentication tokens that are verified by API Gateway middleware
2. **Logging** - Shared logging utilities provide consistent logging across all services
3. **Error Handling** - Standardized error handling via shared error libraries and API Gateway middleware
4. **Monitoring** - Prometheus metrics and Grafana dashboards monitor system health
