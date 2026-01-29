const mongoose = require("mongoose");

const deliveryItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
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

const deliverySchema = new mongoose.Schema({
  deliveryType: {
    type: String,
    enum: ["PICKUP_FROM_STORE", "HOME_DELIVERY"],
    required: true,
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
    estimatedTime: Date,
    actualTime: Date,
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    tip: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "MXN",
    },
  },
  status: {
    type: String,
    enum: [
      "PENDING",
      "ASSIGNED",
      "PICKED_UP",
      "IN_TRANSIT",
      "DELIVERED",
      "CANCELLED",
      "FAILED",
    ],
    default: "PENDING",
  },
  paymentStatus: {
    type: String,
    enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
    default: "PENDING",
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card", "transfer", "paypal"],
  },
  trackingCode: {
    type: String,
    unique: true,
  },
  otp: {
    type: String,
    default: null,
  },
  deliveryDistance: {
    type: Number,
    default: 0,
  },
  deliveryDuration: {
    type: Number,
    default: 0, // minutes
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  review: {
    type: String,
    default: "",
  },
  cancellationReason: {
    type: String,
    default: "",
  },
  cancelledBy: {
    type: String,
    enum: ["customer", "captain", "store", "system"],
    default: "",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Generate unique order number
deliverySchema.pre("save", function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD${timestamp}${random}`;
  }
  
  // Update updatedAt on status change
  if (this.isModified('status')) {
    this.updatedAt = new Date();
  }
  
  next();
});

// Generate tracking code
deliverySchema.methods.generateTrackingCode = function() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  this.trackingCode = `TRK${timestamp}${random}`;
  return this.trackingCode;
};

// Generate OTP
deliverySchema.methods.generateOTP = function() {
  this.otp = Math.floor(1000 + Math.random() * 9000).toString();
  return this.otp;
};

// Calculate delivery distance
deliverySchema.methods.calculateDistance = function() {
  const R = 6371; // Earth's radius in km
  const dLat = (this.delivery.latitude - this.pickup.latitude) * (Math.PI / 180);
  const dLon = (this.delivery.longitude - this.pickup.longitude) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.pickup.latitude * (Math.PI / 180)) * 
    Math.cos(this.delivery.latitude * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * 
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  this.deliveryDistance = R * c;
  return this.deliveryDistance;
};

// Indexes for performance
deliverySchema.index({ orderNumber: 1 });
deliverySchema.index({ trackingCode: 1 });
deliverySchema.index({ customer: 1 });
deliverySchema.index({ captain: 1 });
deliverySchema.index({ store: 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ createdAt: -1 });
deliverySchema.index({ "pickup.latitude": 1, "pickup.longitude": 1 });
deliverySchema.index({ "delivery.latitude": 1, "delivery.longitude": 1 });

const Delivery = mongoose.model("Delivery", deliverySchema);
module.exports = Delivery;