import express from "express";
import { refreshToken } from "../controllers/auth";

const router = express.Router();

router.post("/refresh-token", refreshToken);

export default router;
