import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    deliveryType: { type: String, enum: ["digital", "fisica"], required: true },
    shipping: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
    },
    paymentStatus: {
      type: String,
      enum: ["pendiente", "pagado", "fallido"],
      default: "pendiente",
    },
    paypalOrderId: { type: String, default: "" },
    shippingStatus: {
      type: String,
      enum: ["pendiente", "procesando", "enviado", "entregado"],
      default: "pendiente",
    },
    capturing: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
