const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authenticationV1");
const {
  getBanners,
  getBannerByCity,
} = require("../../controllers/banner");

// Public routes
router.get("/", getBanners);
router.post("/by-city", getBannerByCity);

module.exports = router;
