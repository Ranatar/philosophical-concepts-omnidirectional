/**
 * User Controller tests
 */

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const UserController = require('../../src/controllers/userController');
const UserService = require('../../src/services/userService');
const { NotFoundError } = require('../../../shared/lib/errors/HttpErrors');

describe('UserController', () => {
  let userController;
  let userService;
  let req;
  let res;
  let next;

  beforeEach(() => {
    userService = sinon.createStubInstance(UserService);
    userController = new UserController(userService);
    
    req = {
      params: {},
      body: {},
      query: {},
      user: { user_id: 'admin-id', role: 'admin' }
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
      sendPaginated: sinon.stub(),
      sendSuccess: sinon.stub()
    };
    
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { user_id: '1', username: 'user1' },
        { user_id: '2', username: 'user2' }
      ];
      
      userService.findAll.resolves({
        items: mockUsers,
        total: 2
      });
      
      req.query = { page: 1, pageSize: 20 };
      
      await userController.getAll(req, res, next);
      
      expect(userService.findAll.calledOnce).to.be.true;
      expect(res.sendPaginated.calledOnce).to.be.true;
      expect(res.sendPaginated.firstCall.args[0]).to.deep.equal(mockUsers);
      expect(res.sendPaginated.firstCall.args[1]).to.deep.equal({
        total: 2,
        page: 1,
        pageSize: 20
      });
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation error');
      validationError.isJoi = true;
      
      req.query = { page: -1 };
      
      await userController.getAll(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(Error);
    });
  });

  describe('getById', () => {
    it('should return user by ID', async () => {
      const mockUser = { user_id: '1', username: 'testuser' };
      userService.findById.resolves(mockUser);
      
      req.params.id = '1';
      
      await userController.getById(req, res, next);
      
      expect(userService.findById.calledWith('1')).to.be.true;
      expect(res.sendSuccess.calledWith(mockUser)).to.be.true;
    });

    it('should throw NotFoundError when user not found', async () => {
      userService.findById.resolves(null);
      
      req.params.id = 'non-existent';
      
      await userController.getById(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(NotFoundError);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123!'
      };
      
      const createdUser = {
        user_id: '123',
        ...userData,
        password: undefined
      };
      
      userService.create.resolves(createdUser);
      
      req.body = userData;
      
      await userController.create(req, res, next);
      
      expect(userService.create.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.sendSuccess.calledWith(createdUser, {}, 'User created successfully')).to.be.true;
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      userService.create.rejects(error);
      
      req.body = { username: 'test' };
      
      await userController.create(req, res, next);
      
      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updatedUser = {
        user_id: '1',
        username: 'updateduser',
        email: 'updated@example.com'
      };
      
      userService.update.resolves(updatedUser);
      
      req.params.id = '1';
      req.body = { username: 'updateduser' };
      
      await userController.update(req, res, next);
      
      expect(userService.update.calledWith('1', { username: 'updateduser' })).to.be.true;
      expect(res.sendSuccess.calledWith(updatedUser, {}, 'User updated successfully')).to.be.true;
    });

    it('should throw NotFoundError when user not found', async () => {
      userService.update.resolves(null);
      
      req.params.id = 'non-existent';
      req.body = { username: 'updated' };
      
      await userController.update(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      userService.delete.resolves(true);
      
      req.params.id = '1';
      
      await userController.delete(req, res, next);
      
      expect(userService.delete.calledWith('1')).to.be.true;
      expect(res.sendSuccess.calledWith({ id: '1' }, {}, 'User deleted successfully')).to.be.true;
    });

    it('should throw NotFoundError when user not found', async () => {
      userService.delete.resolves(false);
      
      req.params.id = 'non-existent';
      
      await userController.delete(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(NotFoundError);
    });
  });
});
