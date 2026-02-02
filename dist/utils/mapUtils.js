"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = exports.calculateFare = exports.calculateDistance = exports.calculateDeliveryFee = void 0;
exports.getNearbyCaptainsFromRedis = getNearbyCaptainsFromRedis;
exports.getNearbyStoresFromRedis = getNearbyStoresFromRedis;
exports.getAvailableDeliveriesFromRedis = getAvailableDeliveriesFromRedis;
exports.assignDeliveryToRedis = assignDeliveryToRedis;
exports.releaseDeliveryFromRedis = releaseDeliveryFromRedis;
exports.updateCaptainLocationInRedis = updateCaptainLocationInRedis;
exports.updateStoreLocationInRedis = updateStoreLocationInRedis;
const redisClient_1 = require("./redisClient");
const calculateDeliveryFee = (distance, baseFee = 0, weight = 0, urgency = "normal") => {
    const baseRate = baseFee;
    const distanceRate = distance * 10;
    const weightRate = weight * 5;
    const urgencyMultiplier = urgency === "express" ? 1.5 : 1;
    const calculatedFee = baseRate + distanceRate + weightRate;
    return Math.floor((calculatedFee * urgencyMultiplier) / 10) * 10;
};
exports.calculateDeliveryFee = calculateDeliveryFee;
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
exports.calculateDistance = calculateDistance;
const calculateFare = (distance) => {
    const rateStructure = {
        bike: { baseFare: 100, perKmRate: 150, minimumFare: 200 },
        auto: { baseFare: 200, perKmRate: 150, minimumFare: 300 },
        cabEconomy: { baseFare: 200, perKmRate: 250, minimumFare: 400 },
        cabPremium: { baseFare: 200, perKmRate: 300, minimumFare: 500 },
    };
    const fareCalculation = (baseFare, perKmRate, minimumFare) => {
        const calculatedFare = baseFare + distance * perKmRate;
        const maxFare = Math.max(calculatedFare, minimumFare);
        return Math.floor(maxFare / 10) * 10;
    };
    return {
        bike: fareCalculation(rateStructure.bike.baseFare, rateStructure.bike.perKmRate, rateStructure.bike.minimumFare),
        auto: fareCalculation(rateStructure.auto.baseFare, rateStructure.auto.perKmRate, rateStructure.auto.minimumFare),
        cabEconomy: fareCalculation(rateStructure.cabEconomy.baseFare, rateStructure.cabEconomy.perKmRate, rateStructure.cabEconomy.minimumFare),
        cabPremium: fareCalculation(rateStructure.cabPremium.baseFare, rateStructure.cabPremium.perKmRate, rateStructure.cabPremium.minimumFare),
    };
};
exports.calculateFare = calculateFare;
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};
exports.generateOTP = generateOTP;
async function getNearbyCaptainsFromRedis(lat, lng, radiusInMeters) {
    const result = await redisClient_1.redis.georadius("drivers:locations", lng, lat, radiusInMeters, "m", "WITHDIST", "ASC");
    if (!result.length)
        return [];
    const captainsData = await Promise.all(result.map(async ([captainId, distance]) => {
        const meta = await redisClient_1.redis.hgetall(`drivers:meta:${captainId}`);
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
async function getNearbyStoresFromRedis(lat, lng, radiusInMeters) {
    const result = await redisClient_1.redis.georadius("stores:locations", lng, lat, radiusInMeters, "m", "WITHDIST", "ASC");
    if (!result.length)
        return [];
    const storesData = await Promise.all(result.map(async ([storeId, distance]) => {
        const meta = await redisClient_1.redis.hgetall(`stores:meta:${storeId}`);
        if (!meta || !meta.name)
            return null;
        return {
            id: storeId,
            name: meta.name,
            address: meta.address,
            distance: parseFloat(distance),
            categories: meta.categories ? JSON.parse(meta.categories) : [],
            deliveryFee: parseFloat(meta.deliveryFee) || 0,
            minimumOrderAmount: parseFloat(meta.minimumOrderAmount) || 0,
            averageDeliveryTime: parseInt(meta.averageDeliveryTime) || 30,
            rating: parseFloat(meta.rating) || 0,
        };
    }));
    return storesData.filter((s) => s !== null);
}
async function getAvailableDeliveriesFromRedis(lat, lng, radiusInMeters) {
    const captains = await getNearbyCaptainsFromRedis(lat, lng, radiusInMeters);
    if (!captains.length)
        return [];
    const activeDeliveries = await redisClient_1.redis.zrange("deliveries:active", 0, -1);
    const availableCaptains = await Promise.all(captains.map(async (captain) => {
        const hasDelivery = await Promise.all(activeDeliveries.map((deliveryId) => redisClient_1.redis.hexists(`captain:delivery:${captain.id}`, deliveryId)));
        return hasDelivery.some((exists) => exists) ? null : captain;
    }));
    return availableCaptains.filter((c) => c !== null);
}
async function assignDeliveryToRedis(captainId, deliveryId) {
    await redisClient_1.redis.hset(`captain:delivery:${captainId}`, deliveryId, Date.now().toString());
    await redisClient_1.redis.zadd("deliveries:active", Date.now(), deliveryId);
}
async function releaseDeliveryFromRedis(captainId, deliveryId) {
    await redisClient_1.redis.hdel(`captain:delivery:${captainId}`, deliveryId);
    const otherCaptains = await redisClient_1.redis.hgetall(`delivery:captains:${deliveryId}`);
    if (!otherCaptains || Object.keys(otherCaptains).length === 0) {
        await redisClient_1.redis.zrem("deliveries:active", deliveryId);
    }
}
async function updateCaptainLocationInRedis(captainId, lat, lng) {
    await redisClient_1.redis.geoadd("drivers:locations", lng, lat, captainId);
    await redisClient_1.redis.hset(`drivers:meta:${captainId}`, "lat", lat.toString(), "lng", lng.toString());
}
async function updateStoreLocationInRedis(storeId, lat, lng) {
    await redisClient_1.redis.geoadd("stores:locations", lng, lat, storeId);
    await redisClient_1.redis.hset(`stores:meta:${storeId}`, "lat", lat.toString(), "lng", lng.toString());
}
//# sourceMappingURL=mapUtils.js.map