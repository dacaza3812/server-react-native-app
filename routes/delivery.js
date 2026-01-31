const express = require("express");
const {
  createDelivery,
  getMyDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  cancelDelivery,
  rateDelivery,
  trackDelivery,
} = require("../controllers/delivery");
const authMiddleware = require("../middleware/authentication");

const router = express.Router();

// Get delivery instance from app
router.use((req, res, next) => {
  req.io = req.app.get("io");
  next();
});

// Public routes (no authentication required)
router.get("/track/:trackingCode", trackDelivery);

// Protected routes (authentication required)
router.post("/create", authMiddleware, createDelivery);
router.get("/my-deliveries", authMiddleware, getMyDeliveries);
router.get("/:deliveryId", authMiddleware, getDeliveryById);
router.patch("/:deliveryId/status", authMiddleware, updateDeliveryStatus);
router.patch("/:deliveryId/cancel", authMiddleware, cancelDelivery);
router.patch("/:deliveryId/rate", authMiddleware, rateDelivery);

module.exports = router;