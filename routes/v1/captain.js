const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authenticationV1");
const {
  getCaptainProfile,
  getCaptainById,
  getCaptainRatings,
  updateCaptainProfile,
  updateCaptainPricing,
  rateCaptain,
} = require("../../controllers/v1/captain");

router.get("/profile", authMiddleware, getCaptainProfile);
router.get("/:id/profile", getCaptainById);
router.get("/:id/ratings", getCaptainRatings);
router.patch("/profile", authMiddleware, updateCaptainProfile);
router.patch("/pricing", authMiddleware, updateCaptainPricing);
router.patch("/:id/rate", authMiddleware, rateCaptain);

module.exports = router;
