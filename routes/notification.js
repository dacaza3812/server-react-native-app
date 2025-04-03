const express = require("express");
const {
    sendNotification
} = require("../controllers/notifications");

const router = express.Router();
router.post("/", sendNotification);

module.exports = router;