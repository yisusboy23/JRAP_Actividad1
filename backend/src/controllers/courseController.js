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
         COUNT(m.id) AS total_modulos
       FROM cursos c
       LEFT JOIN usuarios u ON u.id = c.creado_por
       LEFT JOIN modulos m  ON m.curso_id = c.id
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
    const cursoId    = parseInt(req.params.id);
    const usuarioId  = req.usuario?.id; 
    const resCurso = await query(
      `SELECT c.id, c.titulo, c.descripcion, u.nombre AS instructor
       FROM cursos c
       LEFT JOIN usuarios u ON u.id = c.creado_por
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
         m.orden,
         ISNULL(p.completado, 0) AS completado
       FROM modulos m
       LEFT JOIN progreso p
         ON p.modulo_id = m.id AND p.usuario_id = @uid
       WHERE m.curso_id = @cid
       ORDER BY m.orden ASC`,
      {
        cid: { type: sql.Int, value: cursoId  },
        uid: { type: sql.Int, value: usuarioId || 0 },
      }
    );

    const modulos      = resModulos.recordset;
    const completados  = modulos.filter((m) => m.completado).length;
    const porcentaje   = calcularPorcentaje(completados, modulos.length);

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
        titulo:      { type: sql.VarChar, value: titulo       },
        descripcion: { type: sql.VarChar, value: descripcion || null },
        creadoPor:   { type: sql.Int,     value: creadoPor   },
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
    const { titulo, orden } = req.body;

    if (!titulo || orden === undefined) {
      return res.status(400).json({ error: "titulo y orden son requeridos" });
    }

    // Verifica que el curso exista
    const resCurso = await query(
      `SELECT id FROM cursos WHERE id = @cid`,
      { cid: { type: sql.Int, value: cursoId } }
    );
    if (resCurso.recordset.length === 0) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    const result = await query(
      `INSERT INTO modulos (curso_id, titulo, orden)
       OUTPUT INSERTED.id
       VALUES (@cid, @titulo, @orden)`,
      {
        cid:    { type: sql.Int,     value: cursoId },
        titulo: { type: sql.VarChar, value: titulo  },
        orden:  { type: sql.Int,     value: orden   },
      }
    );

    res.status(201).json({
      mensaje: "Módulo agregado correctamente",
      moduloId: result.recordset[0].id,
    });
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
         COUNT(m.id)                          AS total,
         SUM(ISNULL(p.completado, 0))         AS completados
       FROM modulos m
       LEFT JOIN progreso p
         ON p.modulo_id = m.id AND p.usuario_id = @uid
       WHERE m.curso_id = @cid`,
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

module.exports = {
  listarCursos,
  obtenerCurso,
  crearCurso,
  agregarModulo,
  verificarCursoCompleto,
  calcularPorcentaje,
};
