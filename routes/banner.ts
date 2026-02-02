import express, { Router } from "express";
import multer from "multer";

// Configuración de multer para almacenar los archivos en el directorio "uploads"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Importar funciones del controlador
import { getBanners, getBannerByCity } from "../controllers/banner";

const router: Router = express.Router();

// Endpoint para obtener todos los banners
router.get("/", getBanners);

router.post("/by-city", getBannerByCity);

export default router;
