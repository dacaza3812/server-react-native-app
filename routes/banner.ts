import express from "express";
import { getBanners, getBannerByCity } from "../controllers/banner";

const router = express.Router();

router.get("/", getBanners);
router.post("/by-city", getBannerByCity);

export default router;
