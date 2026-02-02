"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateCaptain = exports.updateCaptainPricing = exports.updateCaptainProfile = exports.getCaptainRatings = exports.getCaptainById = exports.getCaptainProfile = void 0;
const http_status_codes_1 = require("http-status-codes");
const UserV1_1 = __importDefault(require("../../models/UserV1"));
const errors_1 = require("../../errors");
const getCaptainProfile = async (req, res) => {
    const captain = await UserV1_1.default.findById(req.user.id).select("-password");
    if (!captain || captain.role !== "captain") {
        throw new errors_1.NotFoundError("Captain not found");
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Captain profile retrieved successfully",
        captain,
    });
};
exports.getCaptainProfile = getCaptainProfile;
const getCaptainById = async (req, res) => {
    const { id } = req.params;
    const captain = await UserV1_1.default.findById(id)
        .select("profile vehicle rating statistics")
        .where("role")
        .equals("captain");
    if (!captain) {
        throw new errors_1.NotFoundError("Captain not found");
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Captain retrieved successfully",
        captain,
    });
};
exports.getCaptainById = getCaptainById;
const getCaptainRatings = async (req, res) => {
    const { id } = req.params;
    const captain = await UserV1_1.default.findById(id).select("rating").where("role").equals("captain");
    if (!captain) {
        throw new errors_1.NotFoundError("Captain not found");
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Captain ratings retrieved successfully",
        rating: captain.rating,
    });
};
exports.getCaptainRatings = getCaptainRatings;
const updateCaptainProfile = async (req, res) => {
    const updates = req.body;
    const captain = await UserV1_1.default.findById(req.user.id);
    if (!captain || captain.role !== "captain") {
        throw new errors_1.NotFoundError("Captain not found");
    }
    if (updates.profile) {
        Object.assign(captain.profile, updates.profile);
    }
    if (updates.vehicle) {
        Object.assign(captain.vehicle, updates.vehicle);
    }
    await captain.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Captain profile updated successfully",
        captain: captain.toObject(),
    });
};
exports.updateCaptainProfile = updateCaptainProfile;
const updateCaptainPricing = async (req, res) => {
    const { pricePerKm } = req.body;
    const captain = await UserV1_1.default.findById(req.user.id);
    if (!captain || captain.role !== "captain") {
        throw new errors_1.NotFoundError("Captain not found");
    }
    if (pricePerKm) {
        captain.captain.pricePerKm = { ...captain.captain.pricePerKm, ...pricePerKm };
        await captain.save();
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Captain pricing updated successfully",
        pricing: captain.captain.pricePerKm,
    });
};
exports.updateCaptainPricing = updateCaptainPricing;
const rateCaptain = async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
        throw new errors_1.BadRequestError("Rating must be between 1 and 5");
    }
    const captain = await UserV1_1.default.findById(id).where("role").equals("captain");
    if (!captain) {
        throw new errors_1.NotFoundError("Captain not found");
    }
    const totalRatings = captain.rating.total + 1;
    const totalScore = captain.rating.average * captain.rating.total + rating;
    captain.rating.average = totalScore / totalRatings;
    captain.rating.total = totalRatings;
    await captain.save();
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Captain rated successfully",
        captain: {
            id: captain._id,
            rating: captain.rating,
        },
    });
};
exports.rateCaptain = rateCaptain;
//# sourceMappingURL=captain.js.map