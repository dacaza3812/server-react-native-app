// server/redisClient.js
const Redis = require("ioredis");

// Usar REDIS_URL del environment o conectar a localhost por defecto
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

console.log(`🔧 Conectando a Redis en: ${redisUrl.replace(/:\/\/.*@/, "://***@")}`);

const redis = new Redis(redisUrl, {
  enableReadyCheck: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

// Initialize Redis keys
const initializeRedisKeys = async () => {
  const keys = [
    "drivers:locations",
    "stores:locations", 
    "deliveries:active",
    "captains:availability",
    "customers:locations"
  ];

  for (const key of keys) {
    try {
      await redis.exists(key);
    } catch (error) {
      console.log(`Redis key ${key} not found, will be created when needed`);
    }
  }
};

redis.on("connect", () => {
  console.log("✅ Conectado exitosamente a Redis");
  initializeRedisKeys();
});

redis.on("error", (err) => {
  console.error("❌ Error de conexión en Redis:", err);
});

// Set up connection handlers
redis.on("reconnecting", () => {
  console.log("🔄 Reconectando a Redis...");
});

redis.on("ready", () => {
  console.log("🟢 Redis listo para operaciones");
});

redis.on("end", () => {
  console.log("🔌 Conexión a Redis cerrada");
});

// Helper functions for Redis operations
const redisHelpers = {
  // Set with expiration
  async setex(key, seconds, value) {
    await redis.setex(key, seconds, value);
  },

  // Get and set with pattern
  async getSet(key, value) {
    return await redis.getset(key, value);
  },

  // Increment with expiration
  async incrEx(key, seconds) {
    await redis.incr(key);
    await redis.expire(key, seconds);
  },

  // Hash operations
  async hsetnx(key, field, value) {
    return await redis.hsetnx(key, field, value);
  },

  // Sorted set operations
  async zaddEx(key, score, member, seconds) {
    await redis.zadd(key, score, member);
    await redis.expire(key, seconds);
  },

  // List operations
  async lpushEx(key, value, seconds) {
    await redis.lpush(key, value);
    await redis.expire(key, seconds);
  }
};

module.exports = { redis, redisHelpers };