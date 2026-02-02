import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVersionApp extends Document {
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

const versionSchema = new Schema<IVersionApp>(
  {
    version: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const VersionApp: Model<IVersionApp> = mongoose.model<IVersionApp>("VersionApp", versionSchema);
export default VersionApp;
