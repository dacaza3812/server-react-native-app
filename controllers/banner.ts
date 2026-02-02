import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Banner from "../models/Banner";
import { NotFoundError, BadRequestError } from "../errors";

const normalize = (str: string): string =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

export const getBanners = async (req: Request, res: Response): Promise<void> => {
  const banners = await Banner.find().sort({ createdAt: -1 });

  res.status(StatusCodes.OK).json({
    message: "Banners retrieved successfully",
    banners,
  });
};

export const getBannerByCity = async (req: Request, res: Response): Promise<void> => {
  const { cities } = req.body;

  if (!cities || !Array.isArray(cities)) {
    throw new BadRequestError("Cities array is required");
  }

  const normalizedCities = cities.map((city: string) => normalize(city));

  const banners = await Banner.find();

  const filteredBanners = banners.filter((banner) => {
    const normCities = banner.targetCity.map((city) => normalize(city));
    return normCities.some((normCity) => normalizedCities.includes(normCity));
  });

  res.status(StatusCodes.OK).json({
    message: "Banners filtered by city",
    banners: filteredBanners,
  });
};
