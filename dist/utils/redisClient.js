const Redis = require("ioredis");
const redis = new Redis({
    host: "127.0.0.1",
    port: 6379,
    enableReadyCheck: false,
});
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
        }
        catch (error) {
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
redis.on("reconnecting", () => {
    console.log("🔄 Reconectando a Redis...");
});
redis.on("ready", () => {
    console.log("🟢 Redis listo para operaciones");
});
redis.on("end", () => {
    console.log("🔌 Conexión a Redis cerrada");
});
const redisHelpers = {
    async setex(key, seconds, value) {
        await redis.setex(key, seconds, value);
    },
    async getSet(key, value) {
        return await redis.getset(key, value);
    },
    async incrEx(key, seconds) {
        await redis.incr(key);
        await redis.expire(key, seconds);
    },
    async hsetnx(key, field, value) {
        return await redis.hsetnx(key, field, value);
    },
    async zaddEx(key, score, member, seconds) {
        await redis.zadd(key, score, member);
        await redis.expire(key, seconds);
    },
    async lpushEx(key, value, seconds) {
        await redis.lpush(key, value);
        await redis.expire(key, seconds);
    }
};
module.exports = { redis, redisHelpers };
//# sourceMappingURL=redisClient.js.map