/**
 * Activity Routes
 * Defines API endpoints for activity management
 */

const express = require('express');
const ActivityController = require('../controllers/activityController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { getActivitiesSchema } = require('../validation/activitySchemas');

const router = express.Router();
const activityController = new ActivityController();

/**
 * @route   GET /api/activities
 * @desc    Get current user's activities
 * @access  Protected
 */
router.get(
  '/',
  authenticate,
  validateRequest('query', getActivitiesSchema),
  activityController.getOwnActivities
);

/**
 * @route   GET /api/activities/recent
 * @desc    Get recent activities for current user
 * @access  Protected
 */
router.get(
  '/recent',
  authenticate,
  activityController.getRecentActivities
);

/**
 * @route   GET /api/activities/stats
 * @desc    Get activity statistics for current user
 * @access  Protected
 */
router.get(
  '/stats',
  authenticate,
  activityController.getActivityStats
);

/**
 * @route   GET /api/activities/user/:id
 * @desc    Get activities for a specific user (admin only)
 * @access  Protected (Admin only)
 */
router.get(
  '/user/:id',
  authenticate,
  authorize('admin'),
  validateRequest('query', getActivitiesSchema),
  activityController.getUserActivities
);

/**
 * @route   GET /api/activities/:id
 * @desc    Get activity by ID
 * @access  Protected
 */
router.get(
  '/:id',
  authenticate,
  activityController.getActivityById
);

module.exports = router;
