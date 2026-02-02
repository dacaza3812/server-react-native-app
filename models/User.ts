import mongoose, { Schema, Document, Model } from "mongoose";
import * as jwt from "jsonwebtoken";

export interface IAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  label: string;
}

export interface IProfile {
  name?: string;
  email?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
}

export interface IVehicle {
  type: "bike" | "auto" | "car";
  licensePlate?: string;
  color?: string;
  model?: string;
}

export interface IUser extends Document {
  role: "customer" | "captain" | "store_owner";
  phone: string;
  firebasePushToken?: string;
  stores: mongoose.Types.ObjectId[];
  addresses: IAddress[];
  deliveryPreferences: {
    defaultAddress?: Omit<IAddress, "isDefault" | "label">;
    preferredContact?: "phone" | "email";
    instructions?: string;
    tipPercentage?: number;
  };
  vehicle: IVehicle;
  profile: IProfile;
  isVerified: boolean;
  verificationDocuments: string[];
  rating: {
    average: number;
    total: number;
  };
  statistics: {
    totalRides: number;
    totalDeliveries: number;
    totalEarnings: number;
    totalHours: number;
  };
  createdAt: Date;
  updatedAt: Date;
  createAccessToken(): string;
  createRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
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
      unique: false,
    },
    stores: [
      {
        type: Schema.Types.ObjectId,
        ref: "Store",
      },
    ],
    addresses: [
      {
        street: String,
        city: String,
        state: String,
        country: { type: String, default: "MX" },
        postalCode: String,
        latitude: Number,
        longitude: Number,
        isDefault: { type: Boolean, default: false },
        label: { type: String, default: "Home" },
      },
    ],
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
      email: String,
      avatar: String,
      dateOfBirth: Date,
      gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"] },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDocuments: [
      {
        type: String,
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
    statistics: {
      totalRides: { type: Number, default: 0 },
      totalDeliveries: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      totalHours: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.createAccessToken = function (this: IUser): string {
  return jwt.sign(
    {
      id: this._id.toString(),
      phone: this.phone,
    },
    process.env.ACCESS_TOKEN_SECRET || "fallback_secret",
    { expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || "4d") as jwt.SignOptions["expiresIn"] }
  );
};

userSchema.methods.createRefreshToken = function (this: IUser): string {
  return jwt.sign(
    { id: this._id.toString(), phone: this.phone },
    process.env.REFRESH_TOKEN_SECRET || "fallback_refresh_secret",
    {
      expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || "30d") as jwt.SignOptions["expiresIn"],
    }
  );
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
