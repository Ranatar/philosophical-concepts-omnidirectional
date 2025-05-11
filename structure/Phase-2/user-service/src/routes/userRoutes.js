/**
 * User Routes
 * Defines API endpoints for user management
 */

const express = require('express');
const UserController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { createUserSchema, updateUserSchema, getUsersSchema } = require('../validation/userSchemas');

const router = express.Router();
const userController = new UserController();

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Protected (Admin only)
 */
router.get(
  '/',
  authenticate,
  authorize('admin'),
  validateRequest('query', getUsersSchema),
  userController.getAll
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Protected (Admin only)
 */
router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  userController.getById
);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Protected (Admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validateRequest('body', createUserSchema),
  userController.create
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Protected (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validateRequest('body', updateUserSchema),
  userController.update
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Protected (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  userController.delete
);

module.exports = router;
