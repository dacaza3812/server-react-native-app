"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { createStore, getMyStores, getStoreById, getNearbyStores, updateStore, deleteStore, getStoreOrders, updateStoreStatus, getStoreStats, } = require("../../controllers/v1/store");
const authMiddleware = require("../../middleware/authenticationV1").default || require("../../middleware/authenticationV1");
router.post("/register", authMiddleware, createStore);
router.get("/my-stores", authMiddleware, getMyStores);
router.get("/nearby", getNearbyStores);
router.get("/:storeId/orders", authMiddleware, getStoreOrders);
router.get("/:storeId/stats", authMiddleware, getStoreStats);
router.patch("/:storeId", authMiddleware, updateStore);
router.patch("/:storeId/status", authMiddleware, updateStoreStatus);
router.delete("/:storeId", authMiddleware, deleteStore);
router.get("/:storeId", getStoreById);
exports.default = router;
//# sourceMappingURL=store.js.map