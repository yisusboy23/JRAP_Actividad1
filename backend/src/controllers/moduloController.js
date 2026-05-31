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
         cm.orden,
         m.nivel_id,
         n.nombre AS nivel
       FROM modulos m
       INNER JOIN curso_modulo cm ON cm.modulo_id = m.id AND cm.curso_id = @cursoId
       INNER JOIN niveles_modulo n ON n.id = m.nivel_id
       ORDER BY cm.orden ASC`,
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

    const titulo  = typeof req.body.titulo === "string"
      ? req.body.titulo.trim().substring(0, MAX_TITULO)
      : null;
    const orden   = parseInt(req.body.orden, 10);
    const nivelId = parseInt(req.body.nivel_id, 10);

    if (!titulo) return res.status(400).json({ error: "titulo es requerido" });
    if (isNaN(orden) || orden < 1) return res.status(400).json({ error: "orden debe ser un número positivo" });
    if (isNaN(nivelId) || !NIVELES_VALIDOS.includes(nivelId)) {
      return res.status(400).json({ error: "nivel_id inválido. Use 1 (Básico), 2 (Intermedio) o 3 (Avanzado)" });
    }

    const resCurso = await query(
      `SELECT id FROM cursos WHERE id = @cursoId`,
      { cursoId: { type: sql.Int, value: cursoId } }
    );
    if (!resCurso.recordset.length) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    // Insertar módulo SIN curso_id
    const resModulo = await query(
      `INSERT INTO modulos (titulo, nivel_id)
       OUTPUT INSERTED.id
       VALUES (@titulo, @nivelId)`,
      {
        titulo:  { type: sql.VarChar(MAX_TITULO), value: titulo  },
        nivelId: { type: sql.TinyInt,             value: nivelId },
      }
    );

    const moduloId = resModulo.recordset[0].id;

    // Vincular en curso_modulo
    await query(
      `INSERT INTO curso_modulo (curso_id, modulo_id, orden)
       VALUES (@cursoId, @moduloId, @orden)`,
      {
        cursoId:  { type: sql.Int, value: cursoId  },
        moduloId: { type: sql.Int, value: moduloId },
        orden:    { type: sql.Int, value: orden    },
      }
    );

    res.status(201).json({ mensaje: "Módulo creado correctamente", moduloId });
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
    const cursoId  = parseInt(req.body.curso_id, 10);

    if (isNaN(moduloId) || moduloId <= 0)
      return res.status(400).json({ error: "moduloId inválido" });

    const titulo  = typeof req.body.titulo === "string"
      ? req.body.titulo.trim().substring(0, MAX_TITULO) : null;
    const orden   = parseInt(req.body.orden, 10);
    const nivelId = parseInt(req.body.nivel_id, 10);

    if (!titulo) return res.status(400).json({ error: "titulo es requerido" });
    if (isNaN(orden) || orden < 1) return res.status(400).json({ error: "orden inválido" });
    if (isNaN(nivelId) || !NIVELES_VALIDOS.includes(nivelId))
      return res.status(400).json({ error: "nivel_id inválido" });

    // Actualizar título y nivel en modulos
    const result = await query(
      `UPDATE modulos SET titulo = @titulo, nivel_id = @nivelId WHERE id = @moduloId`,
      {
        moduloId: { type: sql.Int,               value: moduloId },
        titulo:   { type: sql.VarChar(MAX_TITULO), value: titulo  },
        nivelId:  { type: sql.TinyInt,            value: nivelId },
      }
    );

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ error: "Módulo no encontrado" });

    // Actualizar orden en curso_modulo (si viene curso_id)
    if (!isNaN(cursoId) && cursoId > 0) {
      await query(
        `UPDATE curso_modulo SET orden = @orden WHERE curso_id = @cursoId AND modulo_id = @moduloId`,
        {
          cursoId:  { type: sql.Int, value: cursoId  },
          moduloId: { type: sql.Int, value: moduloId },
          orden:    { type: sql.Int, value: orden    },
        }
      );
    }

    res.json({ mensaje: "Módulo actualizado correctamente" });
  } catch (err) {
    console.error("[moduloController] actualizarModulo:", err.message);
    res.status(500).json({ error: "Error al actualizar módulo" });
  }
}

async function listarTodosLosModulos(req, res) {
  try {
    const result = await query(
      `SELECT m.id, m.titulo, m.nivel_id, n.nombre AS nivel
       FROM modulos m
       INNER JOIN niveles_modulo n ON n.id = m.nivel_id
       ORDER BY m.titulo ASC`
    );
    res.json({ modulos: result.recordset });
  } catch (err) {
    console.error("[moduloController] listarTodosLosModulos:", err.message);
    res.status(500).json({ error: "Error al obtener módulos" });
  }
}

module.exports = {
  listarNiveles,
  listarModulosDeCurso,
  crearModulo,
  actualizarModulo,
  listarTodosLosModulos,
};
