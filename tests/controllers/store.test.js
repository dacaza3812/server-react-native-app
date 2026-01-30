const request = require('supertest');
const app = require('../../app');
const Store = require('../../models/Store');
const User = require('../../models/User');
const { generateStore, generateUser, generateAccessToken } = require('../utils/generateTestData');

describe('Store Controller Tests', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Create a test user and get auth token
    const userData = generateUser('customer');
    const user = new User(userData);
    await user.save();
    userId = user._id;
    authToken = generateAccessToken(userId, userData.phone);
  });

  describe('POST /store/register', () => {
    it('should create a new store successfully', async () => {
      const storeData = generateStore(userId);

      const response = await request(app)
        .post('/store/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(storeData)
        .expect(201);

      expect(response.body.message).toBe('Store created successfully');
      expect(response.body.store).toBeDefined();
      expect(response.body.store.name).toBe(storeData.name);
      expect(response.body.store.owner.toString()).toBe(userId.toString());
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/store/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Store'
          // Missing address, contact, categories
        })
        .expect(400);

      expect(response.body.msg).toBe('Store name, address, contact, and categories are required');
    });

    it('should fail if user already owns a store', async () => {
      // Create first store
      const storeData = generateStore(userId);
      const store = new Store(storeData);
      await store.save();

      // Try to create second store
      const response = await request(app)
        .post('/store/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateStore(userId))
        .expect(400);

      expect(response.body.msg).toBe('You already own a store');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/store/register')
        .send(generateStore(userId))
        .expect(401);

      expect(response.body.msg).toBeDefined();
    });
  });

  describe('GET /store/my-stores', () => {
    it('should get stores owned by user', async () => {
      // Create a store
      const storeData = generateStore(userId);
      const store = new Store(storeData);
      await store.save();

      const response = await request(app)
        .get('/store/my-stores')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Stores retrieved successfully');
      expect(response.body.stores).toHaveLength(1);
      expect(response.body.stores[0].name).toBe(storeData.name);
    });

    it('should return empty array if user has no stores', async () => {
      const response = await request(app)
        .get('/store/my-stores')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.stores).toHaveLength(0);
    });
  });

  describe('GET /store/nearby', () => {
    it('should find nearby stores', async () => {
      // Create a store with specific coordinates
      const storeData = generateStore(userId);
      storeData.address.latitude = 19.4326; // Mexico City
      storeData.address.longitude = -99.1332;
      const store = new Store(storeData);
      await store.save();

      const response = await request(app)
        .get('/store/nearby')
        .query({
          latitude: 19.4326,
          longitude: -99.1332,
          radius: 10000
        })
        .expect(200);

      expect(response.body.message).toBe('Nearby stores retrieved successfully');
      expect(response.body.stores.length).toBeGreaterThan(0);
    });

    it('should fail without coordinates', async () => {
      const response = await request(app)
        .get('/store/nearby')
        .expect(400);

      expect(response.body.msg).toBe('Latitude and longitude are required');
    });
  });

  describe('GET /store/:storeId', () => {
    it('should get store by ID', async () => {
      const storeData = generateStore(userId);
      const store = new Store(storeData);
      await store.save();

      const response = await request(app)
        .get(`/store/${store._id}`)
        .expect(200);

      expect(response.body.message).toBe('Store retrieved successfully');
      expect(response.body.store._id.toString()).toBe(store._id.toString());
    });

    it('should fail for non-existent store', async () => {
      const response = await request(app)
        .get('/store/507f1f77bcf86cd799439011')
        .expect(404);

      expect(response.body.msg).toBe('Store not found');
    });
  });
});
