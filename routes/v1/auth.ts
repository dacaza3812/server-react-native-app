import express from "express";
import {
  register,
  login,
  refreshToken,
  updateProfile,
  updateCaptainProfile,
  changePassword,
} from "../../controllers/v1/auth";
import authMiddleware from "../../middleware/authenticationV1";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);

router.patch("/update-profile", authMiddleware, updateProfile);
router.patch("/update-captain-profile", authMiddleware, updateCaptainProfile);
router.patch("/change-password", authMiddleware, changePassword);

export default router;
