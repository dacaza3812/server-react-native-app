import express, { Router } from "express";
import { sendNotification } from "../controllers/notifications";

const router: Router = express.Router();

router.post("/", sendNotification);

export default router;
