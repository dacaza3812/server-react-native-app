import express, { Router } from "express";
import { getVersion } from "../controllers/versionapp";

const router: Router = express.Router();

router.get("/", getVersion);

export default router;
