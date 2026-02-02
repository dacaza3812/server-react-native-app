const mongoose = require('mongoose');
const Product = require('../../models/Product');
const Store = require('../../models/Store');
const User = require('../../models/User');
const { generateProduct, generateStore, generateUser } = require('../utils/generateTestData');
describe('Product Model Test', () => {
    let storeId;
    let ownerId;
    beforeAll(async () => {
        const owner = new User(generateUser('store_owner'));
        const savedOwner = await owner.save();
        ownerId = savedOwner._id;
        const storeData = generateStore(ownerId);
        const validStore = new Store(storeData);
        const savedStore = await validStore.save();
        storeId = savedStore._id;
    });
    it('should create & save product successfully', async () => {
        const productData = generateProduct(storeId);
        const validProduct = new Product(productData);
        const savedProduct = await validProduct.save();
        expect(savedProduct._id).toBeDefined();
        expect(savedProduct.store.toString()).toBe(storeId.toString());
        expect(savedProduct.name).toBe(productData.name);
        expect(savedProduct.price).toBe(productData.price);
        expect(savedProduct.inventory).toBe(productData.inventory);
    });
    it('should fail if required fields are missing', async () => {
        const productData = generateProduct(storeId);
        delete productData.name;
        const productWithoutName = new Product(productData);
        let err;
        try {
            await productWithoutName.save();
        }
        catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.name).toBeDefined();
    });
    it('should fail if store is missing', async () => {
        const productData = generateProduct(storeId);
        delete productData.store;
        const productWithoutStore = new Product(productData);
        let err;
        try {
            await productWithoutStore.save();
        }
        catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.store).toBeDefined();
    });
    it('should fail if inventory is negative', async () => {
        const productData = generateProduct(storeId);
        productData.inventory = -10;
        const productWithNegativeInventory = new Product(productData);
        let err;
        try {
            await productWithNegativeInventory.save();
        }
        catch (error) {
            err = error;
        }
        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.inventory).toBeDefined();
    });
});
//# sourceMappingURL=product.test.js.map