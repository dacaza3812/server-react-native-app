const Delivery = require("../../models/Delivery");
function handleSubscribeToStoreOrders(socket, user, storeId) {
    socket.join(`store_${storeId}`);
    console.log(`Store owner ${user.id} subscribed to store ${storeId} orders`);
}
async function handleUpdateOrderStatus(socket, io, user, data) {
    const { deliveryId, status } = data;
    try {
        const delivery = await Delivery.findById(deliveryId)
            .populate("customer")
            .populate("captain");
        if (!delivery) {
            socket.emit("error", { message: "Delivery not found" });
            return;
        }
        if (delivery.store.owner.toString() !== user.id) {
            socket.emit("error", { message: "You don't own this store" });
            return;
        }
        delivery.status = status;
        delivery.updatedAt = new Date();
        await delivery.save();
        io.to(`customer_${delivery.customer._id}`).emit("deliveryStatusUpdate", { deliveryId, status });
        if (delivery.captain) {
            io.to(`captain_${delivery.captain._id}`).emit("deliveryStatusUpdate", { deliveryId, status });
        }
        io.to(`delivery_${deliveryId}`).emit("deliveryUpdate", delivery);
        socket.emit("orderStatusUpdated", { deliveryId, status });
        console.log(`Store owner ${user.id} updated delivery ${deliveryId} to ${status}`);
    }
    catch (error) {
        console.error("Error updating order status:", error);
        socket.emit("error", { message: "Error updating order status" });
    }
}
module.exports = {
    handleSubscribeToStoreOrders,
    handleUpdateOrderStatus,
};
//# sourceMappingURL=storeHandlers.js.map