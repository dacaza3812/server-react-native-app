const Ride = require("../../models/RideV1");
const UserV1 = require("../../models/UserV1");
const { BadRequestError, NotFoundError } = require("../../errors");
const { StatusCodes } = require("http-status-codes");
const { calculateDistance, generateOTP, calculateFare, } = require("../../utils/mapUtils");
const calculateFareV1 = async (distance, captainId, vehicleType) => {
    const captain = await UserV1.findById(captainId);
    if (!captain || captain.role !== "captain") {
        throw new BadRequestError("Invalid captain");
    }
    const captainPricePerKm = captain.captain.pricePerKm[vehicleType] || 150;
    const baseFare = 100;
    const minimumFare = 200;
    const fare = baseFare + (distance * captainPricePerKm);
    return Math.max(fare, minimumFare);
};
const createRide = async (req, res) => {
    const { vehicle, pickup, drop } = req.body;
    if (!vehicle || !pickup || !drop) {
        throw new BadRequestError("Vehicle, pickup, and drop details are required");
    }
    const { address: pickupAddress, latitude: pickupLat, longitude: pickupLon, } = pickup;
    const { address: dropAddress, latitude: dropLat, longitude: dropLon } = drop;
    if (!pickupAddress ||
        !pickupLat ||
        !pickupLon ||
        !dropAddress ||
        !dropLat ||
        !dropLon) {
        throw new BadRequestError("Complete pickup and drop details are required");
    }
    const customer = req.user;
    try {
        const distance = calculateDistance(pickupLat, pickupLon, dropLat, dropLon);
        const defaultFares = calculateFare(distance, vehicle);
        const ride = new Ride({
            vehicle,
            distance,
            fare: defaultFares[vehicle],
            pickup: {
                address: pickupAddress,
                latitude: pickupLat,
                longitude: pickupLon,
            },
            drop: { address: dropAddress, latitude: dropLat, longitude: dropLon },
            customer: customer.id,
            otp: generateOTP(),
        });
        await ride.save();
        res.status(StatusCodes.CREATED).json({
            message: "Ride created successfully",
            ride,
        });
    }
    catch (error) {
        console.error(error);
        throw new BadRequestError("Failed to create ride");
    }
};
const acceptRide = async (req, res) => {
    const captainId = req.user.id;
    const { rideId } = req.params;
    if (!rideId) {
        throw new BadRequestError("Ride ID is required");
    }
    try {
        let ride = await Ride.findById(rideId).populate("customer");
        if (!ride) {
            throw new NotFoundError("Ride not found");
        }
        if (ride.status !== "SEARCHING_FOR_CAPTAIN") {
            throw new BadRequestError("Ride is no longer available for assignment");
        }
        const captain = await UserV1.findById(captainId);
        if (captain.role !== "captain") {
            throw new BadRequestError("User is not a captain");
        }
        const fare = await calculateFareV1(ride.distance, captainId, ride.vehicle);
        ride.fare = fare;
        ride.captain = captainId;
        ride.status = "START";
        await ride.save();
        ride = await ride.populate("captain");
        req.io.to(`ride_${rideId}`).emit("rideUpdate", ride);
        req.io.to(`ride_${rideId}`).emit("rideAccepted");
        res.status(StatusCodes.OK).json({
            message: "Ride accepted successfully",
            ride,
        });
    }
    catch (error) {
        console.error("Error accepting ride:", error);
        if (error.name === 'NotFoundError' || error.name === 'BadRequestError') {
            throw error;
        }
        throw new BadRequestError("Failed to accept ride");
    }
};
const updateRideStatus = async (req, res) => {
    const { rideId } = req.params;
    const { status } = req.body;
    if (!rideId || !status) {
        throw new BadRequestError("Ride ID and status are required");
    }
    try {
        let ride = await Ride.findById(rideId).populate("customer captain");
        if (!ride) {
            throw new NotFoundError("Ride not found");
        }
        if (!["START", "ARRIVED", "COMPLETED"].includes(status)) {
            throw new BadRequestError("Invalid ride status");
        }
        ride.status = status;
        await ride.save();
        req.io.to(`ride_${rideId}`).emit("rideUpdate", ride);
        res.status(StatusCodes.OK).json({
            message: `Ride status updated to ${status}`,
            ride,
        });
    }
    catch (error) {
        console.error("Error updating ride status:", error);
        if (error.name === 'NotFoundError' || error.name === 'BadRequestError') {
            throw error;
        }
        throw new BadRequestError("Failed to update ride status");
    }
};
const getMyRides = async (req, res) => {
    const userId = req.user.id;
    const { status } = req.query;
    try {
        const query = {
            $or: [{ customer: userId }, { captain: userId }],
        };
        if (status) {
            query.status = status;
        }
        const rides = await Ride.find(query)
            .populate("customer", "profile.name profile.lastName phone")
            .populate("captain", "profile.name profile.lastName vehicle.type phone")
            .sort({ createdAt: -1 });
        res.status(StatusCodes.OK).json({
            message: "Rides retrieved successfully",
            count: rides.length,
            rides,
        });
    }
    catch (error) {
        console.error("Error retrieving rides:", error);
        throw new BadRequestError("Failed to retrieve rides");
    }
};
const cancelRide = async (req, res) => {
    const { rideId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    try {
        const ride = await Ride.findById(rideId).populate("customer captain");
        if (!ride) {
            throw new NotFoundError("Ride not found");
        }
        if (ride.customer._id.toString() !== userId && ride.captain?._id.toString() !== userId) {
            throw new BadRequestError("You don't have permission to cancel this ride");
        }
        if (ride.status === "COMPLETED") {
            throw new BadRequestError("Cannot cancel a completed ride");
        }
        if (ride.status === "CANCELLED") {
            throw new BadRequestError("Ride is already cancelled");
        }
        ride.status = "CANCELLED";
        ride.cancellationReason = reason || "";
        ride.cancelledBy = userId;
        await ride.save();
        req.io.to(`ride_${rideId}`).emit("rideCancelled", {
            ride,
            cancelledBy: userRole,
            message: "Ride cancelled successfully",
        });
        res.status(StatusCodes.OK).json({
            message: "Ride cancelled successfully",
            ride,
        });
    }
    catch (error) {
        console.error("Error cancelling ride:", error);
        if (error.name === 'NotFoundError' || error.name === 'BadRequestError') {
            throw error;
        }
        throw new BadRequestError("Failed to cancel ride");
    }
};
const rateRide = async (req, res) => {
    const { rideId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;
    console.log('[DEBUG] Rate ride - rideId:', rideId, 'userId:', userId);
    if (!rideId) {
        throw new BadRequestError("Ride ID is required");
    }
    if (!rating || rating < 1 || rating > 5) {
        throw new BadRequestError("Rating must be between 1 and 5");
    }
    try {
        const ride = await Ride.findById(rideId)
            .populate("customer")
            .populate("captain");
        console.log('[DEBUG] Ride found:', !!ride, 'Customer:', !!ride?.customer, 'Captain:', !!ride?.captain);
        if (!ride) {
            throw new NotFoundError("Ride not found");
        }
        if (!ride.customer) {
            throw new BadRequestError("Cannot rate ride without customer");
        }
        if (ride.customer._id.toString() !== userId) {
            throw new BadRequestError("Only customer can rate this ride");
        }
        if (ride.status !== "COMPLETED") {
            throw new BadRequestError("Can only rate completed rides");
        }
        if (!ride.captain) {
            throw new BadRequestError("Cannot rate ride without captain");
        }
        ride.rating = rating;
        ride.review = review || "";
        await ride.save();
        const captain = await UserV1.findById(ride.captain._id);
        const totalRatings = captain.rating.total + 1;
        const totalScore = captain.rating.average * captain.rating.total + rating;
        captain.rating.average = totalScore / totalRatings;
        captain.rating.total = totalRatings;
        await captain.save();
        res.status(StatusCodes.OK).json({
            message: "Ride rated successfully",
            ride,
            captain: {
                id: captain._id,
                profile: captain.profile,
                rating: captain.rating,
            },
        });
    }
    catch (error) {
        console.error("Error rating ride:", error);
        if (error.name === 'NotFoundError' || error.name === 'BadRequestError') {
            throw error;
        }
        throw new BadRequestError("Failed to rate ride");
    }
};
module.exports = {
    createRide,
    acceptRide,
    updateRideStatus,
    getMyRides,
    cancelRide,
    rateRide,
};
//# sourceMappingURL=ride.js.map