import express from "express";
const router = express.Router();

const {
  createDelivery,
  getMyDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  cancelDelivery,
  rateDelivery,
  trackDelivery,
} = require("../controllers/delivery");

const authMiddleware = require("../middleware/authentication").default || require("../middleware/authentication");

// Get delivery instance from app
router.use((req: any, res: any, next: any) => {
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

export default router;
