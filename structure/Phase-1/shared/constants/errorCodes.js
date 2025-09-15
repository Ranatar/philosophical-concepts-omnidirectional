/**
 * Error codes for the Philosophy Service
 * Structured by category for better organization
 */

const ERROR_CODES = {
  // Authentication & Authorization (1xxx)
  AUTH_FAILED: {
    code: 'AUTH_1001',
    message: 'Authentication failed',
    httpStatus: 401
  },
  INVALID_TOKEN: {
    code: 'AUTH_1002',
    message: 'Invalid or expired token',
    httpStatus: 401
  },
  UNAUTHORIZED: {
    code: 'AUTH_1003',
    message: 'Unauthorized access',
    httpStatus: 403
  },
  INSUFFICIENT_PERMISSIONS: {
    code: 'AUTH_1004',
    message: 'Insufficient permissions',
    httpStatus: 403
  },
  API_KEY_INVALID: {
    code: 'AUTH_1005',
    message: 'Invalid API key',
    httpStatus: 401
  },
  API_KEY_EXPIRED: {
    code: 'AUTH_1006',
    message: 'API key has expired',
    httpStatus: 401
  },

  // User Management (2xxx)
  USER_NOT_FOUND: {
    code: 'USER_2001',
    message: 'User not found',
    httpStatus: 404
  },
  USER_ALREADY_EXISTS: {
    code: 'USER_2002',
    message: 'User already exists',
    httpStatus: 409
  },
  INVALID_CREDENTIALS: {
    code: 'USER_2003',
    message: 'Invalid username or password',
    httpStatus: 401
  },
  ACCOUNT_LOCKED: {
    code: 'USER_2004',
    message: 'Account is locked',
    httpStatus: 403
  },
  EMAIL_NOT_VERIFIED: {
    code: 'USER_2005',
    message: 'Email not verified',
    httpStatus: 403
  },

  // Concept Management (3xxx)
  CONCEPT_NOT_FOUND: {
    code: 'CONCEPT_3001',
    message: 'Concept not found',
    httpStatus: 404
  },
  CONCEPT_ALREADY_EXISTS: {
    code: 'CONCEPT_3002',
    message: 'Concept with this name already exists',
    httpStatus: 409
  },
  INVALID_CONCEPT_DATA: {
    code: 'CONCEPT_3003',
    message: 'Invalid concept data',
    httpStatus: 400
  },
  CONCEPT_IN_USE: {
    code: 'CONCEPT_3004',
    message: 'Concept cannot be deleted as it is in use',
    httpStatus: 409
  },

  // Graph Management (4xxx)
  GRAPH_NOT_FOUND: {
    code: 'GRAPH_4001',
    message: 'Graph not found',
    httpStatus: 404
  },
  CATEGORY_NOT_FOUND: {
    code: 'GRAPH_4002',
    message: 'Category not found',
    httpStatus: 404
  },
  RELATIONSHIP_NOT_FOUND: {
    code: 'GRAPH_4003',
    message: 'Relationship not found',
    httpStatus: 404
  },
  INVALID_GRAPH_STRUCTURE: {
    code: 'GRAPH_4004',
    message: 'Invalid graph structure',
    httpStatus: 400
  },
  CYCLIC_DEPENDENCY: {
    code: 'GRAPH_4005',
    message: 'Cyclic dependency detected',
    httpStatus: 400
  },
  INVALID_RELATIONSHIP_TYPE: {
    code: 'GRAPH_4006',
    message: 'Invalid relationship type',
    httpStatus: 400
  },
  NEW_ELEMENTS_REQUIRE_APPROVAL: {
    code: 'GRAPH_4007',
    message: 'New elements require approval before use',
    httpStatus: 400
  },

  // Thesis Management (5xxx)
  THESIS_NOT_FOUND: {
    code: 'THESIS_5001',
    message: 'Thesis not found',
    httpStatus: 404
  },
  INVALID_THESIS_TYPE: {
    code: 'THESIS_5002',
    message: 'Invalid thesis type',
    httpStatus: 400
  },
  THESIS_GENERATION_FAILED: {
    code: 'THESIS_5003',
    message: 'Failed to generate thesis',
    httpStatus: 500
  },
  THESIS_ALREADY_EXISTS: {
    code: 'THESIS_5004',
    message: 'Identical thesis already exists',
    httpStatus: 409
  },

  // Synthesis (6xxx)
  SYNTHESIS_FAILED: {
    code: 'SYNTH_6001',
    message: 'Synthesis operation failed',
    httpStatus: 500
  },
  INCOMPATIBLE_CONCEPTS: {
    code: 'SYNTH_6002',
    message: 'Concepts are incompatible for synthesis',
    httpStatus: 400
  },
  INSUFFICIENT_CONCEPTS: {
    code: 'SYNTH_6003',
    message: 'At least two concepts required for synthesis',
    httpStatus: 400
  },
  SYNTHESIS_NOT_FOUND: {
    code: 'SYNTH_6004',
    message: 'Synthesis record not found',
    httpStatus: 404
  },

  // Claude Service (7xxx)
  CLAUDE_API_ERROR: {
    code: 'CLAUDE_7001',
    message: 'Claude API error',
    httpStatus: 502
  },
  CLAUDE_RATE_LIMIT: {
    code: 'CLAUDE_7002',
    message: 'Claude API rate limit exceeded',
    httpStatus: 429
  },
  CLAUDE_TIMEOUT: {
    code: 'CLAUDE_7003',
    message: 'Claude API request timeout',
    httpStatus: 504
  },
  INVALID_CLAUDE_REQUEST: {
    code: 'CLAUDE_7004',
    message: 'Invalid request to Claude API',
    httpStatus: 400
  },
  CLAUDE_API_KEY_MISSING: {
    code: 'CLAUDE_7005',
    message: 'Claude API key not configured',
    httpStatus: 500
  },

  // Validation Errors (8xxx)
  VALIDATION_ERROR: {
    code: 'VAL_8001',
    message: 'Validation error',
    httpStatus: 400
  },
  INVALID_INPUT: {
    code: 'VAL_8002',
    message: 'Invalid input data',
    httpStatus: 400
  },
  MISSING_REQUIRED_FIELD: {
    code: 'VAL_8003',
    message: 'Missing required field',
    httpStatus: 400
  },
  INVALID_FORMAT: {
    code: 'VAL_8004',
    message: 'Invalid data format',
    httpStatus: 400
  },
  VALUE_OUT_OF_RANGE: {
    code: 'VAL_8005',
    message: 'Value out of acceptable range',
    httpStatus: 400
  },

  // Database Errors (9xxx)
  DATABASE_ERROR: {
    code: 'DB_9001',
    message: 'Database operation failed',
    httpStatus: 500
  },
  CONNECTION_ERROR: {
    code: 'DB_9002',
    message: 'Database connection error',
    httpStatus: 503
  },
  TRANSACTION_FAILED: {
    code: 'DB_9003',
    message: 'Database transaction failed',
    httpStatus: 500
  },
  DUPLICATE_KEY: {
    code: 'DB_9004',
    message: 'Duplicate key error',
    httpStatus: 409
  },

  // General Errors (10xxx)
  INTERNAL_SERVER_ERROR: {
    code: 'GEN_10001',
    message: 'Internal server error',
    httpStatus: 500
  },
  NOT_FOUND: {
    code: 'GEN_10002',
    message: 'Resource not found',
    httpStatus: 404
  },
  BAD_REQUEST: {
    code: 'GEN_10003',
    message: 'Bad request',
    httpStatus: 400
  },
  SERVICE_UNAVAILABLE: {
    code: 'GEN_10004',
    message: 'Service temporarily unavailable',
    httpStatus: 503
  },
  NOT_IMPLEMENTED: {
    code: 'GEN_10005',
    message: 'Feature not implemented',
    httpStatus: 501
  },

  // Queue/Messaging Errors (11xxx)
  QUEUE_ERROR: {
    code: 'QUEUE_11001',
    message: 'Message queue error',
    httpStatus: 500
  },
  TASK_NOT_FOUND: {
    code: 'QUEUE_11002',
    message: 'Task not found',
    httpStatus: 404
  },
  TASK_FAILED: {
    code: 'QUEUE_11003',
    message: 'Task execution failed',
    httpStatus: 500
  },
  TASK_TIMEOUT: {
    code: 'QUEUE_11004',
    message: 'Task execution timeout',
    httpStatus: 504
  },

  // Analysis Services Errors (12xxx)
  NAME_ANALYSIS_FAILED: {
    code: 'ANALYSIS_12001',
    message: 'Name analysis failed',
    httpStatus: 500
  },
  ORIGIN_DETECTION_FAILED: {
    code: 'ANALYSIS_12002',
    message: 'Origin detection failed',
    httpStatus: 500
  },
  HISTORICAL_CONTEXT_FAILED: {
    code: 'ANALYSIS_12003',
    message: 'Historical context analysis failed',
    httpStatus: 500
  },
  PRACTICAL_APPLICATION_FAILED: {
    code: 'ANALYSIS_12004',
    message: 'Practical application analysis failed',
    httpStatus: 500
  },
  DIALOGUE_GENERATION_FAILED: {
    code: 'ANALYSIS_12005',
    message: 'Dialogue generation failed',
    httpStatus: 500
  },
  EVOLUTION_ANALYSIS_FAILED: {
    code: 'ANALYSIS_12006',
    message: 'Evolution analysis failed',
    httpStatus: 500
  }
};

// Helper function to get error by code
function getErrorByCode(code) {
  for (const category of Object.values(ERROR_CODES)) {
    if (category.code === code) {
      return category;
    }
  }
  return null;
}

// Helper function to create error response
function createErrorResponse(errorType, details = null) {
  const error = ERROR_CODES[errorType];
  if (!error) {
    throw new Error(`Unknown error type: ${errorType}`);
  }

  const response = {
    error: {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString()
    }
  };

  if (details) {
    response.error.details = details;
  }

  return response;
}

module.exports = {
  ERROR_CODES,
  getErrorByCode,
  createErrorResponse
};