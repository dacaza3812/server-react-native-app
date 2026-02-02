"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { createDelivery, getMyDeliveries, getDeliveryById, updateDeliveryStatus, cancelDelivery, rateDelivery, trackDelivery, } = require("../controllers/delivery");
const authMiddleware = require("../middleware/authentication").default || require("../middleware/authentication");
router.use((req, res, next) => {
    req.io = req.app.get("io");
    next();
});
router.get("/track/:trackingCode", trackDelivery);
router.post("/create", authMiddleware, createDelivery);
router.get("/my-deliveries", authMiddleware, getMyDeliveries);
router.get("/:deliveryId", authMiddleware, getDeliveryById);
router.patch("/:deliveryId/status", authMiddleware, updateDeliveryStatus);
router.patch("/:deliveryId/cancel", authMiddleware, cancelDelivery);
router.patch("/:deliveryId/rate", authMiddleware, rateDelivery);
exports.default = router;
//# sourceMappingURL=delivery.js.map