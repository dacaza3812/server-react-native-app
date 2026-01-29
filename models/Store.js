const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
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
  categories: [{
    type: String,
    required: true,
  }],
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
    default: 10000, // meters
  },
  averageDeliveryTime: {
    type: Number,
    default: 30, // minutes
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
    default: 0.16, // 16% IVA
  },
  paymentMethods: [{
    type: String,
    enum: ["cash", "card", "transfer", "paypal"],
    default: ["cash", "card"],
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Geospatial index for location-based queries
storeSchema.index({ "address.latitude": 1, "address.longitude": 1 });

// Text search index
storeSchema.index({ name: "text", description: "text", categories: "text" });

// Filter by categories
storeSchema.index({ categories: 1 });

const Store = mongoose.model("Store", storeSchema);
module.exports = Store;