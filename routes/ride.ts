import express, { Router } from "express";
import {
  createRide,
  updateRideStatus,
  acceptRide,
  getMyRides,
  cancelRide,
} from "../controllers/ride";

const router: Router = express.Router();

// io ya está disponible en req.io desde el middleware global en app.ts

router.post("/create", createRide);
router.patch("/accept/:rideId", acceptRide);
router.patch("/update/:rideId", updateRideStatus);
router.get("/rides", getMyRides);
router.patch("/:rideId/cancel", cancelRide);

export default router;
