const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Load environment variables
require('dotenv').config();

let mongoServer;
let useLocalMongoDB = false;

beforeAll(async () => {
  // First, try to use MONGO_URI from environment variables
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✓ Using MongoDB from MONGO_URI environment variable');
      useLocalMongoDB = true;
      return;
    } catch (envError) {
      console.log('✗ Failed to connect using MONGO_URI:', envError.message);
    }
  }

  // Fallback to MongoDB Memory Server
  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'test',
      },
      binary: {
        version: '4.4.18',
      },
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('✓ Using MongoDB Memory Server');
  } catch (error) {
    console.log('✗ MongoDB Memory Server failed, trying local MongoDB...');
    console.log('Error:', error.message);
    
    // Fallback to local MongoDB
    try {
      await mongoose.connect('mongodb://localhost:27017/test');
      useLocalMongoDB = true;
      console.log('✓ Using local MongoDB at localhost:27017');
    } catch (localError) {
      console.error('✗ Could not connect to local MongoDB either');
      console.error('Please install MongoDB locally or use Docker');
      console.error('See tests/TESTING_GUIDE.md for instructions');
      throw localError;
    }
  }
}, 120000);

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  if (mongoServer && !useLocalMongoDB) {
    await mongoServer.stop();
  }
}, 60000);
