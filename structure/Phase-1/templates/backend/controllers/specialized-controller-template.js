/**
 * Template for specialized controllers (non-CRUD operations)
 * Replace all instances of `Feature` with the actual feature name
 * Replace all instances of `feature` with the lowercase feature name
 * Replace all references to featureService with the actual service
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { validate } = require('../../../shared/lib/validation/validators');
const { BadRequestError, NotFoundError } = require('../../../shared/lib/errors/HttpErrors');
const { 
  featureRequestSchema, 
  featureAnalysisSchema 
} = require('../validation/featureSchemas');

/**
 * Specialized controller for specific feature operations
 */
class FeatureController {
  /**
   * Create a new FeatureController
   * @param {Object} featureService - Feature service instance
   * @param {Object} [relatedService] - Related service instance (if needed)
   * @param {Object} [logger=defaultLogger] - Logger instance
   */
  constructor(featureService, relatedService = null, logger = defaultLogger) {
    this.featureService = featureService;
    this.relatedService = relatedService;
    this.logger = logger;
  }

  /**
   * Process feature request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when the operation is complete
   */
  async processFeature(req, res, next) {
    try {
      const data = validate(req.body, featureRequestSchema);
      
      // Add user context if available
      if (req.user) {
        data.userId = req.user.id;
      }
      
      // Process the feature request
      const result = await this.featureService.process(data);
      
      res.sendSuccess(result, {}, 'Feature processed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze feature
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when the operation is complete
   */
  async analyzeFeature(req, res, next) {
    try {
      const { id } = req.params;
      const data = validate(req.body, featureAnalysisSchema);
      
      // Check if the feature exists
      const featureExists = await this.featureService.exists(id);
      
      if (!featureExists) {
        throw new NotFoundError('Feature not found', null, { id });
      }
      
      // Analyze the feature
      const analysis = await this.featureService.analyze(id, data);
      
      res.sendSuccess(analysis, {}, 'Feature analyzed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate report for a feature
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when the operation is complete
   */
  async generateReport(req, res, next) {
    try {
      const { id } = req.params;
      const { format = 'json', details = 'standard' } = req.query;
      
      // Validate format
      const allowedFormats = ['json', 'pdf', 'csv'];
      if (!allowedFormats.includes(format)) {
        throw new BadRequestError(`Invalid format: ${format}. Allowed formats: ${allowedFormats.join(', ')}`);
      }
      
      // Validate details level
      const allowedDetails = ['minimal', 'standard', 'comprehensive'];
      if (!allowedDetails.includes(details)) {
        throw new BadRequestError(`Invalid details level: ${details}. Allowed levels: ${allowedDetails.join(', ')}`);
      }
      
      // Generate the report
      const report = await this.featureService.generateReport(id, { format, details });
      
      // Set the appropriate content type for the response
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="feature-${id}-report.pdf"`);
        res.send(report);
      } else if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="feature-${id}-report.csv"`);
        res.send(report);
      } else {
        // Default to JSON
        res.sendSuccess(report, {}, 'Feature report generated successfully');
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit feature for review
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when the operation is complete
   */
  async submitForReview(req, res, next) {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      
      // Check if the feature exists
      const featureExists = await this.featureService.exists(id);
      
      if (!featureExists) {
        throw new NotFoundError('Feature not found', null, { id });
      }
      
      // Submit for review
      const reviewRequest = await this.featureService.submitForReview(id, {
        comments,
        submittedBy: req.user ? req.user.id : null
      });
      
      res.sendSuccess(reviewRequest, {}, 'Feature submitted for review successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Compare features
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when the operation is complete
   */
  async compareFeatures(req, res, next) {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length < 2) {
        throw new BadRequestError('At least two feature IDs are required for comparison');
      }
      
      // Compare the features
      const comparison = await this.featureService.compare(ids);
      
      res.sendSuccess(comparison, {}, 'Features compared successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle asynchronous feature operation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when the operation is complete
   */
  async handleAsyncOperation(req, res, next) {
    try {
      const { id } = req.params;
      const { operation } = req.body;
      
      // Check if the feature exists
      const featureExists = await this.featureService.exists(id);
      
      if (!featureExists) {
        throw new NotFoundError('Feature not found', null, { id });
      }
      
      // Start the asynchronous operation
      const operationId = await this.featureService.startAsyncOperation(id, operation);
      
      // Return the operation ID for polling
      res.sendSuccess(
        { operationId },
        {},
        `Asynchronous operation '${operation}' started successfully`
      );
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Check status of asynchronous feature operation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {function} next - Express next middleware function
   * @returns {Promise<void>} Promise that resolves when the operation is complete
   */
  async checkAsyncOperationStatus(req, res, next) {
    try {
      const { operationId } = req.params;
      
      // Get the operation status
      const status = await this.featureService.getAsyncOperationStatus(operationId);
      
      if (!status) {
        throw new NotFoundError('Operation not found', null, { operationId });
      }
      
      res.sendSuccess(status);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FeatureController;
