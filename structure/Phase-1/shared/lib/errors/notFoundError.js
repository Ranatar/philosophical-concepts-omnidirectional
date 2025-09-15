/**
 * NotFoundError class with extended functionality
 * Provides comprehensive handling for resource not found errors
 */

const AppError = require('./AppError');
const { ERROR_CODES } = require('../../constants/errorCodes');

class NotFoundError extends AppError {
  /**
   * Create a not found error
   * @param {string} resource - Resource type
   * @param {string|Object} identifier - Resource identifier (ID, name, or criteria)
   * @param {string} message - Custom error message (optional)
   */
  constructor(resource = 'Resource', identifier = null, message = null) {
    // Build details object
    const details = { resource };
    
    // Handle different identifier types
    if (identifier !== null) {
      if (typeof identifier === 'object') {
        details.criteria = identifier;
      } else {
        details.id = identifier;
      }
    }
    
    // Build default message if not provided
    if (!message) {
      if (typeof identifier === 'object') {
        const criteriaStr = Object.entries(identifier)
          .map(([key, value]) => `${key}=${value}`)
          .join(', ');
        message = `${resource} not found with criteria: ${criteriaStr}`;
      } else if (identifier) {
        message = `${resource} with id '${identifier}' not found`;
      } else {
        message = `${resource} not found`;
      }
    }
    
    // Determine specific error code based on resource type
    const errorCode = NotFoundError.getErrorCodeForResource(resource);
    
    super(errorCode, message, details);
  }

  /**
   * Get specific error code based on resource type
   * @param {string} resource - Resource type
   * @returns {Object} Error code object
   */
  static getErrorCodeForResource(resource) {
    const resourceLower = resource.toLowerCase();
    
    // Map resource types to specific error codes
    const resourceErrorMap = {
      'user': ERROR_CODES.USER_NOT_FOUND,
      'concept': ERROR_CODES.CONCEPT_NOT_FOUND,
      'graph': ERROR_CODES.GRAPH_NOT_FOUND,
      'category': ERROR_CODES.CATEGORY_NOT_FOUND,
      'relationship': ERROR_CODES.RELATIONSHIP_NOT_FOUND,
      'thesis': ERROR_CODES.THESIS_NOT_FOUND,
      'synthesis': ERROR_CODES.SYNTHESIS_NOT_FOUND,
      'task': ERROR_CODES.TASK_NOT_FOUND
    };
    
    return resourceErrorMap[resourceLower] || ERROR_CODES.NOT_FOUND;
  }

  /**
   * Create not found error for user
   * @param {string} userId - User ID
   * @returns {NotFoundError}
   */
  static user(userId) {
    return new NotFoundError('User', userId);
  }

  /**
   * Create not found error for concept
   * @param {string} conceptId - Concept ID
   * @returns {NotFoundError}
   */
  static concept(conceptId) {
    return new NotFoundError('Concept', conceptId);
  }

  /**
   * Create not found error for graph
   * @param {string} graphId - Graph ID
   * @returns {NotFoundError}
   */
  static graph(graphId) {
    return new NotFoundError('Graph', graphId);
  }

  /**
   * Create not found error for category
   * @param {string} categoryId - Category ID
   * @returns {NotFoundError}
   */
  static category(categoryId) {
    return new NotFoundError('Category', categoryId);
  }

  /**
   * Create not found error for relationship
   * @param {string} relationshipId - Relationship ID
   * @returns {NotFoundError}
   */
  static relationship(relationshipId) {
    return new NotFoundError('Relationship', relationshipId);
  }

  /**
   * Create not found error for thesis
   * @param {string} thesisId - Thesis ID
   * @returns {NotFoundError}
   */
  static thesis(thesisId) {
    return new NotFoundError('Thesis', thesisId);
  }

  /**
   * Create not found error for synthesis
   * @param {string} synthesisId - Synthesis ID
   * @returns {NotFoundError}
   */
  static synthesis(synthesisId) {
    return new NotFoundError('Synthesis', synthesisId);
  }

  /**
   * Create not found error for task
   * @param {string} taskId - Task ID
   * @returns {NotFoundError}
   */
  static task(taskId) {
    return new NotFoundError('Task', taskId);
  }

  /**
   * Create not found error for multiple resources
   * @param {string} resource - Resource type
   * @param {string[]} ids - Array of IDs not found
   * @returns {NotFoundError}
   */
  static multiple(resource, ids) {
    const details = {
      resource,
      ids,
      count: ids.length
    };
    
    const message = `${ids.length} ${resource}(s) not found`;
    
    return new NotFoundError(resource, null, message).withDetails(details);
  }

  /**
   * Create not found error with search criteria
   * @param {string} resource - Resource type
   * @param {Object} criteria - Search criteria used
   * @returns {NotFoundError}
   */
  static withCriteria(resource, criteria) {
    return new NotFoundError(resource, criteria);
  }

  /**
   * Create not found error for a related resource
   * @param {string} resource - Main resource type
   * @param {string} resourceId - Main resource ID
   * @param {string} relatedResource - Related resource type
   * @returns {NotFoundError}
   */
  static related(resource, resourceId, relatedResource) {
    const message = `No ${relatedResource} found for ${resource} '${resourceId}'`;
    const details = {
      resource: relatedResource,
      parentResource: resource,
      parentId: resourceId
    };
    
    return new NotFoundError(relatedResource, null, message).withDetails(details);
  }

  /**
   * Create not found error for association between resources
   * @param {string} resource1 - First resource type
   * @param {string} id1 - First resource ID
   * @param {string} resource2 - Second resource type
   * @param {string} id2 - Second resource ID
   * @returns {NotFoundError}
   */
  static association(resource1, id1, resource2, id2) {
    const message = `No association found between ${resource1} '${id1}' and ${resource2} '${id2}'`;
    const details = {
      resource: 'Association',
      resource1: { type: resource1, id: id1 },
      resource2: { type: resource2, id: id2 }
    };
    
    return new NotFoundError('Association', null, message).withDetails(details);
  }

  /**
   * Create not found error for file or document
   * @param {string} filename - File name
   * @param {string} path - File path (optional)
   * @returns {NotFoundError}
   */
  static file(filename, path = null) {
    const details = { filename };
    if (path) {
      details.path = path;
    }
    
    const message = path 
      ? `File '${filename}' not found at path '${path}'`
      : `File '${filename}' not found`;
    
    return new NotFoundError('File', null, message).withDetails(details);
  }

  /**
   * Create not found error for configuration
   * @param {string} configKey - Configuration key
   * @returns {NotFoundError}
   */
  static configuration(configKey) {
    const message = `Configuration '${configKey}' not found`;
    const details = { configKey };
    
    return new NotFoundError('Configuration', null, message).withDetails(details);
  }
}

module.exports = NotFoundError;