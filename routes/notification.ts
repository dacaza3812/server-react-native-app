import express from "express";
import { sendNotification } from "../controllers/notifications";

const router = express.Router();

router.post("/", sendNotification);

export default router;
