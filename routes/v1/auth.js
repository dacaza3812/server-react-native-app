const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  updateProfile,
  updateCaptainProfile,
  changePassword,
} = require("../../controllers/v1/auth");

const authMiddleware = require("../../middleware/authenticationV1");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);

// Protected routes
router.patch("/update-profile", authMiddleware, updateProfile);
router.patch("/update-captain-profile", authMiddleware, updateCaptainProfile);
router.patch("/change-password", authMiddleware, changePassword);

module.exports = router;
