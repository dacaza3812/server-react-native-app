import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import UserV1 from "../../models/UserV1";
import { NotFoundError, BadRequestError } from "../../errors";

interface AuthRequest extends Request {
  user: { id: string; phone: string };
}

export const getCaptainProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const captain = await UserV1.findById(req.user.id).select("-password");

  if (!captain || captain.role !== "captain") {
    throw new NotFoundError("Captain not found");
  }

  res.status(StatusCodes.OK).json({
    message: "Captain profile retrieved successfully",
    captain,
  });
};

export const getCaptainById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const captain = await UserV1.findById(id)
    .select("profile vehicle rating statistics")
    .where("role")
    .equals("captain");

  if (!captain) {
    throw new NotFoundError("Captain not found");
  }

  res.status(StatusCodes.OK).json({
    message: "Captain retrieved successfully",
    captain,
  });
};

export const getCaptainRatings = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const captain = await UserV1.findById(id).select("rating").where("role").equals("captain");

  if (!captain) {
    throw new NotFoundError("Captain not found");
  }

  res.status(StatusCodes.OK).json({
    message: "Captain ratings retrieved successfully",
    rating: captain.rating,
  });
};

export const updateCaptainProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const updates = req.body;

  const captain = await UserV1.findById(req.user.id);

  if (!captain || captain.role !== "captain") {
    throw new NotFoundError("Captain not found");
  }

  if (updates.profile) {
    Object.assign(captain.profile, updates.profile);
  }

  if (updates.vehicle) {
    Object.assign(captain.vehicle, updates.vehicle);
  }

  await captain.save();

  res.status(StatusCodes.OK).json({
    message: "Captain profile updated successfully",
    captain: captain.toObject(),
  });
};

export const updateCaptainPricing = async (req: AuthRequest, res: Response): Promise<void> => {
  const { pricePerKm } = req.body;

  const captain = await UserV1.findById(req.user.id);

  if (!captain || captain.role !== "captain") {
    throw new NotFoundError("Captain not found");
  }

  if (pricePerKm) {
    captain.captain.pricePerKm = { ...captain.captain.pricePerKm, ...pricePerKm };
    await captain.save();
  }

  res.status(StatusCodes.OK).json({
    message: "Captain pricing updated successfully",
    pricing: captain.captain.pricePerKm,
  });
};

export const rateCaptain = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new BadRequestError("Rating must be between 1 and 5");
  }

  const captain = await UserV1.findById(id).where("role").equals("captain");

  if (!captain) {
    throw new NotFoundError("Captain not found");
  }

  const totalRatings = captain.rating.total + 1;
  const totalScore = captain.rating.average * captain.rating.total + rating;
  captain.rating.average = totalScore / totalRatings;
  captain.rating.total = totalRatings;

  await captain.save();

  res.status(StatusCodes.OK).json({
    message: "Captain rated successfully",
    captain: {
      id: captain._id,
      rating: captain.rating,
    },
  });
};
