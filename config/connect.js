const mongoose = require("mongoose");

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 segundos

const connectDB = async (url, retries = 0) => {
  try {
    const conn = await mongoose.connect(url, {
      // Timeouts para evitar que se quede colgado indefinidamente
      serverSelectionTimeoutMS: 30000, // 30 segundos para seleccionar servidor
      socketTimeoutMS: 45000, // 45 segundos para operaciones
      connectTimeoutMS: 30000, // 30 segundos para conectar
      
      // Opciones de reintento automático de mongoose
      retryWrites: true,
      retryReads: true,
      
      // Pool de conexiones
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Manejar eventos de conexión
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });
    
    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected. Attempting to reconnect...");
    });
    
    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected successfully");
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB connection attempt ${retries + 1} failed:`, error.message);
    
    if (retries < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDB(url, retries + 1);
    }
    
    console.error("Max retries reached. Could not connect to MongoDB.");
    throw error;
  }
};

module.exports = connectDB;
