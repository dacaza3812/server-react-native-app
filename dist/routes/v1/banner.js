const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authenticationV1");
const { getBanners, getBannerByCity, } = require("../../controllers/banner");
router.get("/", getBanners);
router.post("/by-city", getBannerByCity);
module.exports = router;
//# sourceMappingURL=banner.js.map