import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import RideV1, { IRideV1 } from "../../models/RideV1";
import UserV1, { IUserV1 } from "../../models/UserV1";
import { BadRequestError, NotFoundError } from "../../errors";
import {
  calculateDistance,
  generateOTP,
  calculateFare,
} from "../../utils/mapUtils";
import { AuthenticatedRequest } from "../../middleware/authenticationV1";

interface RideBody {
  vehicle: "bike" | "auto" | "cabEconomy" | "cabPremium";
  pickup: {
    address: string;
    latitude: number;
    longitude: number;
  };
  drop: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

interface StatusBody {
  status: "START" | "ARRIVED" | "COMPLETED";
}

interface CancelBody {
  reason?: string;
}

interface RateBody {
  rating: number;
  review?: string;
}

const calculateFareV1 = async (
  distance: number,
  captainId: string,
  vehicleType: string
): Promise<number> => {
  const captain = await UserV1.findById(captainId);

  if (!captain || captain.role !== "captain") {
    throw new BadRequestError("Invalid captain");
  }

  const captainPricePerKm = captain.captain.pricePerKm[vehicleType as keyof typeof captain.captain.pricePerKm] || 150;
  const baseFare = 100;
  const minimumFare = 200;

  const fare = baseFare + distance * captainPricePerKm;
  return Math.max(fare, minimumFare);
};

export const createRide = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { vehicle, pickup, drop } = req.body as RideBody;

  if (!vehicle || !pickup || !drop) {
    throw new BadRequestError("Vehicle, pickup, and drop details are required");
  }

  const {
    address: pickupAddress,
    latitude: pickupLat,
    longitude: pickupLon,
  } = pickup;

  const { address: dropAddress, latitude: dropLat, longitude: dropLon } = drop;

  if (
    !pickupAddress ||
    !pickupLat ||
    !pickupLon ||
    !dropAddress ||
    !dropLat ||
    !dropLon
  ) {
    throw new BadRequestError("Complete pickup and drop details are required");
  }

  const customer = req.user;

  try {
    const distance = calculateDistance(pickupLat, pickupLon, dropLat, dropLon);
    const defaultFares = calculateFare(distance);

    const ride = new RideV1({
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
  } catch (error) {
    console.error(error);
    throw new BadRequestError("Failed to create ride");
  }
};

export const acceptRide = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const captainId = req.user.id;
  const { rideId } = req.params;

  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }

  try {
    let ride = await RideV1.findById(rideId).populate("customer");

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (ride.status !== "SEARCHING_FOR_CAPTAIN") {
      throw new BadRequestError("Ride is no longer available for assignment");
    }

    const captain = await UserV1.findById(captainId);

    if (captain!.role !== "captain") {
      throw new BadRequestError("User is not a captain");
    }

    const fare = await calculateFareV1(ride.distance, captainId, ride.vehicle);
    ride.fare = fare;
    ride.captain = captainId as any;
    ride.status = "START";
    await ride.save();

    ride = await ride.populate("captain");

    (req as any).io.to(`ride_${rideId}`).emit("rideUpdate", ride);
    (req as any).io.to(`ride_${rideId}`).emit("rideAccepted");

    res.status(StatusCodes.OK).json({
      message: "Ride accepted successfully",
      ride,
    });
  } catch (error: any) {
    console.error("Error accepting ride:", error);
    if (error.name === "NotFoundError" || error.name === "BadRequestError") {
      throw error;
    }
    throw new BadRequestError("Failed to accept ride");
  }
};

export const updateRideStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { rideId } = req.params;
  const { status } = req.body as StatusBody;

  if (!rideId || !status) {
    throw new BadRequestError("Ride ID and status are required");
  }

  try {
    let ride = await RideV1.findById(rideId).populate("customer captain");

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (!["START", "ARRIVED", "COMPLETED"].includes(status)) {
      throw new BadRequestError("Invalid ride status");
    }

    ride.status = status;
    await ride.save();

    (req as any).io.to(`ride_${rideId}`).emit("rideUpdate", ride);

    res.status(StatusCodes.OK).json({
      message: `Ride status updated to ${status}`,
      ride,
    });
  } catch (error: any) {
    console.error("Error updating ride status:", error);
    if (error.name === "NotFoundError" || error.name === "BadRequestError") {
      throw error;
    }
    throw new BadRequestError("Failed to update ride status");
  }
};

export const getMyRides = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.user.id;
  const { status } = req.query;

  try {
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
  } catch (error) {
    console.error("Error retrieving rides:", error);
    throw new BadRequestError("Failed to retrieve rides");
  }
};

export const cancelRide = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { rideId } = req.params;
  const { reason } = req.body as CancelBody;
  const userId = req.user.id;
  const userRole = (req as any).user.role;

  try {
    const ride = await RideV1.findById(rideId).populate("customer captain");

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (
      (ride.customer as any)._id.toString() !== userId &&
      (ride.captain as any)?._id.toString() !== userId
    ) {
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

    (req as any).io.to(`ride_${rideId}`).emit("rideCancelled", {
      ride,
      cancelledBy: userRole,
      message: "Ride cancelled successfully",
    });

    res.status(StatusCodes.OK).json({
      message: "Ride cancelled successfully",
      ride,
    });
  } catch (error: any) {
    console.error("Error cancelling ride:", error);
    if (error.name === "NotFoundError" || error.name === "BadRequestError") {
      throw error;
    }
    throw new BadRequestError("Failed to cancel ride");
  }
};

export const rateRide = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { rideId } = req.params;
  const { rating, review } = req.body as RateBody;
  const userId = req.user.id;

  console.log("[DEBUG] Rate ride - rideId:", rideId, "userId:", userId);

  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new BadRequestError("Rating must be between 1 and 5");
  }

  try {
    const ride = await RideV1.findById(rideId)
      .populate("customer")
      .populate("captain");

    console.log(
      "[DEBUG] Ride found:",
      !!ride,
      "Customer:",
      !!(ride as any)?.customer,
      "Captain:",
      !!(ride as any)?.captain
    );

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (!(ride as any).customer) {
      throw new BadRequestError("Cannot rate ride without customer");
    }

    if ((ride as any).customer._id.toString() !== userId) {
      throw new BadRequestError("Only customer can rate this ride");
    }

    if (ride.status !== "COMPLETED") {
      throw new BadRequestError("Can only rate completed rides");
    }

    if (!(ride as any).captain) {
      throw new BadRequestError("Cannot rate ride without captain");
    }

    (ride as any).rating = rating;
    (ride as any).review = review || "";
    await ride.save();

    const captain = await UserV1.findById((ride as any).captain._id);
    const totalRatings = captain!.rating.total + 1;
    const totalScore =
      captain!.rating.average * captain!.rating.total + rating;

    captain!.rating.average = totalScore / totalRatings;
    captain!.rating.total = totalRatings;
    await captain!.save();

    res.status(StatusCodes.OK).json({
      message: "Ride rated successfully",
      ride,
      captain: {
        id: captain!._id,
        profile: captain!.profile,
        rating: captain!.rating,
      },
    });
  } catch (error: any) {
    console.error("Error rating ride:", error);
    if (error.name === "NotFoundError" || error.name === "BadRequestError") {
      throw error;
    }
    throw new BadRequestError("Failed to rate ride");
  }
};
