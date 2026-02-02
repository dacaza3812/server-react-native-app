import express from "express";
import authMiddleware from "../../middleware/authenticationV1";
import {
  getSellerProfile,
  updateSellerProfile,
  getSellerStores,
} from "../../controllers/v1/seller";

const router = express.Router();

router.get("/profile", authMiddleware, getSellerProfile);
router.get("/stores", authMiddleware, getSellerStores);
router.patch("/profile", authMiddleware, updateSellerProfile);

export default router;
