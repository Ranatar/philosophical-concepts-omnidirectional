/**
 * Auth Service
 * Business logic for authentication
 */

const { defaultLogger } = require('../../../shared/lib/logging/logger');
const { UnauthorizedError, ForbiddenError, BadRequestError } = require('../../../shared/lib/errors/HttpErrors');
const UserService = require('./userService');
const TokenService = require('./tokenService');
const PasswordService = require('./passwordService');
const ActivityService = require('./activityService');
const { USER_ACTIVE, USER_LOCKED } = require('../../../shared/constants/statuses');

class AuthService {
  constructor(
    userService = new UserService(),
    tokenService = new TokenService(),
    passwordService = new PasswordService(),
    activityService = new ActivityService(),
    logger = defaultLogger
  ) {
    this.userService = userService;
    this.tokenService = tokenService;
    this.passwordService = passwordService;
    this.activityService = activityService;
    this.logger = logger;
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Promise resolving to authentication result
   */
  async register(userData) {
    try {
      // Validate password strength
      if (!this.passwordService.validatePasswordStrength(userData.password)) {
        throw new BadRequestError('Password does not meet security requirements');
      }

      // Hash password
      const passwordHash = await this.passwordService.hashPassword(userData.password);

      // Create user
      const user = await this.userService.create({
        ...userData,
        password_hash: passwordHash
      });

      // Generate tokens
      const { accessToken, refreshToken } = this.tokenService.generateTokens({
        user_id: user.user_id,
        username: user.username,
        role: user.role
      });

      // Log registration activity
      await this.activityService.logLogin(user.user_id, { 
        registration: true,
        ip: userData.ip,
        userAgent: userData.userAgent
      });

      return {
        user: {
          ...user,
          password_hash: undefined
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      this.logger.error('Error during user registration:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with login credentials
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} Promise resolving to authentication result
   */
  async login(credentials) {
    const { login, password, ip, userAgent } = credentials;

    try {
      // Find user by username or email
      const user = await this.userService.getUserByLogin(login);
      
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Check if user is active
      if (user.status === USER_LOCKED) {
        throw new ForbiddenError('Account is locked');
      }
      
      if (user.status !== USER_ACTIVE) {
        throw new ForbiddenError('Account is not active');
      }

      // Verify password
      const isValidPassword = await this.passwordService.verifyPassword(password, user.password_hash);
      
      if (!isValidPassword) {
        // Log failed login attempt
        await this.activityService.logActivity({
          user_id: user.user_id,
          activity_type: 'failed_login',
          details: { ip, userAgent, reason: 'invalid_password' }
        });
        
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.tokenService.generateTokens({
        user_id: user.user_id,
        username: user.username,
        role: user.role
      });

      // Update last login
      await this.userService.updateLastLogin(user.user_id);

      // Log successful login
      await this.activityService.logLogin(user.user_id, { ip, userAgent });

      return {
        user: user.toPublic(),
        tokens: {
          accessToken,
          refreshToken
        }
      };
    } catch (error) {
      this.logger.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * Logout user
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Promise<void>}
   */
  async logout(userId, refreshToken) {
    try {
      // Invalidate refresh token
      await this.tokenService.invalidateRefreshToken(refreshToken);

      // Log logout
      await this.activityService.logLogout(userId);
    } catch (error) {
      this.logger.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} Promise resolving to new tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const payload = this.tokenService.verifyRefreshToken(refreshToken);
      
      if (!payload) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Check if refresh token is valid
      const isValid = await this.tokenService.isRefreshTokenValid(refreshToken);
      
      if (!isValid) {
        throw new UnauthorizedError('Refresh token has been invalidated');
      }

      // Check if user still exists and is active
      const user = await this.userService.getUserModel(payload.user_id);
      
      if (!user) {
        throw new UnauthorizedError('User not found');
      }
      
      if (user.status !== USER_ACTIVE) {
        throw new ForbiddenError('Account is not active');
      }

      // Generate new tokens
      const tokens = this.tokenService.generateTokens({
        user_id: user.user_id,
        username: user.username,
        role: user.role
      });

      // Invalidate old refresh token
      await this.tokenService.invalidateRefreshToken(refreshToken);

      return tokens;
    } catch (error) {
      this.logger.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Verify access token
   * @param {string} accessToken - Access token
   * @returns {Object|null} Token payload or null if invalid
   */
  verifyAccessToken(accessToken) {
    return this.tokenService.verifyAccessToken(accessToken);
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {Object} passwordData - Password change data
   * @returns {Promise<void>}
   */
  async changePassword(userId, passwordData) {
    const { currentPassword, newPassword } = passwordData;

    try {
      // Get user
      const user = await this.userService.getUserModel(userId);
      
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Verify current password
      const isValidPassword = await this.passwordService.verifyPassword(
        currentPassword, 
        user.password_hash
      );
      
      if (!isValidPassword) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Validate new password strength
      if (!this.passwordService.validatePasswordStrength(newPassword)) {
        throw new BadRequestError('New password does not meet security requirements');
      }

      // Check if new password is different from current
      const isSamePassword = await this.passwordService.verifyPassword(
        newPassword, 
        user.password_hash
      );
      
      if (isSamePassword) {
        throw new BadRequestError('New password must be different from current password');
      }

      // Hash new password
      const newPasswordHash = await this.passwordService.hashPassword(newPassword);

      // Update password
      await this.userService.userRepository.updatePassword(userId, newPasswordHash);

      // Log password change
      await this.activityService.logPasswordChange(userId);

      // Invalidate all refresh tokens for this user
      await this.tokenService.invalidateUserTokens(userId);
    } catch (error) {
      this.logger.error(`Error changing password for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Promise resolving to reset info
   */
  async requestPasswordReset(email) {
    try {
      const user = await this.userService.findByEmail(email);
      
      if (!user) {
        // Return success even if user not found (security best practice)
        return { message: 'Password reset requested' };
      }

      // Generate reset token (not implemented in this phase)
      // This would typically send an email with a reset link
      
      // Log password reset request
      await this.activityService.logActivity({
        user_id: user.user_id,
        activity_type: 'password_reset_requested',
        details: { email }
      });

      return { message: 'Password reset requested' };
    } catch (error) {
      this.logger.error(`Error requesting password reset for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Validate user session
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} Promise resolving to user info
   */
  async validateSession(accessToken) {
    try {
      const payload = this.tokenService.verifyAccessToken(accessToken);
      
      if (!payload) {
        throw new UnauthorizedError('Invalid access token');
      }

      // Get user
      const user = await this.userService.findById(payload.user_id);
      
      if (!user) {
        throw new UnauthorizedError('User not found');
      }
      
      if (user.status !== USER_ACTIVE) {
        throw new ForbiddenError('Account is not active');
      }

      return {
        user,
        tokenExpiry: new Date(payload.exp * 1000)
      };
    } catch (error) {
      this.logger.error('Error validating session:', error);
      throw error;
    }
  }
}

module.exports = AuthService;
