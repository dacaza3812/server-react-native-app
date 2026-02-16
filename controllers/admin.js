const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const jwt = require("jsonwebtoken");
const UserV1 = require("../models/UserV1");
const RideV1 = require("../models/RideV1");
const Delivery = require("../models/Delivery");
const Store = require("../models/Store");
const ProductV1 = require("../models/ProductV1");
const { redis } = require("../utils/redisClient");

// Mock admin credentials
const ADMIN_EMAIL = "david383812@gmail.com";
const ADMIN_PASSWORD = "12345678";

// Admin Login
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Email and password are required");
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    throw new BadRequestError("Invalid credentials");
  }

  // Create admin token
  const token = jwt.sign(
    { 
      id: "admin",
      email: ADMIN_EMAIL,
      role: "admin"
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "24h" }
  );

  res.status(StatusCodes.OK).json({
    message: "Admin login successful",
    token,
    user: {
      email: ADMIN_EMAIL,
      role: "admin"
    }
  });
};

// Get Dashboard Stats
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

    // Get ride status counts
    const rideStatuses = await RideV1.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Get delivery status counts
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

// Get Live Captains
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

// ============== USERS ==============
const getUsers = async (req, res) => {
  const { role, isActive, page = 1, limit = 20, search } = req.query;
  const query = {};
  
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (search) {
    query.$or = [
      { phone: { $regex: search, $options: "i" } },
      { "profile.name": { $regex: search, $options: "i" } },
      { "profile.email": { $regex: search, $options: "i" } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [users, total] = await Promise.all([
    UserV1.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    UserV1.countDocuments(query)
  ]);

  res.status(StatusCodes.OK).json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

const getUserById = async (req, res) => {
  const user = await UserV1.findById(req.params.id).select("-password");
  if (!user) {
    throw new NotFoundError("User not found");
  }
  res.status(StatusCodes.OK).json({ user });
};

const createUser = async (req, res) => {
  const { phone, password, role, ...otherData } = req.body;
  
  if (!phone || !password || !role) {
    throw new BadRequestError("Phone, password and role are required");
  }

  const existingUser = await UserV1.findOne({ phone });
  if (existingUser) {
    throw new BadRequestError("Phone number already registered");
  }

  const user = new UserV1({
    phone,
    password,
    role,
    ...otherData
  });

  await user.save();
  
  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(StatusCodes.CREATED).json({
    message: "User created successfully",
    user: userResponse
  });
};

const updateUser = async (req, res) => {
  const user = await UserV1.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(StatusCodes.OK).json({
    message: "User updated successfully",
    user
  });
};

const deleteUser = async (req, res) => {
  const user = await UserV1.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  res.status(StatusCodes.OK).json({
    message: "User deleted successfully"
  });
};

// ============== RIDES ==============
const getRides = async (req, res) => {
  const { status, customer, captain, page = 1, limit = 20 } = req.query;
  const query = {};
  
  if (status) query.status = status;
  if (customer) query.customer = customer;
  if (captain) query.captain = captain;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [rides, total] = await Promise.all([
    RideV1.find(query)
      .populate("customer captain", "profile phone")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    RideV1.countDocuments(query)
  ]);

  res.status(StatusCodes.OK).json({
    rides,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

const getRideById = async (req, res) => {
  const ride = await RideV1.findById(req.params.id)
    .populate("customer captain", "profile phone");
  if (!ride) {
    throw new NotFoundError("Ride not found");
  }
  res.status(StatusCodes.OK).json({ ride });
};

const createRide = async (req, res) => {
  const ride = new Ride(req.body);
  await RideV1.save();
  res.status(StatusCodes.CREATED).json({
    message: "Ride created successfully",
    ride
  });
};

const updateRide = async (req, res) => {
  const ride = await RideV1.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!ride) {
    throw new NotFoundError("Ride not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Ride updated successfully",
    ride
  });
};

const deleteRide = async (req, res) => {
  const ride = await RideV1.findByIdAndDelete(req.params.id);
  if (!ride) {
    throw new NotFoundError("Ride not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Ride deleted successfully"
  });
};

// ============== DELIVERIES ==============
const getDeliveries = async (req, res) => {
  const { status, store, customer, captain, page = 1, limit = 20 } = req.query;
  const query = {};
  
  if (status) query.status = status;
  if (store) query.store = store;
  if (customer) query.customer = customer;
  if (captain) query.captain = captain;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [deliveries, total] = await Promise.all([
    Delivery.find(query)
      .populate("store customer captain", "name profile phone")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Delivery.countDocuments(query)
  ]);

  res.status(StatusCodes.OK).json({
    deliveries,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

const getDeliveryById = async (req, res) => {
  const delivery = await Delivery.findById(req.params.id)
    .populate("store customer captain", "name profile phone");
  if (!delivery) {
    throw new NotFoundError("Delivery not found");
  }
  res.status(StatusCodes.OK).json({ delivery });
};

const createDelivery = async (req, res) => {
  const delivery = new Delivery(req.body);
  delivery.generateTrackingCode();
  delivery.generateOTP();
  await delivery.save();
  res.status(StatusCodes.CREATED).json({
    message: "Delivery created successfully",
    delivery
  });
};

const updateDelivery = async (req, res) => {
  const delivery = await Delivery.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!delivery) {
    throw new NotFoundError("Delivery not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Delivery updated successfully",
    delivery
  });
};

const deleteDelivery = async (req, res) => {
  const delivery = await Delivery.findByIdAndDelete(req.params.id);
  if (!delivery) {
    throw new NotFoundError("Delivery not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Delivery deleted successfully"
  });
};

// ============== STORES ==============
const getStores = async (req, res) => {
  const { isActive, category, page = 1, limit = 20, search } = req.query;
  const query = {};
  
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (category) query.categories = category;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [stores, total] = await Promise.all([
    Store.find(query)
      .populate("owner", "profile phone")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    Store.countDocuments(query)
  ]);

  res.status(StatusCodes.OK).json({
    stores,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

const getStoreById = async (req, res) => {
  const store = await Store.findById(req.params.id)
    .populate("owner", "profile phone");
  if (!store) {
    throw new NotFoundError("Store not found");
  }
  res.status(StatusCodes.OK).json({ store });
};

const createStore = async (req, res) => {
  const store = new Store(req.body);
  await store.save();
  res.status(StatusCodes.CREATED).json({
    message: "Store created successfully",
    store
  });
};

const updateStore = async (req, res) => {
  const store = await Store.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!store) {
    throw new NotFoundError("Store not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Store updated successfully",
    store
  });
};

const deleteStore = async (req, res) => {
  const store = await Store.findByIdAndDelete(req.params.id);
  if (!store) {
    throw new NotFoundError("Store not found");
  }
  // Delete associated products
  await ProductV1.deleteMany({ store: req.params.id });
  res.status(StatusCodes.OK).json({
    message: "Store and associated products deleted successfully"
  });
};

// ============== PRODUCTS ==============
const getProducts = async (req, res) => {
  const { store, isActive, isAvailable, page = 1, limit = 20, search } = req.query;
  const query = {};
  
  if (store) query.store = store;
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (isAvailable !== undefined) query.isAvailable = isAvailable === "true";
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [products, total] = await Promise.all([
    ProductV1.find(query)
      .populate("store", "name")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    ProductV1.countDocuments(query)
  ]);

  res.status(StatusCodes.OK).json({
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

const getProductById = async (req, res) => {
  const product = await ProductV1.findById(req.params.id)
    .populate("store", "name");
  if (!product) {
    throw new NotFoundError("Product not found");
  }
  res.status(StatusCodes.OK).json({ product });
};

const createProduct = async (req, res) => {
  const product = new Product(req.body);
  await ProductV1.save();
  res.status(StatusCodes.CREATED).json({
    message: "Product created successfully",
    product
  });
};

const updateProduct = async (req, res) => {
  const product = await ProductV1.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!product) {
    throw new NotFoundError("Product not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Product updated successfully",
    product
  });
};

const deleteProduct = async (req, res) => {
  const product = await ProductV1.findByIdAndDelete(req.params.id);
  if (!product) {
    throw new NotFoundError("Product not found");
  }
  res.status(StatusCodes.OK).json({
    message: "Product deleted successfully"
  });
};

module.exports = {
  adminLogin,
  getStats,
  getLiveCaptains,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRides,
  getRideById,
  createRide,
  updateRide,
  deleteRide,
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
