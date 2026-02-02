import express from "express";
import authMiddleware from "../../middleware/authenticationV1";
import {
  createDelivery,
  getMyDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  cancelDelivery,
  rateDelivery,
  trackDelivery,
} from "../../controllers/v1/delivery";

const router = express.Router();

router.get("/track/:trackingCode", trackDelivery);

router.post("/create", authMiddleware, createDelivery);
router.get("/", authMiddleware, getMyDeliveries);
router.get("/:deliveryId", authMiddleware, getDeliveryById);
router.patch("/:deliveryId/status", authMiddleware, updateDeliveryStatus);
router.patch("/:deliveryId/cancel", authMiddleware, cancelDelivery);
router.patch("/:deliveryId/rate", authMiddleware, rateDelivery);

export default router;
