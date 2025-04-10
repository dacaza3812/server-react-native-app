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
        // Guardar la referencia del socket y demás información en onDutyCaptains
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

            // Si hay capitanes y aún no se ha enviado la notificación para este rideId
            if (captainsWithToken.length > 0 && !rideNotificationSent[rideId]) {
              const firebasePushTokens = captainsWithToken
                .map((captain) => captain.firebasePushToken)
                .filter((token) => token);

              // Marcar que ya se envió la notificación para este rideId
              rideNotificationSent[rideId] = true;

              fetch("https://server-react-native-app.onrender.com/notification", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
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

            // Aquí, además de emitir el evento rideOffer,
            // almacenamos los socketIds de los capitanes asociados al rideId
            if (captainsWithToken.length > 0) {
              // Inicializar el Set si no existe
              if (!rideToCaptains[rideId]) {
                rideToCaptains[rideId] = new Set();
              }
              // Emitir la oferta a cada capitán y guardar su socketId
              captainsWithToken.forEach((captain) => {
                rideToCaptains[rideId].add(captain.socketId);
                socket.to(captain.socketId).emit("rideOffer", ride);
              });
              // También emitir al cliente la lista de capitanes
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

          // Nueva lógica de cancelación usando rideId para notificar a los choferes
          socket.on("cancelRide", async () => {
            canceled = true;
            clearInterval(retryInterval);

            // Notificar al cliente (quien cancela)
            socket.emit("rideCanceled", {
              message: "Your ride has been canceled",
            });

            // Notificar a TODOS los choferes que hayan recibido la oferta para este rideId
            if (rideToCaptains[rideId]) {
              const captainSocketIds = Array.from(rideToCaptains[rideId]);
              captainSocketIds.forEach((sId) => {
                // Dependiendo de la versión de Socket.IO, usar .get() o acceso directo.
                const captainSocket = io.sockets.sockets.get
                  ? io.sockets.sockets.get(sId)
                  : io.sockets.sockets[sId];
                if (captainSocket) {
                  captainSocket.emit("rideCanceled", {
                    message: `The ride with customer ${user.id} has been canceled.`,
                  });
                }
              });
              // Limpiar el mapeo para este rideId
              delete rideToCaptains[rideId];
            } else {
              console.log(`No captain associated with ride ${rideId}`);
            }

            // Finalmente, eliminar el ride de la base de datos
            await Ride.findByIdAndDelete(rideId);
            console.log(`Customer ${user.id} canceled the ride ${rideId}`);
          });
        } catch (error) {
          console.error("Error searching for captain:", error);
          socket.emit("error", { message: "Error searching for captain" });
        }
      });
    }

    socket.on("subscribeToCaptainLocation", (captainId) => {
      const captain = onDutyCaptains[captainId];
      if (captain) {
        socket.join(`captain_${captainId}`);
        socket.emit("captainLocationUpdate", {
          captainId,
          coords: captain.coords,
        });
        console.log(`User ${user.id} subscribed to Captain ${captainId}'s location.`);
      }
    });

    socket.on("subscribeRide", async (rideId) => {
      socket.join(`ride_${rideId}`);
      try {
        const rideData = await Ride.findById(rideId).populate("customer captain");
        socket.emit("rideData", rideData);
      } catch (error) {
        socket.error("Failed to receive data");
      }
    });

    socket.on("disconnect", () => {
      if (user.role === "captain") {
        delete onDutyCaptains[user.id];
      } else if (user.role === "customer") {
        console.log(`Customer ${user.id} disconnected.`);
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
