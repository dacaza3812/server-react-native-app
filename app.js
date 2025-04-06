require("dotenv").config();
require("express-async-errors");

const fs = require("fs");
const path = require("path");

const EventEmitter = require("events");
EventEmitter.defaultMaxListeners = 100;

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/connect");
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const authMiddleware = require("./middleware/authentication");

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Routers
const authRouter = require("./routes/auth");
const rideRouter = require("./routes/ride");
const versionRouter = require("./routes/version");
const notificationRouter = require("./routes/notification")
const bannerRouter = require("./routes/banner");

// Import socket handler
const handleSocketConnection = require("./controllers/sockets");

const app = express();
app.use(express.json());

const server = http.createServer(app);

const io = socketIo(server, { cors: { origin: "*" } });

// Attach the WebSocket instance to the request object
app.use((req, res, next) => {
  req.io = io;
  return next();
});

// Initialize the WebSocket handling logic
handleSocketConnection(io);

// Routes
app.use("/auth", authRouter);
app.use("/ride", authMiddleware, rideRouter);
app.use("/version", versionRouter);
app.use("/notification", notificationRouter);
app.use("/uploads", express.static("uploads"));
app.use("/banner", bannerRouter);

// Middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    // Uncomment this and comment below one if you want to run on ip address so that you can
    // access api in physical device

    // server.listen(process.env.PORT || 3000, "0.0.0.0", () =>
    server.listen(process.env.PORT || 3000, () =>
      console.log(
        `HTTP server is running on port ${
          process.env.PORT || 3000
        }`
      )
    );
  } catch (error) {
    console.log(error);
  }
};

start();
