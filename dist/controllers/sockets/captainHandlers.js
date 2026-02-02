const { redis } = require("../../utils/redisClient");
const Delivery = require("../../models/Delivery");
async function handleGoOnDuty(socket, user, coords, updateNearbyCaptains) {
    await redis.hset(`drivers:meta:${user.id}`, "socketId", socket.id, "firebasePushToken", user.firebasePushToken || "", "lat", coords.latitude.toString(), "lng", coords.longitude.toString());
    await redis.geoadd("drivers:locations", coords.longitude, coords.latitude, user.id);
    await redis.sadd("captains:availability", user.id);
    socket.join("onDuty");
    const userSocket = require("./index").activeSockets.get(user.id);
    if (userSocket) {
        userSocket.emit("captainStatusChanged", { status: "onDuty", message: "You are now on duty" });
        console.log(`📡 captainStatusChanged enviado a captain ${user.id}, socket: ${userSocket.id}`);
    }
    else {
        socket.emit("captainStatusChanged", { status: "onDuty", message: "You are now on duty" });
        console.log(`📡 captainStatusChanged enviado directamente a socket ${socket.id}`);
    }
    console.log(`Captain ${user.id} is now on duty.🫡`);
    updateNearbyCaptains();
}
async function handleGoOffDuty(socket, user, updateNearbyCaptains) {
    await redis.zrem("drivers:locations", user.id);
    await redis.srem("captains:availability", user.id);
    await redis.del(`drivers:meta:${user.id}`);
    socket.leave("onDuty");
    const userSocket = require("./index").activeSockets.get(user.id);
    if (userSocket) {
        userSocket.emit("captainStatusChanged", { status: "offDuty", message: "You are now off duty" });
        console.log(`📡 captainStatusChanged enviado a captain ${user.id}, socket: ${userSocket.id}`);
    }
    else {
        socket.emit("captainStatusChanged", { status: "offDuty", message: "You are now off duty" });
        console.log(`📡 captainStatusChanged enviado directamente a socket ${socket.id}`);
    }
    console.log(`Captain ${user.id} is now off duty.😪`);
    updateNearbyCaptains();
}
async function handleUpdateLocation(socket, user, coords, updateNearbyCaptains) {
    const isOnDuty = await redis.sismember("captains:availability", user.id);
    if (isOnDuty) {
        await redis.geoadd("drivers:locations", coords.longitude, coords.latitude, user.id);
        await redis.hset(`drivers:meta:${user.id}`, "lat", coords.latitude.toString(), "lng", coords.longitude.toString());
        console.log(`Captain ${user.id} updated location.`);
        updateNearbyCaptains();
        socket
            .to(`captain_${user.id}`)
            .emit("captainLocationUpdate", { captainId: user.id, coords });
    }
}
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
    }
    catch (error) {
        console.error("Error accepting delivery:", error);
        socket.emit("error", { message: "Error accepting delivery" });
    }
}
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
    }
    catch (error) {
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
//# sourceMappingURL=captainHandlers.js.map