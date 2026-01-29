const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
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
    type: mongoose.Schema.Types.ObjectId,
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
    default: 0, // kg
  },
  dimensions: {
    length: { type: Number, default: 0 }, // cm
    width: { type: Number, default: 0 }, // cm
    height: { type: Number, default: 0 }, // cm
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
    of: mongoose.Schema.Types.Mixed,
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
    default: 0, // percentage
    min: 0,
    max: 100,
  },
  discountValidUntil: Date,
}, {
  timestamps: true,
});

// Text search index
productSchema.index({ name: "text", description: "text", tags: "text" });

// Filter by category and store
productSchema.index({ category: 1 });
productSchema.index({ store: 1 });

// Filter by availability and active status
productSchema.index({ isAvailable: 1, isActive: 1 });

// Filter by featured products
productSchema.index({ featured: 1 });

// Price range index
productSchema.index({ price: 1 });

// Virtual for discounted price
productSchema.virtual("discountedPrice").get(function() {
  const discountFactor = 1 - (this.discount / 100);
  return this.price * discountFactor;
});

// Method to check if product is on discount
productSchema.methods.isOnDiscount = function() {
  return this.discount > 0 && (!this.discountValidUntil || this.discountValidUntil > new Date());
};

// Method to check if product is in low inventory
productSchema.methods.isLowInventory = function() {
  return this.inventory <= this.lowInventoryThreshold;
};

const Product = mongoose.model("Product", productSchema);
module.exports = Product;