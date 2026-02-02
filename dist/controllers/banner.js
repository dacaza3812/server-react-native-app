"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBannerByCity = exports.getBanners = void 0;
const http_status_codes_1 = require("http-status-codes");
const Banner_1 = __importDefault(require("../models/Banner"));
const errors_1 = require("../errors");
const normalize = (str) => str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
const getBanners = async (req, res) => {
    const banners = await Banner_1.default.find().sort({ createdAt: -1 });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Banners retrieved successfully",
        banners,
    });
};
exports.getBanners = getBanners;
const getBannerByCity = async (req, res) => {
    const { cities } = req.body;
    if (!cities || !Array.isArray(cities)) {
        throw new errors_1.BadRequestError("Cities array is required");
    }
    const normalizedCities = cities.map((city) => normalize(city));
    const banners = await Banner_1.default.find();
    const filteredBanners = banners.filter((banner) => {
        const normCities = banner.targetCity.map((city) => normalize(city));
        return normCities.some((normCity) => normalizedCities.includes(normCity));
    });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Banners filtered by city",
        banners: filteredBanners,
    });
};
exports.getBannerByCity = getBannerByCity;
//# sourceMappingURL=banner.js.map