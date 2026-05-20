const express = require("express");
const router  = express.Router();
const {
  listarCursos,
  obtenerCurso,
  crearCurso,
  agregarModulo,
  verificarCursoCompleto,
} = require("../controllers/courseController");

router.get("/", listarCursos);
router.get("/:id", obtenerCurso);
router.post("/", crearCurso);
router.post("/:id/modulos", agregarModulo);

router.get("/:id/progreso/:usuarioId", verificarCursoCompleto);

module.exports = router;
