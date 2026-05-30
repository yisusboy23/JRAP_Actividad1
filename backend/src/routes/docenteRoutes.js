const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/docenteController");

router.get("/",           ctrl.listarDocentes);
router.get("/audit/:docenteId", ctrl.auditLog);
router.get("/:id",        ctrl.obtenerDocente);
router.post("/",          ctrl.crearDocente);
router.put("/:id",        ctrl.actualizarDocente);
router.delete("/:id",     ctrl.eliminarDocente);

module.exports = router;