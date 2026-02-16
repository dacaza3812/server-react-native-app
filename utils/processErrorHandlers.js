/**
 * Manejadores de errores críticos del proceso
 * Estos manejadores previenen que el servidor crashee por errores no capturados
 */

// Manejar excepciones no capturadas (errores síncronos)
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  
  // Salir del proceso con código de error
  // Dokploy/Docker reiniciará automáticamente el contenedor
  process.exit(1);
});

// Manejar rechazos de promesas no manejados (errores asíncronos)
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥");
  console.error(err.name, err.message);
  console.error(err.stack);
  
  // No cerramos el proceso inmediatamente, pero sí reportamos
  // Esto da tiempo a que las operaciones en curso terminen
});

module.exports = {};
