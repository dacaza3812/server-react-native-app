const geolib = require("geolib");
const User = require("../models/User");
const Ride = require("../models/Ride");
const jwt = require("jsonwebtoken");

// Objeto para registrar los rideId a los que ya se envió la notificación
const rideNotificationSent = {};

// Nuevo mapeo: rideId -> Set de socketIDs de choferes que recibieron la oferta
const rideToCaptains = {};

const handleSocketConnection = (io) => {
  const onDutyCaptains = {};

  io.use(async (socket, next) => {
    const token = socket.handshake.headers.access_token;
    if (!token) {
      return next(new Error("Authentication invalid: No token provided"));
    }
    try {
      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(payload.id);
      if (!user) {
        return next(new Error("Authentication invalid: User not found"));
      }
      // Se añade la propiedad firebasePushToken y el user al socket
      socket.user = { id: payload.id, role: user.role, firebasePushToken: user.firebasePushToken };
      next();
    } catch (error) {
      console.log("Socket Error", error);
      return next(new Error("Authentication invalid: Token verification failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log("User Joined🔴: ", user);

    if (user.role === "captain") {
      socket.on("goOnDuty", (coords) => {
        onDutyCaptains[user.id] = {
          socket: socket, // referencia directa
          socketId: socket.id,
          coords,
          userId: user.id,
          firebasePushToken: user.firebasePushToken,
        };
        socket.join("onDuty");
        console.log(`Captain ${user.id} is now on duty.🫡`);
        updateNearbyCaptains();
      });

      socket.on("goOffDuty", () => {
        delete onDutyCaptains[user.id];
        socket.leave("onDuty");
        console.log(`Captain ${user.id} is now off duty.😪`);
        updateNearbyCaptains();
      });

      socket.on("updateLocation", (coords) => {
        if (onDutyCaptains[user.id]) {
          onDutyCaptains[user.id].coords = coords;
          console.log(`Captain ${user.id} updated location.`);
          updateNearbyCaptains();
          socket.to(`captain_${user.id}`).emit("captainLocationUpdate", {
            captainId: user.id,
            coords,
          });
        }
      });
    }

    if (user.role === "customer") {
      socket.on("subscribeToZone", (customerCoords) => {
        socket.user.coords = customerCoords;
        const nearbyCaptains = Object.values(onDutyCaptains)
          .filter((captain) =>
            geolib.isPointWithinRadius(captain.coords, customerCoords, 60000)
          )
          .map((captain) => ({
            id: captain.userId,
            coords: captain.coords,
            firebasePushToken: captain.firebasePushToken,
          }));
        socket.emit("nearbyCaptains", nearbyCaptains);
      });

      socket.on("searchCaptain", async (rideId) => {
        try {
          const ride = await Ride.findById(rideId).populate("customer captain");
          if (!ride) {
            socket.emit("error", { message: "Ride not found" });
            return;
          }

          const { latitude: pickupLat, longitude: pickupLon } = ride.pickup;

          // Función para encontrar capitanes en un radio de 6 km
          const findNearbyCaptains = () => {
            return Object.values(onDutyCaptains)
              .map((captain) => ({
                ...captain,
                distance: geolib.getDistance(captain.coords, {
                  latitude: pickupLat,
                  longitude: pickupLon,
                }),
              }))
              .filter((captain) => captain.distance <= 6000)
              .sort((a, b) => a.distance - b.distance);
          };

          const emitNearbyCaptains = () => {
            const nearbyCaptains = findNearbyCaptains();
            const captainsWithToken = nearbyCaptains.map((captain) => ({
              id: captain.userId,
              coords: captain.coords,
              firebasePushToken: captain.firebasePushToken,
              socketId: captain.socketId,
              distance: captain.distance,
            }));

            if (captainsWithToken.length > 0 && !rideNotificationSent[rideId]) {
              const firebasePushTokens = captainsWithToken
                .map((captain) => captain.firebasePushToken)
                .filter((token) => token);

              // Marcar que ya se envió la notificación para este rideId
              rideNotificationSent[rideId] = true;

              fetch("https://server-react-native-app-1.onrender.com/notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: "Solicitud de viaje",
                  body: "Alguien necesita un viaje, quizás es para ti",
                  tokens: firebasePushTokens,
                }),
              })
                .then((res) => res.json())
                .then((data) => {
                  console.log("Push notifications sent:", data);
                })
                .catch((error) => {
                  console.error("Error sending push notifications:", error);
                });

              console.log("firebasePushTokens", firebasePushTokens);
            }

            if (captainsWithToken.length > 0) {
              // Almacenar en rideToCaptains los socketIds de capitanes que recibieron la oferta
              if (!rideToCaptains[rideId]) {
                rideToCaptains[rideId] = new Set();
              }
              captainsWithToken.forEach((captain) => {
                rideToCaptains[rideId].add(captain.socketId);
                socket.to(captain.socketId).emit("rideOffer", ride);
              });
              socket.emit("nearbyCaptains", captainsWithToken);
            } else {
              console.log("No captains nearby, retrying...");
            }
            return captainsWithToken;
          };

          const MAX_RETRIES = 20;
          let retries = 0;
          let rideAccepted = false;
          let canceled = false;

          const retrySearch = async () => {
            retries++;
            if (canceled) return;

            const captains = emitNearbyCaptains();
            if (captains.length > 0 || retries >= MAX_RETRIES) {
              clearInterval(retryInterval);

              if (!rideAccepted && retries >= MAX_RETRIES) {
                await Ride.findByIdAndDelete(rideId);
                socket.emit("error", {
                  message: "No captains found for your ride within 5 minutes.",
                });
              }
            }
          };

          const retryInterval = setInterval(retrySearch, 10000);

          socket.on("rideAccepted", async () => {
            rideAccepted = true;
            clearInterval(retryInterval);
          });

        } catch (error) {
          console.error("Error searching for captain:", error);
          socket.emit("error", { message: "Error searching for captain" });
        }
      });
    }

    // Listener unificado para cancelar el viaje (permitido para ambos roles)
    socket.on("cancelRide", async (rideId) => {
      try {
        if (!rideId) {
          socket.emit("error", { message: "Ride ID is required for cancellation." });
          return;
        }
        const ride = await Ride.findById(rideId).populate("customer captain");
        if (!ride) {
          socket.emit("error", { message: "Ride not found" });
          return;
        }

        // Definir el mensaje de cancelación según el rol que emite la acción.
        let cancelMessage = "";
        if (socket.user.role === "customer") {
          cancelMessage = "El viaje ha sido cancelado por el cliente.";
        } else if (socket.user.role === "captain") {
          cancelMessage = "El viaje ha sido cancelado por el chofer.";
        }

        // Notificar a todos los sockets en la sala de este ride (usualmente el cliente que se suscribió)
        io.in(`ride_${rideId}`).emit("rideCanceled", { message: cancelMessage });

        // Notificar a todos los choferes que recibieron la oferta para este rideId.
        if (rideToCaptains[rideId]) {
          const captainSocketIds = Array.from(rideToCaptains[rideId]);
          captainSocketIds.forEach((sId) => {
            const captainSocket = io.sockets.sockets.get
              ? io.sockets.sockets.get(sId)
              : io.sockets.sockets[sId];
            if (captainSocket) {
              captainSocket.emit("rideCanceled", { message: cancelMessage });
            }
          });
          delete rideToCaptains[rideId];
        }
        // También notificar al socket que emitió, en caso de que no esté en la sala.
        socket.emit("rideCanceled", { message: cancelMessage });

        // Finalmente, eliminar el ride de la base de datos.
        await Ride.findByIdAndDelete(rideId);
        console.log(`User ${socket.user.id} canceled the ride ${rideId}`);
      } catch (error) {
        console.error("Error canceling ride:", error);
        socket.emit("error", { message: "Error canceling ride" });
      }
    });

    socket.on("subscribeToCaptainLocation", (captainId) => {
      const captain = onDutyCaptains[captainId];
      if (captain) {
        socket.join(`captain_${captainId}`);
        socket.emit("captainLocationUpdate", {
          captainId,
          coords: captain.coords,
        });
        console.log(`User ${socket.user.id} subscribed to Captain ${captainId}'s location.`);
      }
    });

    socket.on("subscribeRide", async (rideId) => {
      socket.join(`ride_${rideId}`);
      try {
        const rideData = await Ride.findById(rideId).populate("customer captain");
        socket.emit("rideData", rideData);
      } catch (error) {
        socket.emit("error", "Failed to receive data");
      }
    });

    socket.on("disconnect", () => {
      if (socket.user.role === "captain") {
        delete onDutyCaptains[socket.user.id];
      } else if (socket.user.role === "customer") {
        console.log(`Customer ${socket.user.id} disconnected.`);
      }
    });

    function updateNearbyCaptains() {
      io.sockets.sockets.forEach((socket) => {
        if (socket.user?.role === "customer") {
          const customerCoords = socket.user?.coords;
          if (customerCoords) {
            const nearbyCaptains = Object.values(onDutyCaptains)
              .filter((captain) =>
                geolib.isPointWithinRadius(captain.coords, customerCoords, 60000)
              )
              .map((captain) => ({
                id: captain.userId,
                coords: captain.coords,
                firebasePushToken: captain.firebasePushToken,
              }));
            socket.emit("nearbyCaptains", nearbyCaptains);
          }
        }
      });
    }
  });
};

module.exports = handleSocketConnection;
