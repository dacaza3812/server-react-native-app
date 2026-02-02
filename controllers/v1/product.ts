import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import ProductV1 from "../../models/ProductV1";
import Store from "../../models/Store";
import { NotFoundError, BadRequestError } from "../../errors";
import { PRODUCT_CATEGORIES } from "../../utils/constants";

interface AuthRequest extends Request {
  user: { id: string; phone: string };
}

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  res.status(StatusCodes.OK).json({
    message: "Product categories retrieved successfully",
    categories: PRODUCT_CATEGORIES,
  });
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const { storeId } = req.params;
  const productData = req.body;

  const store = await Store.findById(storeId);
  if (!store) {
    throw new NotFoundError("Store not found");
  }

  if (store.owner.toString() !== req.user.id) {
    throw new BadRequestError("You don't own this store");
  }

  if (!PRODUCT_CATEGORIES.includes(productData.category)) {
    throw new BadRequestError(`Invalid category. Must be one of: ${PRODUCT_CATEGORIES.join(", ")}`);
  }

  const product = new ProductV1({
    ...productData,
    store: storeId,
  });

  await product.save();

  res.status(StatusCodes.CREATED).json({
    message: "Product created successfully",
    product,
  });
};

export const getStoreProducts = async (req: Request, res: Response): Promise<void> => {
  const { storeId } = req.params;
  const { category, page = 1, limit = 20 } = req.query;

  const query: any = { store: storeId, isActive: true };
  if (category) {
    query.category = category;
  }

  const products = await ProductV1.find(query)
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await ProductV1.countDocuments(query);

  res.status(StatusCodes.OK).json({
    message: "Store products retrieved successfully",
    count: products.length,
    total,
    products,
  });
};

export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  const { q, category, minPrice, maxPrice } = req.query;

  const query: any = { isActive: true, isAvailable: true };

  if (q) {
    query.$text = { $search: q as string };
  }

  if (category) {
    query.category = category;
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const products = await ProductV1.find(query).limit(50);

  res.status(StatusCodes.OK).json({
    message: "Products search results",
    count: products.length,
    products,
  });
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  const { productId } = req.params;

  const product = await ProductV1.findById(productId).populate("store", "name address");

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  res.status(StatusCodes.OK).json({
    message: "Product retrieved successfully",
    product,
  });
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const updates = req.body;

  const product = await ProductV1.findById(productId).populate("store");

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  if ((product.store as any).owner.toString() !== req.user.id) {
    throw new BadRequestError("You don't own this product");
  }

  Object.assign(product, updates);
  await product.save();

  res.status(StatusCodes.OK).json({
    message: "Product updated successfully",
    product,
  });
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const { productId } = req.params;

  const product = await ProductV1.findById(productId).populate("store");

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  if ((product.store as any).owner.toString() !== req.user.id) {
    throw new BadRequestError("You don't own this product");
  }

  await ProductV1.findByIdAndDelete(productId);

  res.status(StatusCodes.OK).json({
    message: "Product deleted successfully",
  });
};

export const updateProductInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { inventory } = req.body;

  const product = await ProductV1.findById(productId).populate("store");

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  if ((product.store as any).owner.toString() !== req.user.id) {
    throw new BadRequestError("You don't own this product");
  }

  product.inventory = inventory;
  await product.save();

  res.status(StatusCodes.OK).json({
    message: "Product inventory updated successfully",
    product,
  });
};

export const getLowInventoryProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  const { storeId } = req.params;

  const products = await ProductV1.find({
    store: storeId,
    $expr: { $lte: ["$inventory", "$lowInventoryThreshold"] },
  });

  res.status(StatusCodes.OK).json({
    message: "Low inventory products retrieved successfully",
    count: products.length,
    products,
  });
};

export const getFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
  const products = await ProductV1.find({ featured: true, isActive: true, isAvailable: true })
    .populate("store", "name address")
    .limit(20);

  res.status(StatusCodes.OK).json({
    message: "Featured products retrieved successfully",
    count: products.length,
    products,
  });
};
