import { Router } from "express";
import { prisma } from "../prisma.js";
import { ok, fail } from "../utils.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { verifyTurnstileToken } from "../utils/verifyTurnstile.js";

const r = Router();

function generarIDusuario() {
  return crypto.randomBytes(8).toString("hex");
}

r.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = await prisma.usuario.findMany({
      orderBy: { username: "asc" },
      include: { rol: true },
    });

    return ok(res, rows.map((u) => ({
      IDusuario: u.idusuario,
      Username: u.username,
      Nombre: u.nombre,
      Apellido_Paterno: u.apellidoPaterno,
      Apellido_Materno: u.apellidoMaterno,
      Correo: u.correo,
      Estatus: u.estatus,
      IDrol: u.idrol,
      RolNombre: u.rol?.nombre || null,
    })));
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.post("/", async (req, res) => {
  try {
    const Username = req.body.Username || req.body.username;
    const Nombre = req.body.Nombre || req.body.nombre;
    const Apellido_Paterno = req.body.Apellido_Paterno || req.body.apellido_paterno || req.body.apellidoPaterno;
    const Apellido_Materno = req.body.Apellido_Materno || req.body.apellido_materno || req.body.apellidoMaterno;
    const Correo = req.body.Correo || req.body.correo;
    const Contrasena = req.body.Contrasena || req.body.contrasena;
    const IDrol = req.body.IDrol || req.body.idrol || 2;
    const turnstileToken = req.body.turnstileToken;

    const letras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/;
    const usernameRegex = /^[A-Za-z0-9._-]+$/;
    const correoRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;
    const passRegex = /^(?=.*[A-Z]).{10,}$/;

    if (!turnstileToken) return fail(res, "Completa la verificación de seguridad");

    const verification = await verifyTurnstileToken(turnstileToken, req.ip);

    if (!verification.success) {
      return fail(res, "No se pudo validar la verificación de seguridad", 400);
    }

    if (!Username) return fail(res, "Username es obligatorio");
    if (Username.length > 40) return fail(res, "Username no puede superar 40 caracteres");
    if (!usernameRegex.test(Username)) return fail(res, "Username contiene caracteres inválidos");

    const dupUser = await prisma.usuario.findUnique({ where: { username: Username } });
    if (dupUser) return fail(res, "El Username ya está en uso", 409);

    if (!Nombre) return fail(res, "El nombre es obligatorio");
    if (Nombre.length > 40 || !letras.test(Nombre)) return fail(res, "Nombre inválido");
    if (Apellido_Paterno && (Apellido_Paterno.length > 50 || !letras.test(Apellido_Paterno))) return fail(res, "Apellido paterno inválido");
    if (Apellido_Materno && (Apellido_Materno.length > 50 || !letras.test(Apellido_Materno))) return fail(res, "Apellido materno inválido");
    if (!Correo || !correoRegex.test(Correo)) return fail(res, "Correo inválido");

    const dupCorreo = await prisma.usuario.findUnique({ where: { correo: Correo.toLowerCase() } });
    if (dupCorreo) return fail(res, "El correo ya está registrado", 409);

    if (!Contrasena) return fail(res, "La contraseña es obligatoria");
    if (!passRegex.test(Contrasena)) return fail(res, "La contraseña debe tener mínimo 10 caracteres y 1 mayúscula");

    const hashedPassword = await bcrypt.hash(Contrasena, 10);
    const user = await prisma.usuario.create({
      data: {
        idusuario: generarIDusuario(),
        username: Username,
        nombre: Nombre,
        apellidoPaterno: Apellido_Paterno || null,
        apellidoMaterno: Apellido_Materno || null,
        correo: Correo.toLowerCase(),
        contrasena: hashedPassword,
        estatus: 1,
        idrol: Number(IDrol),
      },
    });

    return ok(res, { message: "Usuario creado correctamente", IDusuario: user.idusuario }, 201);
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.delete("/:idusuario", requireAuth, requireAdmin, async (req, res) => {
  try {
    const idusuario = req.params.idusuario;

    const user = await prisma.usuario.findUnique({
      where: { idusuario },
    });

    if (!user) {
      return fail(res, "Usuario no encontrado", 404);
    }

    if (req.user?.IDusuario === idusuario) {
      return fail(res, "No puedes eliminar tu propio usuario", 400);
    }

    await prisma.usuario.delete({
      where: { idusuario },
    });

    return ok(res, { message: "Usuario eliminado correctamente" });
  } catch (error) {
    return fail(res, error, 500);
  }
});

export default r;