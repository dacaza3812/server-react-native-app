"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { getCategories, createProduct, getStoreProducts, searchProducts, getProductById, updateProduct, deleteProduct, updateProductInventory, getLowInventoryProducts, getFeaturedProducts, } = require("../../controllers/v1/product");
const authMiddleware = require("../../middleware/authenticationV1").default || require("../../middleware/authenticationV1");
router.get("/categories", getCategories);
router.get("/search", searchProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:productId", getProductById);
router.get("/store/:storeId", getStoreProducts);
router.post("/store/:storeId", authMiddleware, createProduct);
router.get("/store/:storeId/low-inventory", authMiddleware, getLowInventoryProducts);
router.patch("/:productId", authMiddleware, updateProduct);
router.patch("/:productId/inventory", authMiddleware, updateProductInventory);
router.delete("/:productId", authMiddleware, deleteProduct);
exports.default = router;
//# sourceMappingURL=product.js.map