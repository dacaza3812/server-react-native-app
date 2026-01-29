const Store = require("../models/Store");
const Product = require("../models/Product");
const User = require("../models/User");
const { NotFoundError, BadRequestError } = require("../errors");
const { StatusCodes } = require("http-status-codes");
const { calculateDistance } = require("../utils/mapUtils");

const createStore = async (req, res) => {
  const {
    name,
    description,
    address,
    contact,
    businessHours,
    categories,
    logo,
    banner,
    deliveryRadius,
    averageDeliveryTime,
    minimumOrderAmount,
    deliveryFee,
    taxRate,
    paymentMethods,
  } = req.body;

  if (!name || !address || !contact || !categories) {
    throw new BadRequestError("Store name, address, contact, and categories are required");
  }

  const owner = req.user.id;

  // Check if user already owns a store
  const existingStore = await Store.findOne({ owner });
  if (existingStore) {
    throw new BadRequestError("You already own a store");
  }

  const store = new Store({
    name,
    description,
    address,
    contact,
    businessHours,
    categories,
    logo,
    banner,
    deliveryRadius,
    averageDeliveryTime,
    minimumOrderAmount,
    deliveryFee,
    taxRate,
    paymentMethods,
    owner,
  });

  await store.save();

  // Update user role to store_owner
  await User.findByIdAndUpdate(owner, {
    role: "store_owner",
  });

  res.status(StatusCodes.CREATED).json({
    message: "Store created successfully",
    store,
  });
};

const getMyStores = async (req, res) => {
  const userId = req.user.id;

  try {
    const stores = await Store.find({ owner: userId })
      .populate("owner", "profile.name email phone")
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      message: "Stores retrieved successfully",
      count: stores.length,
      stores,
    });
  } catch (error) {
    console.error("Error retrieving stores:", error);
    throw new BadRequestError("Failed to retrieve stores");
  }
};

const getStoreById = async (req, res) => {
  const { storeId } = req.params;

  if (!storeId) {
    throw new BadRequestError("Store ID is required");
  }

  try {
    const store = await Store.findById(storeId)
      .populate("owner", "profile.name email phone")
      .populate("categories");

    if (!store) {
      throw new NotFoundError("Store not found");
    }

    res.status(StatusCodes.OK).json({
      message: "Store retrieved successfully",
      store,
    });
  } catch (error) {
    console.error("Error retrieving store:", error);
    throw new BadRequestError("Failed to retrieve store");
  }
};

const getNearbyStores = async (req, res) => {
  const { latitude, longitude, radius = 10000, category } = req.query;

  if (!latitude || !longitude) {
    throw new BadRequestError("Latitude and longitude are required");
  }

  try {
    const query = {
      "address.latitude": { $exists: true },
      "address.longitude": { $exists: true },
      isActive: true,
    };

    // Add category filter if provided
    if (category) {
      query.categories = category;
    }

    const stores = await Store.find(query)
      .select("name description logo address categories averageDeliveryTime minimumOrderAmount deliveryFee rating total")
      .lean();

    // Calculate distances and filter by radius
    const nearbyStores = stores
      .map(store => {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          store.address.latitude,
          store.address.longitude
        );
        
        return {
          ...store,
          distance,
        };
      })
      .filter(store => store.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    res.status(StatusCodes.OK).json({
      message: "Nearby stores retrieved successfully",
      count: nearbyStores.length,
      stores: nearbyStores,
    });
  } catch (error) {
    console.error("Error retrieving nearby stores:", error);
    throw new BadRequestError("Failed to retrieve nearby stores");
  }
};

const updateStore = async (req, res) => {
  const { storeId } = req.params;
  const updates = req.body;

  if (!storeId) {
    throw new BadRequestError("Store ID is required");
  }

  try {
    const store = await Store.findById(storeId);

    if (!store) {
      throw new NotFoundError("Store not found");
    }

    // Check if user owns the store
    if (store.owner.toString() !== req.user.id) {
      throw new BadRequestError("You don't have permission to update this store");
    }

    // Update store
    Object.assign(store, updates);
    await store.save();

    res.status(StatusCodes.OK).json({
      message: "Store updated successfully",
      store,
    });
  } catch (error) {
    console.error("Error updating store:", error);
    throw new BadRequestError("Failed to update store");
  }
};

const deleteStore = async (req, res) => {
  const { storeId } = req.params;

  if (!storeId) {
    throw new BadRequestError("Store ID is required");
  }

  try {
    const store = await Store.findById(storeId);

    if (!store) {
      throw new NotFoundError("Store not found");
    }

    // Check if user owns the store
    if (store.owner.toString() !== req.user.id) {
      throw new BadRequestError("You don't have permission to delete this store");
    }

    // Check if store has active orders
    const activeOrders = await Delivery.countDocuments({ store: storeId, status: { $in: ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"] } });
    if (activeOrders > 0) {
      throw new BadRequestError("Cannot delete store with active orders");
    }

    await Store.findByIdAndDelete(storeId);

    res.status(StatusCodes.OK).json({
      message: "Store deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting store:", error);
    throw new BadRequestError("Failed to delete store");
  }
};

const getStoreOrders = async (req, res) => {
  const { storeId } = req.params;
  const { status, limit = 20, page = 1 } = req.query;

  if (!storeId) {
    throw new BadRequestError("Store ID is required");
  }

  try {
    const query = { store: storeId };

    if (status) {
      query.status = status;
    }

    const deliveries = await Delivery.find(query)
      .populate("customer", "profile.name phone")
      .populate("captain", "profile.name phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Delivery.countDocuments(query);

    res.status(StatusCodes.OK).json({
      message: "Store orders retrieved successfully",
      count: deliveries.length,
      total,
      deliveries,
    });
  } catch (error) {
    console.error("Error retrieving store orders:", error);
    throw new BadRequestError("Failed to retrieve store orders");
  }
};

const updateStoreStatus = async (req, res) => {
  const { storeId } = req.params;
  const { isActive } = req.body;

  if (!storeId || isActive === undefined) {
    throw new BadRequestError("Store ID and status are required");
  }

  try {
    const store = await Store.findById(storeId);

    if (!store) {
      throw new NotFoundError("Store not found");
    }

    // Check if user owns the store
    if (store.owner.toString() !== req.user.id) {
      throw new BadRequestError("You don't have permission to update this store");
    }

    // Update store status
    store.isActive = isActive;
    await store.save();

    res.status(StatusCodes.OK).json({
      message: `Store status updated to ${isActive ? "active" : "inactive"}`,
      store,
    });
  } catch (error) {
    console.error("Error updating store status:", error);
    throw new BadRequestError("Failed to update store status");
  }
};

const getStoreStats = async (req, res) => {
  const { storeId } = req.params;

  if (!storeId) {
    throw new BadRequestError("Store ID is required");
  }

  try {
    const store = await Store.findById(storeId);
    if (!store) {
      throw new NotFoundError("Store not found");
    }

    // Check if user owns the store
    if (store.owner.toString() !== req.user.id) {
      throw new BadRequestError("You don't have permission to view these stats");
    }

    // Get statistics
    const totalOrders = await Delivery.countDocuments({ store: storeId });
    const completedOrders = await Delivery.countDocuments({ 
      store: storeId, 
      status: "DELIVERED" 
    });
    const cancelledOrders = await Delivery.countDocuments({ 
      store: storeId, 
      status: "CANCELLED" 
    });
    const pendingOrders = await Delivery.countDocuments({ 
      store: storeId, 
      status: "PENDING" 
    });

    // Calculate total revenue
    const totalRevenue = await Delivery.aggregate([
      { $match: { store: storeId, status: "DELIVERED" } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } }
    ]);

    const avgRating = store.rating.average;
    const totalRatings = store.rating.total;

    res.status(StatusCodes.OK).json({
      message: "Store statistics retrieved successfully",
      stats: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        avgRating,
        totalRatings,
        conversionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      },
    });
  } catch (error) {
    console.error("Error retrieving store stats:", error);
    throw new BadRequestError("Failed to retrieve store stats");
  }
};

module.exports = {
  createStore,
  getMyStores,
  getStoreById,
  getNearbyStores,
  updateStore,
  deleteStore,
  getStoreOrders,
  updateStoreStatus,
  getStoreStats,
};