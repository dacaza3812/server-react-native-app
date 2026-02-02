import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import User from "../models/User";
import { UnauthenticatedError, BadRequestError } from "../errors";

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET as string) as {
      id: string;
    };

    const user = await User.findById(payload.id);

    if (!user) {
      throw new UnauthenticatedError("Invalid refresh token");
    }

    const newAccessToken = user.createAccessToken();
    const newRefreshToken = user.createRefreshToken();

    res.status(StatusCodes.OK).json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    throw new UnauthenticatedError("Invalid refresh token");
  }
};
