const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");

const userV1Schema = new Schema(
  {
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
      unique: false
    },
    stores: [{
      type: Schema.Types.ObjectId,
      ref: "Store",
    }],
    addresses: [{
      type: {
        street: String,
        city: String,
        state: String,
        country: { type: String, default: "MX" },
        postalCode: String,
        latitude: Number,
        longitude: Number,
        isDefault: { type: Boolean, default: false },
        label: { type: String, default: "Home" },
      }
    }],
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
      lastName: String,
      email: String,
      avatar: String,
      avatarUrl: String,
      dateOfBirth: Date,
      gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
      dni: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDocuments: [{
      type: String,
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
  },
  {
    timestamps: true,
  }
);

userV1Schema.methods.createAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      phone: this.phone,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userV1Schema.methods.createRefreshToken = function () {
  return jwt.sign(
    { id: this._id, phone: this.phone },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

const UserV1 = mongoose.model("UserV1", userV1Schema);
module.exports = UserV1;
