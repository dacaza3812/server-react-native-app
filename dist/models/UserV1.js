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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userV1Schema = new mongoose_1.Schema({
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
    password: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
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
        preferredContact: {
            type: String,
            enum: ["phone", "email"],
            default: "phone",
        },
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
        lastName: String,
        email: String,
        avatar: String,
        avatarUrl: String,
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ["male", "female", "other", "prefer_not_to_say"],
        },
        dni: String,
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
    captain: {
        pricePerKm: {
            bike: { type: Number, default: 150 },
            auto: { type: Number, default: 150 },
            car: { type: Number, default: 250 },
        },
    },
    seller: {
        businessName: String,
        taxId: String,
    },
}, {
    timestamps: true,
});
userV1Schema.methods.createAccessToken = function () {
    return jsonwebtoken_1.default.sign({
        id: this._id.toString(),
        phone: this.phone,
    }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
};
userV1Schema.methods.createRefreshToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id.toString(), phone: this.phone }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });
};
userV1Schema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = await bcryptjs_1.default.hash(this.password, 12);
    next();
});
userV1Schema.methods.comparePassword = async function (candidatePassword) {
    return await bcryptjs_1.default.compare(candidatePassword, this.password);
};
const UserV1 = mongoose_1.default.model("UserV1", userV1Schema);
exports.default = UserV1;
//# sourceMappingURL=UserV1.js.map