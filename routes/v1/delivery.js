const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authenticationV1");
const {
  createDelivery,
  getMyDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  cancelDelivery,
  rateDelivery,
  trackDelivery,
} = require("../../controllers/v1/delivery");

router.get("/track/:trackingCode", trackDelivery);

router.post("/create", authMiddleware, createDelivery);
router.get("/", authMiddleware, getMyDeliveries);
router.get("/:deliveryId", authMiddleware, getDeliveryById);
router.patch("/:deliveryId/status", authMiddleware, updateDeliveryStatus);
router.patch("/:deliveryId/cancel", authMiddleware, cancelDelivery);
router.patch("/:deliveryId/rate", authMiddleware, rateDelivery);

module.exports = router;
