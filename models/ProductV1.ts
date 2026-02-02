import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDimensions {
  length: number;
  width: number;
  height: number;
}

export interface INutritionFacts {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface IRating {
  average: number;
  total: number;
}

export interface IProductV1 extends Document {
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  store: mongoose.Types.ObjectId;
  images: string[];
  thumbnail: string;
  weight: number;
  dimensions: IDimensions;
  inventory: number;
  lowInventoryThreshold: number;
  isAvailable: boolean;
  isActive: boolean;
  tags: string[];
  specifications: Map<string, any>;
  nutritionFacts?: INutritionFacts;
  allergens: string[];
  dietaryInfo: string[];
  rating: IRating;
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

const productV1Schema = new Schema<IProductV1>(
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
    images: [{
      type: String,
      required: true,
    }],
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
    tags: [{
      type: String,
    }],
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
    allergens: [{
      type: String,
    }],
    dietaryInfo: [{
      type: String,
      enum: ["vegetarian", "vegan", "gluten-free", "dairy-free", "nut-free", "organic"],
    }],
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
productV1Schema.index({ name: "text", description: "text", tags: "text" });
productV1Schema.index({ category: 1 });
productV1Schema.index({ store: 1 });
productV1Schema.index({ isAvailable: 1, isActive: 1 });
productV1Schema.index({ featured: 1 });
productV1Schema.index({ price: 1 });

// Virtuals
productV1Schema.virtual("discountedPrice").get(function (this: IProductV1): number {
  const discountFactor = 1 - (this.discount / 100);
  return this.price * discountFactor;
});

// Methods
productV1Schema.methods.isOnDiscount = function (this: IProductV1): boolean {
  return this.discount > 0 && (!this.discountValidUntil || this.discountValidUntil > new Date());
};

productV1Schema.methods.isLowInventory = function (this: IProductV1): boolean {
  return this.inventory <= this.lowInventoryThreshold;
};

const ProductV1: Model<IProductV1> = mongoose.model<IProductV1>("ProductV1", productV1Schema);
export default ProductV1;
