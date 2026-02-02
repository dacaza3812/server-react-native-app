import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import RideV1 from "../../models/RideV1";
import UserV1 from "../../models/UserV1";
import { BadRequestError, NotFoundError } from "../../errors";
import { calculateDistance, generateOTP } from "../../utils/mapUtils";

interface AuthRequest extends Request {
  user: { id: string; phone: string };
  io?: any;
}

const calculateFareV1 = async (distance: number, captainId: string, vehicleType: string): Promise<number> => {
  const captain = await UserV1.findById(captainId);
  if (!captain || captain.role !== "captain") {
    throw new BadRequestError("Invalid captain");
  }
  const captainPricePerKm = captain.captain?.pricePerKm?.[vehicleType as keyof typeof captain.captain.pricePerKm] || 150;
  const baseFare = 100;
  const minimumFare = 200;
  const fare = baseFare + (distance * captainPricePerKm);
  return Math.max(fare, minimumFare);
};

export const createRide = async (req: AuthRequest, res: Response): Promise<void> => {
  const { vehicle, pickup, drop } = req.body;

  if (!vehicle || !pickup || !drop) {
    throw new BadRequestError("Vehicle, pickup, and drop details are required");
  }

  const { address: pickupAddress, latitude: pickupLat, longitude: pickupLon } = pickup;
  const { address: dropAddress, latitude: dropLat, longitude: dropLon } = drop;

  if (!pickupAddress || !pickupLat || !pickupLon || !dropAddress || !dropLat || !dropLon) {
    throw new BadRequestError("Complete pickup and drop details are required");
  }

  const distance = calculateDistance(pickupLat, pickupLon, dropLat, dropLon);
  const defaultFares = { bike: 200, auto: 300, cabEconomy: 400, cabPremium: 500 };

  const ride = new RideV1({
    vehicle,
    distance,
    fare: defaultFares[vehicle as keyof typeof defaultFares] || 300,
    pickup: { address: pickupAddress, latitude: pickupLat, longitude: pickupLon },
    drop: { address: dropAddress, latitude: dropLat, longitude: dropLon },
    customer: req.user.id,
    otp: generateOTP(),
  });

  await ride.save();

  res.status(StatusCodes.CREATED).json({
    message: "Ride created successfully",
    ride,
  });
};

export const acceptRide = async (req: AuthRequest, res: Response): Promise<void> => {
  const captainId = req.user.id;
  const { rideId } = req.params;

  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }

  let ride = await RideV1.findById(rideId).populate("customer");

  if (!ride) {
    throw new NotFoundError("Ride not found");
  }

  if (ride.status !== "SEARCHING_FOR_CAPTAIN") {
    throw new BadRequestError("Ride is no longer available for assignment");
  }

  const captain = await UserV1.findById(captainId);
  if (captain?.role !== "captain") {
    throw new BadRequestError("User is not a captain");
  }

  const fare = await calculateFareV1(ride.distance, captainId, ride.vehicle);
  ride.fare = fare;
  ride.captain = captainId as any;
  ride.status = "START";
  await ride.save();

  ride = await ride.populate("captain");

  req.io?.to(`ride_${rideId}`).emit("rideUpdate", ride);
  req.io?.to(`ride_${rideId}`).emit("rideAccepted");

  res.status(StatusCodes.OK).json({
    message: "Ride accepted successfully",
    ride,
  });
};

export const updateRideStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { rideId } = req.params;
  const { status } = req.body;

  if (!rideId || !status) {
    throw new BadRequestError("Ride ID and status are required");
  }

  let ride = await RideV1.findById(rideId).populate("customer captain");

  if (!ride) {
    throw new NotFoundError("Ride not found");
  }

  if (!["START", "ARRIVED", "COMPLETED"].includes(status)) {
    throw new BadRequestError("Invalid ride status");
  }

  ride.status = status;
  await ride.save();

  req.io?.to(`ride_${rideId}`).emit("rideUpdate", ride);

  res.status(StatusCodes.OK).json({
    message: `Ride status updated to ${status}`,
    ride,
  });
};

export const getMyRides = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user.id;
  const { status } = req.query;

  const query: any = {
    $or: [{ customer: userId }, { captain: userId }],
  };

  if (status) {
    query.status = status;
  }

  const rides = await RideV1.find(query)
    .populate("customer", "profile.name profile.lastName phone")
    .populate("captain", "profile.name profile.lastName vehicle.type phone")
    .sort({ createdAt: -1 });

  res.status(StatusCodes.OK).json({
    message: "Rides retrieved successfully",
    count: rides.length,
    rides,
  });
};

export const cancelRide = async (req: AuthRequest, res: Response): Promise<void> => {
  const { rideId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const ride = await RideV1.findById(rideId).populate("customer captain");

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
  ride.cancelledBy = userId as any;
  await ride.save();

  req.io?.to(`ride_${rideId}`).emit("rideCancelled", {
    ride,
    cancelledBy: req.user,
    message: "Ride cancelled successfully",
  });

  res.status(StatusCodes.OK).json({
    message: "Ride cancelled successfully",
    ride,
  });
};

export const rateRide = async (req: AuthRequest, res: Response): Promise<void> => {
  const { rideId } = req.params;
  const { rating, review } = req.body;
  const userId = req.user.id;

  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new BadRequestError("Rating must be between 1 and 5");
  }

  const ride = await RideV1.findById(rideId)
    .populate("customer")
    .populate("captain");

  if (!ride) {
    throw new NotFoundError("Ride not found");
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
  if (captain) {
    const totalRatings = captain.rating.total + 1;
    const totalScore = captain.rating.average * captain.rating.total + rating;
    captain.rating.average = totalScore / totalRatings;
    captain.rating.total = totalRatings;
    await captain.save();
  }

  res.status(StatusCodes.OK).json({
    message: "Ride rated successfully",
    ride,
    captain: {
      id: captain?._id,
      profile: captain?.profile,
      rating: captain?.rating,
    },
  });
};
