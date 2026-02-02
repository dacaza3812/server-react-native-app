"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { getCaptainProfile, getCaptainById, getCaptainRatings, updateCaptainProfile, updateCaptainPricing, rateCaptain, } = require("../../controllers/v1/captain");
const authMiddleware = require("../../middleware/authenticationV1").default || require("../../middleware/authenticationV1");
router.get("/profile", authMiddleware, getCaptainProfile);
router.get("/:id/profile", getCaptainById);
router.get("/:id/ratings", getCaptainRatings);
router.patch("/profile", authMiddleware, updateCaptainProfile);
router.patch("/pricing", authMiddleware, updateCaptainPricing);
router.patch("/:id/rate", authMiddleware, rateCaptain);
exports.default = router;
//# sourceMappingURL=captain.js.map