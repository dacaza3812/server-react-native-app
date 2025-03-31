const Version = require("../models/VersionApp");

const getVersionApp = async (req, res) => {
    try {
      // Obtener el último registro ordenado por _id en orden descendente
      const lastVersion = await Version.findOne().sort({ createdAt: -1 });
  
      if (!lastVersion) {
        return res.status(404).json({
          message: "No se encontraron registros de versiones en la base de datos."
        });
      }
  
      res.status(200).json({
        message: "Versión recuperada exitosamente",
        version: lastVersion
      });
    } catch (error) {
      console.error("Error al recuperar la versión:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  };

const createVersionApp = async (req, res) => {
    const { version, user, password } = req.body;
  
    // Validación de campos obligatorios
    if (!version || !user || !password) {
      return res.status(400).json({ error: "Los campos version, user y password son obligatorios" });
    }

    const userAdmin = "dacaza"
    const passAdmin = "Dacaza3812*ñ"

    if(user !== userAdmin || password !== passAdmin) {
      return res.status(403).json({ error: "Acceso denegado" });
    }
  
    try {
      // Se crea una nueva instancia de Version utilizando solo el campo version,
      // dado que el esquema no almacena user ni password.
      const newVersion = new Version({ version });
      await newVersion.save();
  
      res.status(201).json({
        message: "Versión creada exitosamente",
        version: newVersion
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  };

module.exports = { getVersionApp, createVersionApp };
