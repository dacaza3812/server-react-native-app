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
const storeSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    address: {
        street: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
            default: "MX",
        },
        postalCode: {
            type: String,
            required: true,
        },
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
    },
    contact: {
        phone: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        website: String,
    },
    businessHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String },
    },
    categories: [
        {
            type: String,
            required: true,
        },
    ],
    logo: {
        type: String,
        default: "",
    },
    banner: {
        type: String,
        default: "",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    deliveryRadius: {
        type: Number,
        default: 10000,
    },
    averageDeliveryTime: {
        type: Number,
        default: 30,
    },
    minimumOrderAmount: {
        type: Number,
        default: 0,
    },
    deliveryFee: {
        type: Number,
        default: 0,
    },
    taxRate: {
        type: Number,
        default: 0.16,
    },
    paymentMethods: [
        {
            type: String,
            enum: ["cash", "card", "transfer", "paypal"],
            default: ["cash", "card"],
        },
    ],
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "UserV1",
        required: true,
    },
    ratings: {
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
        distribution: {
            5: { type: Number, default: 0 },
            4: { type: Number, default: 0 },
            3: { type: Number, default: 0 },
            2: { type: Number, default: 0 },
            1: { type: Number, default: 0 },
        },
    },
    reviews: [
        {
            customer: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "UserV1",
                required: true,
            },
            order: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Delivery",
                required: true,
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            comment: {
                type: String,
                maxlength: 500,
            },
            productRatings: [
                {
                    product: {
                        type: mongoose_1.Schema.Types.ObjectId,
                        ref: "ProductV1",
                    },
                    rating: {
                        type: Number,
                        min: 1,
                        max: 5,
                    },
                    comment: String,
                },
            ],
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    totalOrders: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
storeSchema.index({ "address.latitude": 1, "address.longitude": 1 });
storeSchema.index({ name: "text", description: "text", categories: "text" });
storeSchema.index({ categories: 1 });
storeSchema.methods.addReview = async function (reviewData) {
    const { customer, order, rating, comment, productRatings } = reviewData;
    const existingReview = this.reviews.find((r) => r.customer.toString() === customer.toString() &&
        r.order.toString() === order.toString());
    if (existingReview) {
        throw new Error("Review already exists for this order");
    }
    this.reviews.push({
        customer,
        order,
        rating,
        comment,
        productRatings,
        createdAt: new Date(),
    });
    const distKey = rating.toString();
    this.ratings.distribution[distKey] =
        (this.ratings.distribution[distKey] || 0) + 1;
    this.ratings.total += 1;
    const totalScore = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.ratings.average = totalScore / this.ratings.total;
    await this.save();
    return this;
};
const Store = mongoose_1.default.model("Store", storeSchema);
exports.default = Store;
//# sourceMappingURL=Store.js.map