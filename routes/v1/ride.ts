import express from "express";
const router = express.Router();

const {
  createRide,
  acceptRide,
  updateRideStatus,
  getMyRides,
  cancelRide,
  rateRide,
} = require("../../controllers/v1/ride");

const authMiddleware = require("../../middleware/authenticationV1").default || require("../../middleware/authenticationV1");

router.post("/create", authMiddleware, createRide);
router.patch("/accept/:rideId", authMiddleware, acceptRide);
router.patch("/update/:rideId", authMiddleware, updateRideStatus);
router.get("/", authMiddleware, getMyRides);
router.patch("/:rideId/cancel", authMiddleware, cancelRide);
router.patch("/:rideId/rate", authMiddleware, rateRide);

export default router;
