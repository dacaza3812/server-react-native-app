"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const jwt = __importStar(require("jsonwebtoken"));
const userSchema = new mongoose_1.Schema({
    role: {
        type: String,
        enum: ["customer", "captain", "store_owner"],
        required: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    firebasePushToken: {
        type: String,
        required: false,
        unique: false,
    },
    stores: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Store",
        },
    ],
    addresses: [
        {
            street: String,
            city: String,
            state: String,
            country: { type: String, default: "MX" },
            postalCode: String,
            latitude: Number,
            longitude: Number,
            isDefault: { type: Boolean, default: false },
            label: { type: String, default: "Home" },
        },
    ],
    deliveryPreferences: {
        defaultAddress: {
            street: String,
            city: String,
            state: String,
            country: { type: String, default: "MX" },
            postalCode: String,
            latitude: Number,
            longitude: Number,
        },
        preferredContact: { type: String, enum: ["phone", "email"], default: "phone" },
        instructions: { type: String, default: "" },
        tipPercentage: { type: Number, default: 0 },
    },
    vehicle: {
        type: {
            type: String,
            enum: ["bike", "auto", "car"],
            default: "auto",
        },
        licensePlate: String,
        color: String,
        model: String,
    },
    profile: {
        name: String,
        email: String,
        avatar: String,
        dateOfBirth: Date,
        gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationDocuments: [
        {
            type: String,
        },
    ],
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        total: {
            type: Number,
            default: 0,
        },
    },
    statistics: {
        totalRides: { type: Number, default: 0 },
        totalDeliveries: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 },
        totalHours: { type: Number, default: 0 },
    },
}, {
    timestamps: true,
});
userSchema.methods.createAccessToken = function () {
    return jwt.sign({
        id: this._id.toString(),
        phone: this.phone,
    }, process.env.ACCESS_TOKEN_SECRET || "fallback_secret", { expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || "4d") });
};
userSchema.methods.createRefreshToken = function () {
    return jwt.sign({ id: this._id.toString(), phone: this.phone }, process.env.REFRESH_TOKEN_SECRET || "fallback_refresh_secret", {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || "30d"),
    });
};
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
//# sourceMappingURL=User.js.map