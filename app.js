require("dotenv").config();
require("express-async-errors");

const fs = require("fs");
const path = require("path");

const EventEmitter = require("events");
EventEmitter.defaultMaxListeners = 100;

const express = require("express");
const http = require("http");
const cors = require("cors");
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
const deliveryRouter = require("./routes/delivery");
const storeRouter = require("./routes/store");
const productRouter = require("./routes/product");
const uploadRouter = require("./routes/upload");
const apiDocsRouter = require("./routes/api-docs");

// V1 Routers
const v1Router = require("./routes/v1");

// Admin Router
const adminRouter = require("./routes/admin");

// Import socket handler
const handleSocketConnection = require("./controllers/sockets");

const app = express();
app.use(cors());
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

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes
app.use("/auth", authRouter);
app.use("/ride", authMiddleware, rideRouter);
app.use("/delivery", deliveryRouter);
app.use("/store", storeRouter);
app.use("/product", productRouter);
app.use("/upload", uploadRouter);
app.use("/version", versionRouter);
app.use("/notification", notificationRouter);
app.use("/uploads", express.static("uploads"));
app.use("/banner", bannerRouter);
app.use("/api-docs", apiDocsRouter);
app.use("/api/v1", v1Router);
app.use("/api/admin", adminRouter);

// Middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    // Listen on all interfaces for external access
    server.listen(process.env.PORT || 3000, "0.0.0.0", () =>
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

// Export app for testing
module.exports = app;

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  start();
}
