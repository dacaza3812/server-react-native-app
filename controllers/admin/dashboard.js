const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../../errors");
const UserV1 = require("../../models/UserV1");
const RideV1 = require("../../models/RideV1");
const Delivery = require("../../models/Delivery");
const Store = require("../../models/Store");
const ProductV1 = require("../../models/ProductV1");
const { redis } = require("../../utils/redisClient");

const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCaptains,
      totalCustomers,
      totalStoreOwners,
      activeCaptains,
      totalRides,
      ridesToday,
      totalDeliveries,
      deliveriesToday,
      totalStores,
      activeStores,
      totalProducts
    ] = await Promise.all([
      UserV1.countDocuments(),
      UserV1.countDocuments({ role: "captain" }),
      UserV1.countDocuments({ role: "customer" }),
      UserV1.countDocuments({ role: "store_owner" }),
      redis.scard("captains:availability"),
      RideV1.countDocuments(),
      RideV1.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      Delivery.countDocuments(),
      Delivery.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      Store.countDocuments(),
      Store.countDocuments({ isActive: true }),
      ProductV1.countDocuments()
    ]);

    const rideStatuses = await RideV1.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const deliveryStatuses = await Delivery.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.status(StatusCodes.OK).json({
      users: {
        total: totalUsers,
        captains: totalCaptains,
        customers: totalCustomers,
        storeOwners: totalStoreOwners,
        activeCaptains
      },
      rides: {
        total: totalRides,
        today: ridesToday,
        byStatus: rideStatuses.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      deliveries: {
        total: totalDeliveries,
        today: deliveriesToday,
        byStatus: deliveryStatuses.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      stores: {
        total: totalStores,
        active: activeStores
      },
      products: {
        total: totalProducts
      }
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    throw new BadRequestError("Failed to get statistics");
  }
};

const getLiveCaptains = async (req, res) => {
  try {
    const captains = await redis.smembers("captains:availability");
    const captainsData = await Promise.all(
      captains.map(async (captainId) => {
        const meta = await redis.hgetall(`drivers:meta:${captainId}`);
        if (!meta || !meta.lat || !meta.lng) return null;
        
        const user = await UserV1.findById(captainId).select("profile phone vehicle");
        
        return {
          id: captainId,
          coords: {
            latitude: parseFloat(meta.lat),
            longitude: parseFloat(meta.lng)
          },
          socketId: meta.socketId,
          profile: user?.profile || null,
          phone: user?.phone || null,
          vehicle: user?.vehicle || null,
          lastUpdate: meta.lastUpdate || new Date().toISOString()
        };
      })
    );

    res.status(StatusCodes.OK).json({
      captains: captainsData.filter(c => c !== null)
    });
  } catch (error) {
    console.error("Error getting live captains:", error);
    throw new BadRequestError("Failed to get live captains");
  }
};

module.exports = {
  getStats,
  getLiveCaptains,
};
