/**
 * Auth Routes
 * Defines API endpoints for authentication
 */

const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema, 
  changePasswordSchema 
} = require('../validation/authSchemas');

const router = express.Router();
const authController = new AuthController();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validateRequest('body', registerSchema),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email/username and password
 * @access  Public
 */
router.post(
  '/login',
  validateRequest('body', loginSchema),
  authController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout current user
 * @access  Protected
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh',
  validateRequest('body', refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change current user's password
 * @access  Protected
 */
router.post(
  '/change-password',
  authenticate,
  validateRequest('body', changePasswordSchema),
  authController.changePassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Protected
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

/**
 * @route   POST /api/auth/password-reset
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/password-reset',
  authController.requestPasswordReset
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify current session
 * @access  Public (with token)
 */
router.get(
  '/verify',
  authController.verifySession
);

module.exports = router;
