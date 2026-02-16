/**
 * Utilidades para graceful shutdown y verificación de servicios
 */
const mongoose = require("mongoose");

let redisClient = null;

// Almacenar referencia al cliente Redis
const setRedisClient = (client) => {
  redisClient = client;
};

// Verificar estado de MongoDB
const checkMongoDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // 1 = connected
      await mongoose.connection.db.admin().ping();
      return { status: "connected", healthy: true };
    }
    return { status: "disconnected", healthy: false };
  } catch (error) {
    return { status: "error", healthy: false, error: error.message };
  }
};

// Verificar estado de Redis
const checkRedis = async () => {
  try {
    if (!redisClient) {
      return { status: "not_configured", healthy: true };
    }
    await redisClient.ping();
    return { status: "connected", healthy: true };
  } catch (error) {
    return { status: "error", healthy: false, error: error.message };
  }
};

// Health check completo
const healthCheck = async () => {
  const [mongoStatus, redisStatus] = await Promise.all([
    checkMongoDB(),
    checkRedis(),
  ]);

  const isHealthy = mongoStatus.healthy && redisStatus.healthy;

  return {
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      mongodb: mongoStatus,
      redis: redisStatus,
    },
  };
};

// Graceful shutdown
const gracefulShutdown = (server, io, redisConnection = null) => {
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    // Cerrar servidor HTTP (deja de aceptar nuevas conexiones)
    server.close(() => {
      console.log("HTTP server closed.");
    });

    // Cerrar conexiones Socket.IO
    if (io) {
      io.close(() => {
        console.log("Socket.IO connections closed.");
      });
    }

    // Dar tiempo a que las requests en curso terminen (30 segundos)
    setTimeout(async () => {
      try {
        // Cerrar conexión MongoDB
        await mongoose.connection.close(false);
        console.log("MongoDB connection closed.");

        // Cerrar conexión Redis
        const redisToClose = redisConnection || redisClient;
        if (redisToClose) {
          await redisToClose.quit();
          console.log("Redis connection closed.");
        }

        console.log("Graceful shutdown completed.");
        process.exit(0);
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
      }
    }, 30000);
  };

  // Escuchar señales de terminación
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

module.exports = {
  setRedisClient,
  checkMongoDB,
  checkRedis,
  healthCheck,
  gracefulShutdown,
};
