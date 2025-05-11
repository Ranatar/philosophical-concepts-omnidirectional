/**
 * User Service tests
 */

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const UserService = require('../../src/services/userService');
const UserRepository = require('../../src/repositories/userRepository');
const ActivityService = require('../../src/services/activityService');
const UserModel = require('../../src/models/userModel');
const { ConflictError, NotFoundError } = require('../../../shared/lib/errors/HttpErrors');

describe('UserService', () => {
  let userService;
  let userRepository;
  let activityService;

  beforeEach(() => {
    userRepository = sinon.createStubInstance(UserRepository);
    activityService = sinon.createStubInstance(ActivityService);
    userService = new UserService(userRepository, activityService);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        new UserModel({ user_id: '1', username: 'user1' }),
        new UserModel({ user_id: '2', username: 'user2' })
      ];
      
      userRepository.findAll.resolves({
        items: mockUsers,
        total: 2
      });
      
      const result = await userService.findAll({ page: 1, pageSize: 20 });
      
      expect(result.items).to.have.length(2);
      expect(result.total).to.equal(2);
      expect(result.items[0]).to.have.property('user_id');
      expect(result.items[0]).to.not.have.property('password_hash');
    });
  });

  describe('findById', () => {
    it('should return user by ID', async () => {
      const mockUser = new UserModel({ 
        user_id: '1', 
        username: 'testuser',
        email: 'test@example.com'
      });
      
      userRepository.findById.resolves(mockUser);
      
      const result = await userService.findById('1');
      
      expect(result).to.have.property('user_id', '1');
      expect(result).to.not.have.property('password_hash');
    });

    it('should return null when user not found', async () => {
      userRepository.findById.resolves(null);
      
      const result = await userService.findById('non-existent');
      
      expect(result).to.be.null;
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password_hash: 'hashedpassword'
      };
      
      userRepository.usernameExists.resolves(false);
      userRepository.emailExists.resolves(false);
      
      const createdUser = new UserModel({
        ...userData,
        user_id: '123'
      });
      
      userRepository.createWithTransaction.callsFake(async (user, callback) => {
        await callback(null, user);
        return createdUser;
      });
      
      const result = await userService.create(userData);
      
      expect(result).to.have.property('user_id');
      expect(result).to.not.have.property('password_hash');
      expect(activityService.logActivity.calledOnce).to.be.true;
    });

    it('should throw ConflictError when username exists', async () => {
      userRepository.usernameExists.resolves(true);
      
      await expect(userService.create({ username: 'existinguser' }))
        .to.be.rejectedWith(ConflictError, 'Username already exists');
    });

    it('should throw ConflictError when email exists', async () => {
      userRepository.usernameExists.resolves(false);
      userRepository.emailExists.resolves(true);
      
      await expect(userService.create({ 
        username: 'newuser',
        email: 'existing@example.com' 
      }))
        .to.be.rejectedWith(ConflictError, 'Email already exists');
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const existingUser = new UserModel({
        user_id: '1',
        username: 'olduser',
        email: 'old@example.com'
      });
      
      userRepository.findById.resolves(existingUser);
      userRepository.usernameExists.resolves(false);
      userRepository.emailExists.resolves(false);
      
      const updatedUser = new UserModel({
        ...existingUser,
        username: 'newuser'
      });
      
      userRepository.update.resolves(updatedUser);
      
      const result = await userService.update('1', { username: 'newuser' });
      
      expect(result).to.have.property('username', 'newuser');
      expect(activityService.logProfileUpdate.calledOnce).to.be.true;
    });

    it('should throw NotFoundError when user not found', async () => {
      userRepository.findById.resolves(null);
      
      await expect(userService.update('non-existent', { username: 'test' }))
        .to.be.rejectedWith(NotFoundError, 'User not found');
    });

    it('should throw ConflictError when new username exists', async () => {
      const existingUser = new UserModel({
        user_id: '1',
        username: 'olduser'
      });
      
      userRepository.findById.resolves(existingUser);
      userRepository.usernameExists.resolves(true);
      
      await expect(userService.update('1', { username: 'existinguser' }))
        .to.be.rejectedWith(ConflictError, 'Username already exists');
    });
  });

  describe('delete', () => {
    it('should delete user and activities', async () => {
      userRepository.delete.resolves(true);
      activityService.deleteUserActivities.resolves(5);
      
      const result = await userService.delete('1');
      
      expect(result).to.be.true;
      expect(activityService.deleteUserActivities.calledWith('1')).to.be.true;
    });

    it('should return false when user not found', async () => {
      userRepository.delete.resolves(false);
      
      const result = await userService.delete('non-existent');
      
      expect(result).to.be.false;
      expect(activityService.deleteUserActivities.notCalled).to.be.true;
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = new UserModel({
        user_id: '1',
        username: 'testuser',
        email: 'test@example.com',
        settings: { theme: 'dark' }
      });
      
      userRepository.findById.resolves(mockUser);
      
      const result = await userService.getProfile('1');
      
      expect(result).to.have.property('settings');
      expect(result.settings).to.have.property('theme', 'dark');
    });

    it('should throw NotFoundError when user not found', async () => {
      userRepository.findById.resolves(null);
      
      await expect(userService.getProfile('non-existent'))
        .to.be.rejectedWith(NotFoundError, 'User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update only allowed profile fields', async () => {
      const existingUser = new UserModel({
        user_id: '1',
        username: 'testuser',
        first_name: 'Old',
        last_name: 'Name'
      });
      
      userRepository.findById.resolves(existingUser);
      userRepository.update.resolves(existingUser);
      
      const profileData = {
        first_name: 'New',
        last_name: 'Name',
        username: 'should-be-ignored',
        role: 'should-also-be-ignored'
      };
      
      await userService.updateProfile('1', profileData);
      
      expect(userRepository.update.calledOnce).to.be.true;
      const updateCall = userRepository.update.firstCall;
      expect(updateCall.args[1]).to.have.property('first_name', 'New');
      expect(updateCall.args[1]).to.not.have.property('username');
      expect(updateCall.args[1]).to.not.have.property('role');
    });
  });

  describe('getUserByLogin', () => {
    it('should find user by email when login contains @', async () => {
      const mockUser = new UserModel({ 
        user_id: '1', 
        email: 'test@example.com' 
      });
      
      userRepository.findByEmail.resolves(mockUser);
      
      const result = await userService.getUserByLogin('test@example.com');
      
      expect(userRepository.findByEmail.calledWith('test@example.com')).to.be.true;
      expect(userRepository.findByUsername.notCalled).to.be.true;
      expect(result).to.deep.equal(mockUser);
    });

    it('should find user by username when login does not contain @', async () => {
      const mockUser = new UserModel({ 
        user_id: '1', 
        username: 'testuser' 
      });
      
      userRepository.findByUsername.resolves(mockUser);
      
      const result = await userService.getUserByLogin('testuser');
      
      expect(userRepository.findByUsername.calledWith('testuser')).to.be.true;
      expect(userRepository.findByEmail.notCalled).to.be.true;
      expect(result).to.deep.equal(mockUser);
    });
  });
});
