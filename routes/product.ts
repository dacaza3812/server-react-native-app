import express, { Request, Response, NextFunction, Router } from "express";
import {
  createProduct,
  getStoreProducts,
  searchProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductInventory,
  getLowInventoryProducts,
  getFeaturedProducts,
} from "../controllers/product";

const authMiddleware = require("../middleware/authentication").default || require("../middleware/authentication");

const router: Router = express.Router();

// Get delivery instance from app
router.use((req: Request, res: Response, next: NextFunction) => {
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

export default router;
