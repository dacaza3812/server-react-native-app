"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { register, login, refreshToken, updateProfile, updateCaptainProfile, changePassword, } = require("../../controllers/v1/auth");
const authMiddleware = require("../../middleware/authenticationV1").default || require("../../middleware/authenticationV1");
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.patch("/update-profile", authMiddleware, updateProfile);
router.patch("/update-captain-profile", authMiddleware, updateCaptainProfile);
router.patch("/change-password", authMiddleware, changePassword);
exports.default = router;
//# sourceMappingURL=auth.js.map