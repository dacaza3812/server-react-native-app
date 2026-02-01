const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authenticationV1");
const {
  getCategories,
  createProduct,
  getStoreProducts,
  searchProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductInventory,
  getLowInventoryProducts,
  getFeaturedProducts,
} = require("../../controllers/v1/product");

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

module.exports = router;
