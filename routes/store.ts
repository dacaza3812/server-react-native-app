import express, { Request, Response, NextFunction, Router } from "express";
import {
  createStore,
  getMyStores,
  getStoreById,
  getNearbyStores,
  updateStore,
  deleteStore,
  getStoreOrders,
  updateStoreStatus,
  getStoreStats,
} from "../controllers/store";

const authMiddleware = require("../middleware/authentication").default || require("../middleware/authentication");

const router: Router = express.Router();

// Get delivery instance from app
router.use((req: Request, res: Response, next: NextFunction) => {
  req.io = req.app.get("io");
  next();
});

// Protected routes - STATIC ROUTES FIRST (authentication required)
router.post("/register", authMiddleware, createStore);
router.get("/my-stores", authMiddleware, getMyStores);

// Public routes (no authentication required)
router.get("/nearby", getNearbyStores);

// Protected routes - DYNAMIC ROUTES LAST (authentication required)
router.get("/:storeId/orders", authMiddleware, getStoreOrders);
router.get("/:storeId/stats", authMiddleware, getStoreStats);
router.patch("/:storeId", authMiddleware, updateStore);
router.patch("/:storeId/status", authMiddleware, updateStoreStatus);
router.delete("/:storeId", authMiddleware, deleteStore);

// Public route - MUST BE LAST to avoid catching other routes
router.get("/:storeId", getStoreById);

export default router;
