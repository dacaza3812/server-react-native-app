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
const productSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: "MXN",
    },
    category: {
        type: String,
        required: true,
    },
    store: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
    },
    images: [
        {
            type: String,
            required: true,
        },
    ],
    thumbnail: {
        type: String,
        required: true,
    },
    weight: {
        type: Number,
        default: 0,
    },
    dimensions: {
        length: { type: Number, default: 0 },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
    },
    inventory: {
        type: Number,
        required: true,
        min: 0,
    },
    lowInventoryThreshold: {
        type: Number,
        default: 10,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    tags: [
        {
            type: String,
        },
    ],
    specifications: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed,
    },
    nutritionFacts: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
        sugar: Number,
        sodium: Number,
    },
    allergens: [
        {
            type: String,
        },
    ],
    dietaryInfo: [
        {
            type: String,
            enum: ["vegetarian", "vegan", "gluten-free", "dairy-free", "nut-free", "organic"],
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
    salesCount: {
        type: Number,
        default: 0,
    },
    featured: {
        type: Boolean,
        default: false,
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    discountValidUntil: Date,
}, {
    timestamps: true,
});
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1 });
productSchema.index({ store: 1 });
productSchema.index({ isAvailable: 1, isActive: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ price: 1 });
productSchema.virtual("discountedPrice").get(function () {
    const discountFactor = 1 - (this.discount / 100);
    return this.price * discountFactor;
});
productSchema.methods.isOnDiscount = function () {
    return this.discount > 0 && (!this.discountValidUntil || this.discountValidUntil > new Date());
};
productSchema.methods.isLowInventory = function () {
    return this.inventory <= this.lowInventoryThreshold;
};
const Product = mongoose_1.default.model("Product", productSchema);
exports.default = Product;
//# sourceMappingURL=Product.js.map