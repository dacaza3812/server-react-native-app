import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBanner extends Document {
  imageUrl: string;
  title: string;
  description?: string;
  link?: string;
  targetCity: string[];
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    link: {
      type: String,
    },
    targetCity: [
      {
        type: String,
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Banner: Model<IBanner> = mongoose.model<IBanner>("Banner", bannerSchema);
export default Banner;
