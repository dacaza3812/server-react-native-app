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
const deliveryItemSchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "ProductV1",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    subtotal: {
        type: Number,
        required: true,
    },
    notes: {
        type: String,
        default: "",
    },
});
const deliverySchema = new mongoose_1.Schema({
    deliveryType: {
        type: String,
        enum: ["PICKUP_FROM_STORE", "HOME_DELIVERY"],
        required: true,
    },
    orderNumber: {
        type: String,
        unique: true,
        sparse: true,
    },
    trackingCode: {
        type: String,
        unique: true,
        sparse: true,
    },
    store: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
    },
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "UserV1",
        required: true,
    },
    captain: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "UserV1",
        default: null,
    },
    items: [deliveryItemSchema],
    pickup: {
        address: {
            street: String,
            city: String,
            state: String,
            country: { type: String, default: "MX" },
            postalCode: String,
        },
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
        instructions: {
            type: String,
            default: "",
        },
        estimatedTime: Date,
        actualTime: Date,
    },
    delivery: {
        address: {
            street: String,
            city: String,
            state: String,
            country: { type: String, default: "MX" },
            postalCode: String,
        },
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
        instructions: {
            type: String,
            default: "",
        },
        actualTime: Date,
    },
    pricing: {
        subtotal: {
            type: Number,
            required: true,
        },
        tax: {
            type: Number,
            required: true,
        },
        deliveryFee: {
            type: Number,
            required: true,
        },
        total: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "MXN",
        },
        tip: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
    },
    status: {
        type: String,
        enum: ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELLED"],
        default: "PENDING",
    },
    paymentStatus: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
        default: "PENDING",
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
    },
    deliveryDistance: {
        type: Number,
        default: 0,
    },
    deliveryDuration: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
    },
    review: {
        type: String,
    },
    cancellationReason: {
        type: String,
    },
    cancelledBy: {
        type: String,
    },
}, {
    timestamps: true,
});
deliverySchema.methods.generateTrackingCode = function () {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    this.trackingCode = `TRK${timestamp}${random}`;
};
deliverySchema.methods.generateOTP = function () {
    this.otp = Math.floor(1000 + Math.random() * 9000).toString();
};
deliverySchema.pre("save", async function (next) {
    if (!this.orderNumber) {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
        this.orderNumber = `ORD${timestamp}${random}`;
    }
    next();
});
const Delivery = mongoose_1.default.model("Delivery", deliverySchema);
exports.default = Delivery;
//# sourceMappingURL=Delivery.js.map