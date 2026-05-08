import { Router } from "express";
import { prisma } from "../prisma.js";
import { ok, fail } from "../utils.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

function normalize(body = {}) {
  return {
    idtipo: body.idtipo ?? body.IDtipo ?? body.tipoId,
    idMarca: body.idMarca ?? body.IDMarca ?? body.marcaId,
    idmodelo: body.idmodelo ?? body.IDmodelo ?? body.modeloId,
    color: body.color ?? body.Color ?? null,
    alias: body.alias ?? body.Alias ?? null,
    rendimientoEstimado: body.rendimientoEstimado ?? body.Rendimiento_estimado ?? null,
  };
}

function formatUserVehicle(item) {
  return {
    idvehiculo: item.idvehiculo,
    alias: item.alias,
    color: item.color,
    rendimientoEstimado:
      item.vehiculo.rendimientoEstimado == null
        ? null
        : Number(item.vehiculo.rendimientoEstimado),
    tipo: item.vehiculo.tipo
      ? { id: item.vehiculo.tipo.idtipo, nombre: item.vehiculo.tipo.nombre }
      : null,
    marca: item.vehiculo.marca
      ? { id: item.vehiculo.marca.idMarca, nombre: item.vehiculo.marca.nombre }
      : null,
    modelo: item.vehiculo.modelo
      ? {
          id: item.vehiculo.modelo.idmodelo,
          idMarca: item.vehiculo.modelo.idMarca,
          nombre: item.vehiculo.modelo.nombre,
          anio: item.vehiculo.modelo.anio,
        }
      : null,
  };
}

r.get('/mis-vehiculos', requireAuth, async (req, res) => {
  try {
    const items = await prisma.usuarioVehiculo.findMany({
      where: { idusuario: req.user.IDusuario },
      include: {
        vehiculo: {
          include: {
            tipo: true,
            marca: true,
            modelo: true,
          },
        },
      },
      orderBy: { alias: 'asc' },
    });

    return ok(res, items.map(formatUserVehicle));
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.post('/mis-vehiculos', requireAuth, async (req, res) => {
  try {
    const data = normalize(req.body);
    if (!data.idtipo) return fail(res, 'Debes seleccionar un tipo de vehículo');
    if (!data.idMarca) return fail(res, 'Debes seleccionar una marca');
    if (!data.idmodelo) return fail(res, 'Debes seleccionar un modelo');

    const modelo = await prisma.modeloVehiculo.findUnique({
      where: { idmodelo: Number(data.idmodelo) }
    });

    if (!modelo) return fail(res, 'El modelo seleccionado no existe');
    if (Number(modelo.idMarca) !== Number(data.idMarca)) {
      return fail(res, 'El modelo seleccionado no pertenece a la marca elegida');
    }

    const created = await prisma.vehiculo.create({
      data: {
        idtipo: Number(data.idtipo),
        idMarca: Number(data.idMarca),
        idmodelo: Number(data.idmodelo),
        rendimientoEstimado:
          data.rendimientoEstimado == null || data.rendimientoEstimado === ''
            ? null
            : String(data.rendimientoEstimado),
      },
    });

    await prisma.usuarioVehiculo.create({
      data: {
        idusuario: req.user.IDusuario,
        idvehiculo: created.idvehiculo,
        color: data.color,
        alias: data.alias,
      },
    });

    const vehicle = await prisma.usuarioVehiculo.findUnique({
      where: {
        idusuario_idvehiculo: {
          idusuario: req.user.IDusuario,
          idvehiculo: created.idvehiculo,
        },
      },
      include: {
        vehiculo: {
          include: {
            tipo: true,
            marca: true,
            modelo: true,
          },
        },
      },
    });

    return ok(res, {
      message: 'Vehículo guardado correctamente',
      vehicle: formatUserVehicle(vehicle),
    }, 201);
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.put('/mis-vehiculos/:idvehiculo', requireAuth, async (req, res) => {
  try {
    const idvehiculo = Number(req.params.idvehiculo);

    if (!idvehiculo) {
      return fail(res, 'ID de vehículo inválido', 400);
    }

    const relation = await prisma.usuarioVehiculo.findUnique({
      where: {
        idusuario_idvehiculo: {
          idusuario: req.user.IDusuario,
          idvehiculo,
        },
      },
      include: {
        vehiculo: {
          include: {
            tipo: true,
            marca: true,
            modelo: true,
          },
        },
      },
    });

    if (!relation) {
      return fail(res, 'Vehículo no encontrado', 404);
    }

    const data = normalize(req.body);

    if (data.idmodelo || data.idMarca) {
      const nextModelId = data.idmodelo ? Number(data.idmodelo) : relation.vehiculo.idmodelo;
      const nextBrandId = data.idMarca ? Number(data.idMarca) : relation.vehiculo.idMarca;

      const modelo = await prisma.modeloVehiculo.findUnique({
        where: { idmodelo: Number(nextModelId) },
      });

      if (!modelo) return fail(res, 'El modelo seleccionado no existe');
      if (Number(modelo.idMarca) !== Number(nextBrandId)) {
        return fail(res, 'El modelo seleccionado no pertenece a la marca elegida');
      }
    }

    await prisma.vehiculo.update({
      where: { idvehiculo },
      data: {
        ...(data.idtipo !== undefined && { idtipo: Number(data.idtipo) }),
        ...(data.idMarca !== undefined && { idMarca: Number(data.idMarca) }),
        ...(data.idmodelo !== undefined && { idmodelo: Number(data.idmodelo) }),
        ...(data.rendimientoEstimado !== undefined && {
          rendimientoEstimado:
            data.rendimientoEstimado == null || data.rendimientoEstimado === ''
              ? null
              : String(data.rendimientoEstimado),
        }),
      },
    });

    await prisma.usuarioVehiculo.update({
      where: {
        idusuario_idvehiculo: {
          idusuario: req.user.IDusuario,
          idvehiculo,
        },
      },
      data: {
        ...(data.color !== undefined && { color: data.color }),
        ...(data.alias !== undefined && { alias: data.alias }),
      },
    });

    const updated = await prisma.usuarioVehiculo.findUnique({
      where: {
        idusuario_idvehiculo: {
          idusuario: req.user.IDusuario,
          idvehiculo,
        },
      },
      include: {
        vehiculo: {
          include: {
            tipo: true,
            marca: true,
            modelo: true,
          },
        },
      },
    });

    return ok(res, {
      message: 'Vehículo actualizado correctamente',
      vehicle: formatUserVehicle(updated),
    });
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.delete('/mis-vehiculos/:idvehiculo', requireAuth, async (req, res) => {
  try {
    const idvehiculo = Number(req.params.idvehiculo);

    if (!idvehiculo) {
      return fail(res, 'ID de vehículo inválido', 400);
    }

    const relation = await prisma.usuarioVehiculo.findUnique({
      where: {
        idusuario_idvehiculo: {
          idusuario: req.user.IDusuario,
          idvehiculo,
        },
      },
      include: {
        vehiculo: true,
      },
    });

    if (!relation) {
      return fail(res, 'Vehículo no encontrado', 404);
    }

    await prisma.usuarioVehiculo.delete({
      where: {
        idusuario_idvehiculo: {
          idusuario: req.user.IDusuario,
          idvehiculo,
        },
      },
    });

    await prisma.vehiculo.delete({
      where: {
        idvehiculo,
      },
    });

    return ok(res, { message: 'Vehículo eliminado correctamente' });
  } catch (error) {
    return fail(res, error, 500);
  }
});

export default r;