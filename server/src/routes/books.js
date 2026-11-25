import { Router } from "express";
import mongoose from "mongoose";
import { Book } from "../models/Book.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { cleanText, escapeRegex, parsePrice, parseStock } from "../utils.js";

const router = Router();

function bookPayload(body, { partial = false } = {}) {
  const title = cleanText(body.title, 160);
  const author = cleanText(body.author, 120);
  const description = cleanText(body.description, 4000);
  const category = cleanText(body.category, 80);
  const image = cleanText(body.image, 500);
  const price = parsePrice(body.price);
  const stock = parseStock(body.stock);
  const active = typeof body.active === "boolean" ? body.active : true;

  if (!partial) {
    if (!title || !author || !description || !category || price === null || stock === null) {
      return { error: "Completa título, autor, descripción, categoría, precio y stock" };
    }
  }

  const data = {};
  if (body.title !== undefined) data.title = title;
  if (body.author !== undefined) data.author = author;
  if (body.description !== undefined) data.description = description;
  if (body.category !== undefined) data.category = category;
  if (body.image !== undefined) data.image = image;
  if (body.price !== undefined) data.price = price;
  if (body.stock !== undefined) data.stock = stock;
  if (body.active !== undefined) data.active = active;

  if (body.price !== undefined && price === null) return { error: "El precio no es válido" };
  if (body.stock !== undefined && stock === null) return { error: "El stock no es válido" };
  if (!partial && (price === null || stock === null)) {
    return { error: "El precio o el stock no son válidos" };
  }
  return { data: partial ? data : { title, author, description, category, image, price, stock, active } };
}

router.get("/", optionalAuth, async (req, res) => {
  const filter = {};
  const includeInactive = req.query.includeInactive === "1" && req.user?.role === "admin";
  if (!includeInactive) filter.active = true;

  if (req.query.category) {
    filter.category = cleanText(String(req.query.category), 80);
  }
  if (req.query.q) {
    const q = escapeRegex(cleanText(String(req.query.q), 80));
    if (q) {
      filter.$or = [{ title: new RegExp(q, "i") }, { author: new RegExp(q, "i") }];
    }
  }

  const books = await Book.find(filter).sort({ createdAt: -1 });
  res.json(books);
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = bookPayload(req.body);
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const book = await Book.create(parsed.data);
  res.status(201).json(book);
});

router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Libro no encontrado" });
  }
  const book = await Book.findOne({ _id: req.params.id, active: true });
  if (!book) return res.status(404).json({ message: "Libro no encontrado" });
  res.json(book);
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Libro no encontrado" });
  }
  const parsed = bookPayload(req.body);
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const book = await Book.findByIdAndUpdate(req.params.id, parsed.data, { new: true, runValidators: true });
  if (!book) return res.status(404).json({ message: "Libro no encontrado" });
  res.json(book);
});

router.patch("/:id/stock", requireAuth, requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Libro no encontrado" });
  }
  const stock = parseStock(req.body.stock);
  if (stock === null) return res.status(400).json({ message: "El stock no es válido" });
  const book = await Book.findByIdAndUpdate(req.params.id, { stock }, { new: true });
  if (!book) return res.status(404).json({ message: "Libro no encontrado" });
  res.json(book);
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Libro no encontrado" });
  }
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) return res.status(404).json({ message: "Libro no encontrado" });
  res.json({ ok: true });
});

export default router;
