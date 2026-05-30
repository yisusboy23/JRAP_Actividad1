/**
 * moduloController.js — Gestión de Módulos con Niveles (v2 seguro)
 *
 * SEGURIDAD APLICADA:
 * 1. nivel_id validado contra tabla niveles_modulo (whitelist DB)
 * 2. Todos los parámetros tipados explícitamente
 * 3. Inputs sanitizados antes de procesarse
 * 4. IDs de ruta siempre parseados con parseInt + validación
 *
 * NIVELES PERMITIDOS (tabla niveles_modulo):
 *   1 → Básico | 2 → Intermedio | 3 → Avanzado
 */

const { query, sql } = require("../config/db");

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────
const NIVELES_VALIDOS = [1, 2, 3];  // Básico, Intermedio, Avanzado
const MAX_TITULO = 150;

// ─────────────────────────────────────────────
// GET /api/modulos/niveles
// Lista los niveles disponibles (desde DB)
// ─────────────────────────────────────────────
async function listarNiveles(req, res) {
  try {
    const result = await query(
      `SELECT id, nombre FROM niveles_modulo ORDER BY id ASC`
    );
    res.json({ niveles: result.recordset });
  } catch (err) {
    console.error("[moduloController] listarNiveles:", err.message);
    res.status(500).json({ error: "Error al obtener niveles" });
  }
}

// ─────────────────────────────────────────────
// GET /api/modulos/:cursoId
// Lista módulos de un curso con su nivel
// ─────────────────────────────────────────────
async function listarModulosDeCurso(req, res) {
  try {
    const cursoId = parseInt(req.params.cursoId, 10);
    if (isNaN(cursoId) || cursoId <= 0) {
      return res.status(400).json({ error: "cursoId inválido" });
    }

    const result = await query(
      `SELECT
         m.id,
         m.titulo,
         m.orden,
         m.nivel_id,
         n.nombre AS nivel
       FROM modulos m
       INNER JOIN niveles_modulo n ON n.id = m.nivel_id
       WHERE m.curso_id = @cursoId
       ORDER BY m.orden ASC`,
      { cursoId: { type: sql.Int, value: cursoId } }
    );

    res.json({ modulos: result.recordset });
  } catch (err) {
    console.error("[moduloController] listarModulosDeCurso:", err.message);
    res.status(500).json({ error: "Error al obtener módulos" });
  }
}

// ─────────────────────────────────────────────
// POST /api/modulos/:cursoId
// Crea un nuevo módulo con nivel validado
// ─────────────────────────────────────────────
async function crearModulo(req, res) {
  try {
    const cursoId = parseInt(req.params.cursoId, 10);
    if (isNaN(cursoId) || cursoId <= 0) {
      return res.status(400).json({ error: "cursoId inválido" });
    }

    // Sanitizar inputs
    const titulo  = typeof req.body.titulo === "string"
      ? req.body.titulo.trim().substring(0, MAX_TITULO)
      : null;
    const orden   = parseInt(req.body.orden, 10);
    const nivelId = parseInt(req.body.nivel_id, 10);

    // Validaciones
    if (!titulo) {
      return res.status(400).json({ error: "titulo es requerido" });
    }
    if (isNaN(orden) || orden < 1) {
      return res.status(400).json({ error: "orden debe ser un número positivo" });
    }

    // Validación de nivel: whitelist desde constante (+ validación en DB como respaldo)
    if (isNaN(nivelId) || !NIVELES_VALIDOS.includes(nivelId)) {
      return res.status(400).json({
        error: "nivel_id inválido. Use 1 (Básico), 2 (Intermedio) o 3 (Avanzado)",
      });
    }

    // Verificar que el curso exista
    const resCurso = await query(
      `SELECT id FROM cursos WHERE id = @cursoId`,
      { cursoId: { type: sql.Int, value: cursoId } }
    );
    if (!resCurso.recordset.length) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    // INSERT parametrizado
    const result = await query(
      `INSERT INTO modulos (curso_id, titulo, orden, nivel_id)
       OUTPUT INSERTED.id
       VALUES (@cursoId, @titulo, @orden, @nivelId)`,
      {
        cursoId: { type: sql.Int,          value: cursoId  },
        titulo:  { type: sql.VarChar(MAX_TITULO), value: titulo },
        orden:   { type: sql.Int,          value: orden    },
        nivelId: { type: sql.TinyInt,      value: nivelId  },
      }
    );

    res.status(201).json({
      mensaje:  "Módulo creado correctamente",
      moduloId: result.recordset[0].id,
    });
  } catch (err) {
    console.error("[moduloController] crearModulo:", err.message);
    res.status(500).json({ error: "Error al crear módulo" });
  }
}

// ─────────────────────────────────────────────
// PUT /api/modulos/:moduloId
// Actualiza título, orden o nivel de un módulo
// ─────────────────────────────────────────────
async function actualizarModulo(req, res) {
  try {
    const moduloId = parseInt(req.params.moduloId, 10);
    if (isNaN(moduloId) || moduloId <= 0) {
      return res.status(400).json({ error: "moduloId inválido" });
    }

    const titulo  = typeof req.body.titulo === "string"
      ? req.body.titulo.trim().substring(0, MAX_TITULO)
      : null;
    const orden   = parseInt(req.body.orden, 10);
    const nivelId = parseInt(req.body.nivel_id, 10);

    if (!titulo) return res.status(400).json({ error: "titulo es requerido" });
    if (isNaN(orden) || orden < 1) return res.status(400).json({ error: "orden inválido" });
    if (isNaN(nivelId) || !NIVELES_VALIDOS.includes(nivelId)) {
      return res.status(400).json({ error: "nivel_id inválido" });
    }

    const result = await query(
      `UPDATE modulos
       SET titulo = @titulo, orden = @orden, nivel_id = @nivelId
       WHERE id = @moduloId`,
      {
        moduloId: { type: sql.Int,               value: moduloId },
        titulo:   { type: sql.VarChar(MAX_TITULO), value: titulo  },
        orden:    { type: sql.Int,               value: orden    },
        nivelId:  { type: sql.TinyInt,           value: nivelId  },
      }
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Módulo no encontrado" });
    }

    res.json({ mensaje: "Módulo actualizado correctamente" });
  } catch (err) {
    console.error("[moduloController] actualizarModulo:", err.message);
    res.status(500).json({ error: "Error al actualizar módulo" });
  }
}

module.exports = {
  listarNiveles,
  listarModulosDeCurso,
  crearModulo,
  actualizarModulo,
};
