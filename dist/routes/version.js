"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const versionapp_1 = require("../controllers/versionapp");
const router = express_1.default.Router();
router.get("/", versionapp_1.getVersion);
exports.default = router;
//# sourceMappingURL=version.js.map