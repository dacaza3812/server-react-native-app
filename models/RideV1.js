const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const rideV1Schema = new Schema(
  {
    vehicle: {
      type: String,
      enum: ["bike", "auto", "cabEconomy", "cabPremium"],
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    pickup: {
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    drop: {
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    fare: {
      type: Number,
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "UserV1",
      required: true,
    },
    captain: {
      type: Schema.Types.ObjectId,
      ref: "UserV1",
      default: null,
    },
    status: {
      type: String,
      enum: ["SEARCHING_FOR_CAPTAIN", "START", "ARRIVED", "COMPLETED", "CANCELLED"],
      default: "SEARCHING_FOR_CAPTAIN",
    },
    otp: {
      type: String,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "UserV1",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const RideV1 = mongoose.model("RideV1", rideV1Schema);
module.exports = RideV1;
