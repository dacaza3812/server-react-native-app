const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage });
const { createBanner, getBanners, getBannerByCity, deleteBanner } = require("../controllers/banner");
router.post("/", upload.single("image"), createBanner);
router.get("/", getBanners);
router.post("/by-city", getBannerByCity);
router.delete("/:id", deleteBanner);
module.exports = router;
//# sourceMappingURL=banner.js.map