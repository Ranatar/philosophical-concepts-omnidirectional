/**
 * Profile Routes
 * Defines API endpoints for profile management
 */

const express = require('express');
const ProfileController = require('../controllers/profileController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { updateProfileSchema } = require('../validation/profileSchemas');

const router = express.Router();
const profileController = new ProfileController();

/**
 * @route   GET /api/profile
 * @desc    Get current user's profile
 * @access  Protected
 */
router.get(
  '/',
  authenticate,
  profileController.getOwnProfile
);

/**
 * @route   PUT /api/profile
 * @desc    Update current user's profile
 * @access  Protected
 */
router.put(
  '/',
  authenticate,
  validateRequest('body', updateProfileSchema),
  profileController.updateOwnProfile
);

/**
 * @route   GET /api/profile/:id
 * @desc    Get user profile by ID (admin only)
 * @access  Protected (Admin only)
 */
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  profileController.getProfile
);

/**
 * @route   PUT /api/profile/:id
 * @desc    Update user profile by ID (admin only)
 * @access  Protected (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validateRequest('body', updateProfileSchema),
  profileController.updateProfile
);

module.exports = router;
