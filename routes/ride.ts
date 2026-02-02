import express, { Request, Response, NextFunction, Router } from "express";
import {
  createRide,
  updateRideStatus,
  acceptRide,
  getMyRides,
  cancelRide,
} from "../controllers/ride";

const router: Router = express.Router();

router.use((req: Request, res: Response, next: NextFunction) => {
  req.io = req.app.get("io");
  next();
});

router.post("/create", createRide);
router.patch("/accept/:rideId", acceptRide);
router.patch("/update/:rideId", updateRideStatus);
router.get("/rides", getMyRides);
router.patch("/:rideId/cancel", cancelRide);

export default router;
