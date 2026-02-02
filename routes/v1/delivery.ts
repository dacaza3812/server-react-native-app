import express from "express";
const router = express.Router();

// Importar middleware con require para compatibilidad
const authMiddleware = require("../../middleware/authenticationV1").default || require("../../middleware/authenticationV1");

// Importar controladores
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

export default router;
