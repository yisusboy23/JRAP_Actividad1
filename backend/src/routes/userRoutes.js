const express = require("express");
const router = express.Router();
const { query, sql } = require("../config/db");
const bcrypt = require("bcrypt");

// 📌 Obtener estudiantes
router.get("/estudiantes", async (req, res) => {
  try {
    const result = await query("SELECT id, nombre, email, ci FROM usuarios");
    res.json({ estudiantes: result.recordset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener estudiantes" });
  }
});

// 📌 Crear estudiante
router.post("/estudiantes", async (req, res) => {
  try {
    const nombre = typeof req.body.nombre === "string" ? req.body.nombre.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const ci = req.body.ci ? parseInt(req.body.ci, 10) : null;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "nombre, email y contraseña son requeridos" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Contraseña mínimo 6 caracteres" });
    }

    const existe = await query(
      "SELECT id FROM usuarios WHERE email = @email",
      { email: { type: sql.VarChar(100), value: email } }
    );

    if (existe.recordset.length > 0) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO usuarios (nombre, email, password_hash, ci)
       OUTPUT INSERTED.id
       VALUES (@nombre, @email, @hash, @ci)`,
      {
        nombre: { type: sql.VarChar(100), value: nombre },
        email: { type: sql.VarChar(100), value: email },
        hash: { type: sql.VarChar(255), value: hash },
        ci: { type: sql.Int, value: ci },
      }
    );

    res.status(201).json({
      mensaje: "Estudiante creado correctamente",
      estudianteId: result.recordset[0].id,
    });

  } catch (error) {
    console.error("[userRoutes] error:", error);
    res.status(500).json({ error: "Error al crear estudiante" });
  }
});

module.exports = router;