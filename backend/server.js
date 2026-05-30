require("dotenv").config();

const express = require("express");
const cors = require("cors");
const courseRoutes = require("./src/routes/courseRoutes");
const gamificationRoutes = require("./src/routes/gamificationRoutes");
const userRoutes = require("./src/routes/userRoutes");
const docenteRoutes = require("./src/routes/docenteRoutes");
const moduloRoutes  = require("./src/routes/moduloRoutes");
const authRoutes         = require("./src/routes/authRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth",         authRoutes);          
app.use("/api/courses",      courseRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/users",        userRoutes);
app.use("/api/docentes", docenteRoutes);
app.use("/api/modulos",  moduloRoutes);

app.get("/", (req, res) => {
  res.json({ mensaje: "API funcionando 🚀" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});