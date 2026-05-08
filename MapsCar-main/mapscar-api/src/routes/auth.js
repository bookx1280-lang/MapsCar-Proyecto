import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../prisma.js";
import { ok, fail } from "../utils.js";
import { verifyTurnstileToken } from "../utils/verifyTurnstile.js";


const r = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

r.post("/login", async (req, res) => {
  try {
    const loginValue = req.body.Username || req.body.username || req.body.Correo || req.body.correo;
    const password = req.body.Contrasena || req.body.contrasena;
    const turnstileToken = req.body.turnstileToken;

    if (!loginValue) return fail(res, "Debes proporcionar username o correo");
    if (!password) return fail(res, "La contraseña es obligatoria");
    //if (!turnstileToken) return fail(res, "Completa la verificación de seguridad");

    //const verification = await verifyTurnstileToken(turnstileToken, req.ip);

    //if (!verification.success) {
    //  return fail(res, "No se pudo validar la verificación de seguridad", 400);
    //}
    const user = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: loginValue },
          { correo: loginValue },
        ],
      },
      include: {
        rol: true,
      },
    });

    if (!user) return fail(res, "Usuario no encontrado", 404);

    const match = await bcrypt.compare(password, user.contrasena);
    if (!match) return fail(res, "Contraseña incorrecta", 401);

    if (user.estatus !== 1) {
      if (user.estatus === 2) {
        await prisma.usuario.update({ where: { idusuario: user.idusuario }, data: { estatus: 1 } });
        user.estatus = 1;
      } else {
        return fail(res, "Usuario inactivo", 403);
      }
    }

    const token = jwt.sign(
      {
        IDusuario: user.idusuario,
        Username: user.username,
        Correo: user.correo,
        Rol: user.idrol,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    return ok(res, {
      message: "Inicio de sesión exitoso",
      token,
      usuario: {
        IDusuario: user.idusuario,
        Username: user.username,
        Nombre: user.nombre,
        Apellido_Paterno: user.apellidoPaterno,
        Apellido_Materno: user.apellidoMaterno,
        Correo: user.correo,
        Estatus: user.estatus,
        IDrol: user.idrol,
        RolNombre: user.rol?.nombre || (user.idrol === 1 ? "Administrador" : "Usuario"),
      },
    });
  } catch (error) {
    return fail(res, error, 500);
  }
});


r.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return fail(res, "Credencial de Google no recibida", 400);
    }

    // Verificar token de Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const correo = payload.email;
    const nombre = payload.name;

    // Buscar usuario por correo
    let user = await prisma.usuario.findFirst({
      where: { correo },
      include: { rol: true },
    });

    // Si no existe, crearlo
    if (!user) {
      user = await prisma.usuario.create({
        data: {
          idusuario: crypto.randomUUID(),
          username: correo,
          correo,
          nombre,
          contrasena: "google-login",
          estatus: 1,
          idrol: 2,
        },
        include: { rol: true },
      });
    }

    const token = jwt.sign(
      {
        IDusuario: user.idusuario,
        Username: user.username,
        Correo: user.correo,
        Rol: user.idrol,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    return ok(res, {
      message: "Inicio de sesión con Google exitoso",
      token,
      usuario: {
        IDusuario: user.idusuario,
        Username: user.username,
        Nombre: user.nombre,
        Correo: user.correo,
        IDrol: user.idrol,
        RolNombre:
          user.rol?.nombre ||
          (user.idrol === 1 ? "Administrador" : "Usuario"),
      },
    });
  } catch (error) {
    console.error(error);
    return fail(res, error, 500);
  }
});
export default r;