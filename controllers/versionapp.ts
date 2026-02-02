import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import VersionApp from "../models/VersionApp";

export const getVersion = async (req: Request, res: Response): Promise<void> => {
  const version = await VersionApp.findOne().sort({ createdAt: -1 });

  if (!version) {
    res.status(StatusCodes.OK).json({
      message: "No version records found",
      version: null,
    });
    return;
  }

  res.status(StatusCodes.OK).json({
    message: "Version retrieved successfully",
    version,
  });
};
