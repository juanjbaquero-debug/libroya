import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { cleanText, isEmail } from "../utils.js";

const router = Router();

router.post("/register", async (req, res) => {
  const name = cleanText(req.body.name, 80);
  const email = cleanText(req.body.email, 120).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (name.length < 2) {
    return res.status(400).json({ message: "Escribe tu nombre" });
  }
  if (!isEmail(email)) {
    return res.status(400).json({ message: "El correo no es válido" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "Ese correo ya está registrado" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: "cliente" });
  const token = signToken(user);
  return res.status(201).json({ token, user });
});

router.post("/login", async (req, res) => {
  const email = cleanText(req.body.email, 120).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Correo o contraseña incorrectos" });
  }
  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: "Correo o contraseña incorrectos" });
  }
  const token = signToken(user);
  return res.json({ token, user });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(401).json({ message: "No autorizado" });
  }
  return res.json({ user });
});

export default router;
