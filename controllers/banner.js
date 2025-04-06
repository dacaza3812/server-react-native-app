const Banner = require("../models/banner");
const cloudinary = require('../config/cloudinary');

const normalize = (str) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

// Función para extraer public_id de la URL de Cloudinary [[7]]
const extractPublicId = (url) => {
  const uploadPart = url.split('/upload/')[1];
  if (!uploadPart) return null;
  
  const segments = uploadPart.split('/');
  let publicIdStartIndex = 0;
  
  // Verificar si el primer segmento es una versión (v1234)
  if (segments[0].startsWith('v') && /^\d+$/.test(segments[0].substring(1))) {
    publicIdStartIndex = 1;
  }
  
  const publicIdWithExt = segments.slice(publicIdStartIndex).join('/');
  return publicIdWithExt.split('.')[0];
};

const createBanner = async (req, res) => {
  try {
    console.log("req.file:", req.file);
    if (!req.file) {
      return res.status(400).json({ error: "La imagen es requerida." });
    }
    
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: 'banners',
      resource_type: 'image',
    });

    let { title, description, link, targetCity } = req.body;
    if (typeof targetCity === "string") {
      try {
        targetCity = JSON.parse(targetCity);
      } catch (error) {
        targetCity = [targetCity];
      }
    }

    const newBanner = new Banner({
      imageUrl: uploadResult.secure_url,
      title,
      description,
      link,
      targetCity,
    });
    
    await newBanner.save();
    res.status(201).json({
      message: "Banner creado exitosamente.",
      banner: newBanner,
    });
  } catch (error) {
    console.error("Error al crear el banner:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

const getBanners = async (req, res) => {
  try {
    let banners = await Banner.find().sort({ createdAt: -1 });

    banners = banners.map(banner => {
      const bannerObj = banner.toObject();
      const publicId = extractPublicId(bannerObj.imageUrl);
      bannerObj.imageUrl = cloudinary.url(publicId, {
        fetch_format: 'auto',
        quality: 'auto'
      });
      return bannerObj;
    });

    res.status(200).json({
      message: "Banners recuperados exitosamente.",
      banners,
    });
  } catch (error) {
    console.error("Error al obtener banners:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

const getBannerByCity = async (req, res) => {
  try {
    const { cities } = req.body;
    if (!cities || !Array.isArray(cities)) {
      return res.status(400).json({
        error: "Debe enviar un arreglo de ciudades en el body.",
      });
    }

    const normalizedCities = cities.map(city => normalize(city));
    let banners = await Banner.find();

    banners = banners.map(banner => {
      const bannerObj = banner.toObject();
      const publicId = extractPublicId(bannerObj.imageUrl);
      bannerObj.imageUrl = cloudinary.url(publicId, {
        fetch_format: 'auto',
        quality: 'auto'
      });
      return bannerObj;
    });

    banners = banners.filter(banner => {
      const normCities = banner.targetCity.map(city => normalize(city));
      return normCities.some(normCity => normalizedCities.includes(normCity));
    });

    res.status(200).json({
      message: "Banners filtrados por ciudades recuperados exitosamente.",
      banners,
    });
  } catch (error) {
    console.error("Error al obtener banners por ciudades:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    
    if (!banner) {
      return res.status(404).json({ error: "Banner no encontrado" });
    }

    const publicId = extractPublicId(banner.imageUrl);
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    await Banner.findByIdAndDelete(id);

    res.status(200).json({
      message: "Banner eliminado exitosamente",
      deletedId: id
    });
  } catch (error) {
    console.error("Error al eliminar banner:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = { createBanner, getBanners, getBannerByCity, deleteBanner };