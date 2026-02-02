import express from "express";
const router = express.Router();

const {
  getCaptainProfile,
  getCaptainById,
  getCaptainRatings,
  updateCaptainProfile,
  updateCaptainPricing,
  rateCaptain,
} = require("../../controllers/v1/captain");

const authMiddleware = require("../../middleware/authenticationV1").default || require("../../middleware/authenticationV1");

router.get("/profile", authMiddleware, getCaptainProfile);
router.get("/:id/profile", getCaptainById);
router.get("/:id/ratings", getCaptainRatings);
router.patch("/profile", authMiddleware, updateCaptainProfile);
router.patch("/pricing", authMiddleware, updateCaptainPricing);
router.patch("/:id/rate", authMiddleware, rateCaptain);

export default router;
