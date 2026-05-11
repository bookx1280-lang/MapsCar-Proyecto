import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./prisma.js";
import usuario from "./routes/usuario.js";
import auth from "./routes/auth.js";
import gasolineras from "./routes/gasolineras.js";
import catalogos from "./routes/catalogos.js";
import vehiculos from "./routes/vehiculos.js";
import puntuaciones from "./routes/puntuaciones.js";
import adminCatalogos from "./routes/adminCatalogos.js";

dotenv.config();

const app = express();
app.use(cors({
  origin: '*', // Permite peticiones de cualquier origen temporalmente para pruebas
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: true, provider: "mysql" });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) });
  }
});

app.use("/api/auth", auth);
app.use("/api/usuario", usuario);
app.use("/api/gasolineras", gasolineras);
app.use("/api/catalogos", catalogos);
app.use("/api/vehiculos", vehiculos);
app.use("/api/puntuaciones", puntuaciones);
app.use("/api/admin/catalogos", adminCatalogos);

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT}`);
});