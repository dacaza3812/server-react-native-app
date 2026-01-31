const Ride = require("../../models/Ride");
const Delivery = require("../../models/Delivery");

/**
 * Maneja la cancelación de un ride
 */
async function handleCancelRide(socket, io, user, rideId, rideNotificationSent, rideToCaptains) {
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

    const cancelMessage =
      user.role === "customer"
        ? "El viaje ha sido cancelado por el cliente."
        : "El viaje ha sido cancelado por el chofer.";

    io.in(`ride_${rideId}`).emit("rideCanceled", { message: cancelMessage });

    if (rideToCaptains[rideId]) {
      Array.from(rideToCaptains[rideId]).forEach((sId) => {
        const capSock = io.sockets.sockets.get
          ? io.sockets.sockets.get(sId)
          : io.sockets.sockets[sId];
        if (capSock) {
          capSock.emit("rideCanceled", { message: cancelMessage });
        }
      });
      delete rideToCaptains[rideId];
    }

    delete rideNotificationSent[rideId];
    socket.emit("rideCanceled", { message: cancelMessage });
    await Ride.findByIdAndDelete(rideId);

    console.log(`User ${user.id} canceled the ride ${rideId}`);
  } catch (error) {
    console.error("Error canceling ride:", error);
    socket.emit("error", { message: "Error canceling ride" });
  }
}

/**
 * Maneja la cancelación de un delivery
 */
async function handleCancelDelivery(socket, io, user, deliveryId, deliveryToCaptains) {
  try {
    if (!deliveryId) {
      socket.emit("error", { message: "Delivery ID is required for cancellation." });
      return;
    }

    const delivery = await Delivery.findById(deliveryId)
      .populate("customer captain store");
    
    if (!delivery) {
      socket.emit("error", { message: "Delivery not found" });
      return;
    }

    const cancelMessage =
      user.role === "customer"
        ? "Delivery has been cancelled by the customer."
        : "Delivery has been cancelled by the captain.";

    io.in(`delivery_${deliveryId}`).emit("deliveryCancelled", { message: cancelMessage });

    if (deliveryToCaptains[deliveryId]) {
      Array.from(deliveryToCaptains[deliveryId]).forEach((sId) => {
        const capSock = io.sockets.sockets.get
          ? io.sockets.sockets.get(sId)
          : io.sockets.sockets[sId];
        if (capSock) {
          capSock.emit("deliveryCancelled", { message: cancelMessage });
        }
      });
      delete deliveryToCaptains[deliveryId];
    }

    socket.emit("deliveryCancelled", { message: cancelMessage });
    await Delivery.findByIdAndDelete(deliveryId);

    console.log(`User ${user.id} canceled the delivery ${deliveryId}`);
  } catch (error) {
    console.error("Error canceling delivery:", error);
    socket.emit("error", { message: "Error canceling delivery" });
  }
}

module.exports = {
  handleCancelRide,
  handleCancelDelivery,
};
