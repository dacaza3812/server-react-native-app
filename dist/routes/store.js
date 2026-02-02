"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const store_1 = require("../controllers/store");
const authMiddleware = require("../middleware/authentication").default || require("../middleware/authentication");
const router = express_1.default.Router();
router.use((req, res, next) => {
    req.io = req.app.get("io");
    next();
});
router.post("/register", authMiddleware, store_1.createStore);
router.get("/my-stores", authMiddleware, store_1.getMyStores);
router.get("/nearby", store_1.getNearbyStores);
router.get("/:storeId/orders", authMiddleware, store_1.getStoreOrders);
router.get("/:storeId/stats", authMiddleware, store_1.getStoreStats);
router.patch("/:storeId", authMiddleware, store_1.updateStore);
router.patch("/:storeId/status", authMiddleware, store_1.updateStoreStatus);
router.delete("/:storeId", authMiddleware, store_1.deleteStore);
router.get("/:storeId", store_1.getStoreById);
exports.default = router;
//# sourceMappingURL=store.js.map