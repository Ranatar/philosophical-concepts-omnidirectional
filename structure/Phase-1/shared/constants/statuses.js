/**
 * Standardized status constants for the philosophy service application
 * These statuses are used across all microservices to ensure consistent
 * state management and reporting
 */

module.exports = {
  // General statuses
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  DELETED: 'deleted',
  ARCHIVED: 'archived',
  
  // User statuses
  USER_ACTIVE: 'active',
  USER_INACTIVE: 'inactive',
  USER_PENDING_VERIFICATION: 'pending_verification',
  USER_LOCKED: 'locked',
  USER_DELETED: 'deleted',
  
  // Concept statuses
  CONCEPT_DRAFT: 'draft',
  CONCEPT_PUBLISHED: 'published',
  CONCEPT_ARCHIVED: 'archived',
  CONCEPT_DELETED: 'deleted',
  
  // Graph processing statuses
  GRAPH_DRAFT: 'draft',
  GRAPH_VALIDATED: 'validated',
  GRAPH_ENRICHED: 'enriched',
  GRAPH_PUBLISHED: 'published',
  
  // Thesis statuses
  THESIS_DRAFT: 'draft',
  THESIS_GENERATED: 'generated',
  THESIS_EDITED: 'edited',
  THESIS_ELABORATED: 'elaborated',
  THESIS_PUBLISHED: 'published',
  
  // Claude task statuses
  TASK_QUEUED: 'queued',
  TASK_PROCESSING: 'processing',
  TASK_COMPLETED: 'completed',
  TASK_FAILED: 'failed',
  TASK_CANCELED: 'canceled',
  
  // Synthesis statuses
  SYNTHESIS_DRAFT: 'draft',
  SYNTHESIS_ANALYZED: 'analyzed',
  SYNTHESIS_COMPLETED: 'completed',
  SYNTHESIS_REJECTED: 'rejected',
  
  // Analysis statuses
  ANALYSIS_PENDING: 'pending',
  ANALYSIS_IN_PROGRESS: 'in_progress',
  ANALYSIS_COMPLETED: 'completed',
  ANALYSIS_FAILED: 'failed',
  
  // Dialogue statuses
  DIALOGUE_DRAFT: 'draft',
  DIALOGUE_GENERATED: 'generated',
  DIALOGUE_EDITED: 'edited',
  DIALOGUE_PUBLISHED: 'published',
  
  // Evolution statuses
  EVOLUTION_ANALYZED: 'analyzed',
  EVOLUTION_PROPOSED: 'proposed',
  EVOLUTION_APPLIED: 'applied',
  EVOLUTION_REJECTED: 'rejected',
  
  // Operational statuses
  OPERATION_PENDING: 'pending',
  OPERATION_IN_PROGRESS: 'in_progress',
  OPERATION_COMPLETED: 'completed',
  OPERATION_FAILED: 'failed',
  OPERATION_CANCELED: 'canceled',
  
  // Transformation statuses
  TRANSFORMATION_REQUESTED: 'requested',
  TRANSFORMATION_PROCESSING: 'processing',
  TRANSFORMATION_COMPLETED: 'completed',
  TRANSFORMATION_FAILED: 'failed'
};
