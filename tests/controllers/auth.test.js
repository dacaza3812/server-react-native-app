const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const { generateUser } = require('../utils/generateTestData');

describe('Auth Controller Tests', () => {
  describe('POST /auth/signin', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        phone: '1234567890',
        role: 'customer',
        firebasePushToken: 'test_token_123'
      };

      const response = await request(app)
        .post('/auth/signin')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.phone).toBe(userData.phone);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
    });

    it('should login existing user', async () => {
      // First create a user
      const userData = generateUser('customer');
      const user = new User(userData);
      await user.save();

      const response = await request(app)
        .post('/auth/signin')
        .send({
          phone: userData.phone,
          role: 'customer',
          firebasePushToken: 'new_token_456'
        })
        .expect(200);

      expect(response.body.message).toBe('User logged in successfully');
      expect(response.body.user.phone).toBe(userData.phone);
    });

    it('should fail without phone number', async () => {
      const response = await request(app)
        .post('/auth/signin')
        .send({
          role: 'customer'
        })
        .expect(400);

      expect(response.body.msg).toBe('Phone number is required');
    });

    it('should fail without valid role', async () => {
      const response = await request(app)
        .post('/auth/signin')
        .send({
          phone: '1234567890',
          role: 'invalid_role'
        })
        .expect(400);

      expect(response.body.msg).toBe('Valid role is required (customer or captain)');
    });

    it('should prevent role switch without forceSwitch flag', async () => {
      // Create user as customer
      const userData = generateUser('customer');
      const user = new User(userData);
      await user.save();

      // Try to login as captain
      const response = await request(app)
        .post('/auth/signin')
        .send({
          phone: userData.phone,
          role: 'captain'
        })
        .expect(400);

      expect(response.body.msg).toContain('forceSwitch=true');
    });

    it('should allow role switch with forceSwitch flag', async () => {
      // Create user as customer
      const userData = generateUser('customer');
      const user = new User(userData);
      await user.save();

      // Switch to captain with forceSwitch
      const response = await request(app)
        .post('/auth/signin')
        .send({
          phone: userData.phone,
          role: 'captain',
          forceSwitch: true
        })
        .expect(200);

      expect(response.body.user.role).toBe('captain');
    });

    it('should update firebasePushToken for existing user', async () => {
      // Create user
      const userData = generateUser('customer');
      const user = new User(userData);
      await user.save();

      const newToken = 'updated_token_789';

      await request(app)
        .post('/auth/signin')
        .send({
          phone: userData.phone,
          role: 'customer',
          firebasePushToken: newToken
        })
        .expect(200);

      // Verify token was updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.firebasePushToken).toBe(newToken);
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('should refresh tokens successfully', async () => {
      // Create user and get refresh token
      const userData = generateUser('customer');
      const user = new User(userData);
      await user.save();

      const refreshToken = user.createRefreshToken();

      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
    });

    it('should fail without refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({})
        .expect(400);

      expect(response.body.msg).toBe('Refresh token is required');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refresh_token: 'invalid_token' })
        .expect(401);

      expect(response.body.msg).toBe('Invalid refresh token');
    });
  });
});
