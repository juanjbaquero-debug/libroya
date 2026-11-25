import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    provider: { type: String, enum: ["paypal"], required: true, default: "paypal" },
    providerOrderId: { type: String, required: true },
    captureId: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pendiente", "completado", "rechazado"],
      default: "pendiente",
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
