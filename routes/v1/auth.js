const express = require("express");
const router = express.Router();
const {
  auth,
  refreshToken,
  updateProfile,
  updateCaptainProfile,
} = require("../../controllers/v1/auth");

router.post("/signin", auth);
router.post("/refresh-token", refreshToken);

const authMiddleware = require("../../middleware/authenticationV1");

router.post("/update-profile", authMiddleware, updateProfile);
router.post("/update-captain-profile", authMiddleware, updateCaptainProfile);

module.exports = router;
