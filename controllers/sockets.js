// server/socketHandler.js
const geolib = require("geolib");
const User = require("../models/User");
const Ride = require("../models/Ride");
const jwt = require("jsonwebtoken");

// Objeto para registrar los rideId a los que ya se envió la notificación
const rideNotificationSent = {};

// Mapeo: rideId -> Set de socketIDs de choferes que recibieron la oferta
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
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log("User Joined🔴: ", user);

    // --- CAPTAIN HANDLERS ---
    if (user.role === "captain") {
      socket.on("goOnDuty", (coords) => {
        onDutyCaptains[user.id] = {
          socket,
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
          socket
            .to(`captain_${user.id}`)
            .emit("captainLocationUpdate", { captainId: user.id, coords });
        }
      });
    }

    // --- CUSTOMER HANDLERS ---
    if (user.role === "customer") {
      socket.on("subscribeToZone", (customerCoords) => {
        socket.user.coords = customerCoords;
        const nearbyCaptains = Object.values(onDutyCaptains)
          .filter((c) =>
            geolib.isPointWithinRadius(c.coords, customerCoords, 60000)
          )
          .map((c) => ({
            id: c.userId,
            coords: c.coords,
            firebasePushToken: c.firebasePushToken,
          }));
        socket.emit("nearbyCaptains", nearbyCaptains);
      });

      socket.on("searchCaptain", async (rideId) => {
        try {
          const ride = await Ride.findById(rideId).populate(
            "customer captain"
          );
          if (!ride) {
            socket.emit("error", { message: "Ride not found" });
            return;
          }

          const { latitude: pickupLat, longitude: pickupLon } =
            ride.pickup;

          const findNearbyCaptains = () =>
            Object.values(onDutyCaptains)
              .map((c) => ({
                ...c,
                distance: geolib.getDistance(c.coords, {
                  latitude: pickupLat,
                  longitude: pickupLon,
                }),
              }))
              .filter((c) => c.distance <= 6000)
              .sort((a, b) => a.distance - b.distance);

          const emitNearbyCaptains = () => {
            const captains = findNearbyCaptains();
            const withToken = captains.map((c) => ({
              id: c.userId,
              coords: c.coords,
              firebasePushToken: c.firebasePushToken,
              socketId: c.socketId,
              distance: c.distance,
            }));

            // Notificaciones push solo una vez
            if (withToken.length > 0 && !rideNotificationSent[rideId]) {
              const tokens = withToken
                .map((c) => c.firebasePushToken)
                .filter(Boolean);
              rideNotificationSent[rideId] = true;
              fetch(
                "https://server-react-native-app-1.onrender.com/notification",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: "Solicitud de viaje",
                    body: "Alguien necesita un viaje, quizás es para ti",
                    tokens,
                  }),
                }
              )
                .then((res) => res.json())
                .then((data) =>
                  console.log("Push notifications sent:", data)
                )
                .catch((err) =>
                  console.error("Error sending push notifications:", err)
                );
            }

            if (withToken.length > 0) {
              // Guardamos a qué capitanes enviamos oferta
              if (!rideToCaptains[rideId]) {
                rideToCaptains[rideId] = new Set();
              }
              withToken.forEach((c) =>
                rideToCaptains[rideId].add(c.socketId)
              );
              withToken.forEach((c) =>
                socket.to(c.socketId).emit("rideOffer", ride)
              );
              socket.emit("nearbyCaptains", withToken);
            }
            return withToken;
          };

          const MAX_RETRIES = 20;
          let retries = 0;
          let canceled = false;

          // Listener local de cancelación para este rideId
          socket.on("cancelRide", (cancelId) => {
            if (cancelId === rideId) {
              canceled = true;
              clearInterval(retryInterval);
            }
          });

          const retrySearch = async () => {
            if (canceled) return;
            retries++;
            const caps = emitNearbyCaptains();
            if (caps.length > 0 || retries >= MAX_RETRIES) {
              clearInterval(retryInterval);
              if (caps.length === 0 && retries >= MAX_RETRIES) {
                await Ride.findByIdAndDelete(rideId);
                socket.emit("error", {
                  message:
                    "No captains found for your ride within 5 minutes.",
                });
              }
            }
          };

          const retryInterval = setInterval(retrySearch, 10000);
        } catch (error) {
          console.error("Error searching for captain:", error);
          socket.emit("error", {
            message: "Error searching for captain",
          });
        }
      });
    }

    // --- GLOBAL CANCEL HANDLER ---
    socket.on("cancelRide", async (rideId) => {
      try {
        if (!rideId) {
          socket.emit("error", {
            message: "Ride ID is required for cancellation.",
          });
          return;
        }
        const ride = await Ride.findById(rideId).populate(
          "customer captain"
        );
        if (!ride) {
          socket.emit("error", { message: "Ride not found" });
          return;
        }

        // Mensaje según rol
        const cancelMessage =
          socket.user.role === "customer"
            ? "El viaje ha sido cancelado por el cliente."
            : "El viaje ha sido cancelado por el chofer.";

        // Notificar a la sala del ride
        io.in(`ride_${rideId}`).emit("rideCanceled", {
          message: cancelMessage,
        });

        // Notificar a capitanes que recibieron oferta
        if (rideToCaptains[rideId]) {
          Array.from(rideToCaptains[rideId]).forEach((sId) => {
            const capSock = io.sockets.sockets.get
              ? io.sockets.sockets.get(sId)
              : io.sockets.sockets[sId];
            if (capSock) {
              capSock.emit("rideCanceled", {
                message: cancelMessage,
              });
            }
          });
          delete rideToCaptains[rideId];
        }

        // Limpiar flags de notificación push
        delete rideNotificationSent[rideId];

        // Asegurar que incluso el emisor reciba la confirmación
        socket.emit("rideCanceled", { message: cancelMessage });

        // Eliminar de BD
        await Ride.findByIdAndDelete(rideId);

        console.log(
          `User ${socket.user.id} canceled the ride ${rideId}`
        );
      } catch (error) {
        console.error("Error canceling ride:", error);
        socket.emit("error", {
          message: "Error canceling ride",
        });
      }
    });

    // --- OTRAS RUTINAS ---
    socket.on("subscribeToCaptainLocation", (captainId) => {
      const captain = onDutyCaptains[captainId];
      if (captain) {
        socket.join(`captain_${captainId}`);
        socket.emit("captainLocationUpdate", {
          captainId,
          coords: captain.coords,
        });
        console.log(
          `User ${socket.user.id} subscribed to Captain ${captainId}'s location.`
        );
      }
    });

    socket.on("subscribeRide", async (rideId) => {
      socket.join(`ride_${rideId}`);
      try {
        const rideData = await Ride.findById(rideId).populate(
          "customer captain"
        );
        socket.emit("rideData", rideData);
      } catch {
        socket.emit("error", "Failed to receive data");
      }
    });

    socket.on("disconnect", () => {
      if (socket.user.role === "captain") {
        delete onDutyCaptains[socket.user.id];
      }
      console.log(
        `${socket.user.role} ${socket.user.id} disconnected.`
      );
      updateNearbyCaptains();
    });

    function updateNearbyCaptains() {
      io.sockets.sockets.forEach((sock) => {
        if (sock.user?.role === "customer") {
          const custCoords = sock.user.coords;
          if (custCoords) {
            const nearby = Object.values(onDutyCaptains)
              .filter((c) =>
                geolib.isPointWithinRadius(
                  c.coords,
                  custCoords,
                  60000
                )
              )
              .map((c) => ({
                id: c.userId,
                coords: c.coords,
                firebasePushToken: c.firebasePushToken,
              }));
            sock.emit("nearbyCaptains", nearby);
          }
        }
      });
    }
  });
};

module.exports = handleSocketConnection;
