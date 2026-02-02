"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const handleSocketConnection = (io) => {
    io.use(index_1.socketAuthMiddleware);
    io.on("connection", (socket) => {
        const user = socket.user;
        console.log("User Joined:", user);
        index_1.activeSockets.set(user.id, socket);
        socket.on("disconnect", async () => {
            index_1.activeSockets.delete(user.id);
            console.log(`${user.role} ${user.id} disconnected.`);
            (0, index_1.updateNearbyCaptains)(io);
        });
        if (user.role === "captain") {
            socket.on("goOnDuty", (coords) => {
                console.log(`Captain ${user.id} on duty`, coords);
            });
            socket.on("goOffDuty", () => {
                console.log(`Captain ${user.id} off duty`);
            });
            socket.on("updateLocation", (coords) => {
                console.log(`Captain ${user.id} updated location`, coords);
            });
        }
        if (user.role === "customer") {
            socket.on("subscribeToZone", (customerCoords) => {
                socket.user.coords = customerCoords;
                console.log(`Customer ${user.id} subscribed to zone`);
            });
        }
    });
};
exports.default = handleSocketConnection;
//# sourceMappingURL=main.js.map