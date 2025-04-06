const express = require("express");
const router = express.Router();
const multer = require("multer");

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
const { createBanner, getBanners, getBannerByCity, deleteBanner } = require("../controllers/banner");

// Endpoint para subir un banner (imagen + datos)
router.post("/", upload.single("image"), createBanner);

// Endpoint para obtener todos los banners
router.get("/", getBanners);

router.post("/by-city", getBannerByCity)

router.delete("/:id", deleteBanner); 


module.exports = router;
