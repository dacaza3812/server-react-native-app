import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILocation {
  address: string;
  latitude: number;
  longitude: number;
}

export interface IRideV1 extends Document {
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
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

const rideV1Schema = new Schema<IRideV1>(
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
    rating: {
      type: Number,
      default: null,
    },
    review: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const RideV1: Model<IRideV1> = mongoose.model<IRideV1>("RideV1", rideV1Schema);
export default RideV1;
