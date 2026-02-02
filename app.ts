import dotenv from "dotenv";
dotenv.config();

import "express-async-errors";
import express, { Application, Request, Response, NextFunction } from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import connectDB from "./config/connect";
import notFoundMiddleware from "./middleware/not-found";
import errorHandlerMiddleware from "./middleware/error-handler";
import authenticationMiddleware from "./middleware/authentication";

// Import routes
import authRouter from "./routes/auth";
import rideRouter from "./routes/ride";
import versionRouter from "./routes/version";
import notificationRouter from "./routes/notification";
import bannerRouter from "./routes/banner";
import deliveryRouter from "./routes/delivery";
import storeRouter from "./routes/store";
import productRouter from "./routes/product";
import apiDocsRouter from "./routes/api-docs";
import v1Router from "./routes/v1";

// Import socket handler
import handleSocketConnection from "./controllers/sockets";

const app: Application = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, { cors: { origin: "*" } });

// Middleware
app.use(express.json());

// Attach WebSocket instance to request
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).io = io;
  return next();
});

// Initialize WebSocket handling
handleSocketConnection(io);

// Routes
app.use("/auth", authRouter);
app.use("/ride", authenticationMiddleware, rideRouter);
app.use("/delivery", deliveryRouter);
app.use("/store", storeRouter);
app.use("/product", productRouter);
app.use("/version", versionRouter);
app.use("/notification", notificationRouter);
app.use("/banner", bannerRouter);
app.use("/api-docs", apiDocsRouter);
app.use("/api/v1", v1Router);

// Error handling middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async (): Promise<void> => {
  try {
    await connectDB(process.env.MONGO_URI as string);

    const PORT = process.env.PORT || 3000;
    server.listen(PORT as number, "0.0.0.0", () => {
      console.log(`HTTP server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

// Export for testing
export default app;

// Start server only if not in test environment
if (process.env.NODE_ENV !== "test") {
  start();
}
