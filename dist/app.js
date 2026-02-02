"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
require("express-async-errors");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const events_1 = __importDefault(require("events"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const connect_1 = __importDefault(require("./config/connect"));
const not_found_1 = __importDefault(require("./middleware/not-found"));
const error_handler_1 = __importDefault(require("./middleware/error-handler"));
const authentication_1 = __importDefault(require("./middleware/authentication"));
const auth_1 = __importDefault(require("./routes/auth"));
const ride_1 = __importDefault(require("./routes/ride"));
const version_1 = __importDefault(require("./routes/version"));
const notification_1 = __importDefault(require("./routes/notification"));
const banner_1 = __importDefault(require("./routes/banner"));
const delivery_1 = __importDefault(require("./routes/delivery"));
const store_1 = __importDefault(require("./routes/store"));
const product_1 = __importDefault(require("./routes/product"));
const api_docs_1 = __importDefault(require("./routes/api-docs"));
const v1_1 = __importDefault(require("./routes/v1"));
const sockets_1 = __importDefault(require("./controllers/sockets"));
events_1.default.defaultMaxListeners = 100;
const app = (0, express_1.default)();
app.use(express_1.default.json());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: "*" } });
const uploadsDir = path_1.default.join(__dirname, "uploads");
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir);
}
app.use((req, res, next) => {
    req.io = io;
    return next();
});
(0, sockets_1.default)(io);
app.use("/auth", auth_1.default);
app.use("/ride", authentication_1.default, ride_1.default);
app.use("/delivery", delivery_1.default);
app.use("/store", store_1.default);
app.use("/product", product_1.default);
app.use("/version", version_1.default);
app.use("/notification", notification_1.default);
app.use("/uploads", express_1.default.static("uploads"));
app.use("/banner", banner_1.default);
app.use("/api-docs", api_docs_1.default);
app.use("/api/v1", v1_1.default);
app.use(not_found_1.default);
app.use(error_handler_1.default);
const start = async () => {
    try {
        await (0, connect_1.default)(process.env.MONGO_URI);
        const port = process.env.PORT || 3000;
        server.listen(port, "0.0.0.0", () => {
            console.log(`HTTP server is running on port ${port}`);
        });
    }
    catch (error) {
        console.error("Error starting server:", error);
    }
};
exports.default = app;
if (process.env.NODE_ENV !== "test") {
    start();
}
//# sourceMappingURL=app.js.map