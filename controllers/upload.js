const cloudinary = require('../config/cloudinary');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

// Subir imagen a Cloudinary
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      throw new BadRequestError('No se proporcionó ninguna imagen');
    }

    // Subir imagen a Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'rapido/products',
      use_filename: true,
      unique_filename: true,
    });

    res.status(StatusCodes.OK).json({
      message: 'Imagen subida exitosamente',
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new BadRequestError('Error al subir la imagen');
  }
};

// Subir múltiples imágenes
const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new BadRequestError('No se proporcionaron imágenes');
    }

    const uploadPromises = req.files.map(file => 
      cloudinary.uploader.upload(file.path, {
        folder: 'rapido/products',
        use_filename: true,
        unique_filename: true,
      })
    );

    const results = await Promise.all(uploadPromises);

    const images = results.map(result => ({
      imageUrl: result.secure_url,
      publicId: result.public_id,
    }));

    res.status(StatusCodes.OK).json({
      message: 'Imágenes subidas exitosamente',
      images,
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    throw new BadRequestError('Error al subir las imágenes');
  }
};

// Eliminar imagen de Cloudinary
const deleteImage = async (req, res) => {
  const { publicId } = req.params;

  try {
    if (!publicId) {
      throw new BadRequestError('Public ID es requerido');
    }

    await cloudinary.uploader.destroy(publicId);

    res.status(StatusCodes.OK).json({
      message: 'Imagen eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new BadRequestError('Error al eliminar la imagen');
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
};
