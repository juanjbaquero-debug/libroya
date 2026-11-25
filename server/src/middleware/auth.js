import jwt from "jsonwebtoken";

function readUser(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  return { id: payload.sub, role: payload.role, email: payload.email };
}

export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return res.status(401).json({ message: "No autorizado" });
  }
  try {
    req.user = readUser(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return next();
  try {
    req.user = readUser(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: "No tienes permiso para esta acción" });
    }
    return next();
  };
}

export function verifySocketToken(token) {
  return readUser(token);
}
