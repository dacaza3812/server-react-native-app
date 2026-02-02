"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisHelpers = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
exports.redis = new ioredis_1.default({
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
            await exports.redis.exists(key);
        }
        catch (error) {
            console.log(`Redis key ${key} not found, will be created when needed`);
        }
    }
};
exports.redis.on("connect", () => {
    console.log("✅ Conectado exitosamente a Redis");
    initializeRedisKeys();
});
exports.redis.on("error", (err) => {
    console.error("❌ Error de conexión en Redis:", err);
});
exports.redis.on("reconnecting", () => {
    console.log("🔄 Reconectando a Redis...");
});
exports.redis.on("ready", () => {
    console.log("🟢 Redis listo para operaciones");
});
exports.redis.on("end", () => {
    console.log("🔌 Conexión a Redis cerrada");
});
exports.redisHelpers = {
    async setex(key, seconds, value) {
        await exports.redis.setex(key, seconds, value);
    },
    async getSet(key, value) {
        return await exports.redis.getset(key, value);
    },
    async incrEx(key, seconds) {
        await exports.redis.incr(key);
        await exports.redis.expire(key, seconds);
    },
    async hsetnx(key, field, value) {
        return await exports.redis.hsetnx(key, field, value);
    },
    async zaddEx(key, score, member, seconds) {
        await exports.redis.zadd(key, score, member);
        await exports.redis.expire(key, seconds);
    },
    async lpushEx(key, value, seconds) {
        await exports.redis.lpush(key, value);
        await exports.redis.expire(key, seconds);
    }
};
//# sourceMappingURL=redisClient.js.map