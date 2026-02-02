"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_codes_1 = require("http-status-codes");
const User_1 = __importDefault(require("../models/User"));
const errors_1 = require("../errors");
const refreshToken = async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) {
        throw new errors_1.BadRequestError("Refresh token is required");
    }
    try {
        const payload = jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
        const user = await User_1.default.findById(payload.id);
        if (!user) {
            throw new errors_1.UnauthenticatedError("Invalid refresh token");
        }
        const newAccessToken = user.createAccessToken();
        const newRefreshToken = user.createRefreshToken();
        res.status(http_status_codes_1.StatusCodes.OK).json({
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
        });
    }
    catch (error) {
        throw new errors_1.UnauthenticatedError("Invalid refresh token");
    }
};
exports.refreshToken = refreshToken;
//# sourceMappingURL=auth.js.map