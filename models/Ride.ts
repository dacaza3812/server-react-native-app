import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface IRide extends Document {
  vehicle: "bike" | "auto" | "cabEconomy" | "cabPremium";
  distance: number;
  pickup: ILocation;
  drop: ILocation;
  fare: number;
  customer: mongoose.Types.ObjectId;
  captain?: mongoose.Types.ObjectId;
  status: "SEARCHING_FOR_CAPTAIN" | "START" | "ARRIVED" | "COMPLETED" | "CANCELLED";
  otp?: string;
  cancellationReason?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const rideSchema = new Schema<IRide>(
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
      ref: "User",
      required: true,
    },
    captain: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Ride: Model<IRide> = mongoose.model<IRide>("Ride", rideSchema);
export default Ride;
