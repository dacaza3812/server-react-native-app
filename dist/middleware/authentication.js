"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../errors");
const User_1 = __importDefault(require("../models/User"));
const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
        throw new errors_1.UnauthenticatedError("Authentication invalid");
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = { id: payload.id, phone: payload.phone };
        req.socket = req.io;
        const user = await User_1.default.findById(payload.id);
        if (!user) {
            throw new errors_1.NotFoundError("User not found");
        }
        next();
    }
    catch (error) {
        throw new errors_1.UnauthenticatedError("Authentication invalid");
    }
};
exports.default = auth;
//# sourceMappingURL=authentication.js.map