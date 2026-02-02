import express from "express";
import { getVersion } from "../controllers/versionapp";

const router = express.Router();

router.get("/", getVersion);

export default router;
