const express = require("express");
const { createProduct, getStoreProducts, searchProducts, getProductById, updateProduct, deleteProduct, updateProductInventory, getLowInventoryProducts, getFeaturedProducts, } = require("../controllers/product");
const authMiddleware = require("../middleware/authentication");
const router = express.Router();
router.use((req, res, next) => {
    req.io = req.app.get("io");
    next();
});
router.get("/search", searchProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:productId", getProductById);
router.get("/store/:storeId", getStoreProducts);
router.post("/store/:storeId", authMiddleware, createProduct);
router.get("/store/:storeId/low-inventory", authMiddleware, getLowInventoryProducts);
router.patch("/:productId", authMiddleware, updateProduct);
router.patch("/:productId/inventory", authMiddleware, updateProductInventory);
router.delete("/:productId", authMiddleware, deleteProduct);
module.exports = router;
//# sourceMappingURL=product.js.map