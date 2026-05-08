import { Router } from "express";
import { prisma } from "../prisma.js";
import { ok, fail } from "../utils.js";

const r = Router();

r.get("/vehiculos", async (req, res) => {
  try {
    const marcaId = Number(req.query.marcaId);

    const [tipos, marcas, modelos] = await Promise.all([
      prisma.tipoVehiculo.findMany({ orderBy: { nombre: "asc" } }),
      prisma.marcaVehiculo.findMany({ orderBy: { nombre: "asc" } }),
      prisma.modeloVehiculo.findMany({
        where: Number.isFinite(marcaId) && marcaId > 0 ? { idMarca: marcaId } : undefined,
        include: { marca: true },
        orderBy: [{ nombre: "asc" }, { anio: "desc" }],
      }),
    ]);

    return ok(res, {
      tipos: tipos.map((item) => ({ id: item.idtipo, nombre: item.nombre, imagen: item.imagen })),
      marcas: marcas.map((item) => ({ id: item.idMarca, nombre: item.nombre })),
      modelos: modelos.map((item) => ({
        id: item.idmodelo,
        idMarca: item.idMarca,
        nombre: item.nombre,
        anio: item.anio,
        marca: item.marca ? { id: item.marca.idMarca, nombre: item.marca.nombre } : null,
      })),
    });
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.get("/ubicaciones", async (_req, res) => {
  try {
    const estados = await prisma.estado.findMany({
      include: { municipios: { orderBy: { nombre: "asc" } } },
      orderBy: { nombre: "asc" },
    });

    return ok(res, estados.map((estado) => ({
      id: estado.idestado,
      nombre: estado.nombre,
      municipios: estado.municipios.map((m) => ({ id: m.idMunicipio, nombre: m.nombre })),
    })));
  } catch (error) {
    return fail(res, error, 500);
  }
});

export default r;
