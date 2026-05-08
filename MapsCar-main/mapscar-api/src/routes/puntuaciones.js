import { Router } from "express";
import { prisma } from "../prisma.js";
import { ok, fail } from "../utils.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { getStationById } from "../services/gasolineras.js";

const r = Router();

r.get('/admin', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const reviews = await prisma.puntuacion.findMany({
      include: {
        usuario: { include: { rol: true } },
        gasolinera: true,
        puntuacionVehiculos: {
          include: {
            vehiculo: { include: { tipo: true, marca: true, modelo: true } },
          },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    return ok(res, reviews.map((item) => ({
      id: item.idpuntuacion,
      puntuacion: item.puntuacion,
      comentario: item.comentario,
      fecha: item.fecha,
      estatus: item.estatus,
      usuario: item.usuario ? {
        idusuario: item.usuario.idusuario,
        username: item.usuario.username,
        nombre: item.usuario.nombre,
        correo: item.usuario.correo,
        rol: item.usuario.rol?.nombre || null,
      } : null,
      gasolinera: item.gasolinera ? {
        id: item.gasolinera.idgasolinera,
        nombre: item.gasolinera.nombre,
      } : null,
      vehiculo: item.puntuacionVehiculos[0]?.vehiculo ? {
        id: item.puntuacionVehiculos[0].vehiculo.idvehiculo,
        tipo: item.puntuacionVehiculos[0].vehiculo.tipo?.nombre || null,
        marca: item.puntuacionVehiculos[0].vehiculo.marca?.nombre || null,
        modelo: item.puntuacionVehiculos[0].vehiculo.modelo?.nombre || null,
        anio: item.puntuacionVehiculos[0].vehiculo.modelo?.anio || null,
      } : null,
    })));
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.post('/', requireAuth, async (req, res) => {
  try {
    const idgasolinera = Number(req.body.idgasolinera ?? req.body.IDgasolinera);
    const puntuacion = Number(req.body.puntuacion ?? req.body.Puntuacion);
    const comentario = req.body.comentario ?? req.body.Comentario ?? null;
    const idvehiculoBody = req.body.idvehiculo ?? req.body.IDvehiculo;

    if (!idgasolinera) return fail(res, 'Debes indicar una gasolinera');
    if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
      return fail(res, 'La puntuación debe estar entre 1 y 5');
    }

    let idvehiculo = idvehiculoBody ? Number(idvehiculoBody) : null;

    if (!idvehiculo) {
      const firstVehicle = await prisma.usuarioVehiculo.findFirst({ where: { idusuario: req.user.IDusuario } });
      if (!firstVehicle) return fail(res, 'Debes registrar un vehículo antes de puntuar una gasolinera', 400);
      idvehiculo = firstVehicle.idvehiculo;
    }

    const relation = await prisma.usuarioVehiculo.findUnique({
      where: {
        idusuario_idvehiculo: {
          idusuario: req.user.IDusuario,
          idvehiculo,
        },
      },
    });

    if (!relation) return fail(res, 'El vehículo seleccionado no pertenece al usuario autenticado', 403);

    const created = await prisma.puntuacion.create({
      data: {
        idgasolinera,
        idusuario: req.user.IDusuario,
        puntuacion,
        comentario,
        estatus: 1,
      },
    });

    await prisma.puntuacionVehiculo.create({
      data: {
        idpuntuacion: created.idpuntuacion,
        idvehiculo,
        idgasolinera,
      },
    });

    const station = await getStationById(idgasolinera);
    return ok(res, { message: 'Evaluación guardada correctamente', station }, 201);
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.puntuacion.findUnique({
      where: { idpuntuacion: id },
    });

    if (!exist) return fail(res, 'Puntuación no encontrada', 404);

    const isAdmin = Number(req.user?.IDrol) === 1;
    const isOwner = String(exist.idusuario) === String(req.user?.IDusuario);

    if (!isAdmin && !isOwner) {
      return fail(res, 'No tienes permiso para eliminar este comentario', 403);
    }

    await prisma.puntuacion.update({
      where: { idpuntuacion: id },
      data: { estatus: 0 },
    });

    return ok(res, { message: 'Comentario eliminado correctamente' });
  } catch (error) {
    return fail(res, error, 500);
  }
});

export default r;
