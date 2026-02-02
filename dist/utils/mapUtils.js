const { redis } = require("./redisClient");
const calculateDeliveryFee = (distance, baseFee = 0, weight = 0, urgency = "normal") => {
    const baseRate = baseFee;
    const distanceRate = distance * 10;
    const weightRate = weight * 5;
    const urgencyMultiplier = urgency === "express" ? 1.5 : 1;
    const calculatedFee = baseRate + distanceRate + weightRate;
    return Math.floor(calculatedFee * urgencyMultiplier / 10) * 10;
};
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
const calculateFare = (distance) => {
    const rateStructure = {
        bike: { baseFare: 100, perKmRate: 150, minimumFare: 200 },
        auto: { baseFare: 200, perKmRate: 150, minimumFare: 300 },
        cabEconomy: { baseFare: 200, perKmRate: 250, minimumFare: 400 },
        cabPremium: { baseFare: 200, perKmRate: 300, minimumFare: 500 },
    };
    const fareCalculation = (baseFare, perKmRate, minimumFare) => {
        const calculatedFare = baseFare + (distance * perKmRate);
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
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};
async function getNearbyCaptainsFromRedis(lat, lng, radiusInMeters) {
    const result = await redis.georadius("drivers:locations", lng, lat, radiusInMeters, "m", "WITHDIST", "ASC");
    if (!result.length)
        return [];
    const captainsData = await Promise.all(result.map(async ([captainId, distance]) => {
        const meta = await redis.hgetall(`drivers:meta:${captainId}`);
        if (!meta || !meta.socketId)
            return null;
        return {
            id: captainId,
            coords: { latitude: parseFloat(meta.lat), longitude: parseFloat(meta.lng) },
            firebasePushToken: meta.firebasePushToken,
            socketId: meta.socketId,
            distance: parseFloat(distance),
        };
    }));
    return captainsData.filter((c) => c !== null);
}
async function getNearbyStoresFromRedis(lat, lng, radiusInMeters) {
    const result = await redis.georadius("stores:locations", lng, lat, radiusInMeters, "m", "WITHDIST", "ASC");
    if (!result.length)
        return [];
    const storesData = await Promise.all(result.map(async ([storeId, distance]) => {
        const meta = await redis.hgetall(`stores:meta:${storeId}`);
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
    return storesData.filter(s => s !== null);
}
async function getAvailableDeliveriesFromRedis(lat, lng, radiusInMeters) {
    const captains = await getNearbyCaptainsFromRedis(lat, lng, radiusInMeters);
    if (!captains.length)
        return [];
    const activeDeliveries = await redis.zrange("deliveries:active", 0, -1);
    const availableCaptains = captains.filter(captain => {
        return !activeDeliveries.some(deliveryId => redis.hexists(`captain:delivery:${captain.id}`, deliveryId));
    });
    return availableCaptains;
}
async function assignDeliveryToRedis(captainId, deliveryId) {
    await redis.hset(`captain:delivery:${captainId}`, deliveryId, Date.now());
    await redis.zadd("deliveries:active", Date.now(), deliveryId);
}
async function releaseDeliveryFromRedis(captainId, deliveryId) {
    await redis.hdel(`captain:delivery:${captainId}`, deliveryId);
    const otherCaptains = await redis.hgetall(`delivery:captains:${deliveryId}`);
    if (!otherCaptains || Object.keys(otherCaptains).length === 0) {
        await redis.zrem("deliveries:active", deliveryId);
    }
}
async function updateCaptainLocationInRedis(captainId, lat, lng) {
    await redis.geoadd("drivers:locations", lng, lat, captainId);
    await redis.hset(`drivers:meta:${captainId}`, "lat", lat, "lng", lng);
}
async function updateStoreLocationInRedis(storeId, lat, lng) {
    await redis.geoadd("stores:locations", lng, lat, storeId);
    await redis.hset(`stores:meta:${storeId}`, "lat", lat, "lng", lng);
}
module.exports = {
    calculateDistance,
    calculateFare,
    calculateDeliveryFee,
    generateOTP,
    getNearbyCaptainsFromRedis,
    getNearbyStoresFromRedis,
    getAvailableDeliveriesFromRedis,
    assignDeliveryToRedis,
    releaseDeliveryFromRedis,
    updateCaptainLocationInRedis,
    updateStoreLocationInRedis
};
//# sourceMappingURL=mapUtils.js.map