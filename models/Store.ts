import mongoose, { Schema, Document, Model } from "mongoose";

// Interfaces
export interface IStoreAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export interface IStoreContact {
  phone: string;
  email: string;
  website?: string;
}

export interface IBusinessHours {
  open: string;
  close: string;
}

export interface IBusinessHoursWeek {
  monday?: IBusinessHours;
  tuesday?: IBusinessHours;
  wednesday?: IBusinessHours;
  thursday?: IBusinessHours;
  friday?: IBusinessHours;
  saturday?: IBusinessHours;
  sunday?: IBusinessHours;
}

export interface IRatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface IProductRating {
  product: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
}

export interface IReview {
  customer: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  productRatings: IProductRating[];
  createdAt: Date;
}

export interface IStoreRatings {
  average: number;
  total: number;
  distribution: IRatingDistribution;
}

export interface IStore extends Document {
  name: string;
  description?: string;
  address: IStoreAddress;
  contact: IStoreContact;
  businessHours?: IBusinessHoursWeek;
  categories: string[];
  logo?: string;
  banner?: string;
  isActive: boolean;
  deliveryRadius: number;
  averageDeliveryTime: number;
  minimumOrderAmount: number;
  deliveryFee: number;
  taxRate: number;
  paymentMethods: string[];
  owner: mongoose.Types.ObjectId;
  ratings: IStoreRatings;
  reviews: IReview[];
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
  addReview(reviewData: Omit<IReview, "createdAt">): Promise<IStore>;
}

// Schema
const storeSchema = new Schema<IStore>(
  {
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
    categories: [
      {
        type: String,
        required: true,
      },
    ],
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
    paymentMethods: [
      {
        type: String,
        enum: ["cash", "card", "transfer", "paypal"],
        default: ["cash", "card"],
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "UserV1",
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
      distribution: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
    },
    reviews: [
      {
        customer: {
          type: Schema.Types.ObjectId,
          ref: "UserV1",
          required: true,
        },
        order: {
          type: Schema.Types.ObjectId,
          ref: "Delivery",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          maxlength: 500,
        },
        productRatings: [
          {
            product: {
              type: Schema.Types.ObjectId,
              ref: "ProductV1",
            },
            rating: {
              type: Number,
              min: 1,
              max: 5,
            },
            comment: String,
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalOrders: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
storeSchema.index({ "address.latitude": 1, "address.longitude": 1 });
storeSchema.index({ name: "text", description: "text", categories: "text" });
storeSchema.index({ categories: 1 });

// Method to add review
storeSchema.methods.addReview = async function (
  reviewData: Omit<IReview, "createdAt">
): Promise<IStore> {
  const { customer, order, rating, comment, productRatings } = reviewData;

  // Check for duplicate review
  const existingReview = this.reviews.find(
    (r: IReview) =>
      r.customer.toString() === (customer as mongoose.Types.ObjectId).toString() &&
      r.order.toString() === (order as mongoose.Types.ObjectId).toString()
  );

  if (existingReview) {
    throw new Error("Review already exists for this order");
  }

  // Add review
  this.reviews.push({
    customer,
    order,
    rating,
    comment,
    productRatings,
    createdAt: new Date(),
  });

  // Update distribution
  const distKey = rating.toString() as unknown as keyof IRatingDistribution;
  this.ratings.distribution[distKey] =
    (this.ratings.distribution[distKey] || 0) + 1;

  // Recalculate average
  this.ratings.total += 1;
  const totalScore = this.reviews.reduce(
    (sum: number, r: IReview) => sum + r.rating,
    0
  );
  this.ratings.average = totalScore / this.ratings.total;

  await this.save();
  return this;
};

const Store: Model<IStore> = mongoose.model<IStore>("Store", storeSchema);
export default Store;
