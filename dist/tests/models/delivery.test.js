const mongoose = require('mongoose');
const Delivery = require('../../models/Delivery');
const Store = require('../../models/Store');
const Product = require('../../models/Product');
const User = require('../../models/User');
const { generateStore, generateProduct, generateDelivery, generateUser } = require('../utils/generateTestData');
describe('Delivery Model Test', () => {
    let customerId, storeId, productId, storeOwnerId;
    beforeAll(async () => {
        const storeOwner = new User(generateUser('store_owner'));
        const savedStoreOwner = await storeOwner.save();
        storeOwnerId = savedStoreOwner._id;
        const user = new User(generateUser('customer'));
        const savedUser = await user.save();
        customerId = savedUser._id;
        const storeData = generateStore(storeOwnerId);
        const store = new Store(storeData);
        const savedStore = await store.save();
        storeId = savedStore._id;
        const productData = generateProduct(storeId);
        const prod = new Product(productData);
        const savedProd = await prod.save();
        productId = savedProd._id;
    });
    it('should create and save delivery successfully', async () => {
        const deliveryData = {
            deliveryType: 'HOME_DELIVERY',
            orderNumber: 'TEST123',
            store: storeId,
            customer: customerId,
            items: [
                { product: productId, name: 'Test Product', price: 100, quantity: 2, subtotal: 200 }
            ],
            pickup: {
                address: {
                    street: 'Store Street 123',
                    city: 'Test City',
                    state: 'Test State',
                    country: 'MX',
                    postalCode: '00000'
                },
                latitude: 0,
                longitude: 0,
                estimatedTime: new Date()
            },
            delivery: {
                address: {
                    street: 'Customer Street 456',
                    city: 'Test City',
                    state: 'Test State',
                    country: 'MX',
                    postalCode: '00000'
                },
                latitude: 0,
                longitude: 0
            },
            pricing: {
                subtotal: 200,
                tax: 32,
                deliveryFee: 10,
                total: 242,
                currency: 'MXN'
            },
            status: 'PENDING',
            cancelledBy: null,
        };
        const delivery = new Delivery(deliveryData);
        await delivery.save();
        expect(delivery._id).toBeDefined();
        expect(delivery.customer.toString()).toBe(customerId.toString());
        expect(delivery.store.toString()).toBe(storeId.toString());
        if (typeof delivery.generateTrackingCode === 'function')
            delivery.generateTrackingCode();
        if (typeof delivery.generateOTP === 'function')
            delivery.generateOTP();
        expect(delivery.orderNumber).toBeDefined();
    });
    it('should fail when required fields are missing', async () => {
        const badDelivery = new Delivery({});
        let err;
        try {
            await badDelivery.save();
        }
        catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });
});
//# sourceMappingURL=delivery.test.js.map