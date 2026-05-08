import { Router } from "express";
import { prisma } from "../prisma.js";
import { ok, fail } from "../utils.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { listStations, getStationById } from "../services/gasolineras.js";

const r = Router();

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined) return value;
  }
  return undefined;
}

function normalizeStationBody(body = {}) {
  return {
    nombre: pickFirst(body.nombre, body.Nombre),
    imagen: pickFirst(body.imagen, body.Imagen),
    domicilio: pickFirst(body.domicilio, body.Domicilio),
    latitud: pickFirst(body.latitud, body.Latitud, body.lat),
    longitud: pickFirst(body.longitud, body.Longitud, body.lng, body.long),
    idEstado: pickFirst(body.idEstado, body.IDEstado),
    idMunicipio: pickFirst(body.idMunicipio, body.IDMunicipio),
  };
}

r.get("/", async (req, res) => {
  try {
    const idTipo = req.query.idTipo ? Number(req.query.idTipo) : null;
    const idMarca = req.query.idMarca ? Number(req.query.idMarca) : null;
    const idModelo = req.query.idModelo ? Number(req.query.idModelo) : null;

    const stations = await listStations({ idTipo, idMarca, idModelo });
    return ok(res, stations);
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.get("/:id", async (req, res) => {
  try {
    const idTipo = req.query.idTipo ? Number(req.query.idTipo) : null;
    const idMarca = req.query.idMarca ? Number(req.query.idMarca) : null;
    const idModelo = req.query.idModelo ? Number(req.query.idModelo) : null;

    const station = await getStationById(req.params.id, { idTipo, idMarca, idModelo }); if (!station) return fail(res, "Gasolinera no encontrada", 404);
    return ok(res, station);
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = normalizeStationBody(req.body);

    if (!data.nombre) return fail(res, "El nombre es obligatorio");
    if (data.latitud == null || data.longitud == null) {
      return fail(res, "Latitud y longitud son obligatorias");
    }

    const created = await prisma.gasolinera.create({
      data: {
        nombre: data.nombre,
        imagen: data.imagen,
        domicilio: data.domicilio,
        latitud: String(data.latitud),
        longitud: String(data.longitud),
        idEstado: data.idEstado ? Number(data.idEstado) : null,
        idMunicipio: data.idMunicipio ? Number(data.idMunicipio) : null,
      },
    });

    const station = await getStationById(created.idgasolinera);
    return ok(res, { message: "Gasolinera creada correctamente", station }, 201);
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.gasolinera.findUnique({
      where: { idgasolinera: id },
    });

    if (!exist) return fail(res, "Gasolinera no encontrada", 404);

    const data = normalizeStationBody(req.body);

    await prisma.gasolinera.update({
      where: { idgasolinera: id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.imagen !== undefined && { imagen: data.imagen || null }),
        ...(data.domicilio !== undefined && { domicilio: data.domicilio || null }),
        ...(data.latitud !== undefined && {
          latitud:
            data.latitud == null || data.latitud === ""
              ? null
              : String(data.latitud),
        }),
        ...(data.longitud !== undefined && {
          longitud:
            data.longitud == null || data.longitud === ""
              ? null
              : String(data.longitud),
        }),
        ...(data.idEstado !== undefined && {
          idEstado: data.idEstado ? Number(data.idEstado) : null,
        }),
        ...(data.idMunicipio !== undefined && {
          idMunicipio: data.idMunicipio ? Number(data.idMunicipio) : null,
        }),
      },
    });

    const station = await getStationById(id);
    return ok(res, { message: "Gasolinera actualizada correctamente", station });
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.gasolinera.findUnique({
      where: { idgasolinera: id },
    });

    if (!exist) return fail(res, "Gasolinera no encontrada", 404);

    await prisma.puntuacionVehiculo.deleteMany({ where: { idgasolinera: id } });
    await prisma.puntuacion.deleteMany({ where: { idgasolinera: id } });
    await prisma.gasolinera.delete({ where: { idgasolinera: id } });

    return ok(res, { message: "Gasolinera eliminada correctamente" });
  } catch (error) {
    return fail(res, error, 500);
  }
});

export default r;