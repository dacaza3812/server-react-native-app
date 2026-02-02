"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeaturedProducts = exports.getLowInventoryProducts = exports.updateProductInventory = exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.searchProducts = exports.getStoreProducts = exports.createProduct = exports.getCategories = void 0;
const http_status_codes_1 = require("http-status-codes");
const ProductV1_1 = __importDefault(require("../../models/ProductV1"));
const Store_1 = __importDefault(require("../../models/Store"));
const errors_1 = require("../../errors");
const constants_1 = require("../../utils/constants");
const getCategories = async (req, res) => {
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Product categories retrieved successfully",
        categories: constants_1.PRODUCT_CATEGORIES,
    });
};
exports.getCategories = getCategories;
const createProduct = async (req, res) => {
    const { storeId } = req.params;
    const productData = req.body;
    const store = await Store_1.default.findById(storeId);
    if (!store) {
        throw new errors_1.NotFoundError("Store not found");
    }
    if (store.owner.toString() !== req.user.id) {
        throw new errors_1.BadRequestError("You don't own this store");
    }
    if (!constants_1.PRODUCT_CATEGORIES.includes(productData.category)) {
        throw new errors_1.BadRequestError(`Invalid category. Must be one of: ${constants_1.PRODUCT_CATEGORIES.join(", ")}`);
    }
    const product = new ProductV1_1.default({
        ...productData,
        store: storeId,
    });
    await product.save();
    res.status(http_status_codes_1.StatusCodes.CREATED).json({
        message: "Product created successfully",
        product,
    });
};
exports.createProduct = createProduct;
const getStoreProducts = async (req, res) => {
    const { storeId } = req.params;
    const { category, page = 1, limit = 20 } = req.query;
    const query = { store: storeId, isActive: true };
    if (category) {
        query.category = category;
    }
    const products = await ProductV1_1.default.find(query)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ createdAt: -1 });
    const total = await ProductV1_1.default.countDocuments(query);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Store products retrieved successfully",
        count: products.length,
        total,
        products,
    });
};
exports.getStoreProducts = getStoreProducts;
const searchProducts = async (req, res) => {
    const { q, category, minPrice, maxPrice } = req.query;
    const query = { isActive: true, isAvailable: true };
    if (q) {
        query.$text = { $search: q };
    }
    if (category) {
        query.category = category;
    }
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice)
            query.price.$gte = Number(minPrice);
        if (maxPrice)
            query.price.$lte = Number(maxPrice);
    }
    const products = await ProductV1_1.default.find(query).limit(50);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Products search results",
        count: products.length,
        products,
    });
};
exports.searchProducts = searchProducts;
const getProductById = async (req, res) => {
    const { productId } = req.params;
    const product = await ProductV1_1.default.findById(productId).populate("store", "name address");
    if (!product) {
        throw new errors_1.NotFoundError("Product not found");
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Product retrieved successfully",
        product,
    });
};
exports.getProductById = getProductById;
const updateProduct = async (req, res) => {
    const { productId } = req.params;
    const updates = req.body;
    const product = await ProductV1_1.default.findById(productId).populate("store");
    if (!product) {
        throw new errors_1.NotFoundError("Product not found");
    }
    if (product.store.owner.toString() !== req.user.id) {
        throw new errors_1.BadRequestError("You don't own this product");
    }
    Object.assign(product, updates);
    await product.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Product updated successfully",
        product,
    });
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const { productId } = req.params;
    const product = await ProductV1_1.default.findById(productId).populate("store");
    if (!product) {
        throw new errors_1.NotFoundError("Product not found");
    }
    if (product.store.owner.toString() !== req.user.id) {
        throw new errors_1.BadRequestError("You don't own this product");
    }
    await ProductV1_1.default.findByIdAndDelete(productId);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Product deleted successfully",
    });
};
exports.deleteProduct = deleteProduct;
const updateProductInventory = async (req, res) => {
    const { productId } = req.params;
    const { inventory } = req.body;
    const product = await ProductV1_1.default.findById(productId).populate("store");
    if (!product) {
        throw new errors_1.NotFoundError("Product not found");
    }
    if (product.store.owner.toString() !== req.user.id) {
        throw new errors_1.BadRequestError("You don't own this product");
    }
    product.inventory = inventory;
    await product.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Product inventory updated successfully",
        product,
    });
};
exports.updateProductInventory = updateProductInventory;
const getLowInventoryProducts = async (req, res) => {
    const { storeId } = req.params;
    const products = await ProductV1_1.default.find({
        store: storeId,
        $expr: { $lte: ["$inventory", "$lowInventoryThreshold"] },
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Low inventory products retrieved successfully",
        count: products.length,
        products,
    });
};
exports.getLowInventoryProducts = getLowInventoryProducts;
const getFeaturedProducts = async (req, res) => {
    const products = await ProductV1_1.default.find({ featured: true, isActive: true, isAvailable: true })
        .populate("store", "name address")
        .limit(20);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Featured products retrieved successfully",
        count: products.length,
        products,
    });
};
exports.getFeaturedProducts = getFeaturedProducts;
//# sourceMappingURL=product.js.map