const Ride = require("../../models/Ride");
const Delivery = require("../../models/Delivery");
const Store = require("../../models/Store");
async function handleSubscribeToZone(socket, user, customerCoords, getNearbyCaptainsFromRedis) {
    socket.user.coords = customerCoords;
    try {
        const nearbyCaptains = await getNearbyCaptainsFromRedis(customerCoords.latitude, customerCoords.longitude, 60000);
        socket.emit("nearbyCaptains", nearbyCaptains);
    }
    catch (error) {
        console.error("Error getting nearby captains from Redis:", error);
        socket.emit("nearbyCaptains", []);
    }
}
async function handleSearchCaptain(socket, io, user, rideId, rideNotificationSent, rideToCaptains, getNearbyCaptainsFromRedis) {
    try {
        const ride = await Ride.findById(rideId).populate("customer captain");
        if (!ride) {
            socket.emit("error", { message: "Ride not found" });
            return;
        }
        const { latitude: pickupLat, longitude: pickupLon } = ride.pickup;
        const findNearbyCaptains = async () => {
            const captains = await getNearbyCaptainsFromRedis(pickupLat, pickupLon, 6000);
            return captains.sort((a, b) => a.distance - b.distance);
        };
        const emitNearbyCaptains = async () => {
            const captains = await findNearbyCaptains();
            const withToken = captains.map((c) => ({
                id: c.id,
                coords: c.coords,
                firebasePushToken: c.firebasePushToken,
                socketId: c.socketId,
                distance: c.distance,
            }));
            if (withToken.length > 0 && !rideNotificationSent[rideId]) {
                const tokens = withToken
                    .map((c) => c.firebasePushToken)
                    .filter(Boolean);
                rideNotificationSent[rideId] = true;
                try {
                    const response = await fetch("https://server-react-native-app-1.onrender.com/notification", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            title: "Solicitud de viaje",
                            body: "Alguien necesita un viaje, quizás es para ti",
                            tokens,
                        }),
                    });
                    const data = await response.json();
                    console.log("Push notifications sent:", data);
                }
                catch (err) {
                    console.error("Error sending push notifications:", err);
                }
            }
            if (withToken.length > 0) {
                if (!rideToCaptains[rideId]) {
                    rideToCaptains[rideId] = new Set();
                }
                withToken.forEach((c) => rideToCaptains[rideId].add(c.socketId));
                withToken.forEach((c) => socket.to(c.socketId).emit("rideOffer", ride));
                socket.emit("nearbyCaptains", withToken);
            }
            return withToken;
        };
        const MAX_RETRIES = 20;
        let retries = 0;
        let canceled = false;
        socket.on("cancelRide", (cancelId) => {
            if (cancelId === rideId) {
                canceled = true;
                clearInterval(retryInterval);
            }
        });
        const retrySearch = async () => {
            if (canceled)
                return;
            retries++;
            const caps = await emitNearbyCaptains();
            if (caps.length > 0 || retries >= MAX_RETRIES) {
                clearInterval(retryInterval);
                if (caps.length === 0 && retries >= MAX_RETRIES) {
                    await Ride.findByIdAndDelete(rideId);
                    socket.emit("error", {
                        message: "No captains found for your ride within 5 minutes.",
                    });
                }
            }
        };
        const retryInterval = setInterval(retrySearch, 10000);
    }
    catch (error) {
        console.error("Error searching for captain:", error);
        socket.emit("error", { message: "Error searching for captain" });
    }
}
async function handleRequestDelivery(socket, io, user, deliveryData, deliveryToCaptains, activeSockets, getNearbyCaptainsFromRedis) {
    try {
        const { storeId, items, deliveryType, pickupAddress, deliveryAddress } = deliveryData;
        const store = await Store.findById(storeId);
        if (!store || !store.isActive) {
            socket.emit("error", { message: "Store not found or inactive" });
            return;
        }
        const delivery = new Delivery({
            deliveryType,
            store: storeId,
            customer: user.id,
            items: items,
            pickup: {
                address: pickupAddress,
                latitude: pickupAddress.latitude,
                longitude: pickupAddress.longitude,
                estimatedTime: new Date(Date.now() + store.averageDeliveryTime * 60000),
            },
            delivery: {
                address: deliveryAddress,
                latitude: deliveryAddress.latitude,
                longitude: deliveryAddress.longitude,
                instructions: deliveryAddress.instructions || "",
            },
            pricing: {
                subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                tax: 0,
                deliveryFee: store.deliveryFee,
                total: 0,
                currency: "MXN",
            },
            status: "PENDING",
        });
        delivery.generateTrackingCode();
        delivery.generateOTP();
        await delivery.save();
        let nearbyCaptains;
        try {
            nearbyCaptains = await getNearbyCaptainsFromRedis(pickupAddress.latitude, pickupAddress.longitude, 6000);
        }
        catch (error) {
            console.error("Error getting nearby captains from Redis:", error);
            nearbyCaptains = [];
        }
        if (nearbyCaptains.length > 0) {
            if (!deliveryToCaptains[delivery._id]) {
                deliveryToCaptains[delivery._id] = new Set();
            }
            nearbyCaptains.forEach(captain => {
                deliveryToCaptains[delivery._id].add(captain.socketId);
                const captainSocket = activeSockets.get(captain.id);
                if (captainSocket) {
                    captainSocket.emit("deliveryOffer", {
                        deliveryId: delivery._id,
                        delivery,
                    });
                }
            });
            socket.emit("deliveryRequestSent", { deliveryId: delivery._id });
            console.log(`Delivery request sent for ${delivery._id} to ${nearbyCaptains.length} captains`);
        }
        else {
            socket.emit("error", { message: "No available captains for delivery" });
        }
    }
    catch (error) {
        console.error("Error requesting delivery:", error);
        socket.emit("error", { message: "Error requesting delivery" });
    }
}
function handleSubscribeToDelivery(socket, user, deliveryId) {
    socket.join(`delivery_${deliveryId}`);
    console.log(`User ${user.id} subscribed to delivery ${deliveryId}`);
}
function handleSubscribeToStoreOrders(socket, user, storeId) {
    socket.join(`store_${storeId}`);
    console.log(`User ${user.id} subscribed to store ${storeId} orders`);
}
module.exports = {
    handleSubscribeToZone,
    handleSearchCaptain,
    handleRequestDelivery,
    handleSubscribeToDelivery,
    handleSubscribeToStoreOrders,
};
//# sourceMappingURL=customerHandlers.js.map