import { Router } from 'express';
import { prisma } from '../prisma.js';
import { ok, fail } from '../utils.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const r = Router();

r.use(requireAuth, requireAdmin);

r.get('/marcas', async (_req, res) => {
  try {
    const marcas = await prisma.marcaVehiculo.findMany({
      include: { _count: { select: { modelos: true, vehiculos: true } } },
      orderBy: { nombre: 'asc' },
    });

    return ok(res, marcas.map((item) => ({
      id: item.idMarca,
      nombre: item.nombre,
      modelos: item._count.modelos,
      vehiculos: item._count.vehiculos,
    })));
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.post('/marcas', async (req, res) => {
  try {
    const nombre = (req.body.nombre || req.body.Nombre || '').trim();
    if (!nombre) return fail(res, 'El nombre de la marca es obligatorio');

    const existing = await prisma.marcaVehiculo.findFirst({ where: { nombre } });
    if (existing) return fail(res, 'La marca ya existe', 409);

    const created = await prisma.marcaVehiculo.create({ data: { nombre } });
    return ok(res, { id: created.idMarca, nombre: created.nombre }, 201);
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.put('/marcas/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const nombre = (req.body.nombre || req.body.Nombre || '').trim();
    if (!id) return fail(res, 'Marca inválida');
    if (!nombre) return fail(res, 'El nombre de la marca es obligatorio');

    const existing = await prisma.marcaVehiculo.findUnique({ where: { idMarca: id } });
    if (!existing) return fail(res, 'Marca no encontrada', 404);

    const duplicate = await prisma.marcaVehiculo.findFirst({ where: { nombre, NOT: { idMarca: id } } });
    if (duplicate) return fail(res, 'Ya existe otra marca con ese nombre', 409);

    const updated = await prisma.marcaVehiculo.update({ where: { idMarca: id }, data: { nombre } });
    return ok(res, { id: updated.idMarca, nombre: updated.nombre });
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.delete('/marcas/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.marcaVehiculo.findUnique({ where: { idMarca: id }, include: { _count: { select: { modelos: true, vehiculos: true } } } });
    if (!existing) return fail(res, 'Marca no encontrada', 404);
    if (existing._count.modelos > 0 || existing._count.vehiculos > 0) {
      return fail(res, 'No puedes eliminar una marca con modelos o vehículos asociados', 409);
    }

    await prisma.marcaVehiculo.delete({ where: { idMarca: id } });
    return ok(res, { message: 'Marca eliminada correctamente' });
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.get('/modelos', async (req, res) => {
  try {
    const marcaId = Number(req.query.marcaId);
    const modelos = await prisma.modeloVehiculo.findMany({
      where: Number.isFinite(marcaId) && marcaId > 0 ? { idMarca: marcaId } : undefined,
      include: { marca: true, _count: { select: { vehiculos: true } } },
      orderBy: [{ marca: { nombre: 'asc' } }, { nombre: 'asc' }, { anio: 'desc' }],
    });

    return ok(res, modelos.map((item) => ({
      id: item.idmodelo,
      nombre: item.nombre,
      anio: item.anio,
      idMarca: item.idMarca,
      marca: item.marca ? { id: item.marca.idMarca, nombre: item.marca.nombre } : null,
      vehiculos: item._count.vehiculos,
    })));
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.post('/modelos', async (req, res) => {
  try {
    const idMarca = Number(req.body.idMarca || req.body.IDMarca);
    const nombre = (req.body.nombre || req.body.Nombre || '').trim();
    const anio = Number(req.body.anio || req.body.Anio);

    if (!idMarca) return fail(res, 'Debes seleccionar una marca');
    if (!nombre) return fail(res, 'El nombre del modelo es obligatorio');
    if (!anio) return fail(res, 'Debes indicar un año válido');

    const marca = await prisma.marcaVehiculo.findUnique({ where: { idMarca } });
    if (!marca) return fail(res, 'La marca seleccionada no existe', 404);

    const duplicate = await prisma.modeloVehiculo.findFirst({ where: { idMarca, nombre, anio } });
    if (duplicate) return fail(res, 'Ese modelo ya existe para la marca y año indicados', 409);

    const created = await prisma.modeloVehiculo.create({ data: { idMarca, nombre, anio } });
    return ok(res, { id: created.idmodelo, idMarca: created.idMarca, nombre: created.nombre, anio: created.anio }, 201);
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.put('/modelos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const idMarca = Number(req.body.idMarca || req.body.IDMarca);
    const nombre = (req.body.nombre || req.body.Nombre || '').trim();
    const anio = Number(req.body.anio || req.body.Anio);

    if (!id) return fail(res, 'Modelo inválido');
    if (!idMarca) return fail(res, 'Debes seleccionar una marca');
    if (!nombre) return fail(res, 'El nombre del modelo es obligatorio');
    if (!anio) return fail(res, 'Debes indicar un año válido');

    const existing = await prisma.modeloVehiculo.findUnique({ where: { idmodelo: id } });
    if (!existing) return fail(res, 'Modelo no encontrado', 404);

    const duplicate = await prisma.modeloVehiculo.findFirst({ where: { idMarca, nombre, anio, NOT: { idmodelo: id } } });
    if (duplicate) return fail(res, 'Ya existe otro modelo igual para esa marca y año', 409);

    const updated = await prisma.modeloVehiculo.update({ where: { idmodelo: id }, data: { idMarca, nombre, anio } });
    return ok(res, { id: updated.idmodelo, idMarca: updated.idMarca, nombre: updated.nombre, anio: updated.anio });
  } catch (error) {
    return fail(res, error, 500);
  }
});

r.delete('/modelos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.modeloVehiculo.findUnique({ where: { idmodelo: id }, include: { _count: { select: { vehiculos: true } } } });
    if (!existing) return fail(res, 'Modelo no encontrado', 404);
    if (existing._count.vehiculos > 0) return fail(res, 'No puedes eliminar un modelo asociado a vehículos', 409);

    await prisma.modeloVehiculo.delete({ where: { idmodelo: id } });
    return ok(res, { message: 'Modelo eliminado correctamente' });
  } catch (error) {
    return fail(res, error, 500);
  }
});

export default r;