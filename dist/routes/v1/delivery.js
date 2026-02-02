"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const authMiddleware = require("../../middleware/authenticationV1").default || require("../../middleware/authenticationV1");
const { createDelivery, getMyDeliveries, getDeliveryById, updateDeliveryStatus, cancelDelivery, rateDelivery, trackDelivery, } = require("../../controllers/v1/delivery");
router.get("/track/:trackingCode", trackDelivery);
router.post("/create", authMiddleware, createDelivery);
router.get("/", authMiddleware, getMyDeliveries);
router.get("/:deliveryId", authMiddleware, getDeliveryById);
router.patch("/:deliveryId/status", authMiddleware, updateDeliveryStatus);
router.patch("/:deliveryId/cancel", authMiddleware, cancelDelivery);
router.patch("/:deliveryId/rate", authMiddleware, rateDelivery);
exports.default = router;
//# sourceMappingURL=delivery.js.map