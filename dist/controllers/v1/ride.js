"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateRide = exports.cancelRide = exports.getMyRides = exports.updateRideStatus = exports.acceptRide = exports.createRide = void 0;
const http_status_codes_1 = require("http-status-codes");
const RideV1_1 = __importDefault(require("../../models/RideV1"));
const UserV1_1 = __importDefault(require("../../models/UserV1"));
const errors_1 = require("../../errors");
const mapUtils_1 = require("../../utils/mapUtils");
const calculateFareV1 = async (distance, captainId, vehicleType) => {
    const captain = await UserV1_1.default.findById(captainId);
    if (!captain || captain.role !== "captain") {
        throw new errors_1.BadRequestError("Invalid captain");
    }
    const captainPricePerKm = captain.captain?.pricePerKm?.[vehicleType] || 150;
    const baseFare = 100;
    const minimumFare = 200;
    const fare = baseFare + (distance * captainPricePerKm);
    return Math.max(fare, minimumFare);
};
const createRide = async (req, res) => {
    const { vehicle, pickup, drop } = req.body;
    if (!vehicle || !pickup || !drop) {
        throw new errors_1.BadRequestError("Vehicle, pickup, and drop details are required");
    }
    const { address: pickupAddress, latitude: pickupLat, longitude: pickupLon } = pickup;
    const { address: dropAddress, latitude: dropLat, longitude: dropLon } = drop;
    if (!pickupAddress || !pickupLat || !pickupLon || !dropAddress || !dropLat || !dropLon) {
        throw new errors_1.BadRequestError("Complete pickup and drop details are required");
    }
    const distance = (0, mapUtils_1.calculateDistance)(pickupLat, pickupLon, dropLat, dropLon);
    const defaultFares = { bike: 200, auto: 300, cabEconomy: 400, cabPremium: 500 };
    const ride = new RideV1_1.default({
        vehicle,
        distance,
        fare: defaultFares[vehicle] || 300,
        pickup: { address: pickupAddress, latitude: pickupLat, longitude: pickupLon },
        drop: { address: dropAddress, latitude: dropLat, longitude: dropLon },
        customer: req.user.id,
        otp: (0, mapUtils_1.generateOTP)(),
    });
    await ride.save();
    res.status(http_status_codes_1.StatusCodes.CREATED).json({
        message: "Ride created successfully",
        ride,
    });
};
exports.createRide = createRide;
const acceptRide = async (req, res) => {
    const captainId = req.user.id;
    const { rideId } = req.params;
    if (!rideId) {
        throw new errors_1.BadRequestError("Ride ID is required");
    }
    let ride = await RideV1_1.default.findById(rideId).populate("customer");
    if (!ride) {
        throw new errors_1.NotFoundError("Ride not found");
    }
    if (ride.status !== "SEARCHING_FOR_CAPTAIN") {
        throw new errors_1.BadRequestError("Ride is no longer available for assignment");
    }
    const captain = await UserV1_1.default.findById(captainId);
    if (captain?.role !== "captain") {
        throw new errors_1.BadRequestError("User is not a captain");
    }
    const fare = await calculateFareV1(ride.distance, captainId, ride.vehicle);
    ride.fare = fare;
    ride.captain = captainId;
    ride.status = "START";
    await ride.save();
    ride = await ride.populate("captain");
    req.io?.to(`ride_${rideId}`).emit("rideUpdate", ride);
    req.io?.to(`ride_${rideId}`).emit("rideAccepted");
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Ride accepted successfully",
        ride,
    });
};
exports.acceptRide = acceptRide;
const updateRideStatus = async (req, res) => {
    const { rideId } = req.params;
    const { status } = req.body;
    if (!rideId || !status) {
        throw new errors_1.BadRequestError("Ride ID and status are required");
    }
    let ride = await RideV1_1.default.findById(rideId).populate("customer captain");
    if (!ride) {
        throw new errors_1.NotFoundError("Ride not found");
    }
    if (!["START", "ARRIVED", "COMPLETED"].includes(status)) {
        throw new errors_1.BadRequestError("Invalid ride status");
    }
    ride.status = status;
    await ride.save();
    req.io?.to(`ride_${rideId}`).emit("rideUpdate", ride);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: `Ride status updated to ${status}`,
        ride,
    });
};
exports.updateRideStatus = updateRideStatus;
const getMyRides = async (req, res) => {
    const userId = req.user.id;
    const { status } = req.query;
    const query = {
        $or: [{ customer: userId }, { captain: userId }],
    };
    if (status) {
        query.status = status;
    }
    const rides = await RideV1_1.default.find(query)
        .populate("customer", "profile.name profile.lastName phone")
        .populate("captain", "profile.name profile.lastName vehicle.type phone")
        .sort({ createdAt: -1 });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Rides retrieved successfully",
        count: rides.length,
        rides,
    });
};
exports.getMyRides = getMyRides;
const cancelRide = async (req, res) => {
    const { rideId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const ride = await RideV1_1.default.findById(rideId).populate("customer captain");
    if (!ride) {
        throw new errors_1.NotFoundError("Ride not found");
    }
    if (ride.customer._id.toString() !== userId && ride.captain?._id.toString() !== userId) {
        throw new errors_1.BadRequestError("You don't have permission to cancel this ride");
    }
    if (ride.status === "COMPLETED") {
        throw new errors_1.BadRequestError("Cannot cancel a completed ride");
    }
    if (ride.status === "CANCELLED") {
        throw new errors_1.BadRequestError("Ride is already cancelled");
    }
    ride.status = "CANCELLED";
    ride.cancellationReason = reason || "";
    ride.cancelledBy = userId;
    await ride.save();
    req.io?.to(`ride_${rideId}`).emit("rideCancelled", {
        ride,
        cancelledBy: req.user,
        message: "Ride cancelled successfully",
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Ride cancelled successfully",
        ride,
    });
};
exports.cancelRide = cancelRide;
const rateRide = async (req, res) => {
    const { rideId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;
    if (!rideId) {
        throw new errors_1.BadRequestError("Ride ID is required");
    }
    if (!rating || rating < 1 || rating > 5) {
        throw new errors_1.BadRequestError("Rating must be between 1 and 5");
    }
    const ride = await RideV1_1.default.findById(rideId)
        .populate("customer")
        .populate("captain");
    if (!ride) {
        throw new errors_1.NotFoundError("Ride not found");
    }
    if (ride.customer._id.toString() !== userId) {
        throw new errors_1.BadRequestError("Only customer can rate this ride");
    }
    if (ride.status !== "COMPLETED") {
        throw new errors_1.BadRequestError("Can only rate completed rides");
    }
    if (!ride.captain) {
        throw new errors_1.BadRequestError("Cannot rate ride without captain");
    }
    ride.rating = rating;
    ride.review = review || "";
    await ride.save();
    const captain = await UserV1_1.default.findById(ride.captain._id);
    if (captain) {
        const totalRatings = captain.rating.total + 1;
        const totalScore = captain.rating.average * captain.rating.total + rating;
        captain.rating.average = totalScore / totalRatings;
        captain.rating.total = totalRatings;
        await captain.save();
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Ride rated successfully",
        ride,
        captain: {
            id: captain?._id,
            profile: captain?.profile,
            rating: captain?.rating,
        },
    });
};
exports.rateRide = rateRide;
//# sourceMappingURL=ride.js.map