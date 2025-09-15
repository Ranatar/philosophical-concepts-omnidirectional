/**
 * Status constants for the Philosophy Service
 * Used across all microservices for consistency
 */

const STATUSES = {
  // General entity statuses
  ENTITY_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DELETED: 'deleted',
    ARCHIVED: 'archived',
    DRAFT: 'draft',
    PUBLISHED: 'published'
  },

  // User statuses
  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    DELETED: 'deleted',
    PENDING_VERIFICATION: 'pending_verification',
    VERIFIED: 'verified'
  },

  // Concept statuses
  CONCEPT_STATUS: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    UNDER_REVIEW: 'under_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ARCHIVED: 'archived'
  },

  // Graph statuses
  GRAPH_STATUS: {
    INCOMPLETE: 'incomplete',
    COMPLETE: 'complete',
    VALIDATED: 'validated',
    NEEDS_VALIDATION: 'needs_validation',
    HAS_ERRORS: 'has_errors'
  },

  // Thesis statuses
  THESIS_STATUS: {
    DRAFT: 'draft',
    GENERATED: 'generated',
    REVIEWED: 'reviewed',
    APPROVED: 'approved',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
  },

  // Synthesis statuses
  SYNTHESIS_STATUS: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },

  // Task statuses (for async operations)
  TASK_STATUS: {
    QUEUED: 'queued',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    TIMEOUT: 'timeout',
    RETRYING: 'retrying'
  },

  // Claude interaction statuses
  CLAUDE_STATUS: {
    PENDING: 'pending',
    SENT: 'sent',
    RECEIVED: 'received',
    PROCESSED: 'processed',
    ERROR: 'error',
    RATE_LIMITED: 'rate_limited',
    TIMEOUT: 'timeout'
  },

  // Validation statuses
  VALIDATION_STATUS: {
    PENDING: 'pending',
    VALID: 'valid',
    INVALID: 'invalid',
    WARNINGS: 'warnings',
    NEEDS_REVIEW: 'needs_review'
  },

  // Element approval statuses
  ELEMENT_APPROVAL_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    AUTO_APPROVED: 'auto_approved'
  },

  // Analysis statuses
  ANALYSIS_STATUS: {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PARTIAL: 'partial'
  },

  // API key statuses
  API_KEY_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    EXPIRED: 'expired',
    REVOKED: 'revoked',
    INVALID: 'invalid'
  },

  // Sharing statuses
  SHARING_STATUS: {
    PRIVATE: 'private',
    SHARED: 'shared',
    PUBLIC: 'public',
    RESTRICTED: 'restricted'
  },

  // Historical context statuses
  HISTORICAL_CONTEXT_STATUS: {
    DRAFT: 'draft',
    GENERATED: 'generated',
    REVIEWED: 'reviewed',
    VERIFIED: 'verified',
    DISPUTED: 'disputed'
  },

  // Dialogue statuses
  DIALOGUE_STATUS: {
    INITIATED: 'initiated',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    PAUSED: 'paused',
    ABANDONED: 'abandoned'
  },

  // Evolution statuses
  EVOLUTION_STATUS: {
    PROPOSED: 'proposed',
    UNDER_REVIEW: 'under_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    IMPLEMENTED: 'implemented',
    SUPERSEDED: 'superseded'
  }
};

// Helper functions

/**
 * Check if a status is valid for a given status type
 * @param {string} statusType - The type of status (e.g., 'USER_STATUS')
 * @param {string} status - The status to check
 * @returns {boolean} - Whether the status is valid
 */
function isValidStatus(statusType, status) {
  if (!STATUSES[statusType]) {
    return false;
  }
  return Object.values(STATUSES[statusType]).includes(status);
}

/**
 * Get all valid statuses for a given status type
 * @param {string} statusType - The type of status
 * @returns {string[]} - Array of valid statuses
 */
function getValidStatuses(statusType) {
  if (!STATUSES[statusType]) {
    return [];
  }
  return Object.values(STATUSES[statusType]);
}

/**
 * Check if a transition from one status to another is valid
 * @param {string} statusType - The type of status
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {boolean} - Whether the transition is valid
 */
function isValidTransition(statusType, fromStatus, toStatus) {
  // Define valid transitions for each status type
  const transitions = {
    USER_STATUS: {
      PENDING_VERIFICATION: ['VERIFIED', 'SUSPENDED', 'DELETED'],
      VERIFIED: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'],
      ACTIVE: ['INACTIVE', 'SUSPENDED', 'DELETED'],
      INACTIVE: ['ACTIVE', 'SUSPENDED', 'DELETED'],
      SUSPENDED: ['ACTIVE', 'DELETED'],
      DELETED: [] // Cannot transition from deleted
    },
    CONCEPT_STATUS: {
      DRAFT: ['PUBLISHED', 'UNDER_REVIEW', 'ARCHIVED'],
      PUBLISHED: ['UNDER_REVIEW', 'ARCHIVED'],
      UNDER_REVIEW: ['APPROVED', 'REJECTED', 'DRAFT'],
      APPROVED: ['PUBLISHED', 'ARCHIVED'],
      REJECTED: ['DRAFT', 'ARCHIVED'],
      ARCHIVED: ['DRAFT'] // Can be restored to draft
    },
    TASK_STATUS: {
      QUEUED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['COMPLETED', 'FAILED', 'TIMEOUT', 'RETRYING'],
      RETRYING: ['PROCESSING', 'FAILED', 'CANCELLED'],
      COMPLETED: [], // Terminal state
      FAILED: ['RETRYING'], // Can retry failed tasks
      CANCELLED: [], // Terminal state
      TIMEOUT: ['RETRYING'] // Can retry timed out tasks
    }
  };

  if (!transitions[statusType] || !transitions[statusType][fromStatus]) {
    return false;
  }

  return transitions[statusType][fromStatus].includes(toStatus);
}

/**
 * Get terminal statuses for a given status type
 * @param {string} statusType - The type of status
 * @returns {string[]} - Array of terminal statuses
 */
function getTerminalStatuses(statusType) {
  const terminal = {
    USER_STATUS: ['DELETED'],
    CONCEPT_STATUS: [],
    TASK_STATUS: ['COMPLETED', 'CANCELLED'],
    SYNTHESIS_STATUS: ['COMPLETED', 'FAILED', 'CANCELLED'],
    CLAUDE_STATUS: ['PROCESSED', 'ERROR', 'TIMEOUT']
  };

  return terminal[statusType] || [];
}

module.exports = {
  STATUSES,
  isValidStatus,
  getValidStatuses,
  isValidTransition,
  getTerminalStatuses
};