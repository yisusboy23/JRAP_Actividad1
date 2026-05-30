const express = require("express");
const router = express.Router();

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
} = require("../controllers/courseController");

// ── EXISTENTES ──
router.get("/", listarCursos);
router.get("/:id", obtenerCurso);
router.post("/", crearCurso);
router.post("/:id/modulos", agregarModulo);
router.get("/:id/progreso/:usuarioId", verificarCursoCompleto);

// ── NUEVAS FUNCIONES ──
router.put("/:id", actualizarCurso);
router.delete("/:id", eliminarCurso);

router.put("/:cursoId/modulos/:moduloId", actualizarModuloDeCurso);
router.delete("/:cursoId/modulos/:moduloId", eliminarModuloDeCurso);

module.exports = router;