const { adminLogin } = require("./auth");
const { getStats, getLiveCaptains } = require("./dashboard");
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require("./users");
const { getRides, getRideById, createRide, updateRide, deleteRide } = require("./rides");
const { getDeliveries, getDeliveryById, createDelivery, updateDelivery, deleteDelivery } = require("./deliveries");
const { getStores, getStoreById, createStore, updateStore, deleteStore } = require("./stores");
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require("./products");

module.exports = {
  // Auth
  adminLogin,
  
  // Dashboard
  getStats,
  getLiveCaptains,
  
  // Users
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  
  // Rides
  getRides,
  getRideById,
  createRide,
  updateRide,
  deleteRide,
  
  // Deliveries
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  
  // Stores
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  
  // Products
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
