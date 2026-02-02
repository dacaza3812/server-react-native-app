import express from "express";
const router = express.Router();

const {
  getBanners,
  getBannerByCity,
} = require("../../controllers/banner");

router.get("/", getBanners);
router.post("/by-city", getBannerByCity);

export default router;
