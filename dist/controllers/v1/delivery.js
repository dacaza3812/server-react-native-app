"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackDelivery = exports.rateDelivery = exports.cancelDelivery = exports.updateDeliveryStatus = exports.getDeliveryById = exports.getMyDeliveries = exports.createDelivery = void 0;
const http_status_codes_1 = require("http-status-codes");
const Delivery_1 = __importDefault(require("../../models/Delivery"));
const Store_1 = __importDefault(require("../../models/Store"));
const ProductV1_1 = __importDefault(require("../../models/ProductV1"));
const UserV1_1 = __importDefault(require("../../models/UserV1"));
const errors_1 = require("../../errors");
const mapUtils_1 = require("../../utils/mapUtils");
const createDelivery = async (req, res) => {
    const { storeId, items, deliveryType, pickupAddress, deliveryAddress, paymentMethod } = req.body;
    if (!storeId || !items || !deliveryType || !pickupAddress || !deliveryAddress) {
        throw new errors_1.BadRequestError("Store ID, items, delivery type, pickup and delivery addresses are required");
    }
    const store = await Store_1.default.findById(storeId);
    if (!store) {
        throw new errors_1.NotFoundError("Store not found");
    }
    if (!store.isActive) {
        throw new errors_1.BadRequestError("Store is not currently active");
    }
    let subtotal = 0;
    const validItems = [];
    for (const item of items) {
        const product = await ProductV1_1.default.findById(item.productId).populate("store");
        if (!product || !product.isActive || !product.isAvailable) {
            throw new errors_1.BadRequestError(`Product ${item.productId} is not available`);
        }
        if (product.inventory < item.quantity) {
            throw new errors_1.BadRequestError(`Insufficient inventory for product ${product.name}`);
        }
        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;
        validItems.push({
            product: product._id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            subtotal: itemSubtotal,
        });
    }
    if (subtotal < store.minimumOrderAmount) {
        throw new errors_1.BadRequestError(`Minimum order amount is $${store.minimumOrderAmount}`);
    }
    const deliveryDistance = (0, mapUtils_1.calculateDistance)(pickupAddress.latitude, pickupAddress.longitude, deliveryAddress.latitude, deliveryAddress.longitude);
    const deliveryFee = (0, mapUtils_1.calculateDeliveryFee)(deliveryDistance, store.deliveryFee);
    const tax = subtotal * store.taxRate;
    const total = subtotal + tax + deliveryFee;
    const delivery = new Delivery_1.default({
        deliveryType,
        store: storeId,
        customer: req.user.id,
        items: validItems,
        pickup: {
            address: pickupAddress,
            latitude: pickupAddress.latitude,
            longitude: pickupAddress.longitude,
            estimatedTime: new Date(Date.now() + store.averageDeliveryTime * 60000),
        },
        delivery: {
            address: deliveryAddress,
            latitude: deliveryAddress.latitude,
            longitude: deliveryAddress.longitude,
            instructions: deliveryAddress.instructions || "",
        },
        pricing: {
            subtotal,
            tax,
            deliveryFee,
            total,
            currency: "MXN",
        },
        paymentMethod,
        paymentStatus: "PENDING",
    });
    delivery.generateTrackingCode();
    delivery.generateOTP();
    await delivery.save();
    for (const item of validItems) {
        await ProductV1_1.default.findByIdAndUpdate(item.product, {
            $inc: { inventory: -item.quantity, salesCount: item.quantity },
        });
    }
    await Store_1.default.findByIdAndUpdate(storeId, {
        $inc: { totalOrders: 1 },
    });
    res.status(http_status_codes_1.StatusCodes.CREATED).json({
        message: "Delivery order created successfully",
        delivery,
    });
};
exports.createDelivery = createDelivery;
const getMyDeliveries = async (req, res) => {
    const userId = req.user.id;
    const { status, limit = 20, page = 1 } = req.query;
    const query = { customer: userId };
    if (status) {
        query.status = status;
    }
    const deliveries = await Delivery_1.default.find(query)
        .populate("store", "name logo address")
        .populate("captain", "profile.name profile.lastName vehicle.type phone")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));
    const total = await Delivery_1.default.countDocuments(query);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Deliveries retrieved successfully",
        count: deliveries.length,
        total,
        deliveries,
    });
};
exports.getMyDeliveries = getMyDeliveries;
const getDeliveryById = async (req, res) => {
    const { deliveryId } = req.params;
    const userId = req.user.id;
    const delivery = await Delivery_1.default.findOne({
        _id: deliveryId,
        $or: [{ customer: userId }, { captain: userId }],
    })
        .populate("store", "name logo address contact")
        .populate("captain", "profile.name profile.lastName vehicle phone")
        .populate("customer", "profile.name profile.lastName phone");
    if (!delivery) {
        throw new errors_1.NotFoundError("Delivery not found");
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Delivery retrieved successfully",
        delivery,
    });
};
exports.getDeliveryById = getDeliveryById;
const updateDeliveryStatus = async (req, res) => {
    const { deliveryId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const delivery = await Delivery_1.default.findOne({
        _id: deliveryId,
        $or: [{ customer: userId }, { captain: userId }],
    });
    if (!delivery) {
        throw new errors_1.NotFoundError("Delivery not found");
    }
    delivery.status = status;
    delivery.updatedAt = new Date();
    if (status === "PICKED_UP") {
        delivery.pickup.actualTime = new Date();
    }
    if (status === "DELIVERED") {
        delivery.delivery.actualTime = new Date();
    }
    await delivery.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: `Delivery status updated to ${status}`,
        delivery,
    });
};
exports.updateDeliveryStatus = updateDeliveryStatus;
const cancelDelivery = async (req, res) => {
    const { deliveryId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const delivery = await Delivery_1.default.findOne({
        _id: deliveryId,
        $or: [{ customer: userId }, { captain: userId }],
    });
    if (!delivery) {
        throw new errors_1.NotFoundError("Delivery not found");
    }
    if (delivery.status === "DELIVERED") {
        throw new errors_1.BadRequestError("Cannot cancel a delivered delivery");
    }
    if (delivery.status === "CANCELLED") {
        throw new errors_1.BadRequestError("Delivery is already cancelled");
    }
    delivery.status = "CANCELLED";
    delivery.cancellationReason = reason || "";
    delivery.cancelledBy = userId;
    await delivery.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Delivery cancelled successfully",
        delivery,
    });
};
exports.cancelDelivery = cancelDelivery;
const rateDelivery = async (req, res) => {
    const { deliveryId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;
    if (!rating || rating < 1 || rating > 5) {
        throw new errors_1.BadRequestError("Rating must be between 1 and 5");
    }
    const delivery = await Delivery_1.default.findById(deliveryId)
        .populate("customer")
        .populate("captain");
    if (!delivery) {
        throw new errors_1.NotFoundError("Delivery not found");
    }
    if (delivery.customer._id.toString() !== userId) {
        throw new errors_1.BadRequestError("Only customer can rate this delivery");
    }
    if (delivery.status !== "DELIVERED") {
        throw new errors_1.BadRequestError("Can only rate delivered deliveries");
    }
    delivery.rating = rating;
    delivery.review = review || "";
    await delivery.save();
    const captain = await UserV1_1.default.findById(delivery.captain._id);
    if (captain) {
        const totalRatings = captain.rating.total + 1;
        const totalScore = captain.rating.average * captain.rating.total + rating;
        captain.rating.average = totalScore / totalRatings;
        captain.rating.total = totalRatings;
        await captain.save();
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Delivery rated successfully",
        delivery,
        captain: {
            id: captain?._id,
            rating: captain?.rating,
        },
    });
};
exports.rateDelivery = rateDelivery;
const trackDelivery = async (req, res) => {
    const { trackingCode } = req.params;
    const delivery = await Delivery_1.default.findOne({ trackingCode })
        .populate("store", "name address")
        .populate("captain", "profile.name phone")
        .select("-otp");
    if (!delivery) {
        throw new errors_1.NotFoundError("Delivery not found");
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Delivery tracked successfully",
        delivery,
    });
};
exports.trackDelivery = trackDelivery;
//# sourceMappingURL=delivery.js.map