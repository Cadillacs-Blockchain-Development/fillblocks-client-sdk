import mongoose, { Schema, Document } from "mongoose";
 
export interface IUuid extends Document {
  uuid: string;
  userId: mongoose.Types.ObjectId;
}
 
const UuidSchema: Schema = new Schema(
  {
    Uid: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    previousDataHash: {
        type: String,
        required: true,
    }
  },
  { timestamps: true }
);
 
export const UuidModel = mongoose.model<IUuid>("Uuid", UuidSchema);