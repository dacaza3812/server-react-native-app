const Product = require("../models/Product");
const Store = require("../models/Store");
const User = require("../models/User");
const { NotFoundError, BadRequestError } = require("../errors");
const { StatusCodes } = require("http-status-codes");
const createProduct = async (req, res) => {
    const { name, description, price, category, images, thumbnail, weight, dimensions, inventory, lowInventoryThreshold, tags, specifications, nutritionFacts, allergens, dietaryInfo, discount, discountValidUntil, } = req.body;
    const { storeId } = req.params;
    if (!storeId || !name || !price || !category || !images || !thumbnail || inventory === undefined) {
        throw new BadRequestError("Store ID, name, price, category, images, thumbnail, and inventory are required");
    }
    try {
        const store = await Store.findById(storeId);
        if (!store) {
            throw new NotFoundError("Store not found");
        }
        if (store.owner.toString() !== req.user.id) {
            throw new BadRequestError("You don't own this store");
        }
        const existingProduct = await Product.findOne({ store: storeId, name });
        if (existingProduct) {
            throw new BadRequestError("Product with this name already exists in your store");
        }
        const product = new Product({
            name,
            description,
            price,
            category,
            store: storeId,
            images,
            thumbnail,
            weight,
            dimensions,
            inventory,
            lowInventoryThreshold,
            tags,
            specifications,
            nutritionFacts,
            allergens,
            dietaryInfo,
            discount,
            discountValidUntil,
        });
        await product.save();
        res.status(StatusCodes.CREATED).json({
            message: "Product created successfully",
            product,
        });
    }
    catch (error) {
        console.error("Error creating product:", error);
        if (error.name === 'NotFoundError' || error.name === 'BadRequestError') {
            throw error;
        }
        throw new BadRequestError("Failed to create product");
    }
};
const getStoreProducts = async (req, res) => {
    const { storeId } = req.params;
    const { category, featured, available, active, limit = 20, page = 1 } = req.query;
    if (!storeId) {
        throw new BadRequestError("Store ID is required");
    }
    try {
        const query = { store: storeId };
        if (category)
            query.category = category;
        if (featured !== undefined)
            query.featured = featured === "true";
        if (available !== undefined)
            query.isAvailable = available === "true";
        if (active !== undefined)
            query.isActive = active === "true";
        const products = await Product.find(query)
            .select("name price category thumbnail images rating salesCount featured discount isAvailable")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const total = await Product.countDocuments(query);
        res.status(StatusCodes.OK).json({
            message: "Store products retrieved successfully",
            count: products.length,
            total,
            products,
        });
    }
    catch (error) {
        console.error("Error retrieving store products:", error);
        throw new BadRequestError("Failed to retrieve store products");
    }
};
const searchProducts = async (req, res) => {
    const { query, category, storeId, latitude, longitude, radius = 10000, limit = 20, page = 1 } = req.query;
    if (!query && !category) {
        throw new BadRequestError("Search query or category is required");
    }
    try {
        const searchQuery = {};
        if (query) {
            searchQuery.$text = { $search: query };
        }
        if (category) {
            searchQuery.category = category;
        }
        if (storeId) {
            searchQuery.store = storeId;
        }
        searchQuery.isAvailable = true;
        searchQuery.isActive = true;
        const products = await Product.find(searchQuery)
            .populate("store", "name logo address categories averageDeliveryTime")
            .select("name price category thumbnail images rating salesCount featured discount isAvailable")
            .sort({ $text: { $search: query }, rating: -1, salesCount: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        let filteredProducts = products;
        if (latitude && longitude) {
            filteredProducts = products
                .map(product => {
                const store = product.store;
                if (!store || !store.address)
                    return null;
                const distance = calculateDistance(parseFloat(latitude), parseFloat(longitude), store.address.latitude, store.address.longitude);
                return { ...product.toObject(), distance };
            })
                .filter(product => product && product.distance <= radius);
        }
        const total = filteredProducts.length;
        res.status(StatusCodes.OK).json({
            message: "Products search completed successfully",
            count: filteredProducts.length,
            total,
            products: filteredProducts,
        });
    }
    catch (error) {
        console.error("Error searching products:", error);
        throw new BadRequestError("Failed to search products");
    }
};
const getProductById = async (req, res) => {
    const { productId } = req.params;
    if (!productId) {
        throw new BadRequestError("Product ID is required");
    }
    try {
        const product = await Product.findById(productId)
            .populate("store", "name logo address categories averageDeliveryTime minimumOrderAmount deliveryFee taxRate")
            .populate("store.owner", "profile.name phone email");
        if (!product) {
            throw new NotFoundError("Product not found");
        }
        if (!product.store.isActive) {
            throw new BadRequestError("Store is currently inactive");
        }
        res.status(StatusCodes.OK).json({
            message: "Product retrieved successfully",
            product,
        });
    }
    catch (error) {
        console.error("Error retrieving product:", error);
        if (error.name === 'CastError') {
            throw new NotFoundError("Product not found");
        }
        if (error.name === 'NotFoundError' || error.name === 'BadRequestError') {
            throw error;
        }
        throw new BadRequestError("Failed to retrieve product");
    }
};
const updateProduct = async (req, res) => {
    const { productId } = req.params;
    const updates = req.body;
    if (!productId) {
        throw new BadRequestError("Product ID is required");
    }
    try {
        const product = await Product.findById(productId).populate("store");
        if (!product) {
            throw new NotFoundError("Product not found");
        }
        if (product.store.owner.toString() !== req.user.id) {
            throw new BadRequestError("You don't have permission to update this product");
        }
        delete updates.store;
        delete updates.createdAt;
        delete updates.updatedAt;
        Object.assign(product, updates);
        await product.save();
        res.status(StatusCodes.OK).json({
            message: "Product updated successfully",
            product,
        });
    }
    catch (error) {
        console.error("Error updating product:", error);
        throw new BadRequestError("Failed to update product");
    }
};
const deleteProduct = async (req, res) => {
    const { productId } = req.params;
    if (!productId) {
        throw new BadRequestError("Product ID is required");
    }
    try {
        const product = await Product.findById(productId).populate("store");
        if (!product) {
            throw new NotFoundError("Product not found");
        }
        if (product.store.owner.toString() !== req.user.id) {
            throw new BadRequestError("You don't have permission to delete this product");
        }
        await Product.findByIdAndDelete(productId);
        res.status(StatusCodes.OK).json({
            message: "Product deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting product:", error);
        throw new BadRequestError("Failed to delete product");
    }
};
const updateProductInventory = async (req, res) => {
    const { productId } = req.params;
    const { quantity, operation = "set" } = req.body;
    if (!productId || quantity === undefined) {
        throw new BadRequestError("Product ID and quantity are required");
    }
    if (!["set", "add", "subtract"].includes(operation)) {
        throw new BadRequestError("Operation must be one of: set, add, subtract");
    }
    try {
        const product = await Product.findById(productId).populate("store");
        if (!product) {
            throw new NotFoundError("Product not found");
        }
        if (product.store.owner.toString() !== req.user.id) {
            throw new BadRequestError("You don't have permission to update this product");
        }
        switch (operation) {
            case "set":
                product.inventory = quantity;
                break;
            case "add":
                product.inventory += quantity;
                break;
            case "subtract":
                const newInventory = product.inventory - quantity;
                if (newInventory < 0) {
                    throw new BadRequestError("Insufficient inventory");
                }
                product.inventory = newInventory;
                break;
        }
        await product.save();
        res.status(StatusCodes.OK).json({
            message: "Product inventory updated successfully",
            product,
        });
    }
    catch (error) {
        console.error("Error updating product inventory:", error);
        throw new BadRequestError("Failed to update product inventory");
    }
};
const getLowInventoryProducts = async (req, res) => {
    const { storeId } = req.params;
    if (!storeId) {
        throw new BadRequestError("Store ID is required");
    }
    try {
        const store = await Store.findById(storeId);
        if (!store) {
            throw new NotFoundError("Store not found");
        }
        if (store.owner.toString() !== req.user.id) {
            throw new BadRequestError("You don't own this store");
        }
        const products = await Product.find({
            store: storeId,
            inventory: { $lte: "$lowInventoryThreshold" },
            isActive: true,
        })
            .select("name price inventory lowInventoryThreshold category")
            .sort({ inventory: 1 });
        res.status(StatusCodes.OK).json({
            message: "Low inventory products retrieved successfully",
            count: products.length,
            products,
        });
    }
    catch (error) {
        console.error("Error retrieving low inventory products:", error);
        throw new BadRequestError("Failed to retrieve low inventory products");
    }
};
const getFeaturedProducts = async (req, res) => {
    const { limit = 10 } = req.query;
    try {
        const products = await Product.find({
            featured: true,
            isAvailable: true,
            isActive: true,
        })
            .populate("store", "name logo address categories averageDeliveryTime")
            .select("name price category thumbnail images rating salesCount featured discount")
            .sort({ rating: -1, salesCount: -1 })
            .limit(limit);
        res.status(StatusCodes.OK).json({
            message: "Featured products retrieved successfully",
            count: products.length,
            products,
        });
    }
    catch (error) {
        console.error("Error retrieving featured products:", error);
        throw new BadRequestError("Failed to retrieve featured products");
    }
};
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
module.exports = {
    createProduct,
    getStoreProducts,
    searchProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    updateProductInventory,
    getLowInventoryProducts,
    getFeaturedProducts,
};
//# sourceMappingURL=product.js.map