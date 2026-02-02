import dotenv from "dotenv";
dotenv.config();

import "express-async-errors";
import fs from "fs";
import path from "path";
import EventEmitter from "events";
import express, { Application, Request, Response, NextFunction } from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import connectDB from "./config/connect";
import notFoundMiddleware from "./middleware/not-found";
import errorHandlerMiddleware from "./middleware/error-handler";
import authMiddleware from "./middleware/authentication";

// Extend Express Request to include io
declare global {
  namespace Express {
    interface Request {
      io?: SocketIOServer;
    }
  }
}

// Routers
import authRouter from "./routes/auth";
import rideRouter from "./routes/ride";
import versionRouter from "./routes/version";
import notificationRouter from "./routes/notification";
import bannerRouter from "./routes/banner";
import deliveryRouter from "./routes/delivery";
import storeRouter from "./routes/store";
import productRouter from "./routes/product";
import apiDocsRouter from "./routes/api-docs";

// V1 Routers
import v1Router from "./routes/v1";

// Import socket handler
import handleSocketConnection from "./controllers/sockets";

// Increase max listeners
EventEmitter.defaultMaxListeners = 100;

const app: Application = express();
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });

// Create uploads directory
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Attach the WebSocket instance to the request object
app.use((req: Request, res: Response, next: NextFunction) => {
  req.io = io;
  return next();
});

// Initialize the WebSocket handling logic
handleSocketConnection(io);

// Routes
app.use("/auth", authRouter);
app.use("/ride", authMiddleware, rideRouter);
app.use("/delivery", deliveryRouter);
app.use("/store", storeRouter);
app.use("/product", productRouter);
app.use("/version", versionRouter);
app.use("/notification", notificationRouter);
app.use("/uploads", express.static("uploads"));
app.use("/banner", bannerRouter);
app.use("/api-docs", apiDocsRouter);
app.use("/api/v1", v1Router);

// Middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async (): Promise<void> => {
  try {
    await connectDB(process.env.MONGO_URI as string);

    // Listen on all interfaces for external access
    const port = process.env.PORT || 3000;
    server.listen(port as number, "0.0.0.0", () => {
      console.log(`HTTP server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

// Export app for testing
export default app;

// Start server only if not in test environment
if (process.env.NODE_ENV !== "test") {
  start();
}
