const request = require('supertest');
const app = require('../../../app');
const UserV1 = require('../../../models/UserV1');
const Ride = require('../../../models/Ride');

describe('Rides V1 Controller Tests', () => {
  describe('POST /api/v1/rides/create', () => {
    it('should create a ride successfully', async () => {
      const customerData = {
        phone: '1234567890',
        role: 'customer',
        profile: {
          name: 'Juan',
          lastName: 'Pérez',
        },
      };

      const customer = new UserV1(customerData);
      await customer.save();

      const token = customer.createAccessToken();

      const rideData = {
        vehicle: 'auto',
        pickup: {
          address: 'Origen 123',
          latitude: 19.4326,
          longitude: -99.1332,
        },
        drop: {
          address: 'Destino 456',
          latitude: 19.4350,
          longitude: -99.1350,
        },
      };

      const response = await request(app)
        .post('/api/v1/rides/create')
        .set('Authorization', `Bearer ${token}`)
        .send(rideData)
        .expect(201);

      expect(response.body.message).toBe('Ride created successfully');
      expect(response.body.ride).toBeDefined();
      expect(response.body.ride.vehicle).toBe('auto');
      expect(response.body.ride.customer.toString()).toBe(customer._id.toString());
      expect(response.body.ride.otp).toBeDefined();
    });

    it('should fail without vehicle type', async () => {
      const customerData = {
        phone: '9876543210',
        role: 'customer',
      };

      const customer = new UserV1(customerData);
      await customer.save();

      const token = customer.createAccessToken();

      const response = await request(app)
        .post('/api/v1/rides/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          pickup: {
            address: 'Origen 123',
            latitude: 19.4326,
            longitude: -99.1332,
          },
          drop: {
            address: 'Destino 456',
            latitude: 19.4350,
            longitude: -99.1350,
          },
        })
        .expect(400);

      expect(response.body.msg).toBe('Vehicle, pickup, and drop details are required');
    });
  });

  describe('PATCH /api/v1/rides/accept/:rideId', () => {
    it('should accept a ride successfully', async () => {
      const customerData = {
        phone: '1111111111',
        role: 'customer',
      };

      const customer = new UserV1(customerData);
      await customer.save();

      const captainData = {
        phone: '2222222222',
        role: 'captain',
        profile: {
          name: 'Carlos',
          lastName: 'Gómez',
          dni: '12345678',
        },
        captain: {
          pricePerKm: {
            auto: 180,
          },
        },
        vehicle: {
          type: 'auto',
          licensePlate: 'ABC123',
        },
      };

      const captain = new UserV1(captainData);
      await captain.save();

      const rideData = {
        vehicle: 'auto',
        pickup: {
          address: 'Origen 123',
          latitude: 19.4326,
          longitude: -99.1332,
        },
        drop: {
          address: 'Destino 456',
          latitude: 19.4350,
          longitude: -99.1350,
        },
      };

      const ride = new Ride({
        ...rideData,
        customer: customer._id,
        distance: 5,
        fare: 1000,
        otp: '1234',
      });
      await ride.save();

      const token = captain.createAccessToken();

      const response = await request(app)
        .patch(`/api/v1/rides/accept/${ride._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Ride accepted successfully');
      expect(response.body.ride.captain.toString()).toBe(captain._id.toString());
      expect(response.body.ride.status).toBe('START');
    });

    it('should fail for non-captain user', async () => {
      const customerData = {
        phone: '3333333333',
        role: 'customer',
      };

      const customer = new UserV1(customerData);
      await customer.save();

      const anotherCustomerData = {
        phone: '4444444444',
        role: 'customer',
      };

      const anotherCustomer = new UserV1(anotherCustomerData);
      await anotherCustomer.save();

      const rideData = {
        vehicle: 'auto',
        pickup: {
          address: 'Origen 123',
          latitude: 19.4326,
          longitude: -99.1332,
        },
        drop: {
          address: 'Destino 456',
          latitude: 19.4350,
          longitude: -99.1350,
        },
      };

      const ride = new Ride({
        ...rideData,
        customer: customer._id,
        distance: 5,
        fare: 1000,
        otp: '1234',
      });
      await ride.save();

      const token = anotherCustomer.createAccessToken();

      const response = await request(app)
        .patch(`/api/v1/rides/accept/${ride._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.msg).toBe('User is not a captain');
    });
  });

  describe('GET /api/v1/rides', () => {
    it('should get my rides successfully', async () => {
      const customerData = {
        phone: '5555555555',
        role: 'customer',
      };

      const customer = new UserV1(customerData);
      await customer.save();

      const rideData = {
        vehicle: 'auto',
        pickup: {
          address: 'Origen 123',
          latitude: 19.4326,
          longitude: -99.1332,
        },
        drop: {
          address: 'Destino 456',
          latitude: 19.4350,
          longitude: -99.1350,
        },
      };

      const ride1 = new Ride({
        ...rideData,
        customer: customer._id,
        distance: 5,
        fare: 1000,
        otp: '1234',
      });
      await ride1.save();

      const ride2 = new Ride({
        ...rideData,
        customer: customer._id,
        distance: 8,
        fare: 1500,
        otp: '5678',
      });
      await ride2.save();

      const token = customer.createAccessToken();

      const response = await request(app)
        .get('/api/v1/rides')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Rides retrieved successfully');
      expect(response.body.count).toBe(2);
      expect(response.body.rides).toBeDefined();
      expect(response.body.rides[0].customer.toString()).toBe(customer._id.toString());
    });
  });

  describe('PATCH /api/v1/rides/:rideId/rate', () => {
    it('should rate a ride successfully', async () => {
      const customerData = {
        phone: '6666666666',
        role: 'customer',
      };

      const customer = new UserV1(customerData);
      await customer.save();

      const captainData = {
        phone: '7777777777',
        role: 'captain',
        profile: {
          name: 'Pedro',
          lastName: 'Martínez',
        },
        rating: {
          average: 4.0,
          total: 10,
        },
      };

      const captain = new UserV1(captainData);
      await captain.save();

      const rideData = {
        vehicle: 'auto',
        pickup: {
          address: 'Origen 123',
          latitude: 19.4326,
          longitude: -99.1332,
        },
        drop: {
          address: 'Destino 456',
          latitude: 19.4350,
          longitude: -99.1350,
        },
      };

      const ride = new Ride({
        ...rideData,
        customer: customer._id,
        captain: captain._id,
        distance: 5,
        fare: 1000,
        otp: '1234',
        status: 'COMPLETED',
      });
      await ride.save();

      const token = customer.createAccessToken();

      const response = await request(app)
        .patch(`/api/v1/rides/${ride._id}/rate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          review: 'Excellent service!',
        })
        .expect(200);

      expect(response.body.message).toBe('Ride rated successfully');
      expect(response.body.ride.rating).toBe(5);
      
      const updatedCaptain = await UserV1.findById(captain._id);
      expect(updatedCaptain.rating.total).toBe(11);
      expect(updatedCaptain.rating.average).toBeGreaterThan(4.0);
    });
  });
});
