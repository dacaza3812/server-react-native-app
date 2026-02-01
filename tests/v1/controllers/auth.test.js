const request = require('supertest');
const app = require('../../../app');
const UserV1 = require('../../../models/UserV1');
const { generateUser } = require('../../utils/generateTestData');

describe('Auth V1 Controller Tests', () => {
  describe('POST /api/v1/auth/signin', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        phone: '1234567890',
        role: 'customer',
        firebasePushToken: 'test_token_123',
        name: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        dateOfBirth: '1990-01-01',
        gender: 'male',
      };

      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.phone).toBe(userData.phone);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.user.profile.name).toBe(userData.name);
      expect(response.body.user.profile.lastName).toBe(userData.lastName);
      expect(response.body.user.profile.email).toBe(userData.email);
      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
    });

    it('should login existing user and update profile', async () => {
      const userData = generateUser('customer');
      const user = new UserV1(userData);
      await user.save();

      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send({
          phone: userData.phone,
          role: 'customer',
          firebasePushToken: 'new_token_456',
          name: 'Updated Name',
          lastName: 'Updated Last Name',
          email: 'updated@example.com',
        })
        .expect(200);

      expect(response.body.message).toBe('User logged in successfully');
      expect(response.body.user.phone).toBe(userData.phone);
      expect(response.body.user.profile.name).toBe('Updated Name');
      expect(response.body.user.profile.lastName).toBe('Updated Last Name');
      expect(response.body.user.profile.email).toBe('updated@example.com');
    });

    it('should fail without phone number', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send({
          role: 'customer'
        })
        .expect(400);

      expect(response.body.msg).toBe('Phone number is required');
    });

    it('should fail without valid role', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send({
          phone: '1234567890',
          role: 'invalid_role'
        })
        .expect(400);

      expect(response.body.msg).toBe('Valid role is required (customer, captain, or store_owner)');
    });

    it('should create captain with dni', async () => {
      const userData = {
        phone: '9876543210',
        role: 'captain',
        name: 'Carlos',
        lastName: 'Gómez',
        dni: '12345678',
      };

      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send(userData)
        .expect(201);

      expect(response.body.user.role).toBe('captain');
      expect(response.body.user.profile.name).toBe('Carlos');
      expect(response.body.user.profile.lastName).toBe('Gómez');
      expect(response.body.user.profile.dni).toBe('12345678');
    });

    it('should create seller with business info', async () => {
      const userData = {
        phone: '5555555555',
        role: 'store_owner',
        name: 'María',
        lastName: 'López',
        email: 'maria@business.com',
      };

      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send(userData)
        .expect(201);

      expect(response.body.user.role).toBe('store_owner');
      expect(response.body.user.profile.name).toBe('María');
      expect(response.body.user.profile.email).toBe('maria@business.com');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should refresh access token', async () => {
      const userData = generateUser('customer');
      const user = new UserV1(userData);
      await user.save();

      const refreshToken = user.createRefreshToken();

      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(response.body.access_token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refresh_token: 'invalid_token' })
        .expect(401);
    });
  });
});
