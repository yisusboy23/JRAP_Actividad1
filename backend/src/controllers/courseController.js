const { query, sql } = require("../config/db");
const { puntajePorCurso } = require("../services/pointsService");

const PORCENTAJE_MAXIMO = 100;

function calcularPorcentaje(completados, totalModulos) {
  if (totalModulos === 0) return 0;
  return Math.round((completados / totalModulos) * PORCENTAJE_MAXIMO);
}

async function listarCursos(req, res) {
  try {
    const result = await query(
      `SELECT 
         c.id, 
         c.titulo, 
         c.descripcion, 
         u.nombre AS instructor,
         COUNT(cm.modulo_id) AS total_modulos
       FROM cursos c
       LEFT JOIN docentes u ON u.id = c.creado_por
       LEFT JOIN curso_modulo cm ON cm.curso_id = c.id
       GROUP BY c.id, c.titulo, c.descripcion, u.nombre
       ORDER BY c.id ASC`
    );

    res.json({ cursos: result.recordset });
  } catch (error) {
    console.error("Error al listar cursos:", error);
    res.status(500).json({ error: "Error al obtener cursos" });
  }
}

async function obtenerCurso(req, res) {
  try {
    const cursoId = parseInt(req.params.id);
    const usuarioId = req.usuario?.id;
    const resCurso = await query(
      `SELECT c.id, c.titulo, c.descripcion, u.nombre AS instructor
       FROM cursos c
       LEFT JOIN docentes u ON u.id = c.creado_por
       WHERE c.id = @cid`,
      { cid: { type: sql.Int, value: cursoId } }
    );

    if (resCurso.recordset.length === 0) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    const resModulos = await query(
      `SELECT 
     m.id, 
     m.titulo,
     ISNULL(p.completado, 0) AS completado
   FROM modulos m
   INNER JOIN curso_modulo cm ON cm.modulo_id = m.id AND cm.curso_id = @cid
   LEFT  JOIN progreso p      ON p.modulo_id = m.id AND p.usuario_id = @uid`,
      {
        cid: { type: sql.Int, value: cursoId },
        uid: { type: sql.Int, value: usuarioId || 0 },
      }
    );

    const modulos = resModulos.recordset;
    const completados = modulos.filter((m) => m.completado).length;
    const porcentaje = calcularPorcentaje(completados, modulos.length);

    res.json({
      curso: resCurso.recordset[0],
      modulos,
      progreso: {
        completados,
        total: modulos.length,
        porcentaje,
      },
    });
  } catch (error) {
    console.error("Error al obtener curso:", error);
    res.status(500).json({ error: "Error al obtener curso" });
  }
}

async function crearCurso(req, res) {
  try {
    const { titulo, descripcion } = req.body;
    const creadoPor = req.usuario?.id;

    if (!titulo) {
      return res.status(400).json({ error: "El título es requerido" });
    }

    const result = await query(
      `INSERT INTO cursos (titulo, descripcion, creado_por)
       OUTPUT INSERTED.id
       VALUES (@titulo, @descripcion, @creadoPor)`,
      {
        titulo: { type: sql.VarChar, value: titulo },
        descripcion: { type: sql.VarChar, value: descripcion || null },
        creadoPor: { type: sql.Int, value: creadoPor },
      }
    );

    res.status(201).json({
      mensaje: "Curso creado correctamente",
      cursoId: result.recordset[0].id,
    });
  } catch (error) {
    console.error("Error al crear curso:", error);
    res.status(500).json({ error: "Error al crear curso" });
  }
}

async function agregarModulo(req, res) {
  try {
    const cursoId = parseInt(req.params.id);
    const { titulo, nivel_id, modulo_id } = req.body;  // ← modulo_id nuevo

    const resCurso = await query(
      `SELECT id FROM cursos WHERE id = @cid`,
      { cid: { type: sql.Int, value: cursoId } }
    );
    if (!resCurso.recordset.length)
      return res.status(404).json({ error: "Curso no encontrado" });

    let moduloId;

    if (modulo_id) {
      // Vincular módulo existente
      moduloId = parseInt(modulo_id);
      const yaExiste = await query(
        `SELECT 1 FROM curso_modulo WHERE curso_id = @cid AND modulo_id = @mid`,
        { cid: { type: sql.Int, value: cursoId }, mid: { type: sql.Int, value: moduloId } }
      );
      if (yaExiste.recordset.length)
        return res.status(409).json({ error: "El módulo ya está en este curso" });
    } else {
      // Crear módulo nuevo
      if (!titulo)
        return res.status(400).json({ error: "titulo es requerido para crear un módulo nuevo" });
      const resModulo = await query(
        `INSERT INTO modulos (titulo, nivel_id) OUTPUT INSERTED.id VALUES (@titulo, @nivelId)`,
        {
          titulo: { type: sql.VarChar, value: titulo },
          nivelId: { type: sql.Int, value: nivel_id || 1 },
        }
      );
      moduloId = resModulo.recordset[0].id;
    }

    await query(
      `INSERT INTO curso_modulo (curso_id, modulo_id) VALUES (@cid, @mid)`,
      {
        cid: { type: sql.Int, value: cursoId },
        mid: { type: sql.Int, value: moduloId },
      }
    );

    res.status(201).json({ mensaje: "Módulo agregado correctamente", moduloId });
  } catch (error) {
    console.error("Error al agregar módulo:", error);
    res.status(500).json({ error: "Error al agregar módulo" });
  }
}

async function verificarCursoCompleto(req, res) {
  try {
    const cursoId = parseInt(req.params.id);
    const usuarioId = parseInt(req.params.usuarioId);

const result = await query(
  `SELECT 
     COUNT(m.id) AS total, 
     SUM(ISNULL(p.completado, 0)) AS completados
   FROM modulos m
   INNER JOIN curso_modulo cm ON cm.modulo_id = m.id AND cm.curso_id = @cid
   LEFT  JOIN progreso p      ON p.modulo_id = m.id AND p.usuario_id = @uid`,
  {
    cid: { type: sql.Int, value: cursoId   },
    uid: { type: sql.Int, value: usuarioId },
  }
);

    const { total, completados } = result.recordset[0];
    const porcentaje = calcularPorcentaje(completados, total);
    const cursoCompleto = porcentaje === PORCENTAJE_MAXIMO && total > 0;
    if (cursoCompleto) {
      await puntajePorCurso(usuarioId);
    }

    res.json({ porcentaje, cursoCompleto });
  } catch (error) {
    console.error("Error al verificar curso:", error);
    res.status(500).json({ error: "Error al verificar progreso del curso" });
  }
}

async function actualizarCurso(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { titulo, descripcion } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: "El título es requerido" });
    }

    const result = await query(
      `UPDATE cursos
       SET titulo = @titulo, descripcion = @descripcion
       WHERE id = @id`,
      {
        id: { type: sql.Int, value: id },
        titulo: { type: sql.VarChar, value: titulo },
        descripcion: { type: sql.VarChar, value: descripcion || null },
      }
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    res.json({ mensaje: "Curso actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar curso:", error);
    res.status(500).json({ error: "Error al actualizar curso" });
  }
}

async function eliminarCurso(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0)
      return res.status(400).json({ error: "ID inválido" });

    // ========== PASO 1: Guardar módulos que son SOLO de este curso ==========
    const soloEnEsteCurso = await query(
      `SELECT modulo_id FROM curso_modulo
       WHERE curso_id = @id
         AND modulo_id NOT IN (
           SELECT modulo_id FROM curso_modulo WHERE curso_id != @id
         )`,
      { id: { type: sql.Int, value: id } }
    );
    const idsExclusivos = soloEnEsteCurso.recordset.map(r => r.modulo_id);

    // ========== PASO 2: Eliminar progreso de los módulos del curso ==========
    await query(
      `DELETE FROM progreso 
       WHERE modulo_id IN (SELECT modulo_id FROM curso_modulo WHERE curso_id = @id)`,
      { id: { type: sql.Int, value: id } }
    );

    // ========== PASO 3: Eliminar relaciones curso_modulo ==========
    await query(
      `DELETE FROM curso_modulo WHERE curso_id = @id`,
      { id: { type: sql.Int, value: id } }
    );

    // ========== PASO 4: Eliminar módulos exclusivos (los que solo estaban en este curso) ==========
    if (idsExclusivos.length > 0) {
      // Crear placeholders para SQL injection safe
      const placeholders = idsExclusivos.map(() => '?').join(',');
      await query(
        `DELETE FROM modulos WHERE id IN (${placeholders})`,
        idsExclusivos
      );
    }

    // ========== PASO 5: Eliminar el curso ==========
    const result = await query(
      `DELETE FROM cursos WHERE id = @id`,
      { id: { type: sql.Int, value: id } }
    );

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ error: "Curso no encontrado" });

    res.json({ mensaje: "Curso eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar curso:", error);
    res.status(500).json({ error: "Error al eliminar curso" });
  }
}

async function actualizarModuloDeCurso(req, res) {
  try {
    const moduloId = parseInt(req.params.moduloId, 10);
    const titulo = typeof req.body.titulo === "string" ? req.body.titulo.trim() : null;
    const nivelId = parseInt(req.body.nivel_id, 10);
    const cursoId = parseInt(req.body.curso_id, 10);

    if (isNaN(moduloId) || moduloId <= 0)
      return res.status(400).json({ error: "moduloId inválido" });
    if (!titulo)
      return res.status(400).json({ error: "titulo es requerido" });
    if (isNaN(nivelId) || ![1, 2, 3].includes(nivelId))
      return res.status(400).json({ error: "nivel_id inválido" });

    // Actualizar módulo
    await query(
      `UPDATE modulos SET titulo = @titulo, nivel_id = @nivelId WHERE id = @id`,
      {
        id: { type: sql.Int, value: moduloId },
        titulo: { type: sql.VarChar, value: titulo },
        nivelId: { type: sql.TinyInt, value: nivelId },
      }
    );
    res.json({ mensaje: "Módulo actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar módulo:", error);
    res.status(500).json({ error: "Error al actualizar módulo" });
  }
}

async function eliminarModuloDeCurso(req, res) {
  try {
    const moduloId = parseInt(req.params.moduloId, 10);
    const cursoId = parseInt(req.params.id, 10); // si viene de ruta /cursos/:id/modulos/:moduloId

    // Eliminar progreso del módulo
    await query(
      `DELETE FROM progreso WHERE modulo_id = @id`,
      { id: { type: sql.Int, value: moduloId } }
    );

    // Eliminar relación curso_modulo
    if (cursoId && !isNaN(cursoId)) {
      await query(
        `DELETE FROM curso_modulo WHERE curso_id = @cid AND modulo_id = @mid`,
        {
          cid: { type: sql.Int, value: cursoId },
          mid: { type: sql.Int, value: moduloId },
        }
      );
    } else {
      await query(
        `DELETE FROM curso_modulo WHERE modulo_id = @mid`,
        { mid: { type: sql.Int, value: moduloId } }
      );
    }

    // Verificar si el módulo está en otros cursos
    const otrasRelaciones = await query(
      `SELECT COUNT(*) AS count FROM curso_modulo WHERE modulo_id = @mid`,
      { mid: { type: sql.Int, value: moduloId } }
    );

    // Si no está en ningún curso, eliminar el módulo
    if (otrasRelaciones.recordset[0].count === 0) {
      const result = await query(
        `DELETE FROM modulos WHERE id = @id`,
        { id: { type: sql.Int, value: moduloId } }
      );

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: "Módulo no encontrado" });
      }
    }

    res.json({ mensaje: "Módulo eliminado correctamente del curso" });
  } catch (error) {
    console.error("Error al eliminar módulo:", error);
    res.status(500).json({ error: "Error al eliminar módulo" });
  }
}

async function desvincularModulo(req, res) {
  try {
    const moduloId = parseInt(req.params.moduloId, 10);
    const cursoId = parseInt(req.params.cursoId, 10);

    await query(
      `DELETE FROM curso_modulo WHERE curso_id = @cid AND modulo_id = @mid`,
      {
        cid: { type: sql.Int, value: cursoId },
        mid: { type: sql.Int, value: moduloId },
      }
    );

    res.json({ mensaje: "Módulo desvinculado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al desvincular módulo" });
  }
}

module.exports = {
  listarCursos,
  obtenerCurso,
  crearCurso,
  agregarModulo,
  verificarCursoCompleto,
  calcularPorcentaje,
  actualizarCurso,
  eliminarCurso,
  actualizarModuloDeCurso,
  eliminarModuloDeCurso,
  desvincularModulo,
};