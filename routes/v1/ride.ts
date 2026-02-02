import express from "express";
import authMiddleware from "../../middleware/authenticationV1";
import {
  createRide,
  acceptRide,
  updateRideStatus,
  getMyRides,
  cancelRide,
  rateRide,
} from "../../controllers/v1/ride";

const router = express.Router();

router.post("/create", authMiddleware, createRide);
router.patch("/accept/:rideId", authMiddleware, acceptRide);
router.patch("/update/:rideId", authMiddleware, updateRideStatus);
router.get("/", authMiddleware, getMyRides);
router.patch("/:rideId/cancel", authMiddleware, cancelRide);
router.patch("/:rideId/rate", authMiddleware, rateRide);

export default router;
