"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { createRide, acceptRide, updateRideStatus, getMyRides, cancelRide, rateRide, } = require("../../controllers/v1/ride");
const authMiddleware = require("../../middleware/authenticationV1").default || require("../../middleware/authenticationV1");
router.post("/create", authMiddleware, createRide);
router.patch("/accept/:rideId", authMiddleware, acceptRide);
router.patch("/update/:rideId", authMiddleware, updateRideStatus);
router.get("/", authMiddleware, getMyRides);
router.patch("/:rideId/cancel", authMiddleware, cancelRide);
router.patch("/:rideId/rate", authMiddleware, rateRide);
exports.default = router;
//# sourceMappingURL=ride.js.map