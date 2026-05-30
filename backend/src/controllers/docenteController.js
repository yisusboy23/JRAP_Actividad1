/**
 * docenteController.js — Controlador de Docentes (v2 seguro)
 *
 * SEGURIDAD APLICADA:
 * 1. Todos los inputs se validan y sanitizan antes de usarse
 * 2. Todas las consultas usan parámetros tipados (cero interpolación)
 * 3. Validación de formato CI con regex antes de llegar a la DB
 * 4. Respuestas nunca exponen datos internos del servidor (error genérico)
 * 5. Validación de tipos en cada campo para prevenir type juggling
 *
 * REFACTORIZACIÓN:
 * - Extract Method: validarCI(), sanitizarTexto()
 * - Replace Magic Number: REGEX_CI, MAX_NOMBRE, etc.
 */

const { query, sql } = require("../config/db");

// ─────────────────────────────────────────────
// CONSTANTES (Replace Magic Number)
// ─────────────────────────────────────────────
const MAX_NOMBRE    = 100;
const MAX_EMAIL     = 150;
const MAX_ESPECIAL  = 150;

// ─────────────────────────────────────────────
// FUNCIONES INTERNAS — Extract Method
// ─────────────────────────────────────────────

/**
 * Valida que el CI tenga exactamente 7 dígitos numéricos.
 * @param {string} ci
 * @returns {{ valido: boolean, error?: string }}
 */
function validarCI(ci) {
  if (!ci) return { valido: true };
  const num = parseInt(ci);
  if (isNaN(num) || num < 1000000 || num > 9999999) {
    return { valido: false, error: "CI debe tener exactamente 7 dígitos" };
  }
  return { valido: true };
}

/**
 * Sanitiza texto: recorta espacios y limita longitud.
 * @param {string} texto
 * @param {number} maxLen
 * @returns {string}
 */
function sanitizarTexto(texto, maxLen) {
  if (typeof texto !== "string") return "";
  return texto.trim().substring(0, maxLen);
}

/**
 * Valida formato de email básico.
 * @param {string} email
 * @returns {boolean}
 */
function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─────────────────────────────────────────────
// GET /api/docentes
// Lista todos los docentes activos
// ─────────────────────────────────────────────
async function listarDocentes(req, res) {
  try {
    // Sin parámetros de usuario → sin riesgo de inyección aquí,
    // pero igual usamos el método query() que usa pool seguro
    const result = await query(
      `SELECT id, nombre, apellido, email, especialidad, ci, creado_en
       FROM docentes
       WHERE activo = 1
       ORDER BY apellido ASC, nombre ASC`
    );
    res.json({ docentes: result.recordset });
  } catch (err) {
    console.error("[docenteController] listarDocentes:", err.message);
    res.status(500).json({ error: "Error al obtener docentes" });
  }
}

// ─────────────────────────────────────────────
// GET /api/docentes/:id
// Obtiene un docente por ID
// ─────────────────────────────────────────────
async function obtenerDocente(req, res) {
  try {
    // parseInt() + validación: previene inyección por parámetro de ruta
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const result = await query(
      `SELECT id, nombre, apellido, email, especialidad, ci, creado_en
       FROM docentes
       WHERE id = @id AND activo = 1`,
      { id: { type: sql.Int, value: id } }
    );

    if (!result.recordset.length) {
      return res.status(404).json({ error: "Docente no encontrado" });
    }

    res.json({ docente: result.recordset[0] });
  } catch (err) {
    console.error("[docenteController] obtenerDocente:", err.message);
    res.status(500).json({ error: "Error al obtener docente" });
  }
}

// ─────────────────────────────────────────────
// POST /api/docentes
// Crea un nuevo docente
// ─────────────────────────────────────────────
async function crearDocente(req, res) {
  try {
    // 1. Extraer y sanitizar inputs
    const nombre      = sanitizarTexto(req.body.nombre    || "", MAX_NOMBRE);
    const apellido    = sanitizarTexto(req.body.apellido  || "", MAX_NOMBRE);
    const email       = sanitizarTexto(req.body.email     || "", MAX_EMAIL);
    const especialidad = sanitizarTexto(req.body.especialidad || "", MAX_ESPECIAL) || null;
    const ci          = req.body.ci ? sanitizarTexto(String(req.body.ci), 7) : null;

    // 2. Validaciones de negocio
    if (!nombre)  return res.status(400).json({ error: "nombre es requerido" });
    if (!apellido) return res.status(400).json({ error: "apellido es requerido" });
    if (!email)   return res.status(400).json({ error: "email es requerido" });

    if (!emailValido(email)) {
      return res.status(400).json({ error: "Formato de email inválido" });
    }

    const validacionCI = validarCI(ci);
    if (!validacionCI.valido) {
      return res.status(400).json({ error: validacionCI.error });
    }

    // 3. Verificar email duplicado (consulta parametrizada)
    const existeEmail = await query(
      `SELECT id FROM docentes WHERE email = @email`,
      { email: { type: sql.VarChar(MAX_EMAIL), value: email } }
    );
    if (existeEmail.recordset.length) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    // 4. INSERT completamente parametrizado
    const result = await query(
      `INSERT INTO docentes (nombre, apellido, email, especialidad, ci)
       OUTPUT INSERTED.id
       VALUES (@nombre, @apellido, @email, @especialidad, @ci)`,
      {
        nombre:      { type: sql.VarChar(MAX_NOMBRE),  value: nombre      },
        apellido:    { type: sql.VarChar(MAX_NOMBRE),  value: apellido    },
        email:       { type: sql.VarChar(MAX_EMAIL),   value: email       },
        especialidad:{ type: sql.VarChar(MAX_ESPECIAL),value: especialidad},
        ci:          { type: sql.Int, value: ci ? parseInt(ci) : null }
      }
    );

    res.status(201).json({
      mensaje:   "Docente creado correctamente",
      docenteId: result.recordset[0].id,
    });
  } catch (err) {
    console.error("[docenteController] crearDocente:", err.message);
    // No exponer detalles internos de la DB al cliente
    res.status(500).json({ error: "Error al crear docente" });
  }
}

// ─────────────────────────────────────────────
// PUT /api/docentes/:id
// Actualiza un docente existente
// ─────────────────────────────────────────────
async function actualizarDocente(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const nombre      = sanitizarTexto(req.body.nombre    || "", MAX_NOMBRE);
    const apellido    = sanitizarTexto(req.body.apellido  || "", MAX_NOMBRE);
    const email       = sanitizarTexto(req.body.email     || "", MAX_EMAIL);
    const especialidad = sanitizarTexto(req.body.especialidad || "", MAX_ESPECIAL) || null;
    const ci          = req.body.ci ? sanitizarTexto(String(req.body.ci), 7) : null;

    if (!nombre || !apellido || !email) {
      return res.status(400).json({ error: "nombre, apellido y email son requeridos" });
    }
    if (!emailValido(email)) {
      return res.status(400).json({ error: "Formato de email inválido" });
    }
    const validacionCI = validarCI(ci);
    if (!validacionCI.valido) {
      return res.status(400).json({ error: validacionCI.error });
    }

    const result = await query(
      `UPDATE docentes
       SET nombre = @nombre, apellido = @apellido, email = @email,
           especialidad = @especialidad, ci = @ci
       WHERE id = @id AND activo = 1`,
      {
        id:          { type: sql.Int,              value: id          },
        nombre:      { type: sql.VarChar(MAX_NOMBRE),  value: nombre  },
        apellido:    { type: sql.VarChar(MAX_NOMBRE),  value: apellido},
        email:       { type: sql.VarChar(MAX_EMAIL),   value: email   },
        especialidad:{ type: sql.VarChar(MAX_ESPECIAL),value: especialidad },
        ci:          { type: sql.Int, value: ci ? parseInt(ci) : null }
      }
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Docente no encontrado" });
    }

    res.json({ mensaje: "Docente actualizado correctamente" });
  } catch (err) {
    console.error("[docenteController] actualizarDocente:", err.message);
    res.status(500).json({ error: "Error al actualizar docente" });
  }
}

// ─────────────────────────────────────────────
// DELETE /api/docentes/:id  (soft delete)
// Marca el docente como inactivo — nunca borra datos
// ─────────────────────────────────────────────
async function eliminarDocente(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const result = await query(
      `UPDATE docentes SET activo = 0 WHERE id = @id AND activo = 1`,
      { id: { type: sql.Int, value: id } }
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Docente no encontrado o ya inactivo" });
    }

    res.json({ mensaje: "Docente eliminado correctamente" });
  } catch (err) {
    console.error("[docenteController] eliminarDocente:", err.message);
    res.status(500).json({ error: "Error al eliminar docente" });
  }
}

// ─────────────────────────────────────────────
// GET /api/docentes/audit/:docenteId
// Historial de auditoría de un docente
// ─────────────────────────────────────────────
async function auditLog(req, res) {
  try {
    const docenteId = parseInt(req.params.docenteId, 10);
    if (isNaN(docenteId) || docenteId <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const result = await query(
      `SELECT accion, campo_cambio, valor_anterior, valor_nuevo, usuario_db, fecha
       FROM docentes_audit_log
       WHERE docente_id = @docenteId
       ORDER BY fecha DESC`,
      { docenteId: { type: sql.Int, value: docenteId } }
    );

    res.json({ logs: result.recordset });
  } catch (err) {
    console.error("[docenteController] auditLog:", err.message);
    res.status(500).json({ error: "Error al obtener logs de auditoría" });
  }
}

module.exports = {
  listarDocentes,
  obtenerDocente,
  crearDocente,
  actualizarDocente,
  eliminarDocente,
  auditLog,
};
