const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/moduloController");

router.get("/niveles",       ctrl.listarNiveles);
router.get("/:cursoId",      ctrl.listarModulosDeCurso);
router.post("/:cursoId",     ctrl.crearModulo);
router.put("/:moduloId",     ctrl.actualizarModulo);

module.exports = router;