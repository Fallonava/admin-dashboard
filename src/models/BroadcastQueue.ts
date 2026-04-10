import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBroadcastQueue extends Document {
  patientName: string;
  whatsappNumber: string;
  doctorName?: string;
  clinicName?: string;
  status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
  messageText: string;
  log?: string;
  sendAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BroadcastQueueSchema: Schema = new Schema(
  {
    patientName: { type: String, required: true },
    whatsappNumber: { type: String, required: true },
    doctorName: { type: String, required: false },
    clinicName: { type: String, required: false },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SENT", "FAILED"],
      default: "PENDING",
      required: true,
    },
    messageText: { type: String, required: true },
    log: { type: String, required: false },
    sendAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose from compiling the model multiple times during Next.js hot-reloading
export const BroadcastQueue: Model<IBroadcastQueue> =
  mongoose.models.BroadcastQueue || mongoose.model<IBroadcastQueue>("BroadcastQueue", BroadcastQueueSchema);

export default BroadcastQueue;
