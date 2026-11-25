import { Router } from "express";
import mongoose from "mongoose";
import { Book } from "../models/Book.js";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { requireAuth } from "../middleware/auth.js";
import { capturePaypalOrder, createPaypalOrder } from "../paypal.js";
import { broadcastOrder } from "../socket.js";
import { toCents } from "../utils.js";

const router = Router();

router.use(requireAuth);

function captureDetails(data) {
  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture) return null;
  return {
    id: capture.id || "",
    status: capture.status,
    currency: capture.amount?.currency_code,
    value: capture.amount?.value,
  };
}

async function decrementStock(items) {
  const applied = [];
  for (const item of items) {
    const result = await Book.updateOne(
      { _id: item.book, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
    if (result.modifiedCount !== 1) {
      for (const done of applied) {
        await Book.updateOne({ _id: done.book }, { $inc: { stock: done.quantity } });
      }
      return false;
    }
    applied.push(item);
  }
  return true;
}

router.post("/paypal/create", async (req, res) => {
  if (!mongoose.isValidObjectId(req.body.orderId)) {
    return res.status(404).json({ message: "Pedido no encontrado" });
  }
  const order = await Order.findById(req.body.orderId);
  if (!order || order.user.toString() !== req.user.id) {
    return res.status(404).json({ message: "Pedido no encontrado" });
  }
  if (order.paymentStatus !== "pendiente") {
    return res.status(409).json({ message: "El pedido no está pendiente de pago" });
  }

  try {
    const paypalOrder = await createPaypalOrder(order.total);
    order.paypalOrderId = paypalOrder.id;
    await order.save();
    await Payment.create({
      orderId: order._id,
      provider: "paypal",
      providerOrderId: paypalOrder.id,
      amount: order.total,
      status: "pendiente",
    });
    return res.status(201).json({ paypalOrderId: paypalOrder.id });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ message: "No se pudo crear el pago en PayPal" });
  }
});

router.post("/paypal/capture", async (req, res) => {
  if (!mongoose.isValidObjectId(req.body.orderId)) {
    return res.status(404).json({ message: "Pedido no encontrado" });
  }

  const current = await Order.findById(req.body.orderId);
  if (!current || current.user.toString() !== req.user.id) {
    return res.status(404).json({ message: "Pedido no encontrado" });
  }
  if (current.paymentStatus === "pagado") {
    await current.populate("user", "name email");
    return res.json({ order: current });
  }
  if (current.paymentStatus !== "pendiente") {
    return res.status(409).json({ message: "El pedido no admite pago" });
  }

  const locked = await Order.findOneAndUpdate(
    {
      _id: current._id,
      user: req.user.id,
      paymentStatus: "pendiente",
      capturing: { $ne: true },
    },
    { $set: { capturing: true } },
    { new: true }
  );
  if (!locked) {
    return res.status(409).json({ message: "El pago ya se está procesando" });
  }
  if (!locked.paypalOrderId) {
    locked.capturing = false;
    await locked.save();
    return res.status(400).json({ message: "Primero inicia el pago con PayPal" });
  }

  const payment = await Payment.findOne({
    orderId: locked._id,
    providerOrderId: locked.paypalOrderId,
  });

  let paypalData;
  try {
    paypalData = await capturePaypalOrder(locked.paypalOrderId);
  } catch (error) {
    console.error(error);
    locked.capturing = false;
    await locked.save();
    if (payment) {
      payment.status = "rechazado";
      await payment.save();
    }
    return res.status(502).json({ message: "PayPal no pudo capturar el pago" });
  }

  const details = captureDetails(paypalData);
  const amountMatches =
    paypalData.status === "COMPLETED" &&
    details?.status === "COMPLETED" &&
    details.currency === "USD" &&
    toCents(details.value) === toCents(locked.total);

  if (!amountMatches) {
    if (payment) {
      payment.status = "rechazado";
      payment.captureId = details?.id || "";
      await payment.save();
    }
    locked.capturing = false;
    await locked.save();
    return res.status(400).json({ message: "La captura de PayPal no coincide con el total del pedido" });
  }

  const decremented = await decrementStock(locked.items);
  if (!decremented) {
    if (payment) {
      payment.status = "rechazado";
      payment.captureId = details.id;
      payment.amount = locked.total;
      await payment.save();
    } else {
      await Payment.create({
        orderId: locked._id,
        provider: "paypal",
        providerOrderId: locked.paypalOrderId,
        captureId: details.id,
        amount: locked.total,
        status: "rechazado",
      });
    }
    locked.paymentStatus = "fallido";
    locked.capturing = false;
    await locked.save();
    return res.status(409).json({ message: "No hay licencias suficientes para completar el pedido" });
  }

  if (payment) {
    payment.status = "completado";
    payment.captureId = details.id;
    payment.amount = locked.total;
    await payment.save();
  } else {
    await Payment.create({
      orderId: locked._id,
      provider: "paypal",
      providerOrderId: locked.paypalOrderId,
      captureId: details.id,
      amount: locked.total,
      status: "completado",
    });
  }

  locked.paymentStatus = "pagado";
  locked.shippingStatus = "pendiente";
  locked.capturing = false;
  await locked.save();

  const populated = await Order.findById(locked._id).populate("user", "name email");
  broadcastOrder(req.app.get("io"), populated);
  return res.json({ order: populated });
});

export default router;
