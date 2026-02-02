"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSellerStores = exports.updateSellerProfile = exports.getSellerProfile = void 0;
const http_status_codes_1 = require("http-status-codes");
const UserV1_1 = __importDefault(require("../../models/UserV1"));
const Store_1 = __importDefault(require("../../models/Store"));
const errors_1 = require("../../errors");
const getSellerProfile = async (req, res) => {
    const seller = await UserV1_1.default.findById(req.user.id)
        .select("-password")
        .populate("stores");
    if (!seller || seller.role !== "store_owner") {
        throw new errors_1.NotFoundError("Seller not found");
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Seller profile retrieved successfully",
        seller,
    });
};
exports.getSellerProfile = getSellerProfile;
const updateSellerProfile = async (req, res) => {
    const { seller } = req.body;
    const user = await UserV1_1.default.findById(req.user.id);
    if (!user || user.role !== "store_owner") {
        throw new errors_1.NotFoundError("Seller not found");
    }
    if (seller) {
        Object.assign(user.seller, seller);
        await user.save();
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Seller profile updated successfully",
        seller: user.seller,
    });
};
exports.updateSellerProfile = updateSellerProfile;
const getSellerStores = async (req, res) => {
    const stores = await Store_1.default.find({ owner: req.user.id });
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Seller stores retrieved successfully",
        count: stores.length,
        stores,
    });
};
exports.getSellerStores = getSellerStores;
//# sourceMappingURL=seller.js.map