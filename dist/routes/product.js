"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_1 = require("../controllers/product");
const authMiddleware = require("../middleware/authentication").default || require("../middleware/authentication");
const router = express_1.default.Router();
router.use((req, res, next) => {
    req.io = req.app.get("io");
    next();
});
router.get("/search", product_1.searchProducts);
router.get("/featured", product_1.getFeaturedProducts);
router.get("/:productId", product_1.getProductById);
router.get("/store/:storeId", product_1.getStoreProducts);
router.post("/store/:storeId", authMiddleware, product_1.createProduct);
router.get("/store/:storeId/low-inventory", authMiddleware, product_1.getLowInventoryProducts);
router.patch("/:productId", authMiddleware, product_1.updateProduct);
router.patch("/:productId/inventory", authMiddleware, product_1.updateProductInventory);
router.delete("/:productId", authMiddleware, product_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.js.map