const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authenticationV1");
const {
  getSellerProfile,
  getSellerById,
  updateSellerProfile,
  getSellerStores,
} = require("../../controllers/v1/seller");

router.get("/profile", authMiddleware, getSellerProfile);
router.get("/:id/profile", getSellerById);
router.get("/:id/stores", getSellerStores);
router.patch("/profile", authMiddleware, updateSellerProfile);

module.exports = router;
