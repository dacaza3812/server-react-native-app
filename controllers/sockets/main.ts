import { Server as SocketIOServer } from "socket.io";
import { socketAuthMiddleware, activeSockets, updateNearbyCaptains } from "./index";

const handleSocketConnection = (io: SocketIOServer): void => {
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    console.log("User Joined:", user);

    activeSockets.set(user.id, socket);

    socket.on("disconnect", async () => {
      activeSockets.delete(user.id);
      console.log(`${user.role} ${user.id} disconnected.`);
      updateNearbyCaptains(io);
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
        (socket as any).user.coords = customerCoords;
        console.log(`Customer ${user.id} subscribed to zone`);
      });
    }
  });
};

export default handleSocketConnection;
