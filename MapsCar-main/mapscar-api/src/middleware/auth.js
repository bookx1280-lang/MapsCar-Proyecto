import jwt from "jsonwebtoken";
import { fail } from "../utils.js";

export function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return fail(res, "Token no proporcionado", 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return fail(res, "Token inválido o expirado", 401);
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return fail(res, "No autenticado", 401);
  if (Number(req.user.Rol) !== 1) return fail(res, "Acceso solo para administradores", 403);
  next();
}
