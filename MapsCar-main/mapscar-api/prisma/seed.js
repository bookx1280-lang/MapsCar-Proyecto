import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertMany(entries, modelName, key) {
  for (const item of entries) {
    await prisma[modelName].upsert({
      where: { [key]: item[key] },
      update: item,
      create: item,
    });
  }
}

async function main() {
  await prisma.rol.upsert({
    where: { idrol: 1 },
    update: { nombre: 'Administrador' },
    create: { idrol: 1, nombre: 'Administrador' },
  });

  await prisma.rol.upsert({
    where: { idrol: 2 },
    update: { nombre: 'Usuario' },
    create: { idrol: 2, nombre: 'Usuario' },
  });

  const estado = await prisma.estado.upsert({
    where: { idestado: 1 },
    update: { nombre: 'Colima' },
    create: { idestado: 1, nombre: 'Colima' },
  });

  await prisma.municipio.upsert({
    where: { idMunicipio: 1 },
    update: { nombre: 'Colima', idEstado: estado.idestado },
    create: { idMunicipio: 1, nombre: 'Colima', idEstado: estado.idestado },
  });

  await upsertMany([
    { idtipo: 1, nombre: 'Sedán', imagen: 'car' },
    { idtipo: 2, nombre: 'SUV', imagen: 'car' },
    { idtipo: 3, nombre: 'Pickup', imagen: 'truck' },
    { idtipo: 4, nombre: 'Motocicleta', imagen: 'bike' },
  ], 'tipoVehiculo', 'idtipo');

  await upsertMany([
    { idMarca: 1, nombre: 'Toyota' },
    { idMarca: 2, nombre: 'Honda' },
    { idMarca: 3, nombre: 'Nissan' },
    { idMarca: 4, nombre: 'Mazda' },
    { idMarca: 5, nombre: 'Ford' },
    { idMarca: 6, nombre: 'Chevrolet' },
    { idMarca: 7, nombre: 'Volkswagen' },
    { idMarca: 8, nombre: 'Kia' },
  ], 'marcaVehiculo', 'idMarca');

  await upsertMany([
    { idmodelo: 1, idMarca: 1, nombre: 'Corolla', anio: 2022 },
    { idmodelo: 2, idMarca: 1, nombre: 'Yaris', anio: 2021 },
    { idmodelo: 3, idMarca: 1, nombre: 'Hilux', anio: 2024 },
    { idmodelo: 4, idMarca: 2, nombre: 'Civic', anio: 2021 },
    { idmodelo: 5, idMarca: 2, nombre: 'CR-V', anio: 2023 },
    { idmodelo: 6, idMarca: 3, nombre: 'Sentra', anio: 2023 },
    { idmodelo: 7, idMarca: 3, nombre: 'Versa', anio: 2022 },
    { idmodelo: 8, idMarca: 4, nombre: 'CX-5', anio: 2022 },
    { idmodelo: 9, idMarca: 4, nombre: 'Mazda 3', anio: 2024 },
    { idmodelo: 10, idMarca: 5, nombre: 'Ranger', anio: 2024 },
    { idmodelo: 11, idMarca: 5, nombre: 'Escape', anio: 2023 },
    { idmodelo: 12, idMarca: 6, nombre: 'Aveo', anio: 2022 },
    { idmodelo: 13, idMarca: 6, nombre: 'S10', anio: 2024 },
    { idmodelo: 14, idMarca: 7, nombre: 'Jetta', anio: 2020 },
    { idmodelo: 15, idMarca: 7, nombre: 'Tiguan', anio: 2023 },
    { idmodelo: 16, idMarca: 8, nombre: 'Rio', anio: 2021 },
    { idmodelo: 17, idMarca: 8, nombre: 'Sportage', anio: 2024 },
  ], 'modeloVehiculo', 'idmodelo');



  await upsertMany([
    { idgasolinera: 1, nombre: "Gasolinera del Centro", domicilio: "Av. Revolución 123, Centro, Colima", imagen: null, latitud: 19.2438, longitud: -103.7243, idEstado: 1, idMunicipio: 1 },
    { idgasolinera: 2, nombre: "Combustibles del Valle", domicilio: "Blvd. Camino Real 456, Colima", imagen: null, latitud: 19.2562, longitud: -103.7152, idEstado: 1, idMunicipio: 1 },
    { idgasolinera: 3, nombre: "Servicio Las Palmas", domicilio: "Tercer Anillo 882, Colima", imagen: null, latitud: 19.2307, longitud: -103.7027, idEstado: 1, idMunicipio: 1 },
  ], 'gasolinera', 'idgasolinera');

  const hashed = await bcrypt.hash('Administrador_123', 10);
  await prisma.usuario.upsert({
    where: { username: 'Admin123' },
    update: {
      nombre: 'Administrador',
      apellidoPaterno: 'MapsCar',
      apellidoMaterno: 'System',
      correo: 'admin@mapscar.local',
      contrasena: hashed,
      estatus: 1,
      idrol: 1,
    },
    create: {
      idusuario: 'admin123mapscar',
      username: 'Admin123',
      nombre: 'Administrador',
      apellidoPaterno: 'MapsCar',
      apellidoMaterno: 'System',
      correo: 'admin@mapscar.local',
      contrasena: hashed,
      estatus: 1,
      idrol: 1,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });