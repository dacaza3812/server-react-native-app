import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoMemoryServer: MongoMemoryServer | null = null;

const connectDB = async (url: string): Promise<typeof mongoose> => {
  // Use in-memory MongoDB for development if MONGO_URI is localhost and we're not in production
  if (url.includes("localhost") && process.env.NODE_ENV !== "production") {
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const mongoUri = mongoMemoryServer.getUri();
      console.log(`Using in-memory MongoDB at ${mongoUri}`);
      return mongoose.connect(mongoUri);
    } catch (error) {
      console.log("Failed to start in-memory MongoDB, falling back to:", url);
      return mongoose.connect(url);
    }
  }
  return mongoose.connect(url);
};

export const closeDB = async (): Promise<void> => {
  await mongoose.connection.close();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

export default connectDB;
