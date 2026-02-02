import express from "express";
import authMiddleware from "../../middleware/authenticationV1";
import {
  getCaptainProfile,
  getCaptainById,
  getCaptainRatings,
  updateCaptainProfile,
  updateCaptainPricing,
  rateCaptain,
} from "../../controllers/v1/captain";

const router = express.Router();

router.get("/profile", authMiddleware, getCaptainProfile);
router.get("/:id/profile", getCaptainById);
router.get("/:id/ratings", getCaptainRatings);
router.patch("/profile", authMiddleware, updateCaptainProfile);
router.patch("/pricing", authMiddleware, updateCaptainPricing);
router.patch("/:id/rate", authMiddleware, rateCaptain);

export default router;
