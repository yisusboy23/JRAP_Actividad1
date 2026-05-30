const express = require("express");
const router = express.Router();
const { query } = require("../config/db");

router.get("/estudiantes", async (req, res) => {
  try {
    const result = await query(
        "SELECT id, nombre FROM usuarios"
    );
    res.json({ estudiantes: result.recordset });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estudiantes" });
  }
});

module.exports = router;