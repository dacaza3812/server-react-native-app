const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authenticationV1');
const {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
} = require('../controllers/upload');

// Configurar multer para almacenamiento temporal
const upload = multer({ dest: 'uploads/' });

// Subir imagen individual
router.post('/image', authMiddleware, upload.single('image'), uploadImage);

// Subir múltiples imágenes
router.post('/images', authMiddleware, upload.array('images', 10), uploadMultipleImages);

// Eliminar imagen
router.delete('/image/:publicId', authMiddleware, deleteImage);

module.exports = router;
