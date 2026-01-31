const Delivery = require("../models/Delivery");
const Store = require("../models/Store");
const Product = require("../models/Product");
const User = require("../models/User");
const { NotFoundError, BadRequestError } = require("../errors");
const { StatusCodes } = require("http-status-codes");
const {
  calculateDistance,
  calculateDeliveryFee,
  generateOTP,
  getNearbyCaptainsFromRedis,
} = require("../utils/mapUtils");

const createDelivery = async (req, res) => {
  const { storeId, items, deliveryType, pickupAddress, deliveryAddress, paymentMethod } = req.body;

  if (!storeId || !items || !deliveryType || !pickupAddress || !deliveryAddress) {
    throw new BadRequestError("Store ID, items, delivery type, pickup and delivery addresses are required");
  }

  // Verify store exists and is active
  const store = await Store.findById(storeId);
  if (!store) {
    throw new NotFoundError("Store not found");
  }

  if (!store.isActive) {
    throw new BadRequestError("Store is not currently active");
  }

  // Verify items and calculate pricing
  let subtotal = 0;
  const validItems = [];
  
  for (const item of items) {
    const product = await Product.findById(item.productId).populate("store");
    if (!product || !product.isActive || !product.isAvailable) {
      throw new BadRequestError(`Product ${item.productId} is not available`);
    }
    
    if (product.inventory < item.quantity) {
      throw new BadRequestError(`Insufficient inventory for product ${product.name}`);
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

  // Check minimum order amount
  if (subtotal < store.minimumOrderAmount) {
    throw new BadRequestError(`Minimum order amount is $${store.minimumOrderAmount}`);
  }

  // Calculate delivery fee
  const deliveryDistance = calculateDistance(
    pickupAddress.latitude,
    pickupAddress.longitude,
    deliveryAddress.latitude,
    deliveryAddress.longitude
  );
  
  const deliveryFee = calculateDeliveryFee(deliveryDistance, store.deliveryFee);
  
  // Calculate tax
  const tax = subtotal * store.taxRate;
  
  // Calculate total
  let total = subtotal + tax + deliveryFee;
  
  // Apply discounts if any
  if (store.discount && store.discount > 0) {
    const discountAmount = total * (store.discount / 100);
    total -= discountAmount;
  }

  const customer = req.user;

  // Create delivery
  const delivery = new Delivery({
    deliveryType,
    store: storeId,
    customer: customer.id,
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

  // Generate tracking code and OTP
  delivery.generateTrackingCode();
  delivery.generateOTP();

  // Save delivery
  await delivery.save();

  // Update product inventory
  for (const item of validItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { inventory: -item.quantity, salesCount: item.quantity },
    });
  }

  // Update store statistics
  await Store.findByIdAndUpdate(storeId, {
    $inc: { totalOrders: 1 },
  });

  res.status(StatusCodes.CREATED).json({
    message: "Delivery order created successfully",
    delivery,
  });
};

const getMyDeliveries = async (req, res) => {
  const userId = req.user.id;
  const { status, limit = 20, page = 1 } = req.query;

  try {
    const query = {
      customer: userId,
    };

    if (status) {
      query.status = status;
    }

    const deliveries = await Delivery.find(query)
      .populate("store", "name logo address")
      .populate("captain", "profile.name vehicle.type")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Delivery.countDocuments(query);

    res.status(StatusCodes.OK).json({
      message: "Deliveries retrieved successfully",
      count: deliveries.length,
      total,
      deliveries,
    });
  } catch (error) {
    console.error("Error retrieving deliveries:", error);
    throw new BadRequestError("Failed to retrieve deliveries");
  }
};

const getDeliveryById = async (req, res) => {
  const { deliveryId } = req.params;
  const userId = req.user.id;

  if (!deliveryId) {
    throw new BadRequestError("Delivery ID is required");
  }

  try {
    const delivery = await Delivery.findOne({
      _id: deliveryId,
      $or: [{ customer: userId }, { captain: userId }, { store: userId }],
    })
      .populate("store", "name logo address categories")
      .populate("captain", "profile.name vehicle.type phone")
      .populate("items.product", "name images thumbnail");

    if (!delivery) {
      throw new NotFoundError("Delivery not found");
    }

    res.status(StatusCodes.OK).json({
      message: "Delivery retrieved successfully",
      delivery,
    });
  } catch (error) {
    console.error("Error retrieving delivery:", error);
    if (error.name === 'CastError') {
      throw new NotFoundError("Delivery not found");
    }
    throw new BadRequestError("Failed to retrieve delivery");
  }
};

const updateDeliveryStatus = async (req, res) => {
  const { deliveryId } = req.params;
  const { status, captainId } = req.body;

  if (!deliveryId || !status) {
    throw new BadRequestError("Delivery ID and status are required");
  }

  try {
    let delivery = await Delivery.findById(deliveryId)
      .populate("store")
      .populate("customer")
      .populate("captain");

    if (!delivery) {
      throw new NotFoundError("Delivery not found");
    }

    // Check if user has permission to update status
    const userId = req.user.id;
    if (delivery.customer._id.toString() !== userId && 
        delivery.captain._id.toString() !== userId &&
        delivery.store.owner.toString() !== userId) {
      throw new BadRequestError("You don't have permission to update this delivery");
    }

    // Validate status transition
    const validStatusTransitions = {
      PENDING: ["ASSIGNED", "CANCELLED"],
      ASSIGNED: ["PICKED_UP", "CANCELLED"],
      PICKED_UP: ["IN_TRANSIT"],
      IN_TRANSIT: ["DELIVERED", "FAILED"],
      DELIVERED: [],
      CANCELLED: [],
      FAILED: ["DELIVERED"],
    };

    if (!validStatusTransitions[delivery.status].includes(status)) {
      throw new BadRequestError(`Invalid status transition from ${delivery.status} to ${status}`);
    }

    // Update delivery status
    delivery.status = status;
    delivery.updatedAt = new Date();

    // Handle status-specific logic
    if (status === "ASSIGNED" && captainId) {
      delivery.captain = captainId;
    }

    if (status === "PICKED_UP") {
      delivery.pickup.actualTime = new Date();
    }

    if (status === "DELIVERED") {
      delivery.delivery.actualTime = new Date();
      // Update captain statistics
      if (delivery.captain) {
        await User.findByIdAndUpdate(delivery.captain._id, {
          $inc: { "statistics.totalDeliveries": 1 },
        });
      }
    }

    if (status === "CANCELLED") {
      delivery.cancellationReason = req.body.cancellationReason || "";
      delivery.cancelledBy = req.user.role;
      // Restore product inventory
      for (const item of delivery.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { inventory: item.quantity },
        });
      }
    }

    await delivery.save();

    // Emit real-time updates
    if (req.io) {
      req.io.to(`delivery_${deliveryId}`).emit("deliveryUpdate", delivery);
    }

    res.status(StatusCodes.OK).json({
      message: `Delivery status updated to ${status}`,
      delivery,
    });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    throw new BadRequestError("Failed to update delivery status");
  }
};

const cancelDelivery = async (req, res) => {
  const { deliveryId } = req.params;
  const { reason } = req.body;

  if (!deliveryId) {
    throw new BadRequestError("Delivery ID is required");
  }

  try {
    const delivery = await Delivery.findById(deliveryId)
      .populate("customer")
      .populate("captain")
      .populate("store");

    if (!delivery) {
      throw new NotFoundError("Delivery not found");
    }

    // Check if user has permission to cancel
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (delivery.customer._id.toString() !== userId && userRole !== "store_owner") {
      throw new BadRequestError("You don't have permission to cancel this delivery");
    }

    // Check if delivery can be cancelled
    if (delivery.status === "DELIVERED" || delivery.status === "PICKED_UP") {
      throw new BadRequestError("Cannot cancel a delivered or picked up delivery");
    }

    // Cancel delivery
    delivery.status = "CANCELLED";
    delivery.cancellationReason = reason || "";
    delivery.cancelledBy = userRole;
    delivery.updatedAt = new Date();

    await delivery.save();

    // Restore product inventory
    for (const item of delivery.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { inventory: item.quantity },
      });
    }

    // Emit real-time updates
    if (req.io) {
      req.io.to(`delivery_${deliveryId}`).emit("deliveryCancelled", {
        deliveryId,
        reason,
        cancelledBy: userRole,
      });
    }

    res.status(StatusCodes.OK).json({
      message: "Delivery cancelled successfully",
      delivery,
    });
  } catch (error) {
    console.error("Error cancelling delivery:", error);
    throw new BadRequestError("Failed to cancel delivery");
  }
};

const rateDelivery = async (req, res) => {
  const { deliveryId } = req.params;
  const { rating, review } = req.body;

  if (!deliveryId || !rating) {
    throw new BadRequestError("Delivery ID and rating are required");
  }

  if (rating < 1 || rating > 5) {
    throw new BadRequestError("Rating must be between 1 and 5");
  }

  try {
    const delivery = await Delivery.findById(deliveryId)
      .populate("customer")
      .populate("captain");

    if (!delivery) {
      throw new NotFoundError("Delivery not found");
    }

    // Check if user is the customer
    if (delivery.customer._id.toString() !== req.user.id) {
      throw new BadRequestError("Only the customer can rate this delivery");
    }

    // Check if delivery is completed
    if (delivery.status !== "DELIVERED") {
      throw new BadRequestError("Can only rate completed deliveries");
    }

    // Check if already rated
    if (delivery.rating) {
      throw new BadRequestError("Delivery already rated");
    }

    // Update delivery rating
    delivery.rating = rating;
    delivery.review = review || "";
    delivery.updatedAt = new Date();

    await delivery.save();

    // Update captain rating
    if (delivery.captain) {
      const captain = delivery.captain;
      const totalRatings = captain.rating.total + 1;
      const totalScore = captain.rating.average * captain.rating.total + rating;
      
      await User.findByIdAndUpdate(captain._id, {
        "rating.average": totalScore / totalRatings,
        "rating.total": totalRatings,
      });
    }

    res.status(StatusCodes.OK).json({
      message: "Delivery rated successfully",
      delivery,
    });
  } catch (error) {
    console.error("Error rating delivery:", error);
    throw new BadRequestError("Failed to rate delivery");
  }
};

const trackDelivery = async (req, res) => {
  const { trackingCode } = req.params;

  if (!trackingCode) {
    throw new BadRequestError("Tracking code is required");
  }

  try {
    const delivery = await Delivery.findOne({ trackingCode })
      .populate("store", "name logo address")
      .populate("captain", "profile.name vehicle.type phone")
      .populate("items.product", "name images thumbnail");

    if (!delivery) {
      throw new NotFoundError("Delivery not found");
    }

    res.status(StatusCodes.OK).json({
      message: "Tracking information retrieved successfully",
      delivery,
    });
  } catch (error) {
    console.error("Error tracking delivery:", error);
    throw new BadRequestError("Failed to track delivery");
  }
};

module.exports = {
  createDelivery,
  getMyDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  cancelDelivery,
  rateDelivery,
  trackDelivery,
};