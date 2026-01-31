const Ride = require("../../models/Ride");
const { redis } = require("../../utils/redisClient");

const {
  rideNotificationSent,
  rideToCaptains,
  deliveryToCaptains,
  activeSockets,
  socketAuthMiddleware,
  getNearbyCaptainsFromRedis,
  updateNearbyCaptains,
} = require("./index");

const {
  handleGoOnDuty,
  handleGoOffDuty,
  handleUpdateLocation,
  handleAcceptDelivery,
  handleUpdateDeliveryStatus,
} = require("./captainHandlers");

const {
  handleSubscribeToZone,
  handleSearchCaptain,
  handleRequestDelivery,
  handleSubscribeToDelivery,
  handleSubscribeToStoreOrders: handleCustomerSubscribeToStoreOrders,
} = require("./customerHandlers");

const {
  handleSubscribeToStoreOrders: handleStoreSubscribeToStoreOrders,
  handleUpdateOrderStatus,
} = require("./storeHandlers");

const {
  handleCancelRide,
  handleCancelDelivery,
} = require("./cancelHandlers");

/**
 * Handler principal de conexiones Socket.IO
 */
const handleSocketConnection = (io) => {
  // Middleware de autenticación
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log("User Joined🔴: ", user);

    // Store socket reference for this connection
    activeSockets.set(user.id, socket);

    // --- CAPTAIN HANDLERS ---
    if (user.role === "captain") {
      socket.on("goOnDuty", (coords) => 
        handleGoOnDuty(socket, user, coords, () => updateNearbyCaptains(io)));

      socket.on("goOffDuty", () => 
        handleGoOffDuty(socket, user, () => updateNearbyCaptains(io)));

      socket.on("updateLocation", (coords) => 
        handleUpdateLocation(socket, user, coords, () => updateNearbyCaptains(io)));

      socket.on("acceptDelivery", (deliveryId) => 
        handleAcceptDelivery(socket, io, user, deliveryId));

      socket.on("updateDeliveryStatus", (data) => 
        handleUpdateDeliveryStatus(socket, io, user, data));
    }

    // --- CUSTOMER HANDLERS ---
    if (user.role === "customer") {
      socket.on("subscribeToZone", (customerCoords) => 
        handleSubscribeToZone(socket, user, customerCoords, getNearbyCaptainsFromRedis));

      socket.on("searchCaptain", (rideId) => 
        handleSearchCaptain(socket, io, user, rideId, rideNotificationSent, rideToCaptains, getNearbyCaptainsFromRedis));

      socket.on("requestDelivery", (deliveryData) => 
        handleRequestDelivery(socket, io, user, deliveryData, deliveryToCaptains, activeSockets, getNearbyCaptainsFromRedis));

      socket.on("subscribeToDelivery", (deliveryId) => 
        handleSubscribeToDelivery(socket, user, deliveryId));

      socket.on("subscribeToStoreOrders", (storeId) => 
        handleCustomerSubscribeToStoreOrders(socket, user, storeId));
    }

    // --- GLOBAL CANCEL HANDLERS ---
    socket.on("cancelRide", (rideId) => 
      handleCancelRide(socket, io, user, rideId, rideNotificationSent, rideToCaptains));

    socket.on("cancelDelivery", (deliveryId) => 
      handleCancelDelivery(socket, io, user, deliveryId, deliveryToCaptains));

    // --- STORE OWNER HANDLERS ---
    if (user.role === "store_owner") {
      socket.on("subscribeToStoreOrders", (storeId) => 
        handleStoreSubscribeToStoreOrders(socket, user, storeId));

      socket.on("updateOrderStatus", (data) => 
        handleUpdateOrderStatus(socket, io, user, data));
    }

    // --- OTHER ROUTINES ---
    socket.on("subscribeToCaptainLocation", async (captainId) => {
      try {
        const meta = await redis.hgetall(`drivers:meta:${captainId}`);
        if (meta && meta.lat && meta.lng) {
          socket.join(`captain_${captainId}`);
          socket.emit("captainLocationUpdate", {
            captainId,
            coords: { 
              latitude: parseFloat(meta.lat), 
              longitude: parseFloat(meta.lng) 
            },
          });
          console.log(`User ${user.id} subscribed to Captain ${captainId}'s location.`);
        }
      } catch (error) {
        console.error("Error getting captain location from Redis:", error);
      }
    });

    socket.on("subscribeRide", async (rideId) => {
      socket.join(`ride_${rideId}`);
      try {
        const rideData = await Ride.findById(rideId).populate("customer captain");
        socket.emit("rideData", rideData);
      } catch {
        socket.emit("error", "Failed to receive data");
      }
    });

    socket.on("disconnect", async () => {
      activeSockets.delete(user.id);
      
      if (user.role === "captain") {
        await redis.zrem("drivers:locations", user.id);
        await redis.srem("captains:availability", user.id);
        await redis.del(`drivers:meta:${user.id}`);
      }
      
      console.log(`${user.role} ${user.id} disconnected.`);
      updateNearbyCaptains(io);
    });
  });
};

module.exports = handleSocketConnection;
