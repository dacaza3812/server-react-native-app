"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { getBanners, getBannerByCity, } = require("../../controllers/banner");
router.get("/", getBanners);
router.post("/by-city", getBannerByCity);
exports.default = router;
//# sourceMappingURL=banner.js.map