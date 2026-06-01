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

// POST /api/auth/set-password
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

// POST /api/auth/register
async function register(req, res) {
  try {
    const nombre       = typeof req.body.nombre       === "string" ? req.body.nombre.trim()              : "";
    const apellido     = typeof req.body.apellido     === "string" ? req.body.apellido.trim()            : "";
    const email        = typeof req.body.email        === "string" ? req.body.email.trim().toLowerCase() : "";
    const password     = typeof req.body.password     === "string" ? req.body.password                   : "";
    const especialidad = typeof req.body.especialidad === "string" ? req.body.especialidad.trim()        : null;
    const ci           = req.body.ci ? parseInt(req.body.ci, 10) : null;

    if (!nombre || !apellido || !email || !password)
      return res.status(400).json({ error: "nombre, apellido, email y contraseña son requeridos" });
    if (password.length < 6)
      return res.status(400).json({ error: "Mínimo 6 caracteres" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: "Formato de email inválido" });
    if (ci && (ci < 1000000 || ci > 9999999))
      return res.status(400).json({ error: "CI debe tener exactamente 7 dígitos" });

    const existe = await query(
      `SELECT id FROM docentes WHERE email = @email`,
      { email: { type: sql.VarChar(150), value: email } }
    );
    if (existe.recordset.length)
      return res.status(409).json({ error: "El email ya está registrado" });

    const hash = await bcrypt.hash(password, 12);

await query(
      `INSERT INTO docentes (nombre, apellido, email, password_hash, especialidad, ci)
       VALUES (@nombre, @apellido, @email, @hash, @especialidad, @ci)`,
      {
        nombre:       { type: sql.VarChar(100), value: nombre             },
        apellido:     { type: sql.VarChar(100), value: apellido           },
        email:        { type: sql.VarChar(150), value: email              },
        hash:         { type: sql.VarChar(255), value: hash               },
        especialidad: { type: sql.VarChar(150), value: especialidad || null },
        ci:           { type: sql.Int,          value: ci                 },
      }
    );

    res.status(201).json({ mensaje: "Docente registrado correctamente" });
  } catch (err) {
    console.error("[authController] register:", err.message);
    res.status(500).json({ error: "Error al registrar docente" });
  }
}

module.exports = { login, setPassword, register };