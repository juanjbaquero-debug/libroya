import { verifySocketToken } from "./middleware/auth.js";

export function initSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No autorizado"));
      socket.user = verifySocketToken(token);
      return next();
    } catch {
      return next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);
    if (socket.user.role === "admin") {
      socket.join("admin");
    }
  });
}

export function broadcastOrder(io, order) {
  if (!io || !order) return;
  const plain = typeof order.toJSON === "function" ? order.toJSON() : order;
  const userId = String(plain.user?._id || plain.user);
  io.to(`user:${userId}`).to("admin").emit("order:updated", plain);
}
