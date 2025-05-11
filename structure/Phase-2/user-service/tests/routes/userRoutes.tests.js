/**
 * User routes tests
 */

const request = require('supertest');
const express = require('express');
const userRoutes = require('../../src/routes/userRoutes');
const userController = require('../../src/controllers/userController');
const { authenticate, checkRole } = require('../../src/middleware/auth');
const validate = require('../../src/middleware/validation');
const { errorHandler } = require('../../src/middleware/errorHandler');
const { rateLimiter } = require('../../src/middleware/rateLimiter');
const { ROLE_ADMIN, ROLE_MODERATOR, ROLE_USER } = require('../../../shared/constants/roles');
const { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } = require('../../../shared/lib/errors/httpErrors');
const errorCodes = require('../../../shared/constants/errorCodes');

// Mock dependencies
jest.mock('../../src/controllers/userController');
jest.mock('../../src/middleware/auth');
jest.mock('../../src/middleware/validation');
jest.mock('../../src/middleware/rateLimiter');

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/users', userRoutes);
  app.use(errorHandler);
  return app;
}

describe('User Routes', () => {
  let app;
  let mockAuthUser;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();

    // Default authenticated user (regular user)
    mockAuthUser = {
      user_id: '456e7890-e89b-12d3-a456-426614174000',
      role: ROLE_USER
    };

    // Mock rateLimiter to always pass
    rateLimiter.mockImplementation((req, res, next) => next());

    // Mock authentication middleware to always pass by default
    authenticate.mockImplementation((req, res, next) => {
      req.user = mockAuthUser;
      next();
    });

    // Mock checkRole middleware
    checkRole.mockImplementation((...roles) => (req, res, next) => {
      if (roles.includes(req.user.role)) {
        next();
      } else {
        next(new ForbiddenError('Access denied', errorCodes.FORBIDDEN));
      }
    });

    // Mock validation middleware to always pass by default
    validate.mockImplementation(() => (req, res, next) => next());
  });

  describe('GET /users', () => {
    const mockUsers = [
      {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testuser1',
        email: 'test1@example.com',
        role: ROLE_USER
      },
      {
        user_id: '456e7890-e89b-12d3-a456-426614174000',
        username: 'testuser2',
        email: 'test2@example.com',
        role: ROLE_USER
      }
    ];

    const mockPaginatedResponse = {
      items: mockUsers,
      total: 2,
      page: 1,
      pageSize: 20
    };

    it('should return paginated list of users for admin', async () => {
      // Set admin user
      mockAuthUser.role = ROLE_ADMIN;

      // Mock controller response
      userController.getAllUsers.mockImplementation((req, res) => {
        res.sendPaginated(
          mockPaginatedResponse.items,
          {
            total: mockPaginatedResponse.total,
            page: mockPaginatedResponse.page,
            pageSize: mockPaginatedResponse.pageSize
          }
        );
      });

      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUsers,
        meta: {
          pagination: {
            total: 2,
            page: 1,
            pageSize: 20
          }
        }
      });

      expect(userController.getAllUsers).toHaveBeenCalled();
      expect(authenticate).toHaveBeenCalled();
      expect(checkRole).toHaveBeenCalledWith(ROLE_ADMIN, ROLE_MODERATOR);
    });

    it('should return paginated list of users for moderator', async () => {
      // Set moderator user
      mockAuthUser.role = ROLE_MODERATOR;

      // Mock controller response
      userController.getAllUsers.mockImplementation((req, res) => {
        res.sendPaginated(
          mockPaginatedResponse.items,
          {
            total: mockPaginatedResponse.total,
            page: mockPaginatedResponse.page,
            pageSize: mockPaginatedResponse.pageSize
          }
        );
      });

      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUsers,
        meta: {
          pagination: {
            total: 2,
            page: 1,
            pageSize: 20
          }
        }
      });

      expect(userController.getAllUsers).toHaveBeenCalled();
    });

    it('should pass query parameters to controller', async () => {
      mockAuthUser.role = ROLE_ADMIN;

      userController.getAllUsers.mockImplementation((req, res) => {
        expect(req.query).toEqual({
          page: '2',
          pageSize: '10',
          status: 'active',
          role: 'user'
        });
        res.sendPaginated([], { total: 0, page: 2, pageSize: 10 });
      });

      await request(app)
        .get('/users?page=2&pageSize=10&status=active&role=user')
        .expect(200);

      expect(userController.getAllUsers).toHaveBeenCalled();
    });

    it('should return 403 for regular user', async () => {
      // Default mockAuthUser is regular user
      const response = await request(app)
        .get('/users')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.FORBIDDEN,
          message: 'Access denied'
        }
      });

      expect(userController.getAllUsers).not.toHaveBeenCalled();
    });

    it('should return 401 for unauthenticated user', async () => {
      // Mock authentication failure
      authenticate.mockImplementation((req, res, next) => {
        next(new UnauthorizedError('Authentication required', errorCodes.UNAUTHORIZED));
      });

      const response = await request(app)
        .get('/users')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.UNAUTHORIZED,
          message: 'Authentication required'
        }
      });

      expect(userController.getAllUsers).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockAuthUser.role = ROLE_ADMIN;

      // Mock validation error
      validate.mockImplementation(() => (req, res, next) => {
        const error = new ValidationError('Validation failed');
        error.validationErrors = {
          page: ['Page must be a positive integer']
        };
        next(error);
      });

      const response = await request(app)
        .get('/users?page=-1')
        .expect(422);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.VALIDATION_ERROR,
          message: 'Validation failed',
          details: {
            validationErrors: {
              page: ['Page must be a positive integer']
            }
          }
        }
      });

      expect(userController.getAllUsers).not.toHaveBeenCalled();
    });

    it('should handle controller errors', async () => {
      mockAuthUser.role = ROLE_ADMIN;

      // Mock controller error
      userController.getAllUsers.mockImplementation((req, res, next) => {
        next(new Error('Database error'));
      });

      const response = await request(app)
        .get('/users')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: process.env.NODE_ENV === 'development' ? 'Database error' : 'An unexpected error occurred'
        }
      });
    });
  });

  describe('GET /users/:userId', () => {
    const mockUser = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      username: 'testuser',
      email: 'test@example.com',
      role: ROLE_USER
    };

    it('should return user by ID', async () => {
      userController.getUserById.mockImplementation((req, res) => {
        expect(req.params.userId).toBe(mockUser.user_id);
        res.sendSuccess(mockUser);
      });

      const response = await request(app)
        .get(`/users/${mockUser.user_id}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUser
      });

      expect(userController.getUserById).toHaveBeenCalled();
      expect(authenticate).toHaveBeenCalled();
    });

    it('should validate UUID format', async () => {
      validate.mockImplementation(() => (req, res, next) => {
        const error = new ValidationError('Validation failed');
        error.validationErrors = {
          userId: ['Invalid UUID format']
        };
        next(error);
      });

      const response = await request(app)
        .get('/users/invalid-uuid')
        .expect(422);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.VALIDATION_ERROR,
          message: 'Validation failed',
          details: {
            validationErrors: {
              userId: ['Invalid UUID format']
            }
          }
        }
      });

      expect(userController.getUserById).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent user', async () => {
      userController.getUserById.mockImplementation((req, res, next) => {
        next(new NotFoundError('User not found', errorCodes.USER_NOT_FOUND));
      });

      const response = await request(app)
        .get(`/users/${mockUser.user_id}`)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.USER_NOT_FOUND,
          message: 'User not found'
        }
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      authenticate.mockImplementation((req, res, next) => {
        next(new UnauthorizedError('Authentication required', errorCodes.UNAUTHORIZED));
      });

      const response = await request(app)
        .get(`/users/${mockUser.user_id}`)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.UNAUTHORIZED,
          message: 'Authentication required'
        }
      });

      expect(userController.getUserById).not.toHaveBeenCalled();
    });
  });

  describe('PUT /users/:userId', () => {
    const updateData = {
      first_name: 'Updated',
      last_name: 'Name'
    };

    const updatedUser = {
      user_id: '456e7890-e89b-12d3-a456-426614174000',
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Updated',
      last_name: 'Name',
      role: ROLE_USER
    };

    it('should allow user to update their own profile', async () => {
      userController.updateUser.mockImplementation((req, res) => {
        expect(req.params.userId).toBe(mockAuthUser.user_id);
        expect(req.body).toEqual(updateData);
        res.sendSuccess(updatedUser, {}, 'User updated successfully');
      });

      const response = await request(app)
        .put(`/users/${mockAuthUser.user_id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });

      expect(userController.updateUser).toHaveBeenCalled();
    });

    it('should allow admin to update any user', async () => {
      mockAuthUser.role = ROLE_ADMIN;
      const otherUserId = '123e4567-e89b-12d3-a456-426614174000';

      userController.updateUser.mockImplementation((req, res) => {
        expect(req.params.userId).toBe(otherUserId);
        res.sendSuccess(updatedUser, {}, 'User updated successfully');
      });

      const response = await request(app)
        .put(`/users/${otherUserId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });

      expect(userController.updateUser).toHaveBeenCalled();
    });

    it('should prevent user from updating other users', async () => {
      const otherUserId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock controller to simulate authorization check
      userController.updateUser.mockImplementation((req, res, next) => {
        if (req.user.role !== ROLE_ADMIN && req.user.user_id !== req.params.userId) {
          return next(new ForbiddenError('You can only update your own profile', errorCodes.FORBIDDEN));
        }
        res.sendSuccess(updatedUser);
      });

      const response = await request(app)
        .put(`/users/${otherUserId}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.FORBIDDEN,
          message: 'You can only update your own profile'
        }
      });
    });

    it('should validate update data', async () => {
      validate.mockImplementation(() => (req, res, next) => {
        const error = new ValidationError('Validation failed');
        error.validationErrors = {
          email: ['Invalid email format']
        };
        next(error);
      });

      const response = await request(app)
        .put(`/users/${mockAuthUser.user_id}`)
        .send({ email: 'invalid-email' })
        .expect(422);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.VALIDATION_ERROR,
          message: 'Validation failed',
          details: {
            validationErrors: {
              email: ['Invalid email format']
            }
          }
        }
      });

      expect(userController.updateUser).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent user', async () => {
      userController.updateUser.mockImplementation((req, res, next) => {
        next(new NotFoundError('User not found', errorCodes.USER_NOT_FOUND));
      });

      const response = await request(app)
        .put(`/users/${mockAuthUser.user_id}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.USER_NOT_FOUND,
          message: 'User not found'
        }
      });
    });
  });

  describe('DELETE /users/:userId', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    it('should allow admin to delete user', async () => {
      mockAuthUser.role = ROLE_ADMIN;

      userController.deleteUser.mockImplementation((req, res) => {
        expect(req.params.userId).toBe(userId);
        res.sendSuccess({ user_id: userId }, {}, 'User deleted successfully');
      });

      const response = await request(app)
        .delete(`/users/${userId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { user_id: userId },
        message: 'User deleted successfully'
      });

      expect(userController.deleteUser).toHaveBeenCalled();
      expect(checkRole).toHaveBeenCalledWith(ROLE_ADMIN);
    });

    it('should return 403 for non-admin users', async () => {
      // Default mockAuthUser is regular user
      const response = await request(app)
        .delete(`/users/${userId}`)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.FORBIDDEN,
          message: 'Access denied'
        }
      });

      expect(userController.deleteUser).not.toHaveBeenCalled();
    });

    it('should return 403 for moderator', async () => {
      mockAuthUser.role = ROLE_MODERATOR;

      const response = await request(app)
        .delete(`/users/${userId}`)
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.FORBIDDEN,
          message: 'Access denied'
        }
      });

      expect(userController.deleteUser).not.toHaveBeenCalled();
    });

    it('should validate UUID format', async () => {
      mockAuthUser.role = ROLE_ADMIN;

      validate.mockImplementation(() => (req, res, next) => {
        const error = new ValidationError('Validation failed');
        error.validationErrors = {
          userId: ['Invalid UUID format']
        };
        next(error);
      });

      const response = await request(app)
        .delete('/users/invalid-uuid')
        .expect(422);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.VALIDATION_ERROR,
          message: 'Validation failed',
          details: {
            validationErrors: {
              userId: ['Invalid UUID format']
            }
          }
        }
      });

      expect(userController.deleteUser).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent user', async () => {
      mockAuthUser.role = ROLE_ADMIN;

      userController.deleteUser.mockImplementation((req, res, next) => {
        next(new NotFoundError('User not found', errorCodes.USER_NOT_FOUND));
      });

      const response = await request(app)
        .delete(`/users/${userId}`)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.USER_NOT_FOUND,
          message: 'User not found'
        }
      });
    });

    it('should handle controller errors', async () => {
      mockAuthUser.role = ROLE_ADMIN;

      userController.deleteUser.mockImplementation((req, res, next) => {
        next(new Error('Database error'));
      });

      const response = await request(app)
        .delete(`/users/${userId}`)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: process.env.NODE_ENV === 'development' ? 'Database error' : 'An unexpected error occurred'
        }
      });
    });
  });

  describe('Rate limiting', () => {
    it('should apply rate limiting to routes', async () => {
      // Mock rate limit exceeded
      rateLimiter.mockImplementation((req, res, next) => {
        const error = new ForbiddenError('Rate limit exceeded', errorCodes.FORBIDDEN);
        next(error);
      });

      const response = await request(app)
        .get('/users')
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: errorCodes.FORBIDDEN,
          message: 'Rate limit exceeded'
        }
      });

      expect(rateLimiter).toHaveBeenCalled();
      expect(userController.getAllUsers).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle unknown errors', async () => {
      mockAuthUser.role = ROLE_ADMIN;

      userController.getAllUsers.mockImplementation((req, res, next) => {
        const error = new Error('Unknown error');
        error.statusCode = undefined;
        next(error);
      });

      const response = await request(app)
        .get('/users')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: process.env.NODE_ENV === 'development' ? 'Unknown error' : 'An unexpected error occurred'
        }
      });
    });

    it('should handle async errors', async () => {
      mockAuthUser.role = ROLE_ADMIN;

      userController.getAllUsers.mockImplementation(async (req, res, next) => {
        throw new Error('Async error');
      });

      const response = await request(app)
        .get('/users')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: process.env.NODE_ENV === 'development' ? 'Async error' : 'An unexpected error occurred'
        }
      });
    });
  });
});
