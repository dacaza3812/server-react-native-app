const express = require("express");
const {
  createRide,
  updateRideStatus,
  acceptRide,
  getMyRides,
  cancelRide,
} = require("../controllers/ride");
const authMiddleware = require("../middleware/authentication");

const router = express.Router();

router.use((req, res, next) => {
  req.io = req.app.get("io");
  next();
});

router.post("/create", authMiddleware, createRide);
router.patch("/accept/:rideId", authMiddleware, acceptRide);
router.patch("/update/:rideId", authMiddleware, updateRideStatus);
router.get("/rides", authMiddleware, getMyRides);
router.patch("/:rideId/cancel", authMiddleware, cancelRide);

module.exports = router;
