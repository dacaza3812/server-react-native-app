"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = exports.deliveryToCaptains = exports.rideToCaptains = exports.rideNotificationSent = exports.activeSockets = void 0;
exports.getNearbyCaptainsFromRedis = getNearbyCaptainsFromRedis;
exports.updateNearbyCaptains = updateNearbyCaptains;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserV1_1 = __importDefault(require("../../models/UserV1"));
exports.activeSockets = new Map();
exports.rideNotificationSent = {};
exports.rideToCaptains = {};
exports.deliveryToCaptains = {};
const socketAuthMiddleware = async (socket, next) => {
    const token = socket.handshake.headers.access_token;
    if (!token) {
        return next(new Error("Authentication invalid: No token provided"));
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await UserV1_1.default.findById(payload.id);
        if (!user) {
            return next(new Error("Authentication invalid: User not found"));
        }
        socket.user = {
            id: payload.id,
            role: user.role,
            firebasePushToken: user.firebasePushToken,
        };
        next();
    }
    catch (error) {
        return next(new Error("Authentication invalid: Token verification failed"));
    }
};
exports.socketAuthMiddleware = socketAuthMiddleware;
async function getNearbyCaptainsFromRedis(lat, lng, radiusInMeters) {
    const { redis } = await Promise.resolve().then(() => __importStar(require("../../utils/redisClient")));
    const result = await redis.georadius("drivers:locations", lng, lat, radiusInMeters, "m", "WITHDIST", "ASC");
    if (!result.length)
        return [];
    const captainsData = await Promise.all(result.map(async ([captainId, distance]) => {
        const meta = await redis.hgetall(`drivers:meta:${captainId}`);
        if (!meta || !meta.socketId)
            return null;
        return {
            id: captainId,
            coords: {
                latitude: parseFloat(meta.lat),
                longitude: parseFloat(meta.lng),
            },
            firebasePushToken: meta.firebasePushToken || "",
            socketId: meta.socketId,
            distance: parseFloat(distance),
        };
    }));
    return captainsData.filter((c) => c !== null);
}
async function updateNearbyCaptains(io) {
    io.sockets.sockets.forEach(async (sock) => {
        if (sock.user?.role === "customer") {
            const custCoords = sock.user.coords;
            if (custCoords) {
                try {
                    const nearby = await getNearbyCaptainsFromRedis(custCoords.latitude, custCoords.longitude, 60000);
                    sock.emit("nearbyCaptains", nearby);
                }
                catch (error) {
                    console.error("Error updating nearby captains:", error);
                }
            }
        }
    });
}
//# sourceMappingURL=index.js.map