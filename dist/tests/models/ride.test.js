const mongoose = require('mongoose');
const Ride = require('../../models/Ride');
const User = require('../../models/User');
const { generateRide, generateUser } = require('../utils/generateTestData');
describe('Ride Model Test', () => {
    let customerId;
    beforeAll(async () => {
        const customer = new User(generateUser('customer'));
        const savedCustomer = await customer.save();
        customerId = savedCustomer._id;
    });
    it('should create & save ride successfully', async () => {
        const rideData = generateRide(customerId);
        const validRide = new Ride(rideData);
        const savedRide = await validRide.save();
        expect(savedRide._id).toBeDefined();
        expect(savedRide.customer.toString()).toBe(customerId.toString());
        expect(savedRide.status).toBe('SEARCHING_FOR_CAPTAIN');
    });
    it('should fail if vehicle is missing', async () => {
        const rideData = generateRide(customerId);
        delete rideData.vehicle;
        const rideWithoutVehicle = new Ride(rideData);
        let err;
        try {
            await rideWithoutVehicle.save();
        }
        catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.vehicle).toBeDefined();
    });
    it('should fail if pickup is incomplete', async () => {
        const rideData = generateRide(customerId);
        delete rideData.pickup.latitude;
        const rideWithIncompletePickup = new Ride(rideData);
        let err;
        try {
            await rideWithIncompletePickup.save();
        }
        catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors['pickup.latitude']).toBeDefined();
    });
});
//# sourceMappingURL=ride.test.js.map