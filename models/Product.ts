import mongoose, { Schema, Document, Model } from "mongoose";

export interface INutritionFacts {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  store: mongoose.Types.ObjectId;
  images: string[];
  thumbnail: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  inventory: number;
  lowInventoryThreshold: number;
  isAvailable: boolean;
  isActive: boolean;
  tags: string[];
  specifications: Map<string, any>;
  nutritionFacts: INutritionFacts;
  allergens: string[];
  dietaryInfo: string[];
  rating: {
    average: number;
    total: number;
  };
  salesCount: number;
  featured: boolean;
  discount: number;
  discountValidUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  discountedPrice: number;
  isOnDiscount(): boolean;
  isLowInventory(): boolean;
}

const productSchema = new Schema<IProduct>(
  {
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
      type: Schema.Types.ObjectId,
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
      of: Schema.Types.Mixed,
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
  },
  {
    timestamps: true,
  }
);

// Indexes
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1 });
productSchema.index({ store: 1 });
productSchema.index({ isAvailable: 1, isActive: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ price: 1 });

// Virtual for discounted price
productSchema.virtual("discountedPrice").get(function (this: IProduct) {
  const discountFactor = 1 - (this.discount / 100);
  return this.price * discountFactor;
});

// Method to check if product is on discount
productSchema.methods.isOnDiscount = function (this: IProduct): boolean {
  return this.discount > 0 && (!this.discountValidUntil || this.discountValidUntil > new Date());
};

// Method to check if product is in low inventory
productSchema.methods.isLowInventory = function (this: IProduct): boolean {
  return this.inventory <= this.lowInventoryThreshold;
};

const Product: Model<IProduct> = mongoose.model<IProduct>("Product", productSchema);
export default Product;
