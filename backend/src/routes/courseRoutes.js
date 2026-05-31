const express = require("express");
const router = express.Router();
const { verificarToken } = require("../middlewares/authMiddleware"); // ← agregar

const {
  listarCursos,
  obtenerCurso,
  crearCurso,
  agregarModulo,
  verificarCursoCompleto,
  actualizarCurso,
  eliminarCurso,
  actualizarModuloDeCurso,
  eliminarModuloDeCurso,
  desvincularModulo,
} = require("../controllers/courseController");

// Rutas públicas (lectura)
router.get("/", listarCursos);
router.get("/:id", obtenerCurso);
router.get("/:id/progreso/:usuarioId", verificarCursoCompleto);
router.delete("/:cursoId/desvincular/:moduloId", verificarToken, desvincularModulo);

// Rutas protegidas (escritura) — requieren login de docente
router.post("/", verificarToken, crearCurso);
router.post("/:id/modulos", verificarToken, agregarModulo);
router.put("/:id", verificarToken, actualizarCurso);
router.delete("/:id", verificarToken, eliminarCurso);
router.put("/:cursoId/modulos/:moduloId", verificarToken, actualizarModuloDeCurso);
router.delete("/:cursoId/modulos/:moduloId", verificarToken, eliminarModuloDeCurso);

module.exports = router;