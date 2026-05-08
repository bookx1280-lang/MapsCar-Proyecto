# MapsCar Web + Google Maps JavaScript API

## 1) Configura tu API key
Crea un archivo `.env` dentro de `mapscar-web` usando este contenido base:

```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_MAPS_API_KEY=pon_aqui_tu_api_key
```

## 2) Instala y corre la web

```bash
npm install
npm run dev
```

## 3) Qué hace esta versión
- Reemplaza el mapa simulado por un mapa real de Google Maps.
- Centra el mapa en Colima.
- Coloca marcadores de gasolineras.
- Abre un info window al seleccionar una gasolinera.
- Incluye botón para usar tu ubicación actual.

## 4) Siguiente paso recomendado
Cuando tengas tu endpoint real de gasolineras con Prisma, cambia los datos de `src/data/mock.ts` por datos traídos desde tu backend.
