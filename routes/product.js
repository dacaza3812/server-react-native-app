const express = require("express");
const {
  createProduct,
  getStoreProducts,
  searchProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductInventory,
  getLowInventoryProducts,
  getFeaturedProducts,
} = require("../controllers/product");
const authMiddleware = require("../middleware/authentication");

const router = express.Router();

// Get delivery instance from app
router.use((req, res, next) => {
  req.io = req.app.get("io");
  next();
});

// Public routes (no authentication required)
router.get("/search", searchProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:productId", getProductById);
router.get("/store/:storeId", getStoreProducts);

// Protected routes (authentication required)
router.post("/store/:storeId", authMiddleware, createProduct);
router.get("/store/:storeId/low-inventory", authMiddleware, getLowInventoryProducts);
router.patch("/:productId", authMiddleware, updateProduct);
router.patch("/:productId/inventory", authMiddleware, updateProductInventory);
router.delete("/:productId", authMiddleware, deleteProduct);

module.exports = router;