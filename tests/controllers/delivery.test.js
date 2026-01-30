const request = require('supertest');
const app = require('../../app');
const Delivery = require('../../models/Delivery');
const Store = require('../../models/Store');
const Product = require('../../models/Product');
const User = require('../../models/User');
const { generateDelivery, generateProduct, generateStore, generateUser, generateAccessToken } = require('../utils/generateTestData');

describe('Delivery Controller Tests', () => {
  let customerToken;
  let customerId;
  let storeId;
  let productId;
  let storeOwnerId;

  beforeEach(async () => {
    // Create store owner
    const storeOwnerData = generateUser('store_owner');
    const storeOwner = new User(storeOwnerData);
    await storeOwner.save();
    storeOwnerId = storeOwner._id;

    // Create customer
    const customerData = generateUser('customer');
    const customer = new User(customerData);
    await customer.save();
    customerId = customer._id;
    customerToken = generateAccessToken(customerId, customerData.phone);

    // Create store
    const storeData = generateStore(storeOwnerId);
    const store = new Store(storeData);
    await store.save();
    storeId = store._id;

    // Create product
    const productData = generateProduct(storeId);
    productData.inventory = 100;
    const product = new Product(productData);
    await product.save();
    productId = product._id;
  });

  describe('POST /delivery/create', () => {
    it('should create a delivery order successfully', async () => {
      const deliveryData = {
        storeId: storeId.toString(),
        items: [
          {
            productId: productId.toString(),
            quantity: 2
          }
        ],
        deliveryType: 'HOME_DELIVERY',
        pickupAddress: {
          street: 'Store Street 123',
          city: 'Test City',
          state: 'State',
          country: 'MX',
          postalCode: '00000',
          latitude: 19.4326,
          longitude: -99.1332
        },
        deliveryAddress: {
          street: 'Customer Street 456',
          city: 'Test City',
          state: 'State',
          country: 'MX',
          postalCode: '00000',
          latitude: 19.4330,
          longitude: -99.1340
        },
        paymentMethod: 'cash'
      };

      const response = await request(app)
        .post('/delivery/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(deliveryData)
        .expect(201);

      expect(response.body.message).toBe('Delivery order created successfully');
      expect(response.body.delivery).toBeDefined();
      expect(response.body.delivery.orderNumber).toBeDefined();
      expect(response.body.delivery.trackingCode).toBeDefined();
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/delivery/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          storeId: storeId.toString()
          // Missing other required fields
        })
        .expect(400);

      expect(response.body.msg).toContain('required');
    });

    it('should fail for non-existent store', async () => {
      const response = await request(app)
        .post('/delivery/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          storeId: '507f1f77bcf86cd799439011',
          items: [{ productId: productId.toString(), quantity: 1 }],
          deliveryType: 'HOME_DELIVERY',
          pickupAddress: { latitude: 0, longitude: 0 },
          deliveryAddress: { latitude: 0, longitude: 0 }
        })
        .expect(404);

      expect(response.body.msg).toBe('Store not found');
    });

    it('should fail if product is not available', async () => {
      // Make product unavailable
      await Product.findByIdAndUpdate(productId, { isAvailable: false });

      const response = await request(app)
        .post('/delivery/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          storeId: storeId.toString(),
          items: [{ productId: productId.toString(), quantity: 1 }],
          deliveryType: 'HOME_DELIVERY',
          pickupAddress: { latitude: 0, longitude: 0 },
          deliveryAddress: { latitude: 0, longitude: 0 }
        })
        .expect(400);

      expect(response.body.msg).toContain('not available');
    });

    it('should fail if insufficient inventory', async () => {
      const response = await request(app)
        .post('/delivery/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          storeId: storeId.toString(),
          items: [{ productId: productId.toString(), quantity: 999 }],
          deliveryType: 'HOME_DELIVERY',
          pickupAddress: { latitude: 0, longitude: 0 },
          deliveryAddress: { latitude: 0, longitude: 0 }
        })
        .expect(400);

      expect(response.body.msg).toContain('Insufficient inventory');
    });
  });

  describe('GET /delivery/my-deliveries', () => {
    it('should get deliveries for customer', async () => {
      // Create a delivery
      const deliveryData = generateDelivery(customerId, storeId, null, [
        { product: productId, name: 'Test Product', price: 100, quantity: 1, subtotal: 100 }
      ]);
      const delivery = new Delivery(deliveryData);
      await delivery.save();

      const response = await request(app)
        .get('/delivery/my-deliveries')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.message).toBe('Deliveries retrieved successfully');
      expect(response.body.deliveries.length).toBeGreaterThan(0);
    });

    it('should filter deliveries by status', async () => {
      // Create deliveries with different statuses
      const delivery1 = new Delivery(generateDelivery(customerId, storeId));
      delivery1.status = 'PENDING';
      await delivery1.save();

      const delivery2 = new Delivery(generateDelivery(customerId, storeId));
      delivery2.status = 'DELIVERED';
      await delivery2.save();

      const response = await request(app)
        .get('/delivery/my-deliveries')
        .set('Authorization', `Bearer ${customerToken}`)
        .query({ status: 'PENDING' })
        .expect(200);

      expect(response.body.deliveries.every(d => d.status === 'PENDING')).toBe(true);
    });
  });

  describe('GET /delivery/:deliveryId', () => {
    it('should get delivery by ID', async () => {
      const deliveryData = generateDelivery(customerId, storeId);
      const delivery = new Delivery(deliveryData);
      await delivery.save();

      const response = await request(app)
        .get(`/delivery/${delivery._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.message).toBe('Delivery retrieved successfully');
      expect(response.body.delivery._id.toString()).toBe(delivery._id.toString());
    });

    it('should fail for non-existent delivery', async () => {
      const response = await request(app)
        .get('/delivery/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);

      expect(response.body.msg).toBe('Delivery not found');
    });
  });

  describe('PATCH /delivery/:deliveryId/cancel', () => {
    it('should cancel delivery successfully', async () => {
      const deliveryData = generateDelivery(customerId, storeId);
      deliveryData.status = 'PENDING';
      const delivery = new Delivery(deliveryData);
      await delivery.save();

      const response = await request(app)
        .patch(`/delivery/${delivery._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(200);

      expect(response.body.message).toBe('Delivery cancelled successfully');
      expect(response.body.delivery.status).toBe('CANCELLED');
    });
  });

  describe('GET /delivery/track/:trackingCode', () => {
    it('should track delivery by tracking code', async () => {
      const deliveryData = generateDelivery(customerId, storeId);
      const delivery = new Delivery(deliveryData);
      await delivery.save();

      const response = await request(app)
        .get(`/delivery/track/${delivery.trackingCode}`)
        .expect(200);

      expect(response.body.message).toBe('Tracking information retrieved successfully');
      expect(response.body.delivery.trackingCode).toBe(delivery.trackingCode);
    });
  });
});
