"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoreStats = exports.getStoreOrders = exports.deleteStore = exports.updateStoreStatus = exports.updateStore = exports.getNearbyStores = exports.getStoreById = exports.getMyStores = exports.createStore = void 0;
const http_status_codes_1 = require("http-status-codes");
const Store_1 = __importDefault(require("../../models/Store"));
const ProductV1_1 = __importDefault(require("../../models/ProductV1"));
const UserV1_1 = __importDefault(require("../../models/UserV1"));
const Delivery_1 = __importDefault(require("../../models/Delivery"));
const errors_1 = require("../../errors");
const createStore = async (req, res) => {
    const { name, description, address, contact, categories, deliveryRadius } = req.body;
    if (!name || !address || !contact || !categories) {
        throw new errors_1.BadRequestError("Store name, address, contact, and categories are required");
    }
    const owner = req.user.id;
    const store = new Store_1.default({
        name,
        description,
        address,
        contact,
        categories,
        deliveryRadius,
        owner,
    });
    await store.save();
    await UserV1_1.default.findByIdAndUpdate(owner, {
        $push: { stores: store._id },
    });
    res.status(http_status_codes_1.StatusCodes.CREATED).json({
        message: "Store created successfully",
        store,
    });
};
exports.createStore = createStore;
const getMyStores = async (req, res) => {
    const userId = req.user.id;
    const stores = await Store_1.default.find({ owner: userId })
        .populate("owner", "profile.name profile.lastName email phone")
        .sort({ createdAt: -1 });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Stores retrieved successfully",
        count: stores.length,
        stores,
    });
};
exports.getMyStores = getMyStores;
const getStoreById = async (req, res) => {
    const { storeId } = req.params;
    const store = await Store_1.default.findById(storeId).populate("owner", "profile.name profile.lastName");
    if (!store) {
        throw new errors_1.NotFoundError("Store not found");
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Store retrieved successfully",
        store,
    });
};
exports.getStoreById = getStoreById;
const getNearbyStores = async (req, res) => {
    const { lat, lng, radius = 10000 } = req.query;
    if (!lat || !lng) {
        throw new errors_1.BadRequestError("Latitude and longitude are required");
    }
    const stores = await Store_1.default.find({
        isActive: true,
        "address.latitude": { $exists: true },
        "address.longitude": { $exists: true },
    }).limit(50);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Nearby stores retrieved successfully",
        count: stores.length,
        stores,
    });
};
exports.getNearbyStores = getNearbyStores;
const updateStore = async (req, res) => {
    const { storeId } = req.params;
    const updates = req.body;
    const store = await Store_1.default.findOne({ _id: storeId, owner: req.user.id });
    if (!store) {
        throw new errors_1.NotFoundError("Store not found");
    }
    Object.assign(store, updates);
    await store.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Store updated successfully",
        store,
    });
};
exports.updateStore = updateStore;
const updateStoreStatus = async (req, res) => {
    const { storeId } = req.params;
    const { isActive } = req.body;
    const store = await Store_1.default.findOne({ _id: storeId, owner: req.user.id });
    if (!store) {
        throw new errors_1.NotFoundError("Store not found");
    }
    store.isActive = isActive;
    await store.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: `Store ${isActive ? "activated" : "deactivated"} successfully`,
        store,
    });
};
exports.updateStoreStatus = updateStoreStatus;
const deleteStore = async (req, res) => {
    const { storeId } = req.params;
    const store = await Store_1.default.findOne({ _id: storeId, owner: req.user.id });
    if (!store) {
        throw new errors_1.NotFoundError("Store not found");
    }
    await Store_1.default.findByIdAndDelete(storeId);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Store deleted successfully",
    });
};
exports.deleteStore = deleteStore;
const getStoreOrders = async (req, res) => {
    const { storeId } = req.params;
    const userId = req.user.id;
    const store = await Store_1.default.findOne({ _id: storeId, owner: userId });
    if (!store) {
        throw new errors_1.NotFoundError("Store not found");
    }
    const orders = await Delivery_1.default.find({ store: storeId })
        .populate("customer", "profile.name profile.lastName phone")
        .populate("captain", "profile.name profile.lastName vehicle.type phone")
        .sort({ createdAt: -1 });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Store orders retrieved successfully",
        count: orders.length,
        orders,
    });
};
exports.getStoreOrders = getStoreOrders;
const getStoreStats = async (req, res) => {
    const { storeId } = req.params;
    const userId = req.user.id;
    const store = await Store_1.default.findOne({ _id: storeId, owner: userId });
    if (!store) {
        throw new errors_1.NotFoundError("Store not found");
    }
    const totalOrders = await Delivery_1.default.countDocuments({ store: storeId });
    const pendingOrders = await Delivery_1.default.countDocuments({ store: storeId, status: "PENDING" });
    const completedOrders = await Delivery_1.default.countDocuments({ store: storeId, status: "DELIVERED" });
    const products = await ProductV1_1.default.countDocuments({ store: storeId });
    const lowInventoryProducts = await ProductV1_1.default.countDocuments({
        store: storeId,
        $expr: { $lte: ["$inventory", "$lowInventoryThreshold"] },
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Store stats retrieved successfully",
        stats: {
            totalOrders,
            pendingOrders,
            completedOrders,
            products,
            lowInventoryProducts,
            rating: store.ratings,
        },
    });
};
exports.getStoreStats = getStoreStats;
//# sourceMappingURL=store.js.map