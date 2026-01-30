const request = require('supertest');
const app = require('../../app');
const Ride = require('../../models/Ride');
const User = require('../../models/User');
const { generateRide, generateUser, generateAccessToken } = require('../utils/generateTestData');

describe('Ride Controller Tests', () => {
  let customerToken;
  let customerId;
  let captainToken;
  let captainId;

  beforeEach(async () => {
    // Create customer
    const customerData = generateUser('customer');
    const customer = new User(customerData);
    await customer.save();
    customerId = customer._id;
    customerToken = generateAccessToken(customerId, customerData.phone);

    // Create captain
    const captainData = generateUser('captain');
    const captain = new User(captainData);
    await captain.save();
    captainId = captain._id;
    captainToken = generateAccessToken(captainId, captainData.phone);
  });

  describe('POST /ride/create', () => {
    it('should create a ride successfully', async () => {
      const rideData = {
        vehicle: 'auto',
        pickup: {
          address: 'Pickup Location',
          latitude: 19.4326,
          longitude: -99.1332
        },
        drop: {
          address: 'Drop Location',
          latitude: 19.4500,
          longitude: -99.1500
        }
      };

      const response = await request(app)
        .post('/ride/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(rideData)
        .expect(201);

      expect(response.body.message).toBe('Ride created successfully');
      expect(response.body.ride).toBeDefined();
      expect(response.body.ride.vehicle).toBe(rideData.vehicle);
      expect(response.body.ride.otp).toBeDefined();
      expect(response.body.ride.status).toBe('SEARCHING_FOR_CAPTAIN');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/ride/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vehicle: 'auto'
          // Missing pickup and drop
        })
        .expect(400);

      expect(response.body.msg).toBe('Vehicle, pickup, and drop details are required');
    });

    it('should fail with incomplete pickup details', async () => {
      const response = await request(app)
        .post('/ride/create')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          vehicle: 'auto',
          pickup: {
            address: 'Pickup Location'
            // Missing latitude and longitude
          },
          drop: {
            address: 'Drop Location',
            latitude: 19.4500,
            longitude: -99.1500
          }
        })
        .expect(400);

      expect(response.body.msg).toBe('Complete pickup and drop details are required');
    });
  });

  describe('PATCH /ride/accept/:rideId', () => {
    it('should allow captain to accept ride', async () => {
      // Create a ride
      const rideData = generateRide(customerId);
      const ride = new Ride(rideData);
      await ride.save();

      const response = await request(app)
        .patch(`/ride/accept/${ride._id}`)
        .set('Authorization', `Bearer ${captainToken}`)
        .expect(200);

      expect(response.body.message).toBe('Ride accepted successfully');
      expect(response.body.ride.captain.toString()).toBe(captainId.toString());
      expect(response.body.ride.status).toBe('START');
    });

    it('should fail if ride is not available', async () => {
      // Create a ride that's already accepted
      const rideData = generateRide(customerId);
      rideData.status = 'START';
      rideData.captain = captainId;
      const ride = new Ride(rideData);
      await ride.save();

      const response = await request(app)
        .patch(`/ride/accept/${ride._id}`)
        .set('Authorization', `Bearer ${captainToken}`)
        .expect(400);

      expect(response.body.msg).toBe('Ride is no longer available for assignment');
    });
  });

  describe('PATCH /ride/update/:rideId', () => {
    it('should update ride status', async () => {
      // Create a ride
      const rideData = generateRide(customerId);
      rideData.captain = captainId;
      rideData.status = 'START';
      const ride = new Ride(rideData);
      await ride.save();

      const response = await request(app)
        .patch(`/ride/update/${ride._id}`)
        .set('Authorization', `Bearer ${captainToken}`)
        .send({ status: 'ARRIVED' })
        .expect(200);

      expect(response.body.message).toBe('Ride status updated to ARRIVED');
      expect(response.body.ride.status).toBe('ARRIVED');
    });

    it('should fail with invalid status', async () => {
      const rideData = generateRide(customerId);
      const ride = new Ride(rideData);
      await ride.save();

      const response = await request(app)
        .patch(`/ride/update/${ride._id}`)
        .set('Authorization', `Bearer ${captainToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body.msg).toBe('Invalid ride status');
    });
  });

  describe('GET /ride/rides', () => {
    it('should get rides for customer', async () => {
      // Create some rides
      const ride1 = new Ride(generateRide(customerId));
      const ride2 = new Ride(generateRide(customerId));
      await ride1.save();
      await ride2.save();

      const response = await request(app)
        .get('/ride/rides')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.message).toBe('Rides retrieved successfully');
      expect(response.body.rides.length).toBe(2);
    });

    it('should get rides for captain', async () => {
      // Create rides assigned to captain
      const rideData = generateRide(customerId);
      rideData.captain = captainId;
      const ride = new Ride(rideData);
      await ride.save();

      const response = await request(app)
        .get('/ride/my-rides')
        .set('Authorization', `Bearer ${captainToken}`)
        .expect(200);

      expect(response.body.rides.length).toBeGreaterThan(0);
    });

    it('should filter rides by status', async () => {
      const ride1 = new Ride(generateRide(customerId));
      ride1.status = 'COMPLETED';
      const ride2 = new Ride(generateRide(customerId));
      ride2.status = 'SEARCHING_FOR_CAPTAIN';
      await ride1.save();
      await ride2.save();

      const response = await request(app)
        .get('/ride/my-rides')
        .set('Authorization', `Bearer ${customerToken}`)
        .query({ status: 'COMPLETED' })
        .expect(200);

      expect(response.body.rides.every(r => r.status === 'COMPLETED')).toBe(true);
    });
  });
});
