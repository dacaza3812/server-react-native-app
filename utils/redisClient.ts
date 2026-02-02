import Redis from "ioredis";

// Conexión por defecto a localhost:6379.
// Si usas nube, pon tu URL: new Redis("redis://:password@host:port")
export const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  // No se requiere contraseña ni TLS en local
  // Enable Redis JSON module if available (Redis 6.2+)
  enableReadyCheck: false,
});

// Initialize Redis keys
const initializeRedisKeys = async (): Promise<void> => {
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

redis.on("error", (err: Error) => {
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
export const redisHelpers = {
  // Set with expiration
  async setex(key: string, seconds: number, value: string): Promise<void> {
    await redis.setex(key, seconds, value);
  },

  // Get and set with pattern
  async getSet(key: string, value: string): Promise<string | null> {
    return await redis.getset(key, value);
  },

  // Increment with expiration
  async incrEx(key: string, seconds: number): Promise<void> {
    await redis.incr(key);
    await redis.expire(key, seconds);
  },

  // Hash operations
  async hsetnx(key: string, field: string, value: string): Promise<number> {
    return await redis.hsetnx(key, field, value);
  },

  // Sorted set operations
  async zaddEx(key: string, score: number, member: string, seconds: number): Promise<void> {
    await redis.zadd(key, score, member);
    await redis.expire(key, seconds);
  },

  // List operations
  async lpushEx(key: string, value: string, seconds: number): Promise<void> {
    await redis.lpush(key, value);
    await redis.expire(key, seconds);
  }
};
