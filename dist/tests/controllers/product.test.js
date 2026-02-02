const request = require('supertest');
const app = require('../../app');
const Product = require('../../models/Product');
const Store = require('../../models/Store');
const User = require('../../models/User');
const { generateProduct, generateStore, generateUser, generateAccessToken } = require('../utils/generateTestData');
describe('Product Controller Tests', () => {
    let authToken;
    let userId;
    let storeId;
    beforeEach(async () => {
        const userData = generateUser('store_owner');
        const user = new User(userData);
        await user.save();
        userId = user._id;
        authToken = generateAccessToken(userId, userData.phone);
        const storeData = generateStore(userId);
        const store = new Store(storeData);
        await store.save();
        storeId = store._id;
    });
    describe('POST /product/store/:storeId', () => {
        it('should create a new product successfully', async () => {
            const productData = generateProduct(storeId);
            const response = await request(app)
                .post(`/product/store/${storeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(productData)
                .expect(201);
            expect(response.body.message).toBe('Product created successfully');
            expect(response.body.product).toBeDefined();
            expect(response.body.product.name).toBe(productData.name);
            expect(response.body.product.store.toString()).toBe(storeId.toString());
        });
        it('should fail without required fields', async () => {
            const response = await request(app)
                .post(`/product/store/${storeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                name: 'Test Product'
            })
                .expect(400);
            expect(response.body.msg).toContain('required');
        });
        it('should fail if user does not own the store', async () => {
            const otherUserData = generateUser('store_owner');
            const otherUser = new User(otherUserData);
            await otherUser.save();
            const otherToken = generateAccessToken(otherUser._id, otherUserData.phone);
            const productData = generateProduct(storeId);
            const response = await request(app)
                .post(`/product/store/${storeId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send(productData)
                .expect(400);
            expect(response.body.msg).toBe("You don't own this store");
        });
        it('should fail for non-existent store', async () => {
            const response = await request(app)
                .post('/product/store/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${authToken}`)
                .send(generateProduct(storeId))
                .expect(404);
            expect(response.body.msg).toBe('Store not found');
        });
        it('should fail if product name already exists in store', async () => {
            const productData = generateProduct(storeId);
            const product = new Product(productData);
            await product.save();
            const response = await request(app)
                .post(`/product/store/${storeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(productData)
                .expect(400);
            expect(response.body.msg).toBe('Product with this name already exists in your store');
        });
    });
    describe('GET /product/store/:storeId', () => {
        it('should get products for a store', async () => {
            const product1 = new Product(generateProduct(storeId));
            const product2 = new Product(generateProduct(storeId));
            await product1.save();
            await product2.save();
            const response = await request(app)
                .get(`/product/store/${storeId}`)
                .expect(200);
            expect(response.body.message).toBe('Store products retrieved successfully');
            expect(response.body.products.length).toBe(2);
        });
        it('should filter products by category', async () => {
            const productData = generateProduct(storeId);
            productData.category = 'Electronics';
            const product = new Product(productData);
            await product.save();
            const response = await request(app)
                .get(`/product/store/${storeId}`)
                .query({ category: 'Electronics' })
                .expect(200);
            expect(response.body.products.length).toBe(1);
            expect(response.body.products[0].category).toBe('Electronics');
        });
    });
    describe('GET /product/:productId', () => {
        it('should get product by ID', async () => {
            const productData = generateProduct(storeId);
            const product = new Product(productData);
            await product.save();
            const response = await request(app)
                .get(`/product/${product._id}`)
                .expect(200);
            expect(response.body.message).toBe('Product retrieved successfully');
            expect(response.body.product._id.toString()).toBe(product._id.toString());
        });
        it('should fail for non-existent product', async () => {
            const response = await request(app)
                .get('/product/507f1f77bcf86cd799439011')
                .expect(404);
            expect(response.body.msg).toBe('Product not found');
        });
    });
    describe('PATCH /product/:productId', () => {
        it('should update product successfully', async () => {
            const productData = generateProduct(storeId);
            const product = new Product(productData);
            await product.save();
            const response = await request(app)
                .patch(`/product/${product._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                price: 999.99,
                description: 'Updated description'
            })
                .expect(200);
            expect(response.body.message).toBe('Product updated successfully');
            expect(response.body.product.price).toBe(999.99);
        });
    });
    describe('DELETE /product/:productId', () => {
        it('should delete product successfully', async () => {
            const productData = generateProduct(storeId);
            const product = new Product(productData);
            await product.save();
            const response = await request(app)
                .delete(`/product/${product._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body.message).toBe('Product deleted successfully');
            const deletedProduct = await Product.findById(product._id);
            expect(deletedProduct).toBeNull();
        });
    });
});
//# sourceMappingURL=product.test.js.map