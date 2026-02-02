const express = require("express");
const { createStore, getMyStores, getStoreById, getNearbyStores, updateStore, deleteStore, getStoreOrders, updateStoreStatus, getStoreStats, } = require("../controllers/store");
const authMiddleware = require("../middleware/authentication");
const router = express.Router();
router.use((req, res, next) => {
    req.io = req.app.get("io");
    next();
});
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
//# sourceMappingURL=store.js.map