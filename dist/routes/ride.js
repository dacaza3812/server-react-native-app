"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ride_1 = require("../controllers/ride");
const router = express_1.default.Router();
router.use((req, res, next) => {
    req.io = req.app.get("io");
    next();
});
router.post("/create", ride_1.createRide);
router.patch("/accept/:rideId", ride_1.acceptRide);
router.patch("/update/:rideId", ride_1.updateRideStatus);
router.get("/rides", ride_1.getMyRides);
router.patch("/:rideId/cancel", ride_1.cancelRide);
exports.default = router;
//# sourceMappingURL=ride.js.map