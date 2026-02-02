import mongoose, { Schema, Document, Model } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Interfaces
export interface IProfile {
  name?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  dni?: string;
}

export interface IVehicle {
  type: "bike" | "auto" | "car";
  licensePlate?: string;
  color?: string;
  model?: string;
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
  label?: string;
}

export interface IDeliveryPreferences {
  defaultAddress?: Omit<IAddress, "isDefault" | "label">;
  preferredContact?: "phone" | "email";
  instructions?: string;
  tipPercentage?: number;
}

export interface IRating {
  average: number;
  total: number;
}

export interface IStatistics {
  totalRides: number;
  totalDeliveries: number;
  totalEarnings: number;
  totalHours: number;
}

export interface ICaptainPricing {
  pricePerKm: {
    bike: number;
    auto: number;
    car: number;
  };
}

export interface ISellerInfo {
  businessName?: string;
  taxId?: string;
}

export interface IUserV1 extends Document {
  role: "customer" | "captain" | "store_owner";
  phone: string;
  password: string;
  isActive: boolean;
  firebasePushToken?: string;
  stores: mongoose.Types.ObjectId[];
  addresses: IAddress[];
  deliveryPreferences: IDeliveryPreferences;
  vehicle: IVehicle;
  profile: IProfile;
  isVerified: boolean;
  verificationDocuments: string[];
  rating: IRating;
  statistics: IStatistics;
  captain: ICaptainPricing;
  seller: ISellerInfo;
  createdAt: Date;
  updatedAt: Date;
  createAccessToken(): string;
  createRefreshToken(): string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Schema
const userV1Schema = new Schema<IUserV1>(
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
    password: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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
      preferredContact: {
        type: String,
        enum: ["phone", "email"],
        default: "phone",
      },
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
      gender: {
        type: String,
        enum: ["male", "female", "other", "prefer_not_to_say"],
      },
      dni: String,
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

// Methods
userV1Schema.methods.createAccessToken = function (): string {
  return jwt.sign(
    {
      id: this._id.toString(),
      phone: this.phone,
    },
    process.env.ACCESS_TOKEN_SECRET as jwt.Secret,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"] }
  );
};

userV1Schema.methods.createRefreshToken = function (): string {
  return jwt.sign(
    { id: this._id.toString(), phone: this.phone },
    process.env.REFRESH_TOKEN_SECRET as jwt.Secret,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
    }
  );
};

// Hash password before saving
userV1Schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userV1Schema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const UserV1: Model<IUserV1> = mongoose.model<IUserV1>("UserV1", userV1Schema);
export default UserV1;
