const express = require("express");
const {
  getVersionApp,
  createVersionApp
} = require("../controllers/versionapp");

const router = express.Router();
router.get("/", getVersionApp);
router.post("/", createVersionApp);

module.exports = router;