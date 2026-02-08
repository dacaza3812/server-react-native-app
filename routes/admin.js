const express = require("express");
const router = express.Router();
const adminAuthMiddleware = require("../middleware/adminAuth");

// Controladores
const {
  getStats,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRides,
  getRideById,
  createRide,
  updateRide,
  deleteRide,
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLiveCaptains,
  adminLogin,
} = require("../controllers/admin");

// Auth
router.post("/auth/login", adminLogin);

// Todas las rutas debajo requieren autenticación de admin
router.use(adminAuthMiddleware);

// Stats
router.get("/stats", getStats);

// Live captains locations
router.get("/captains/live", getLiveCaptains);

// Users
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Rides
router.get("/rides", getRides);
router.get("/rides/:id", getRideById);
router.post("/rides", createRide);
router.patch("/rides/:id", updateRide);
router.delete("/rides/:id", deleteRide);

// Deliveries
router.get("/deliveries", getDeliveries);
router.get("/deliveries/:id", getDeliveryById);
router.post("/deliveries", createDelivery);
router.patch("/deliveries/:id", updateDelivery);
router.delete("/deliveries/:id", deleteDelivery);

// Stores
router.get("/stores", getStores);
router.get("/stores/:id", getStoreById);
router.post("/stores", createStore);
router.patch("/stores/:id", updateStore);
router.delete("/stores/:id", deleteStore);

// Products
router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.post("/products", createProduct);
router.patch("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

module.exports = router;
