import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDeliveryItem {
  product: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
}

export interface ILocationPoint {
  address: IAddress;
  latitude: number;
  longitude: number;
  instructions?: string;
  estimatedTime?: Date;
  actualTime?: Date;
}

export interface IPricing {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  currency: string;
  tip?: number;
  discount?: number;
}

export interface IDelivery extends Document {
  deliveryType: "PICKUP_FROM_STORE" | "HOME_DELIVERY";
  orderNumber?: string;
  trackingCode?: string;
  store: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  captain?: mongoose.Types.ObjectId;
  items: IDeliveryItem[];
  pickup: ILocationPoint;
  delivery: ILocationPoint;
  pricing: IPricing;
  status: "PENDING" | "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: string;
  otp?: string;
  deliveryDistance: number;
  deliveryDuration: number;
  rating?: number;
  review?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  createdAt: Date;
  updatedAt: Date;
  generateTrackingCode(): void;
  generateOTP(): void;
}

const deliveryItemSchema = new Schema<IDeliveryItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "ProductV1",
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

const deliverySchema = new Schema<IDelivery>(
  {
    deliveryType: {
      type: String,
      enum: ["PICKUP_FROM_STORE", "HOME_DELIVERY"],
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    trackingCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
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
      actualTime: Date,
    },
    pricing: {
      subtotal: {
        type: Number,
        required: true,
      },
      tax: {
        type: Number,
        required: true,
      },
      deliveryFee: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: "MXN",
      },
      tip: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
    },
    deliveryDistance: {
      type: Number,
      default: 0,
    },
    deliveryDuration: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
    },
    review: {
      type: String,
    },
    cancellationReason: {
      type: String,
    },
    cancelledBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Methods
deliverySchema.methods.generateTrackingCode = function (): void {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  this.trackingCode = `TRK${timestamp}${random}`;
};

deliverySchema.methods.generateOTP = function (): void {
  this.otp = Math.floor(1000 + Math.random() * 9000).toString();
};

// Pre-save hook to generate order number
deliverySchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    this.orderNumber = `ORD${timestamp}${random}`;
  }
  next();
});

const Delivery: Model<IDelivery> = mongoose.model<IDelivery>("Delivery", deliverySchema);
export default Delivery;
