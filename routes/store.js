const express = require("express");
const {
  createStore,
  getMyStores,
  getStoreById,
  getNearbyStores,
  updateStore,
  deleteStore,
  getStoreOrders,
  updateStoreStatus,
  getStoreStats,
} = require("../controllers/store");
const authMiddleware = require("../middleware/authentication");

const router = express.Router();

// Get delivery instance from app
router.use((req, res, next) => {
  req.io = req.app.get("io");
  next();
});

// Public routes (no authentication required)
router.get("/nearby", getNearbyStores);
router.get("/:storeId", getStoreById);

// Protected routes (authentication required)
router.post("/register", authMiddleware, createStore);
router.get("/my-stores", authMiddleware, getMyStores);
router.get("/:storeId/orders", authMiddleware, getStoreOrders);
router.get("/:storeId/stats", authMiddleware, getStoreStats);
router.patch("/:storeId", authMiddleware, updateStore);
router.patch("/:storeId/status", authMiddleware, updateStoreStatus);
router.delete("/:storeId", authMiddleware, deleteStore);

module.exports = router;