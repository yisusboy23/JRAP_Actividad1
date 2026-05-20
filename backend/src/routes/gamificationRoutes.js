const express = require("express");
const router = express.Router();

const {
  obtenerInsignias,
  completarModulo,
  obtenerRanking,
  misPuntos,
} = require("../controllers/gamificationController");

router.get("/ranking", obtenerRanking);

router.get("/insignias/:usuarioId", obtenerInsignias);

router.get("/mis-puntos/:usuarioId", misPuntos);

router.post("/completar-modulo", completarModulo);

module.exports = router;