const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authenticationV1");
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
} = require("../../controllers/v1/store");

router.post("/register", authMiddleware, createStore);
router.get("/my-stores", authMiddleware, getMyStores);

router.get("/nearby", getNearbyStores);

router.get("/:storeId/orders", authMiddleware, getStoreOrders);
router.get("/:storeId/stats", authMiddleware, getStoreStats);
router.patch("/:storeId", authMiddleware, updateStore);
router.patch("/:storeId/status", authMiddleware, updateStoreStatus);
router.delete("/:storeId", authMiddleware, deleteStore);

router.get("/:storeId", getStoreById);

module.exports = router;
