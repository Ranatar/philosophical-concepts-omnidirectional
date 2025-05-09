/**
 * Standardized error codes for the philosophy service application
 * These codes are used across all microservices to ensure consistent
 * error handling and reporting
 */

module.exports = {
  // General error codes (1000-1999)
  UNKNOWN_ERROR: 1000,
  VALIDATION_ERROR: 1001,
  NOT_FOUND: 1002,
  UNAUTHORIZED: 1003,
  FORBIDDEN: 1004,
  BAD_REQUEST: 1005,
  CONFLICT: 1006,
  INTERNAL_SERVER_ERROR: 1007,
  SERVICE_UNAVAILABLE: 1008,
  TIMEOUT: 1009,
  
  // User service error codes (2000-2999)
  USER_NOT_FOUND: 2000,
  USER_ALREADY_EXISTS: 2001,
  INVALID_CREDENTIALS: 2002,
  ACCOUNT_LOCKED: 2003,
  SESSION_EXPIRED: 2004,
  TOKEN_INVALID: 2005,
  PASSWORD_RESET_REQUIRED: 2006,
  
  // Concept service error codes (3000-3999)
  CONCEPT_NOT_FOUND: 3000,
  CONCEPT_ALREADY_EXISTS: 3001,
  PHILOSOPHER_NOT_FOUND: 3002,
  TRADITION_NOT_FOUND: 3003,
  
  // Graph service error codes (4000-4999)
  GRAPH_NOT_FOUND: 4000,
  CATEGORY_NOT_FOUND: 4001,
  RELATIONSHIP_NOT_FOUND: 4002,
  CIRCULAR_REFERENCE: 4003,
  INVALID_GRAPH_STRUCTURE: 4004,
  
  // Thesis service error codes (5000-5999)
  THESIS_NOT_FOUND: 5000,
  DESCRIPTION_NOT_FOUND: 5001,
  INVALID_THESIS_TYPE: 5002,
  
  // Claude service error codes (6000-6999)
  CLAUDE_API_ERROR: 6000,
  PROMPT_CONSTRUCTION_ERROR: 6001,
  RESPONSE_PROCESSING_ERROR: 6002,
  TASK_NOT_FOUND: 6003,
  TASK_ALREADY_COMPLETED: 6004,
  TASK_FAILED: 6005,
  
  // Synthesis service error codes (7000-7999)
  SYNTHESIS_NOT_FOUND: 7000,
  INCOMPATIBLE_CONCEPTS: 7001,
  SYNTHESIS_ALREADY_EXISTS: 7002,
  
  // Name analysis service error codes (8000-8999)
  NAME_ANALYSIS_NOT_FOUND: 8000,
  
  // Origin detection service error codes (9000-9999)
  ORIGIN_NOT_FOUND: 9000,
  
  // Historical context service error codes (10000-10999)
  HISTORICAL_CONTEXT_NOT_FOUND: 10000,
  
  // Practical application service error codes (11000-11999)
  PRACTICAL_APPLICATION_NOT_FOUND: 11000,
  
  // Dialogue service error codes (12000-12999)
  DIALOGUE_NOT_FOUND: 12000,
  
  // Evolution service error codes (13000-13999)
  EVOLUTION_NOT_FOUND: 13000,
  
  // Infrastructure error codes (14000-14999)
  DATABASE_ERROR: 14000,
  CACHE_ERROR: 14001,
  MESSAGE_QUEUE_ERROR: 14002,
  EVENT_BUS_ERROR: 14003,
  NETWORK_ERROR: 14004,
  CONFIGURATION_ERROR: 14005
};
