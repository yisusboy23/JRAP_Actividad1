/**
 * authController.js
 * Login de docentes con bcrypt + JWT
 */

const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const { query, sql } = require("../config/db");

const JWT_SECRET  = process.env.JWT_SECRET  || "lms_secret_dev";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

// POST /api/auth/login
async function login(req, res) {
  try {
    const email    = typeof req.body.email    === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password)
      return res.status(400).json({ error: "Email y contraseña son requeridos" });

    const result = await query(
      `SELECT id, nombre, apellido, email, password_hash
       FROM docentes
       WHERE email = @email AND activo = 1`,
      { email: { type: sql.VarChar(150), value: email } }
    );

    if (!result.recordset.length || !result.recordset[0].password_hash)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const docente  = result.recordset[0];
    const coincide = await bcrypt.compare(password, docente.password_hash);
    if (!coincide)
      return res.status(401).json({ error: "Credenciales inválidas" });

const token = jwt.sign(
  { id: docente.id, nombre: docente.nombre, apellido: docente.apellido, email: docente.email },
  JWT_SECRET
);

    res.json({
      token,
      docente: { id: docente.id, nombre: docente.nombre, apellido: docente.apellido, email: docente.email },
    });
  } catch (err) {
    console.error("[authController] login:", err.message);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
}

// POST /api/auth/set-password  — solo para asignar contraseña por primera vez
async function setPassword(req, res) {
  try {
    const docenteId = parseInt(req.body.docenteId, 10);
    const password  = typeof req.body.password === "string" ? req.body.password : "";

    if (isNaN(docenteId) || docenteId <= 0)
      return res.status(400).json({ error: "docenteId inválido" });
    if (password.length < 6)
      return res.status(400).json({ error: "Mínimo 6 caracteres" });

    const hash   = await bcrypt.hash(password, 12);
    const result = await query(
      `UPDATE docentes SET password_hash = @hash WHERE id = @id AND activo = 1`,
      {
        hash: { type: sql.VarChar(255), value: hash      },
        id:   { type: sql.Int,          value: docenteId },
      }
    );

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ error: "Docente no encontrado" });

    res.json({ mensaje: "Contraseña establecida correctamente" });
  } catch (err) {
    console.error("[authController] setPassword:", err.message);
    res.status(500).json({ error: "Error al establecer contraseña" });
  }
}

module.exports = { login, setPassword };
