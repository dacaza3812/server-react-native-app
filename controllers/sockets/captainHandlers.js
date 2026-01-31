const { redis } = require("../../utils/redisClient");
const Delivery = require("../../models/Delivery");

/**
 * Maneja el evento cuando un capitán se pone en servicio
 */
async function handleGoOnDuty(socket, user, coords, updateNearbyCaptains) {
  await redis.hset(`drivers:meta:${user.id}`, 
    "socketId", socket.id,
    "firebasePushToken", user.firebasePushToken || "",
    "lat", coords.latitude.toString(),
    "lng", coords.longitude.toString()
  );
  await redis.geoadd("drivers:locations", 
    coords.longitude, 
    coords.latitude, 
    user.id
  );
  await redis.sadd("captains:availability", user.id);
  
  socket.join("onDuty");
  console.log(`Captain ${user.id} is now on duty.🫡`);
  updateNearbyCaptains();
}

/**
 * Maneja el evento cuando un capitán se sale de servicio
 */
async function handleGoOffDuty(socket, user, updateNearbyCaptains) {
  await redis.zrem("drivers:locations", user.id);
  await redis.srem("captains:availability", user.id);
  await redis.del(`drivers:meta:${user.id}`);
  
  socket.leave("onDuty");
  console.log(`Captain ${user.id} is now off duty.😪`);
  updateNearbyCaptains();
}

/**
 * Maneja la actualización de ubicación del capitán
 */
async function handleUpdateLocation(socket, user, coords, updateNearbyCaptains) {
  const isOnDuty = await redis.sismember("captains:availability", user.id);
  if (isOnDuty) {
    await redis.geoadd("drivers:locations", 
      coords.longitude, 
      coords.latitude, 
      user.id
    );
    await redis.hset(`drivers:meta:${user.id}`, 
      "lat", coords.latitude.toString(),
      "lng", coords.longitude.toString()
    );
    
    console.log(`Captain ${user.id} updated location.`);
    updateNearbyCaptains();
    socket
      .to(`captain_${user.id}`)
      .emit("captainLocationUpdate", { captainId: user.id, coords });
  }
}

/**
 * Maneja cuando un capitán acepta un delivery
 */
async function handleAcceptDelivery(socket, io, user, deliveryId) {
  try {
    const delivery = await Delivery.findById(deliveryId)
      .populate("store")
      .populate("customer")
      .populate("captain");

    if (!delivery) {
      socket.emit("error", { message: "Delivery not found" });
      return;
    }

    if (delivery.status !== "PENDING") {
      socket.emit("error", { message: "Delivery is no longer available" });
      return;
    }

    delivery.captain = user.id;
    delivery.status = "ASSIGNED";
    await delivery.save();

    io.to(`customer_${delivery.customer._id}`).emit("deliveryAssigned", delivery);
    io.to(`store_${delivery.store._id}`).emit("storeOrder", delivery);
    io.to(`delivery_${deliveryId}`).emit("deliveryUpdate", delivery);

    socket.emit("deliveryAccepted", { deliveryId, message: "Delivery accepted successfully" });
    console.log(`Captain ${user.id} accepted delivery ${deliveryId}`);
  } catch (error) {
    console.error("Error accepting delivery:", error);
    socket.emit("error", { message: "Error accepting delivery" });
  }
}

/**
 * Maneja la actualización de estado de un delivery por el capitán
 */
async function handleUpdateDeliveryStatus(socket, io, user, data) {
  const { deliveryId, status } = data;
  
  try {
    const delivery = await Delivery.findById(deliveryId)
      .populate("customer")
      .populate("store");
    
    if (!delivery) {
      socket.emit("error", { message: "Delivery not found" });
      return;
    }

    if (delivery.captain.toString() !== user.id) {
      socket.emit("error", { message: "You are not assigned to this delivery" });
      return;
    }

    delivery.status = status;
    delivery.updatedAt = new Date();

    if (status === "PICKED_UP") {
      delivery.pickup.actualTime = new Date();
    }

    if (status === "DELIVERED") {
      delivery.delivery.actualTime = new Date();
    }

    await delivery.save();

    io.to(`customer_${delivery.customer._id}`).emit("deliveryStatusUpdate", { deliveryId, status });
    io.to(`store_${delivery.store._id}`).emit("deliveryStatusUpdate", { deliveryId, status });
    io.to(`delivery_${deliveryId}`).emit("deliveryUpdate", delivery);

    socket.emit("statusUpdated", { deliveryId, status });
    console.log(`Captain ${user.id} updated delivery ${deliveryId} to ${status}`);
  } catch (error) {
    console.error("Error updating delivery status:", error);
    socket.emit("error", { message: "Error updating delivery status" });
  }
}

module.exports = {
  handleGoOnDuty,
  handleGoOffDuty,
  handleUpdateLocation,
  handleAcceptDelivery,
  handleUpdateDeliveryStatus,
};
