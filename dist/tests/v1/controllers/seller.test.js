const request = require('supertest');
const app = require('../../../app');
const UserV1 = require('../../../models/UserV1');
const Store = require('../../../models/Store');
describe('Sellers V1 Controller Tests', () => {
    describe('GET /api/v1/sellers/profile', () => {
        it('should get seller profile successfully', async () => {
            const sellerData = {
                phone: '1234567890',
                role: 'store_owner',
                profile: {
                    name: 'Juan',
                    lastName: 'Pérez',
                    email: 'juan@business.com',
                },
                seller: {
                    businessName: 'Tienda de Juan',
                    taxId: 'ABC123456',
                },
            };
            const seller = new UserV1(sellerData);
            await seller.save();
            const token = seller.createAccessToken();
            const response = await request(app)
                .get('/api/v1/sellers/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(response.body.message).toBe('Seller profile retrieved successfully');
            expect(response.body.seller.id).toBeDefined();
            expect(response.body.seller.profile.name).toBe('Juan');
            expect(response.body.seller.profile.lastName).toBe('Pérez');
            expect(response.body.seller.seller.businessName).toBe('Tienda de Juan');
            expect(response.body.seller.seller.taxId).toBe('ABC123456');
        });
        it('should fail for non-seller user', async () => {
            const userData = {
                phone: '9876543210',
                role: 'customer',
            };
            const user = new UserV1(userData);
            await user.save();
            const token = user.createAccessToken();
            const response = await request(app)
                .get('/api/v1/sellers/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(400);
            expect(response.body.msg).toBe('User is not a seller');
        });
    });
    describe('GET /api/v1/sellers/:id/profile', () => {
        it('should get seller by id successfully', async () => {
            const sellerData = {
                phone: '5555555555',
                role: 'store_owner',
                profile: {
                    name: 'María',
                    lastName: 'López',
                    email: 'maria@business.com',
                },
                seller: {
                    businessName: 'Tienda de María',
                },
            };
            const seller = new UserV1(sellerData);
            await seller.save();
            const response = await request(app)
                .get(`/api/v1/sellers/${seller._id}/profile`)
                .expect(200);
            expect(response.body.message).toBe('Seller retrieved successfully');
            expect(response.body.seller.profile.name).toBe('María');
            expect(response.body.seller.seller.businessName).toBe('Tienda de María');
            expect(response.body.seller.stores).toBeDefined();
        });
    });
    describe('PATCH /api/v1/sellers/profile', () => {
        it('should update seller profile successfully', async () => {
            const sellerData = {
                phone: '1111111111',
                role: 'store_owner',
                profile: {
                    name: 'Juan',
                    lastName: 'Pérez',
                },
            };
            const seller = new UserV1(sellerData);
            await seller.save();
            const token = seller.createAccessToken();
            const response = await request(app)
                .patch('/api/v1/sellers/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({
                name: 'Juan Carlos',
                lastName: 'Pérez García',
                email: 'juancarlos@business.com',
                avatarUrl: 'https://example.com/new-avatar.jpg',
                businessName: 'Tienda Juan Carlos',
                taxId: 'XYZ987654',
            })
                .expect(200);
            expect(response.body.message).toBe('Seller profile updated successfully');
            expect(response.body.seller.profile.name).toBe('Juan Carlos');
            expect(response.body.seller.profile.lastName).toBe('Pérez García');
            expect(response.body.seller.seller.businessName).toBe('Tienda Juan Carlos');
            expect(response.body.seller.seller.taxId).toBe('XYZ987654');
        });
    });
    describe('GET /api/v1/sellers/:id/stores', () => {
        it('should get seller stores successfully', async () => {
            const sellerData = {
                phone: '2222222222',
                role: 'store_owner',
                profile: {
                    name: 'Carlos',
                    lastName: 'Gómez',
                },
            };
            const seller = new UserV1(sellerData);
            await seller.save();
            const storeData = {
                name: 'Tienda de Carlos',
                address: {
                    street: 'Calle Principal 123',
                    city: 'Ciudad de México',
                    state: 'CDMX',
                    country: 'MX',
                    postalCode: '06600',
                    latitude: 19.4326,
                    longitude: -99.1332,
                },
                contact: {
                    phone: '5551234567',
                    email: 'store@carlos.com',
                },
                categories: ['Comida y Bebidas'],
                owner: seller._id,
            };
            const store = new Store(storeData);
            await store.save();
            seller.stores.push(store._id);
            await seller.save();
            const response = await request(app)
                .get(`/api/v1/sellers/${seller._id}/stores`)
                .expect(200);
            expect(response.body.message).toBe('Seller stores retrieved successfully');
            expect(response.body.count).toBe(1);
            expect(response.body.stores[0].name).toBe('Tienda de Carlos');
        });
    });
});
//# sourceMappingURL=seller.test.js.map