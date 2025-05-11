/**
 * User Repository tests
 */

const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const UserRepository = require('../../src/repositories/userRepository');
const UserModel = require('../../src/models/userModel');
const { getPostgresPool, transaction } = require('../../src/config/db');

describe('UserRepository', () => {
  let userRepository;
  let pgPool;
  let pgClient;

  beforeEach(() => {
    // Mock PostgreSQL pool and client
    pgClient = {
      query: sinon.stub()
    };
    
    pgPool = {
      query: sinon.stub(),
      connect: sinon.stub().resolves(pgClient),
      end: sinon.stub()
    };
    
    // Stub getPostgresPool to return our mock pool
    sinon.stub(require('../../src/config/db'), 'getPostgresPool').returns(pgPool);
    
    userRepository = new UserRepository();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockRows = [
        { user_id: '1', username: 'user1', email: 'user1@example.com' },
        { user_id: '2', username: 'user2', email: 'user2@example.com' }
      ];
      
      pgPool.query
        .onFirstCall().resolves({ rows: mockRows })
        .onSecondCall().resolves({ rows: [{ total: '2' }] });
      
      const result = await userRepository.findAll({
        page: 1,
        pageSize: 20,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      expect(result.items).to.have.length(2);
      expect(result.total).to.equal(2);
      expect(result.items[0]).to.be.instanceOf(UserModel);
    });

    it('should apply filters correctly', async () => {
      pgPool.query
        .onFirstCall().resolves({ rows: [] })
        .onSecondCall().resolves({ rows: [{ total: '0' }] });
      
      await userRepository.findAll({
        filters: {
          status: 'active',
          role: 'user',
          search: 'test'
        }
      });
      
      const queryCall = pgPool.query.firstCall;
      expect(queryCall.args[0].text).to.include('WHERE');
      expect(queryCall.args[0].text).to.include('status =');
      expect(queryCall.args[0].text).to.include('role =');
      expect(queryCall.args[0].text).to.include('ILIKE');
    });
  });

  describe('findById', () => {
    it('should return user by ID', async () => {
      const mockUser = {
        user_id: '1',
        username: 'testuser',
        email: 'test@example.com'
      };
      
      pgPool.query.resolves({ rows: [mockUser] });
      
      const result = await userRepository.findById('1');
      
      expect(result).to.be.instanceOf(UserModel);
      expect(result.user_id).to.equal('1');
      expect(result.username).to.equal('testuser');
    });

    it('should return null when user not found', async () => {
      pgPool.query.resolves({ rows: [] });
      
      const result = await userRepository.findById('non-existent');
      
      expect(result).to.be.null;
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const user = new UserModel({
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashedpassword'
      });
      
      const mockCreatedUser = {
        ...user.toDatabase(),
        user_id: '123',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      pgPool.query.resolves({ rows: [mockCreatedUser] });
      
      const result = await userRepository.create(user);
      
      expect(result).to.be.instanceOf(UserModel);
      expect(result.user_id).to.equal('123');
      expect(pgPool.query.calledOnce).to.be.true;
      expect(pgPool.query.firstCall.args[0].text).to.include('INSERT INTO users');
      expect(pgPool.query.firstCall.args[0].text).to.include('RETURNING *');
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const user = new UserModel({
        user_id: '1',
        username: 'updateduser',
        email: 'updated@example.com'
      });
      
      const mockUpdatedUser = user.toDatabase();
      
      pgPool.query.resolves({ rows: [mockUpdatedUser] });
      
      const result = await userRepository.update('1', user);
      
      expect(result).to.be.instanceOf(UserModel);
      expect(result.username).to.equal('updateduser');
      expect(pgPool.query.firstCall.args[0].text).to.include('UPDATE users');
      expect(pgPool.query.firstCall.args[0].text).to.include('RETURNING *');
    });

    it('should return null when user not found', async () => {
      pgPool.query.resolves({ rows: [] });
      
      const user = new UserModel({ username: 'updated' });
      const result = await userRepository.update('non-existent', user);
      
      expect(result).to.be.null;
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      pgPool.query.resolves({ rows: [{ user_id: '1' }] });
      
      const result = await userRepository.delete('1');
      
      expect(result).to.be.true;
      expect(pgPool.query.firstCall.args[0].text).to.include('DELETE FROM users');
    });

    it('should return false when user not found', async () => {
      pgPool.query.resolves({ rows: [] });
      
      const result = await userRepository.delete('non-existent');
      
      expect(result).to.be.false;
    });
  });

  describe('exists', () => {
    it('should return true when user exists', async () => {
      pgPool.query.resolves({ rows: [{ user_id: '1' }] });
      
      const result = await userRepository.exists('1');
      
      expect(result).to.be.true;
    });

    it('should return false when user does not exist', async () => {
      pgPool.query.resolves({ rows: [] });
      
      const result = await userRepository.exists('non-existent');
      
      expect(result).to.be.false;
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const mockUser = {
        user_id: '1',
        username: 'testuser',
        email: 'test@example.com'
      };
      
      pgPool.query.resolves({ rows: [mockUser] });
      
      const result = await userRepository.findByUsername('testuser');
      
      expect(result).to.be.instanceOf(UserModel);
      expect(result.username).to.equal('testuser');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        user_id: '1',
        username: 'testuser',
        email: 'test@example.com'
      };
      
      pgPool.query.resolves({ rows: [mockUser] });
      
      const result = await userRepository.findByEmail('test@example.com');
      
      expect(result).to.be.instanceOf(UserModel);
      expect(result.email).to.equal('test@example.com');
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login time', async () => {
      pgPool.query.resolves({ rows: [{ user_id: '1' }] });
      
      const result = await userRepository.updateLastLogin('1');
      
      expect(result).to.be.true;
      expect(pgPool.query.firstCall.args[0].text).to.include('UPDATE users');
      expect(pgPool.query.firstCall.args[0].text).to.include('last_login');
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      pgPool.query.resolves({ rows: [{ user_id: '1' }] });
      
      const result = await userRepository.updatePassword('1', 'newhash');
      
      expect(result).to.be.true;
      expect(pgPool.query.firstCall.args[0].text).to.include('UPDATE users');
      expect(pgPool.query.firstCall.args[0].text).to.include('password_hash');
    });
  });

  describe('createWithTransaction', () => {
    it('should create user within transaction', async () => {
      const user = new UserModel({
        username: 'transactionuser',
        email: 'transaction@example.com'
      });
      
      const mockCreatedUser = {
        ...user.toDatabase(),
        user_id: '123'
      };
      
      pgClient.query.resolves({ rows: [mockCreatedUser] });
      
      // Mock transaction function
      sinon.stub(require('../../src/config/db'), 'transaction').callsFake(async (callback) => {
        return callback(pgClient);
      });
      
      const callback = sinon.stub();
      const result = await userRepository.createWithTransaction(user, callback);
      
      expect(result).to.be.instanceOf(UserModel);
      expect(result.user_id).to.equal('123');
      expect(callback.calledOnce).to.be.true;
      expect(callback.firstCall.args[0]).to.equal(pgClient);
      expect(callback.firstCall.args[1]).to.be.instanceOf(UserModel);
    });
  });
});
