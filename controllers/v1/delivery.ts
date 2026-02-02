import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Delivery, { IDelivery } from "../../models/Delivery";
import Store from "../../models/Store";
import ProductV1 from "../../models/ProductV1";
import UserV1 from "../../models/UserV1";
import { NotFoundError, BadRequestError } from "../../errors";
import { calculateDistance, calculateDeliveryFee, generateOTP } from "../../utils/mapUtils";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    phone: string;
  };
}

interface DeliveryItem {
  productId: string;
  quantity: number;
}

interface Address {
  street: string;
  city: string;
  latitude: number;
  longitude: number;
  instructions?: string;
}

export const createDelivery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { storeId, items, deliveryType, pickupAddress, deliveryAddress, paymentMethod } = req.body;

  if (!storeId || !items || !deliveryType || !pickupAddress || !deliveryAddress) {
    throw new BadRequestError("Store ID, items, delivery type, pickup and delivery addresses are required");
  }

  const store = await Store.findById(storeId);
  if (!store) {
    throw new NotFoundError("Store not found");
  }

  if (!store.isActive) {
    throw new BadRequestError("Store is not currently active");
  }

  let subtotal = 0;
  const validItems: any[] = [];

  for (const item of items as DeliveryItem[]) {
    const product = await ProductV1.findById(item.productId).populate("store");
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

  if (subtotal < store.minimumOrderAmount) {
    throw new BadRequestError(`Minimum order amount is $${store.minimumOrderAmount}`);
  }

  const deliveryDistance = calculateDistance(
    pickupAddress.latitude,
    pickupAddress.longitude,
    deliveryAddress.latitude,
    deliveryAddress.longitude
  );

  const deliveryFee = calculateDeliveryFee(deliveryDistance, store.deliveryFee);
  const tax = subtotal * store.taxRate;
  const total = subtotal + tax + deliveryFee;

  const delivery = new Delivery({
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
    await ProductV1.findByIdAndUpdate(item.product, {
      $inc: { inventory: -item.quantity, salesCount: item.quantity },
    });
  }

  await Store.findByIdAndUpdate(storeId, {
    $inc: { totalOrders: 1 },
  });

  res.status(StatusCodes.CREATED).json({
    message: "Delivery order created successfully",
    delivery,
  });
};

export const getMyDeliveries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user.id;
  const { status, limit = 20, page = 1 } = req.query;

  const query: any = { customer: userId };
  if (status) {
    query.status = status;
  }

  const deliveries = await Delivery.find(query)
    .populate("store", "name logo address")
    .populate("captain", "profile.name profile.lastName vehicle.type phone")
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Delivery.countDocuments(query);

  res.status(StatusCodes.OK).json({
    message: "Deliveries retrieved successfully",
    count: deliveries.length,
    total,
    deliveries,
  });
};

export const getDeliveryById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { deliveryId } = req.params;
  const userId = req.user.id;

  const delivery = await Delivery.findOne({
    _id: deliveryId,
    $or: [{ customer: userId }, { captain: userId }],
  })
    .populate("store", "name logo address contact")
    .populate("captain", "profile.name profile.lastName vehicle phone")
    .populate("customer", "profile.name profile.lastName phone");

  if (!delivery) {
    throw new NotFoundError("Delivery not found");
  }

  res.status(StatusCodes.OK).json({
    message: "Delivery retrieved successfully",
    delivery,
  });
};

export const updateDeliveryStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { deliveryId } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  const delivery = await Delivery.findOne({
    _id: deliveryId,
    $or: [{ customer: userId }, { captain: userId }],
  });

  if (!delivery) {
    throw new NotFoundError("Delivery not found");
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

  res.status(StatusCodes.OK).json({
    message: `Delivery status updated to ${status}`,
    delivery,
  });
};

export const cancelDelivery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { deliveryId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const delivery = await Delivery.findOne({
    _id: deliveryId,
    $or: [{ customer: userId }, { captain: userId }],
  });

  if (!delivery) {
    throw new NotFoundError("Delivery not found");
  }

  if (delivery.status === "DELIVERED") {
    throw new BadRequestError("Cannot cancel a delivered delivery");
  }

  if (delivery.status === "CANCELLED") {
    throw new BadRequestError("Delivery is already cancelled");
  }

  delivery.status = "CANCELLED";
  delivery.cancellationReason = reason || "";
  delivery.cancelledBy = userId;
  await delivery.save();

  res.status(StatusCodes.OK).json({
    message: "Delivery cancelled successfully",
    delivery,
  });
};

export const rateDelivery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { deliveryId } = req.params;
  const { rating, review } = req.body;
  const userId = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
    throw new BadRequestError("Rating must be between 1 and 5");
  }

  const delivery = await Delivery.findById(deliveryId)
    .populate("customer")
    .populate("captain");

  if (!delivery) {
    throw new NotFoundError("Delivery not found");
  }

  if (delivery.customer._id.toString() !== userId) {
    throw new BadRequestError("Only customer can rate this delivery");
  }

  if (delivery.status !== "DELIVERED") {
    throw new BadRequestError("Can only rate delivered deliveries");
  }

  delivery.rating = rating;
  delivery.review = review || "";
  await delivery.save();

  const captain = await UserV1.findById(delivery.captain._id);
  if (captain) {
    const totalRatings = captain.rating.total + 1;
    const totalScore = captain.rating.average * captain.rating.total + rating;
    captain.rating.average = totalScore / totalRatings;
    captain.rating.total = totalRatings;
    await captain.save();
  }

  res.status(StatusCodes.OK).json({
    message: "Delivery rated successfully",
    delivery,
    captain: {
      id: captain?._id,
      rating: captain?.rating,
    },
  });
};

export const trackDelivery = async (req: Request, res: Response): Promise<void> => {
  const { trackingCode } = req.params;

  const delivery = await Delivery.findOne({ trackingCode })
    .populate("store", "name address")
    .populate("captain", "profile.name phone")
    .select("-otp");

  if (!delivery) {
    throw new NotFoundError("Delivery not found");
  }

  res.status(StatusCodes.OK).json({
    message: "Delivery tracked successfully",
    delivery,
  });
};
