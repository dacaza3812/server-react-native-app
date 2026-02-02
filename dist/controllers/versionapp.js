"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVersion = void 0;
const http_status_codes_1 = require("http-status-codes");
const VersionApp_1 = __importDefault(require("../models/VersionApp"));
const getVersion = async (req, res) => {
    const version = await VersionApp_1.default.findOne().sort({ createdAt: -1 });
    if (!version) {
        res.status(http_status_codes_1.StatusCodes.OK).json({
            message: "No version records found",
            version: null,
        });
        return;
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        message: "Version retrieved successfully",
        version,
    });
};
exports.getVersion = getVersion;
//# sourceMappingURL=versionapp.js.map