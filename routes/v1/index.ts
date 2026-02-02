import express from "express";
import authRouter from "./auth";
import rideRouter from "./ride";
import captainRouter from "./captain";
import sellerRouter from "./seller";
import productRouter from "./product";
import storeRouter from "./store";
import deliveryRouter from "./delivery";
import bannerRouter from "./banner";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/rides", rideRouter);
router.use("/captains", captainRouter);
router.use("/sellers", sellerRouter);
router.use("/products", productRouter);
router.use("/stores", storeRouter);
router.use("/deliveries", deliveryRouter);
router.use("/banners", bannerRouter);

export default router;
