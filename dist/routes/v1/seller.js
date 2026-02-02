"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const { getSellerProfile, updateSellerProfile, getSellerStores, } = require("../../controllers/v1/seller");
const authMiddleware = require("../../middleware/authenticationV1").default || require("../../middleware/authenticationV1");
router.get("/profile", authMiddleware, getSellerProfile);
router.get("/stores", authMiddleware, getSellerStores);
router.patch("/profile", authMiddleware, updateSellerProfile);
exports.default = router;
//# sourceMappingURL=seller.js.map