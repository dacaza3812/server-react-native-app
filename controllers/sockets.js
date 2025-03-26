const geolib = require("geolib");
const User = require("../models/User");
const Ride = require("../models/Ride");
const jwt = require("jsonwebtoken");
const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.PROJECT_ID,
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY,
  "client_email": process.env.CLIENT_EMAIL,
  "client_id": process.env.CLIENT_ID,
  "auth_uri": process.env.AUTH_URI,
  "token_uri": process.env.TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
  "universe_domain": process.env.UNIVERSE_DOMAIN,
};

// Inicializa Firebase Admin con la cuenta de servicio
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Objeto para registrar los rideId a los que ya se envió la notificación
const rideNotificationSent = {};

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
      // Se añade la propiedad firebasePushToken al objeto de usuario
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
        // Se guarda el token y demás datos en onDutyCaptains
        onDutyCaptains[user.id] = {
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

          // Función para emitir los capitanes cercanos y enviar notificaciones push
          const emitNearbyCaptains = async () => {
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
                .filter((token) => token); // Filtramos tokens nulos o indefinidos

              // Marcar que ya se envió la notificación para este rideId
              rideNotificationSent[rideId] = true;

              // Enviar la petición POST utilizando fetch (se envía solo el array de tokens) 
/*
              fetch("https://expressserveryt.onrender.com/send-notification", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  "title": "Solicitud de viaje",
                  "body": "Alguien necesita un viaje, quizás es para ti",
                  "tokens": firebasePushTokens
                }),
              })
                .then((res) => res.json())
                .then((data) => {
                  console.log("Push notifications sent:", data);
                })
                .catch((error) => {
                  console.error("Error sending push notifications:", error);
                });
*/
                if (!Array.isArray(firebasePushTokens) || firebasePushTokens.length === 0) {
                  return res.status(400).json({ success: false, error: "El campo 'tokens' debe ser un array no vacío." });
                }

              const notificationPayload = {
                title: "Solicitud de viaje",
                body: "Alguien necesita un viaje, quizás es para ti",
              };

              const message = {
                notification: notificationPayload,
                tokens: firebasePushTokens, // Array de tokens de los dispositivos a notificar
              };


              try {
                const response = await admin.messaging().sendEachForMulticast(message);
                console.log('Notificaciones enviadas:', response);
                
              } catch (error) {
                console.error('Error al enviar notificaciones:', error);
                
              }

              console.log("firebasePushTokens", firebasePushTokens)
            }

            // Emitir el evento socket a los capitanes
            if (captainsWithToken.length > 0) {
              socket.emit("nearbyCaptains", captainsWithToken);
              captainsWithToken.forEach((captain) => {
                socket.to(captain.socketId).emit("rideOffer", ride);
              });
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

          socket.on("cancelRide", async () => {
            canceled = true;
            clearInterval(retryInterval);
            await Ride.findByIdAndDelete(rideId);
            socket.emit("rideCanceled", {
              message: "Your ride has been canceled",
            });

            if (ride.captain) {
              const captainSocket = getCaptainSocket(ride.captain._id);
              if (captainSocket) {
                captainSocket.emit("rideCanceled", {
                  message: `The ride with customer ${user.id} has been canceled.`,
                });
              } else {
                console.log(`Captain not found for ride ${rideId}`);
              }
            } else {
              console.log(`No captain associated with ride ${rideId}`);
            }
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

    function getCaptainSocket(captainId) {
      const captain = Object.values(onDutyCaptains).find(
        (captain) => captain.userId.toString() === captainId.toString()
      );
      return captain ? io.sockets.sockets.get(captain.socketId) : null;
    }
  });
};

module.exports = handleSocketConnection;
