import { Router } from "express";
import mongoose from "mongoose";
import { Book } from "../models/Book.js";
import { Order } from "../models/Order.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { broadcastOrder } from "../socket.js";
import { cleanText, isEmail, roundMoney } from "../utils.js";

const router = Router();
const SHIPPING_STATUSES = ["pendiente", "procesando", "enviado", "entregado"];

function normalizeShipping(raw, deliveryType) {
  const source = raw && typeof raw === "object" ? raw : {};
  const shipping = {
    name: cleanText(source.name, 80),
    email: cleanText(source.email, 120).toLowerCase(),
    phone: cleanText(source.phone, 30),
    address: cleanText(source.address, 160),
    city: cleanText(source.city, 80),
  };
  if (shipping.name.length < 2 || !isEmail(shipping.email)) return null;
  if (deliveryType === "fisica" && (!shipping.phone || !shipping.address || !shipping.city)) {
    return null;
  }
  return shipping;
}

async function loadOwned(req, id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const order = await Order.findById(id);
  if (!order) return null;
  const ownerId = order.user.toString();
  if (req.user.role !== "admin" && ownerId !== req.user.id) return null;
  return order;
}

router.use(requireAuth);

router.post("/", async (req, res) => {
  const itemsInput = Array.isArray(req.body.items) ? req.body.items : [];
  if (itemsInput.length === 0 || itemsInput.length > 30) {
    return res.status(400).json({ message: "El pedido no tiene libros válidos" });
  }

  const deliveryType = req.body.deliveryType;
  if (deliveryType !== "digital" && deliveryType !== "fisica") {
    return res.status(400).json({ message: "Elige entrega digital o física" });
  }

  const shipping = normalizeShipping(req.body.shipping, deliveryType);
  if (!shipping) {
    return res.status(400).json({ message: "Completa los datos de entrega" });
  }

  const qtyById = new Map();
  for (const raw of itemsInput) {
    const id = String(raw?.bookId || "");
    const quantity = Number(raw?.quantity);
    if (!mongoose.isValidObjectId(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ message: "Cantidad o libro inválido" });
    }
    qtyById.set(id, (qtyById.get(id) || 0) + quantity);
    if (qtyById.get(id) > 20) {
      return res.status(400).json({ message: "La cantidad máxima por libro es 20" });
    }
  }

  const books = await Book.find({ _id: { $in: [...qtyById.keys()] }, active: true });
  if (books.length !== qtyById.size) {
    return res.status(400).json({ message: "Hay libros que ya no están disponibles" });
  }

  const items = [];
  let total = 0;
  for (const book of books) {
    const quantity = qtyById.get(book._id.toString());
    if (book.stock < quantity) {
      return res.status(409).json({ message: `No hay licencias suficientes de «${book.title}»` });
    }
    items.push({
      book: book._id,
      title: book.title,
      price: book.price,
      quantity,
    });
    total += book.price * quantity;
  }

  const order = await Order.create({
    user: req.user.id,
    items,
    total: roundMoney(total),
    deliveryType,
    shipping,
    paymentStatus: "pendiente",
    shippingStatus: "pendiente",
  });

  res.status(201).json(order);
});

router.get("/", async (req, res) => {
  const ownOnly = req.user.role !== "admin" || req.query.mine === "1";
  const filter = ownOnly ? { user: req.user.id } : {};
  if (req.query.paid === "1") filter.paymentStatus = "pagado";
  const orders = await Order.find(filter).populate("user", "name email").sort({ createdAt: -1 }).limit(100);
  res.json(orders);
});

router.get("/:id", async (req, res) => {
  const order = await loadOwned(req, req.params.id);
  if (!order) return res.status(404).json({ message: "Pedido no encontrado" });
  await order.populate("user", "name email");
  res.json(order);
});

router.patch("/:id/shipping-status", requireRole("admin"), async (req, res) => {
  const shippingStatus = req.body.shippingStatus;
  if (!SHIPPING_STATUSES.includes(shippingStatus)) {
    return res.status(400).json({ message: "Estado de envío no válido" });
  }
  const order = await loadOwned(req, req.params.id);
  if (!order) return res.status(404).json({ message: "Pedido no encontrado" });
  if (order.paymentStatus !== "pagado") {
    return res.status(409).json({ message: "Solo se gestionan envíos de pedidos pagados" });
  }
  order.shippingStatus = shippingStatus;
  await order.save();
  await order.populate("user", "name email");
  broadcastOrder(req.app.get("io"), order);
  res.json(order);
});

export default router;
