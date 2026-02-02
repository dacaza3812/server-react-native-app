import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import UserV1 from "../../models/UserV1";
import Store from "../../models/Store";
import { NotFoundError } from "../../errors";

interface AuthRequest extends Request {
  user: { id: string; phone: string };
}

export const getSellerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const seller = await UserV1.findById(req.user.id)
    .select("-password")
    .populate("stores");

  if (!seller || seller.role !== "store_owner") {
    throw new NotFoundError("Seller not found");
  }

  res.status(StatusCodes.OK).json({
    message: "Seller profile retrieved successfully",
    seller,
  });
};

export const updateSellerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { seller } = req.body;

  const user = await UserV1.findById(req.user.id);

  if (!user || user.role !== "store_owner") {
    throw new NotFoundError("Seller not found");
  }

  if (seller) {
    Object.assign(user.seller, seller);
    await user.save();
  }

  res.status(StatusCodes.OK).json({
    message: "Seller profile updated successfully",
    seller: user.seller,
  });
};

export const getSellerStores = async (req: AuthRequest, res: Response): Promise<void> => {
  const stores = await Store.find({ owner: req.user.id });

  res.status(StatusCodes.OK).json({
    message: "Seller stores retrieved successfully",
    count: stores.length,
    stores,
  });
};
