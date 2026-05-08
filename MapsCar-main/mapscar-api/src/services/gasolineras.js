import { prisma } from "../prisma.js";

function toNumber(value) {
  return value == null ? null : Number(value);
}

function filterReviewsByVehicle(reviews = [], filters = {}) {
  const { idTipo, idMarca, idModelo } = filters;

  if (!idTipo || !idMarca || !idModelo) return reviews;

  return reviews.filter((item) => {
    const vehiculo = item.puntuacionVehiculos?.[0]?.vehiculo;
    if (!vehiculo) return false;

    const sameType = Number(vehiculo.idtipo) === Number(idTipo);
    const sameBrand = Number(vehiculo.idMarca) === Number(idMarca);
    const sameModel = Number(vehiculo.idmodelo) === Number(idModelo);

    return sameType && sameBrand && sameModel;
  });
}

function formatStation(baseStation, reviews = []) {
  const valid = reviews.filter((item) => typeof item.puntuacion === "number");

  const average = valid.length
    ? valid.reduce((acc, item) => acc + item.puntuacion, 0) / valid.length
    : 0;

  const latestComments = reviews
    .filter((item) => item.comentario)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 3)
    .map((item) => ({
      id: item.idpuntuacion,
      text: item.comentario,
      userId: item.usuario?.idusuario ?? item.usuario?.IDusuario ?? item.idusuario ?? item.IDusuario ?? null,
      userName: item.usuario?.nombre || null,
      date: item.fecha,
    }));

  return {
    id: baseStation.idgasolinera,
    idgasolinera: baseStation.idgasolinera,
    name: baseStation.nombre,
    nombre: baseStation.nombre,
    image: baseStation.imagen || null,
    imagen: baseStation.imagen || null,
    address: baseStation.domicilio || "Sin domicilio registrado",
    domicilio: baseStation.domicilio || "Sin domicilio registrado",
    lat: toNumber(baseStation.latitud),
    lng: toNumber(baseStation.longitud),
    latitud: toNumber(baseStation.latitud),
    longitud: toNumber(baseStation.longitud),
    estado: baseStation.estado?.nombre || null,
    municipio: baseStation.municipio?.nombre || null,
    rating: Number(average.toFixed(1)),
    reviewCount: reviews.length,
    comments: latestComments,
    estimatedPerformance: valid.length
      ? `${(13 + average / 2).toFixed(1)} km/L promedio reportado`
      : "Sin evaluaciones todavía",
    location:
      [toNumber(baseStation.latitud), toNumber(baseStation.longitud)].every(
        (value) => value != null
      )
        ? `${toNumber(baseStation.latitud)}, ${toNumber(baseStation.longitud)}`
        : "Ubicación pendiente",
  };
}

export async function listStations(filters = {}) {
  const stations = await prisma.gasolinera.findMany({
    include: {
      estado: true,
      municipio: true,
      puntuaciones: {
        where: { estatus: 1 },
        include: {
          usuario: {
            select: {
              idusuario: true,
              nombre: true,
            },
          },
          puntuacionVehiculos: {
            include: {
              vehiculo: {
                select: {
                  idtipo: true,
                  idMarca: true,
                  idmodelo: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { nombre: "asc" },
  });

  return stations.map((station) => {
    const filteredReviews = filterReviewsByVehicle(station.puntuaciones, filters);
    return formatStation(station, filteredReviews);
  });
}

export async function getStationById(id, filters = {}) {
  const station = await prisma.gasolinera.findUnique({
    where: { idgasolinera: Number(id) },
    include: {
      estado: true,
      municipio: true,
      puntuaciones: {
        where: { estatus: 1 },
        include: {
          usuario: {
            select: {
              idusuario: true,
              nombre: true,
            },
          },
          puntuacionVehiculos: {
            include: {
              vehiculo: {
                select: {
                  idtipo: true,
                  idMarca: true,
                  idmodelo: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!station) return null;

  const filteredReviews = filterReviewsByVehicle(station.puntuaciones, filters);
  return formatStation(station, filteredReviews);
}