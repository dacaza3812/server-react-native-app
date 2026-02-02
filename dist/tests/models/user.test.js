const mongoose = require('mongoose');
const User = require('../../models/User');
const { generateUser } = require('../utils/generateTestData');
describe('User Model Test', () => {
    it('should create & save user successfully', async () => {
        const userData = generateUser('customer');
        const validUser = new User(userData);
        const savedUser = await validUser.save();
        expect(savedUser._id).toBeDefined();
        expect(savedUser.phone).toBe(userData.phone);
        expect(savedUser.role).toBe('customer');
    });
    it('should fail if required fields are missing', async () => {
        const userWithoutRequiredField = new User({ phone: '1234567890' });
        let err;
        try {
            await userWithoutRequiredField.save();
        }
        catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.role).toBeDefined();
    });
    it('should fail if role is not in enum', async () => {
        const userData = generateUser('customer');
        userData.role = 'invalid_role';
        const userWithInvalidRole = new User(userData);
        let err;
        try {
            await userWithInvalidRole.save();
        }
        catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.role).toBeDefined();
    });
    it('should create access token successfully', () => {
        const userData = generateUser('customer');
        const user = new User(userData);
        process.env.ACCESS_TOKEN_SECRET = 'test_secret';
        process.env.ACCESS_TOKEN_EXPIRY = '1h';
        const token = user.createAccessToken();
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
    });
    it('should create refresh token successfully', () => {
        const userData = generateUser('customer');
        const user = new User(userData);
        process.env.REFRESH_TOKEN_SECRET = 'refresh_test_secret';
        process.env.REFRESH_TOKEN_EXPIRY = '7d';
        const token = user.createRefreshToken();
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
    });
});
//# sourceMappingURL=user.test.js.map