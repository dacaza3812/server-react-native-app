const geolib = require("geolib");
const jwt = require("jsonwebtoken");
const UserV1 = require("../../models/UserV1");
const { redis } = require("../../utils/redisClient");

// Objeto para registrar los rideId a los que ya se envió la notificación
const rideNotificationSent = {};

// Mapeo: rideId -> Set de socketIDs de choferes que recibieron la oferta
const rideToCaptains = {};

// Mapeo: deliveryId -> Set de socketIDs de choferes que recibieron la oferta de delivery
const deliveryToCaptains = {};

// Mapa en memoria para sockets activos (no se puede persistir en Redis)
const activeSockets = new Map();

/**
 * Middleware de autenticación para sockets
 */
const socketAuthMiddleware = async (socket, next) => {
  const token = socket.handshake.headers.access_token;
  if (!token) {
    return next(new Error("Authentication invalid: No token provided"));
  }
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await UserV1.findById(payload.id);
    if (!user) {
      return next(new Error("Authentication invalid: User not found"));
    }
    socket.user = {
      id: payload.id,
      role: user.role,
      firebasePushToken: user.firebasePushToken,
    };
    next();
  } catch (error) {
    console.log("Socket Error", error);
    return next(new Error("Authentication invalid: Token verification failed"));
  }
};

/**
 * Helper function to get nearby captains from Redis
 */
async function getNearbyCaptainsFromRedis(lat, lng, radiusInMeters) {
  try {
    const result = await redis.georadius(
      "drivers:locations",
      lng,
      lat,
      radiusInMeters,
      "m",
      "WITHDIST",
      "ASC"
    );
    
    if (!result.length) return [];

    const captainsData = await Promise.all(
      result.map(async ([captainId, distance]) => {
        const meta = await redis.hgetall(`drivers:meta:${captainId}`);
        if (!meta || !meta.socketId) return null;

        return {
          id: captainId,
          coords: { 
            latitude: parseFloat(meta.lat), 
            longitude: parseFloat(meta.lng) 
          },
          firebasePushToken: meta.firebasePushToken || "",
          socketId: meta.socketId,
          distance: parseFloat(distance),
        };
      })
    );

    return captainsData.filter(c => c !== null);
  } catch (error) {
    console.error("Error querying Redis for nearby captains:", error);
    return [];
  }
}

/**
 * Actualiza la lista de capitanes cercanos para todos los clientes conectados
 */
async function updateNearbyCaptains(io) {
  io.sockets.sockets.forEach(async (sock) => {
    if (sock.user?.role === "customer") {
      const custCoords = sock.user.coords;
      if (custCoords) {
        try {
          const nearby = await getNearbyCaptainsFromRedis(
            custCoords.latitude,
            custCoords.longitude,
            60000
          );
          sock.emit("nearbyCaptains", nearby);
        } catch (error) {
          console.error("Error updating nearby captains:", error);
        }
      }
    }
  });
}

module.exports = {
  rideNotificationSent,
  rideToCaptains,
  deliveryToCaptains,
  activeSockets,
  socketAuthMiddleware,
  getNearbyCaptainsFromRedis,
  updateNearbyCaptains,
};
