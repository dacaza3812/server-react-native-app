const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const Store = require('../../models/Store');
const Product = require('../../models/Product');
const Delivery = require('../../models/Delivery');
const Ride = require('../../models/Ride');
const { generateUser, generateStore, generateProduct, generateDelivery, generateRide, generateAccessToken } = require('../utils/generateTestData');

describe('API Routes Integration Tests', () => {
  let customerToken, customerId;
  let captainToken, captainId;
  let storeOwnerToken, storeOwnerId;
  let storeId, productId;

  beforeEach(async () => {
    // Create test users
    const customer = new User(generateUser('customer'));
    await customer.save();
    customerId = customer._id;
    customerToken = generateAccessToken(customerId, customer.phone);

    const captain = new User(generateUser('captain'));
    await captain.save();
    captainId = captain._id;
    captainToken = generateAccessToken(captainId, captain.phone);

    const storeOwner = new User(generateUser('store_owner'));
    await storeOwner.save();
    storeOwnerId = storeOwner._id;
    storeOwnerToken = generateAccessToken(storeOwnerId, storeOwner.phone);

    // Create store and product
    const store = new Store(generateStore(storeOwnerId));
    await store.save();
    storeId = store._id;

    const product = new Product(generateProduct(storeId));
    await product.save();
    productId = product._id;
  });

  describe('Authentication Flow', () => {
    it('should complete full auth flow: register -> login -> refresh token', async () => {
      // Register new user
      const registerResponse = await request(app)
        .post('/auth/signin')
        .send({
          phone: '5555555555',
          role: 'customer',
          firebasePushToken: 'test_token'
        })
        .expect(201);

      expect(registerResponse.body.access_token).toBeDefined();
      expect(registerResponse.body.refresh_token).toBeDefined();

      const refreshToken = registerResponse.body.refresh_token;

      // Refresh token
      const refreshResponse = await request(app)
        .post('/auth/refresh-token')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(refreshResponse.body.access_token).toBeDefined();
      expect(refreshResponse.body.refresh_token).toBeDefined();
    });
  });

  describe('Store Management Flow', () => {
    it('should complete store lifecycle: create -> get -> update -> delete', async () => {
      // Create new store owner
      const newOwner = new User(generateUser('store_owner'));
      await newOwner.save();
      const newOwnerToken = generateAccessToken(newOwner._id, newOwner.phone);

      // Create store
      const createResponse = await request(app)
        .post('/store/register')
        .set('Authorization', `Bearer ${newOwnerToken}`)
        .send(generateStore(newOwner._id))
        .expect(201);

      const newStoreId = createResponse.body.store._id;
      expect(createResponse.body.store).toBeDefined();

      // Get store
      const getResponse = await request(app)
        .get(`/store/${newStoreId}`)
        .expect(200);

      expect(getResponse.body.store._id.toString()).toBe(newStoreId.toString());

      // Update store
      const updateResponse = await request(app)
        .patch(`/store/${newStoreId}`)
        .set('Authorization', `Bearer ${newOwnerToken}`)
        .send({ name: 'Updated Store Name' })
        .expect(200);

      expect(updateResponse.body.store.name).toBe('Updated Store Name');
    });
  });

  describe('Product Management Flow', () => {
    it('should manage products in store', async () => {
      // Create product
      const productData = generateProduct(storeId);
      const createResponse = await request(app)
        .post(`/product/store/${storeId}`)
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send(productData)
        .expect(201);

      const newProductId = createResponse.body.product._id;

      // Get products
      const getResponse = await request(app)
        .get(`/product/store/${storeId}`)
        .expect(200);

      expect(getResponse.body.products.length).toBeGreaterThan(0);

      // Update product
      const updateResponse = await request(app)
        .patch(`/product/${newProductId}`)
        .set('Authorization', `Bearer ${storeOwnerToken}`)
        .send({ price: 199.99 })
        .expect(200);

      expect(updateResponse.body.product.price).toBe(199.99);
    });
  });

  describe('Delivery Order Flow', () => {
    it('should complete delivery lifecycle: create -> track -> cancel', async () => {
      // Create delivery
      const deliveryData = {
        storeId: storeId.toString(),
        items: [{ productId: productId.toString(), quantity: 1 }],
        deliveryType: 'HOME_DELIVERY',
        pickupAddress: {
          street: 'Store St',
          city: 'City',
          state: 'State',
          country: 'MX',
          postalCode: '00000',
          latitude: 19.4326,
          longitude: -99.1332
        },
        deliveryAddress: {
          street: 'Customer St',
          city: 'City',
          state: 'State',
          country: 'MX',
          postalCode: '00000',
          latitude: 19.4330,
          longitude: -99.1340
        },
        paymentMethod: 'cash'
      };

      const createResponse = await request(app)
        .post('/delivery/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(deliveryData)
        .expect(201);

      const deliveryId = createResponse.body.delivery._id;
      const trackingCode = createResponse.body.delivery.trackingCode;

      expect(createResponse.body.delivery).toBeDefined();
      expect(trackingCode).toBeDefined();

      // Track delivery
      const trackResponse = await request(app)
        .get(`/delivery/track/${trackingCode}`)
        .expect(200);

      expect(trackResponse.body.delivery.trackingCode).toBe(trackingCode);

      // Get my deliveries
      const myDeliveriesResponse = await request(app)
        .get('/delivery/my-deliveries')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(myDeliveriesResponse.body.deliveries.length).toBeGreaterThan(0);
    });
  });

  describe('Ride Flow', () => {
    it('should complete ride lifecycle: create -> accept -> update status', async () => {
      // Create ride
      const rideData = {
        vehicle: 'auto',
        pickup: {
          address: 'Pickup',
          latitude: 19.4326,
          longitude: -99.1332
        },
        drop: {
          address: 'Drop',
          latitude: 19.4500,
          longitude: -99.1500
        }
      };

      const createResponse = await request(app)
        .post('/ride/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(rideData)
        .expect(201);

      const rideId = createResponse.body.ride._id;
      expect(createResponse.body.ride.status).toBe('SEARCHING_FOR_CAPTAIN');

      // Captain accepts ride
      const acceptResponse = await request(app)
        .patch(`/ride/accept/${rideId}`)
        .set('Authorization', `Bearer ${captainToken}`)
        .expect(200);

      expect(acceptResponse.body.ride.status).toBe('START');
      expect(acceptResponse.body.ride.captain._id.toString()).toBe(captainId.toString());

      // Update status to arrived
      const arriveResponse = await request(app)
        .patch(`/ride/update/${rideId}`)
        .set('Authorization', `Bearer ${captainToken}`)
        .send({ status: 'ARRIVED' })
        .expect(200);

      expect(arriveResponse.body.ride.status).toBe('ARRIVED');

      // Complete ride
      const completeResponse = await request(app)
        .patch(`/ride/update/${rideId}`)
        .set('Authorization', `Bearer ${captainToken}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      expect(completeResponse.body.ride.status).toBe('COMPLETED');

      // Get ride history
      const historyResponse = await request(app)
        .get('/ride/rides')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(historyResponse.body.rides.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.msg).toBeDefined();
    });

    it('should handle authentication errors', async () => {
      const response = await request(app)
        .get('/store/my-stores')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.msg).toBeDefined();
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/auth/signin')
        .send({})  // Empty body
        .expect(400);

      expect(response.body.msg).toBeDefined();
    });
  });
});
