"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./auth"));
const ride_1 = __importDefault(require("./ride"));
const captain_1 = __importDefault(require("./captain"));
const seller_1 = __importDefault(require("./seller"));
const product_1 = __importDefault(require("./product"));
const store_1 = __importDefault(require("./store"));
const delivery_1 = __importDefault(require("./delivery"));
const banner_1 = __importDefault(require("./banner"));
const router = express_1.default.Router();
router.use("/auth", auth_1.default);
router.use("/rides", ride_1.default);
router.use("/captains", captain_1.default);
router.use("/sellers", seller_1.default);
router.use("/products", product_1.default);
router.use("/stores", store_1.default);
router.use("/deliveries", delivery_1.default);
router.use("/banners", banner_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map