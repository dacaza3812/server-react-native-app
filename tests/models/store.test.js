const mongoose = require('mongoose');
const Store = require('../../models/Store');
const User = require('../../models/User');
const { generateStore, generateUser } = require('../utils/generateTestData');

describe('Store Model Test', () => {
  let ownerId;

  beforeAll(async () => {
    const owner = new User(generateUser('store_owner'));
    const savedOwner = await owner.save();
    ownerId = savedOwner._id;
  });

  it('should create & save store successfully', async () => {
    const storeData = generateStore(ownerId);
    const validStore = new Store(storeData);
    const savedStore = await validStore.save();

    expect(savedStore._id).toBeDefined();
    expect(savedStore.owner.toString()).toBe(ownerId.toString());
    expect(savedStore.name).toBe(storeData.name);
  });

  it('should fail if name is missing', async () => {
    const storeData = generateStore(ownerId);
    delete storeData.name;
    const storeWithoutName = new Store(storeData);
    let err;
    try {
      await storeWithoutName.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
  });

  it('should fail if owner is missing', async () => {
    const storeData = generateStore(ownerId);
    delete storeData.owner;
    const storeWithoutOwner = new Store(storeData);
    let err;
    try {
      await storeWithoutOwner.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.owner).toBeDefined();
  });
});
