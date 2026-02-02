import express from "express";
const router = express.Router();

const {
  getSellerProfile,
  updateSellerProfile,
  getSellerStores,
} = require("../../controllers/v1/seller");

const authMiddleware = require("../../middleware/authenticationV1").default || require("../../middleware/authenticationV1");

router.get("/profile", authMiddleware, getSellerProfile);
router.get("/stores", authMiddleware, getSellerStores);
router.patch("/profile", authMiddleware, updateSellerProfile);

export default router;
