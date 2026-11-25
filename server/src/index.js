import "express-async-errors";
import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { loadEnv } from "./loadEnv.js";
import { connectDb } from "./db.js";
import { initSocket } from "./socket.js";
import authRoutes from "./routes/auth.js";
import bookRoutes from "./routes/books.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";

loadEnv();

const app = express();
const server = http.createServer(app);

const origins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: { origin: origins, credentials: true },
});

app.set("io", io);
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "No encontrado" });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Error interno del servidor" });
});

initSocket(io);

const port = Number(process.env.PORT) || 4000;

connectDb()
  .then(() => {
    if (!process.env.JWT_SECRET) {
      throw new Error("Falta JWT_SECRET");
    }
    server.listen(port, "0.0.0.0", () => {
      console.log(`LibroYa API en http://0.0.0.0:${port}`);
    });
  })
  .catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
