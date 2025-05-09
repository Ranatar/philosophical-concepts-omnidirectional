/**
 * Specialized error class for resource not found errors
 * Extends the basic AppError to provide specific functionality
 * for handling and formatting not found errors
 */

const AppError = require('./AppError');
const errorCodes = require('../../constants/errorCodes');

class NotFoundError extends AppError {
  /**
   * Create a new NotFoundError
   * @param {string} message - Human-readable error message
   * @param {string} [resource] - Type of resource that was not found
   * @param {string|number} [identifier] - Identifier that was used to look up the resource
   * @param {number} [code=errorCodes.NOT_FOUND] - Error code
   * @param {Error} [originalError=null] - Original error if this is a wrapper
   */
  constructor(
    message = 'Resource not found',
    resource = null,
    identifier = null,
    code = errorCodes.NOT_FOUND,
    originalError = null
  ) {
    const data = { resource, identifier };
    super(message, code, 404, data, originalError);
    
    this.resource = resource;
    this.identifier = identifier;
  }
  
  /**
   * Create a NotFoundError for a specific resource type
   * @param {string} resource - Type of resource (e.g., 'user', 'concept')
   * @param {string|number} identifier - Identifier used to look up the resource
   * @param {number} [code] - Custom error code from errorCodes
   * @returns {NotFoundError} New NotFoundError instance
   */
  static forResource(resource, identifier, code) {
    // Get the appropriate error code for this resource
    let errorCode = code;
    if (!errorCode) {
      // If no specific code is provided, try to find a resource-specific not found code
      const resourceUpperCase = resource.toUpperCase();
      const specificErrorCode = errorCodes[`${resourceUpperCase}_NOT_FOUND`];
      errorCode = specificErrorCode || errorCodes.NOT_FOUND;
    }
    
    // Construct a user-friendly message
    const message = identifier
      ? `${resource.charAt(0).toUpperCase() + resource.slice(1)} with identifier '${identifier}' not found`
      : `${resource.charAt(0).toUpperCase() + resource.slice(1)} not found`;
      
    return new NotFoundError(message, resource, identifier, errorCode);
  }
  
  /**
   * Create a NotFoundError for a user
   * @param {string|number} userId - User ID
   * @returns {NotFoundError} New NotFoundError instance
   */
  static forUser(userId) {
    return NotFoundError.forResource('user', userId, errorCodes.USER_NOT_FOUND);
  }
  
  /**
   * Create a NotFoundError for a concept
   * @param {string|number} conceptId - Concept ID
   * @returns {NotFoundError} New NotFoundError instance
   */
  static forConcept(conceptId) {
    return NotFoundError.forResource('concept', conceptId, errorCodes.CONCEPT_NOT_FOUND);
  }
  
  /**
   * Create a NotFoundError for a graph
   * @param {string|number} graphId - Graph ID
   * @returns {NotFoundError} New NotFoundError instance
   */
  static forGraph(graphId) {
    return NotFoundError.forResource('graph', graphId, errorCodes.GRAPH_NOT_FOUND);
  }
  
  /**
   * Create a NotFoundError for a category
   * @param {string|number} categoryId - Category ID
   * @returns {NotFoundError} New NotFoundError instance
   */
  static forCategory(categoryId) {
    return NotFoundError.forResource('category', categoryId, errorCodes.CATEGORY_NOT_FOUND);
  }
  
  /**
   * Create a NotFoundError for a relationship
   * @param {string|number} relationshipId - Relationship ID
   * @returns {NotFoundError} New NotFoundError instance
   */
  static forRelationship(relationshipId) {
    return NotFoundError.forResource('relationship', relationshipId, errorCodes.RELATIONSHIP_NOT_FOUND);
  }
  
  /**
   * Create a NotFoundError for a thesis
   * @param {string|number} thesisId - Thesis ID
   * @returns {NotFoundError} New NotFoundError instance
   */
  static forThesis(thesisId) {
    return NotFoundError.forResource('thesis', thesisId, errorCodes.THESIS_NOT_FOUND);
  }
  
  /**
   * Create a NotFoundError for a synthesis
   * @param {string|number} synthesisId - Synthesis ID
   * @returns {NotFoundError} New NotFoundError instance
   */
  static forSynthesis(synthesisId) {
    return NotFoundError.forResource('synthesis', synthesisId, errorCodes.SYNTHESIS_NOT_FOUND);
  }
  
  /**
   * Create a NotFoundError for a Claude task
   * @param {string|number} taskId - Task ID
   * @returns {NotFoundError} New NotFoundError instance
   */
  static forTask(taskId) {
    return NotFoundError.forResource('task', taskId, errorCodes.TASK_NOT_FOUND);
  }
}

module.exports = NotFoundError;
