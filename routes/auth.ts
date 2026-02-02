import express, { Router } from "express";
import { refreshToken } from "../controllers/auth";

const router: Router = express.Router();

router.post("/refresh-token", refreshToken);

export default router;
