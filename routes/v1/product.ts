import express from "express";
import authMiddleware from "../../middleware/authenticationV1";
import {
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
} from "../../controllers/v1/product";

const router = express.Router();

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

export default router;
