import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Store from "../../models/Store";
import ProductV1 from "../../models/ProductV1";
import UserV1 from "../../models/UserV1";
import Delivery from "../../models/Delivery";
import { NotFoundError, BadRequestError } from "../../errors";

interface AuthRequest extends Request {
  user: { id: string; phone: string };
  io?: any;
}

export const createStore = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, address, contact, categories, deliveryRadius } = req.body;

  if (!name || !address || !contact || !categories) {
    throw new BadRequestError("Store name, address, contact, and categories are required");
  }

  const owner = req.user.id;

  const store = new Store({
    name,
    description,
    address,
    contact,
    categories,
    deliveryRadius,
    owner,
  });

  await store.save();

  await UserV1.findByIdAndUpdate(owner, {
    $push: { stores: store._id },
  });

  res.status(StatusCodes.CREATED).json({
    message: "Store created successfully",
    store,
  });
};

export const getMyStores = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user.id;

  const stores = await Store.find({ owner: userId })
    .populate("owner", "profile.name profile.lastName email phone")
    .sort({ createdAt: -1 });

  res.status(StatusCodes.OK).json({
    message: "Stores retrieved successfully",
    count: stores.length,
    stores,
  });
};

export const getStoreById = async (req: Request, res: Response): Promise<void> => {
  const { storeId } = req.params;

  const store = await Store.findById(storeId).populate("owner", "profile.name profile.lastName");

  if (!store) {
    throw new NotFoundError("Store not found");
  }

  res.status(StatusCodes.OK).json({
    message: "Store retrieved successfully",
    store,
  });
};

export const getNearbyStores = async (req: Request, res: Response): Promise<void> => {
  const { lat, lng, radius = 10000 } = req.query;

  if (!lat || !lng) {
    throw new BadRequestError("Latitude and longitude are required");
  }

  const stores = await Store.find({
    isActive: true,
    "address.latitude": { $exists: true },
    "address.longitude": { $exists: true },
  }).limit(50);

  res.status(StatusCodes.OK).json({
    message: "Nearby stores retrieved successfully",
    count: stores.length,
    stores,
  });
};

export const updateStore = async (req: AuthRequest, res: Response): Promise<void> => {
  const { storeId } = req.params;
  const updates = req.body;

  const store = await Store.findOne({ _id: storeId, owner: req.user.id });

  if (!store) {
    throw new NotFoundError("Store not found");
  }

  Object.assign(store, updates);
  await store.save();

  res.status(StatusCodes.OK).json({
    message: "Store updated successfully",
    store,
  });
};

export const updateStoreStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { storeId } = req.params;
  const { isActive } = req.body;

  const store = await Store.findOne({ _id: storeId, owner: req.user.id });

  if (!store) {
    throw new NotFoundError("Store not found");
  }

  store.isActive = isActive;
  await store.save();

  res.status(StatusCodes.OK).json({
    message: `Store ${isActive ? "activated" : "deactivated"} successfully`,
    store,
  });
};

export const deleteStore = async (req: AuthRequest, res: Response): Promise<void> => {
  const { storeId } = req.params;

  const store = await Store.findOne({ _id: storeId, owner: req.user.id });

  if (!store) {
    throw new NotFoundError("Store not found");
  }

  await Store.findByIdAndDelete(storeId);

  res.status(StatusCodes.OK).json({
    message: "Store deleted successfully",
  });
};

export const getStoreOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const { storeId } = req.params;
  const userId = req.user.id;

  const store = await Store.findOne({ _id: storeId, owner: userId });

  if (!store) {
    throw new NotFoundError("Store not found");
  }

  const orders = await Delivery.find({ store: storeId })
    .populate("customer", "profile.name profile.lastName phone")
    .populate("captain", "profile.name profile.lastName vehicle.type phone")
    .sort({ createdAt: -1 });

  res.status(StatusCodes.OK).json({
    message: "Store orders retrieved successfully",
    count: orders.length,
    orders,
  });
};

export const getStoreStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const { storeId } = req.params;
  const userId = req.user.id;

  const store = await Store.findOne({ _id: storeId, owner: userId });

  if (!store) {
    throw new NotFoundError("Store not found");
  }

  const totalOrders = await Delivery.countDocuments({ store: storeId });
  const pendingOrders = await Delivery.countDocuments({ store: storeId, status: "PENDING" });
  const completedOrders = await Delivery.countDocuments({ store: storeId, status: "DELIVERED" });

  const products = await ProductV1.countDocuments({ store: storeId });
  const lowInventoryProducts = await ProductV1.countDocuments({
    store: storeId,
    $expr: { $lte: ["$inventory", "$lowInventoryThreshold"] },
  });

  res.status(StatusCodes.OK).json({
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
