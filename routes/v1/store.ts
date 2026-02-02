import express from "express";
import authMiddleware from "../../middleware/authenticationV1";
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
} from "../../controllers/v1/store";

const router = express.Router();

router.post("/register", authMiddleware, createStore);
router.get("/my-stores", authMiddleware, getMyStores);
router.get("/nearby", getNearbyStores);

router.get("/:storeId/orders", authMiddleware, getStoreOrders);
router.get("/:storeId/stats", authMiddleware, getStoreStats);
router.patch("/:storeId", authMiddleware, updateStore);
router.patch("/:storeId/status", authMiddleware, updateStoreStatus);
router.delete("/:storeId", authMiddleware, deleteStore);

router.get("/:storeId", getStoreById);

export default router;
