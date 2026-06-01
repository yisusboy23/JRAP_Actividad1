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
         ISNULL(d.nombre + ' ' + d.apellido, 'Sin asignar') AS instructor,
         COUNT(cm.modulo_id) AS total_modulos
       FROM cursos c
       LEFT JOIN docentes d ON d.id = c.docente_id
       LEFT JOIN curso_modulo cm ON cm.curso_id = c.id
       GROUP BY c.id, c.titulo, c.descripcion, d.nombre, d.apellido
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
    const cursoId   = parseInt(req.params.id);
    const usuarioId = req.usuario?.id;

    const resCurso = await query(
      `SELECT c.id, c.titulo, c.descripcion,
              ISNULL(d.nombre + ' ' + d.apellido, 'Sin asignar') AS instructor
       FROM cursos c
       LEFT JOIN docentes d ON d.id = c.docente_id
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
         cm.orden,
         ISNULL(p.completado, 0) AS completado
       FROM modulos m
       INNER JOIN curso_modulo cm ON cm.modulo_id = m.id AND cm.curso_id = @cid
       LEFT  JOIN progreso p      ON p.modulo_id = m.id AND p.usuario_id = @uid
       ORDER BY cm.orden ASC`,
      {
        cid: { type: sql.Int, value: cursoId },
        uid: { type: sql.Int, value: usuarioId || 0 },
      }
    );

    const modulos     = resModulos.recordset;
    const completados = modulos.filter((m) => m.completado).length;
    const porcentaje  = calcularPorcentaje(completados, modulos.length);

    res.json({
      curso: resCurso.recordset[0],
      modulos,
      progreso: { completados, total: modulos.length, porcentaje },
    });
  } catch (error) {
    console.error("Error al obtener curso:", error);
    res.status(500).json({ error: "Error al obtener curso" });
  }
}

async function crearCurso(req, res) {
  try {
    const { titulo, descripcion } = req.body;
    const docenteId = req.usuario?.id;

    if (!titulo) {
      return res.status(400).json({ error: "El título es requerido" });
    }

    const result = await query(
      `INSERT INTO cursos (titulo, descripcion, docente_id)
       OUTPUT INSERTED.id
       VALUES (@titulo, @descripcion, @docenteId)`,
      {
        titulo:      { type: sql.VarChar, value: titulo             },
        descripcion: { type: sql.VarChar, value: descripcion || null },
        docenteId:   { type: sql.Int,     value: docenteId          },
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
    const cursoId   = parseInt(req.params.id);
    const docenteId = req.usuario?.id;
    const { titulo, nivel_id, modulo_id } = req.body;

    const resCurso = await query(
      `SELECT id FROM cursos WHERE id = @cid`,
      { cid: { type: sql.Int, value: cursoId } }
    );
    if (!resCurso.recordset.length)
      return res.status(404).json({ error: "Curso no encontrado" });

    let moduloId;

    if (modulo_id) {
      moduloId = parseInt(modulo_id);
      const yaExiste = await query(
        `SELECT 1 FROM curso_modulo WHERE curso_id = @cid AND modulo_id = @mid`,
        { cid: { type: sql.Int, value: cursoId }, mid: { type: sql.Int, value: moduloId } }
      );
      if (yaExiste.recordset.length)
        return res.status(409).json({ error: "El módulo ya está en este curso" });
    } else {
      if (!titulo)
        return res.status(400).json({ error: "titulo es requerido para crear un módulo nuevo" });
      const resModulo = await query(
        `INSERT INTO modulos (titulo, nivel_id, docente_id)
         OUTPUT INSERTED.id
         VALUES (@titulo, @nivelId, @docenteId)`,
        {
          titulo:    { type: sql.VarChar, value: titulo        },
          nivelId:   { type: sql.Int,     value: nivel_id || 1 },
          docenteId: { type: sql.Int,     value: docenteId     },
        }
      );
      moduloId = resModulo.recordset[0].id;
    }

    const resOrden = await query(
      `SELECT ISNULL(MAX(orden), 0) + 1 AS siguiente FROM curso_modulo WHERE curso_id = @cid`,
      { cid: { type: sql.Int, value: cursoId } }
    );
    const orden = resOrden.recordset[0].siguiente;

    await query(
      `INSERT INTO curso_modulo (curso_id, modulo_id, orden) VALUES (@cid, @mid, @orden)`,
      {
        cid:   { type: sql.Int, value: cursoId  },
        mid:   { type: sql.Int, value: moduloId },
        orden: { type: sql.Int, value: orden    },
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
    const cursoId   = parseInt(req.params.id);
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
    const porcentaje    = calcularPorcentaje(completados, total);
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
      `UPDATE cursos SET titulo = @titulo, descripcion = @descripcion WHERE id = @id`,
      {
        id:          { type: sql.Int,     value: id                  },
        titulo:      { type: sql.VarChar, value: titulo              },
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

    const soloEnEsteCurso = await query(
      `SELECT modulo_id FROM curso_modulo
       WHERE curso_id = @id
         AND modulo_id NOT IN (
           SELECT modulo_id FROM curso_modulo WHERE curso_id != @id
         )`,
      { id: { type: sql.Int, value: id } }
    );
    const idsExclusivos = soloEnEsteCurso.recordset.map((r) => r.modulo_id);

    await query(
      `DELETE FROM progreso WHERE modulo_id IN (SELECT modulo_id FROM curso_modulo WHERE curso_id = @id)`,
      { id: { type: sql.Int, value: id } }
    );

    await query(
      `DELETE FROM curso_modulo WHERE curso_id = @id`,
      { id: { type: sql.Int, value: id } }
    );

    for (const moduloId of idsExclusivos) {
      await query(
        `DELETE FROM modulos WHERE id = @mid`,
        { mid: { type: sql.Int, value: moduloId } }
      );
    }

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
    const titulo   = typeof req.body.titulo === "string" ? req.body.titulo.trim() : null;
    const nivelId  = parseInt(req.body.nivel_id, 10);

    if (isNaN(moduloId) || moduloId <= 0)
      return res.status(400).json({ error: "moduloId inválido" });
    if (!titulo)
      return res.status(400).json({ error: "titulo es requerido" });
    if (isNaN(nivelId) || ![1, 2, 3].includes(nivelId))
      return res.status(400).json({ error: "nivel_id inválido" });

    await query(
      `UPDATE modulos SET titulo = @titulo, nivel_id = @nivelId WHERE id = @id`,
      {
        id:      { type: sql.Int,     value: moduloId },
        titulo:  { type: sql.VarChar, value: titulo   },
        nivelId: { type: sql.TinyInt, value: nivelId  },
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
    const cursoId  = parseInt(req.params.id, 10);

    await query(
      `DELETE FROM progreso WHERE modulo_id = @id`,
      { id: { type: sql.Int, value: moduloId } }
    );

    if (cursoId && !isNaN(cursoId)) {
      await query(
        `DELETE FROM curso_modulo WHERE curso_id = @cid AND modulo_id = @mid`,
        {
          cid: { type: sql.Int, value: cursoId  },
          mid: { type: sql.Int, value: moduloId },
        }
      );
    } else {
      await query(
        `DELETE FROM curso_modulo WHERE modulo_id = @mid`,
        { mid: { type: sql.Int, value: moduloId } }
      );
    }

    const otrasRelaciones = await query(
      `SELECT COUNT(*) AS count FROM curso_modulo WHERE modulo_id = @mid`,
      { mid: { type: sql.Int, value: moduloId } }
    );

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
    const cursoId  = parseInt(req.params.cursoId, 10);

    await query(
      `DELETE FROM curso_modulo WHERE curso_id = @cid AND modulo_id = @mid`,
      {
        cid: { type: sql.Int, value: cursoId  },
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