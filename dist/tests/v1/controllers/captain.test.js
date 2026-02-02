const request = require('supertest');
const app = require('../../../app');
const UserV1 = require('../../../models/UserV1');
describe('Captains V1 Controller Tests', () => {
    describe('GET /api/v1/captains/profile', () => {
        it('should get captain profile successfully', async () => {
            const captainData = {
                phone: '1234567890',
                role: 'captain',
                profile: {
                    name: 'Juan',
                    lastName: 'Pérez',
                    email: 'juan@example.com',
                    dni: '12345678',
                },
                captain: {
                    pricePerKm: {
                        bike: 150,
                        auto: 160,
                        car: 260,
                    },
                },
                vehicle: {
                    type: 'auto',
                    licensePlate: 'ABC123',
                    color: 'Rojo',
                    model: 'Toyota Corolla',
                },
            };
            const captain = new UserV1(captainData);
            await captain.save();
            const token = captain.createAccessToken();
            const response = await request(app)
                .get('/api/v1/captains/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(response.body.message).toBe('Captain profile retrieved successfully');
            expect(response.body.captain.id).toBeDefined();
            expect(response.body.captain.profile.name).toBe('Juan');
            expect(response.body.captain.profile.lastName).toBe('Pérez');
            expect(response.body.captain.profile.dni).toBe('12345678');
            expect(response.body.captain.captain.pricePerKm.bike).toBe(150);
            expect(response.body.captain.captain.pricePerKm.auto).toBe(160);
            expect(response.body.captain.captain.pricePerKm.car).toBe(260);
        });
        it('should fail for non-captain user', async () => {
            const userData = {
                phone: '9876543210',
                role: 'customer',
            };
            const user = new UserV1(userData);
            await user.save();
            const token = user.createAccessToken();
            const response = await request(app)
                .get('/api/v1/captains/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(400);
            expect(response.body.msg).toBe('User is not a captain');
        });
    });
    describe('GET /api/v1/captains/:id/profile', () => {
        it('should get captain by id successfully', async () => {
            const captainData = {
                phone: '5555555555',
                role: 'captain',
                profile: {
                    name: 'Carlos',
                    lastName: 'Gómez',
                    email: 'carlos@example.com',
                    dni: '87654321',
                },
            };
            const captain = new UserV1(captainData);
            await captain.save();
            const response = await request(app)
                .get(`/api/v1/captains/${captain._id}/profile`)
                .expect(200);
            expect(response.body.message).toBe('Captain retrieved successfully');
            expect(response.body.captain.profile.name).toBe('Carlos');
            expect(response.body.captain.profile.dni).toBe('87654321');
        });
        it('should fail for invalid captain id', async () => {
            const response = await request(app)
                .get('/api/v1/captains/invalidid/profile')
                .expect(400);
        });
    });
    describe('PATCH /api/v1/captains/profile', () => {
        it('should update captain profile successfully', async () => {
            const captainData = {
                phone: '1111111111',
                role: 'captain',
                profile: {
                    name: 'Juan',
                    lastName: 'Pérez',
                },
            };
            const captain = new UserV1(captainData);
            await captain.save();
            const token = captain.createAccessToken();
            const response = await request(app)
                .patch('/api/v1/captains/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({
                name: 'Juan Carlos',
                lastName: 'Pérez García',
                email: 'juancarlos@example.com',
                avatarUrl: 'https://example.com/new-avatar.jpg',
                dni: '12345678',
            })
                .expect(200);
            expect(response.body.message).toBe('Captain profile updated successfully');
            expect(response.body.captain.profile.name).toBe('Juan Carlos');
            expect(response.body.captain.profile.lastName).toBe('Pérez García');
            expect(response.body.captain.profile.dni).toBe('12345678');
        });
    });
    describe('PATCH /api/v1/captains/pricing', () => {
        it('should update captain pricing successfully', async () => {
            const captainData = {
                phone: '2222222222',
                role: 'captain',
            };
            const captain = new UserV1(captainData);
            await captain.save();
            const token = captain.createAccessToken();
            const response = await request(app)
                .patch('/api/v1/captains/pricing')
                .set('Authorization', `Bearer ${token}`)
                .send({
                pricePerKm: {
                    bike: 180,
                    auto: 190,
                    car: 290,
                },
            })
                .expect(200);
            expect(response.body.message).toBe('Captain pricing updated successfully');
            expect(response.body.captain.pricePerKm.bike).toBe(180);
            expect(response.body.captain.pricePerKm.auto).toBe(190);
            expect(response.body.captain.pricePerKm.car).toBe(290);
        });
        it('should fail with negative price', async () => {
            const captainData = {
                phone: '3333333333',
                role: 'captain',
            };
            const captain = new UserV1(captainData);
            await captain.save();
            const token = captain.createAccessToken();
            const response = await request(app)
                .patch('/api/v1/captains/pricing')
                .set('Authorization', `Bearer ${token}`)
                .send({
                pricePerKm: {
                    bike: -10,
                },
            })
                .expect(400);
            expect(response.body.msg).toBe('bike price per km must be positive');
        });
    });
    describe('GET /api/v1/captains/:id/ratings', () => {
        it('should get captain ratings successfully', async () => {
            const captainData = {
                phone: '4444444444',
                role: 'captain',
                profile: {
                    name: 'Pedro',
                    lastName: 'Martínez',
                },
                rating: {
                    average: 4.5,
                    total: 10,
                },
            };
            const captain = new UserV1(captainData);
            await captain.save();
            const response = await request(app)
                .get(`/api/v1/captains/${captain._id}/ratings`)
                .expect(200);
            expect(response.body.message).toBe('Captain ratings retrieved successfully');
            expect(response.body.captain.averageRating).toBe(4.5);
            expect(response.body.captain.totalRatings).toBe(10);
            expect(response.body.ratings).toBeDefined();
        });
    });
});
//# sourceMappingURL=captain.test.js.map