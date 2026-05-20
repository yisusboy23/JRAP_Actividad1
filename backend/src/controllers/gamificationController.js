const { query, sql } = require("../config/db");
const { obtenerTotalPuntos } = require("../services/pointsService");
const { UMBRAL_INSIGNIA, INSIGNIA } = require("../utils/constants");

async function verificarYAsignarInsignias(usuarioId) {
  const resModulos = await query(
    `SELECT COUNT(*) AS total
     FROM progreso
     WHERE usuario_id = @uid AND completado = 1`,
    { uid: { type: sql.Int, value: usuarioId } }
  );
  const modulosCompletados = resModulos.recordset[0].total;

  const totalPuntos = await obtenerTotalPuntos(usuarioId);

  const reglas = [
    { umbral: UMBRAL_INSIGNIA.PRIMER_MODULO,    nombre: INSIGNIA.PRIMER_PASO,        tipo: "modulos" },
    { umbral: UMBRAL_INSIGNIA.ESTUDIANTE_ACTIVO, nombre: INSIGNIA.ESTUDIANTE_ACTIVO,  tipo: "modulos" },
    { umbral: UMBRAL_INSIGNIA.EXPERTO,           nombre: INSIGNIA.EXPERTO,            tipo: "modulos" },
    { umbral: UMBRAL_INSIGNIA.MAESTRO,           nombre: INSIGNIA.MAESTRO,            tipo: "modulos" },
    { umbral: UMBRAL_INSIGNIA.PUNTAJE_BRONCE,    nombre: INSIGNIA.BRONCE,             tipo: "puntos"  },
    { umbral: UMBRAL_INSIGNIA.PUNTAJE_PLATA,     nombre: INSIGNIA.PLATA,              tipo: "puntos"  },
    { umbral: UMBRAL_INSIGNIA.PUNTAJE_ORO,       nombre: INSIGNIA.ORO,                tipo: "puntos"  },
  ];

  const nuevasInsignias = [];

  for (const regla of reglas) {
    const valor = regla.tipo === "modulos" ? modulosCompletados : totalPuntos;
    if (valor < regla.umbral) continue;

    const resInsignia = await query(
      `SELECT id FROM insignias WHERE nombre = @nombre`,
      { nombre: { type: sql.VarChar, value: regla.nombre } }
    );
    if (resInsignia.recordset.length === 0) continue;

    const insigniaId = resInsignia.recordset[0].id;
    const yaLaTiene = await query(
      `SELECT id FROM usuario_insignias
       WHERE usuario_id = @uid AND insignia_id = @iid`,
      {
        uid: { type: sql.Int, value: usuarioId  },
        iid: { type: sql.Int, value: insigniaId },
      }
    );
    if (yaLaTiene.recordset.length > 0) continue;
    await query(
      `INSERT INTO usuario_insignias (usuario_id, insignia_id)
       VALUES (@uid, @iid)`,
      {
        uid: { type: sql.Int, value: usuarioId  },
        iid: { type: sql.Int, value: insigniaId },
      }
    );

    nuevasInsignias.push(regla.nombre);
  }

  return nuevasInsignias;
}

async function obtenerInsignias(req, res) {
  try {
    const { usuarioId } = req.params;

    const result = await query(
      `SELECT i.id, i.nombre, i.descripcion, i.icono, ui.fecha_obtenida
       FROM usuario_insignias ui
       INNER JOIN insignias i ON i.id = ui.insignia_id
       WHERE ui.usuario_id = @uid
       ORDER BY ui.fecha_obtenida DESC`,
      { uid: { type: sql.Int, value: parseInt(usuarioId) } }
    );

    res.json({ insignias: result.recordset });
  } catch (error) {
    console.error("Error al obtener insignias:", error);
    res.status(500).json({ error: "Error al obtener insignias" });
  }
}


async function completarModulo(req, res) {
  try {
    const { usuarioId, moduloId } = req.body;

    if (!usuarioId || !moduloId) {
      return res.status(400).json({ error: "usuarioId y moduloId son requeridos" });
    }

    await query(
      `IF NOT EXISTS (
         SELECT 1 FROM progreso
         WHERE usuario_id = @uid AND modulo_id = @mid
       )
       INSERT INTO progreso (usuario_id, modulo_id, completado)
       VALUES (@uid, @mid, 1)
       ELSE
       UPDATE progreso SET completado = 1, fecha = GETDATE()
       WHERE usuario_id = @uid AND modulo_id = @mid`,
      {
        uid: { type: sql.Int, value: usuarioId },
        mid: { type: sql.Int, value: moduloId  },
      }
    );

    const { puntajeporModulo } = require("../services/pointsService");
    await puntajeporModulo(usuarioId);

    const nuevasInsignias = await verificarYAsignarInsignias(usuarioId);

    const totalPuntos = await obtenerTotalPuntos(usuarioId);

    res.json({
      mensaje: "Módulo completado",
      totalPuntos,
      nuevasInsignias,  
    });
  } catch (error) {
    console.error("Error al completar módulo:", error);
    res.status(500).json({ error: "Error al completar módulo" });
  }
}

async function obtenerRanking(req, res) {
  try {
    const result = await query(
      `SELECT TOP 10
         usuario_id, nombre, total_puntos, posicion
       FROM ranking
       ORDER BY posicion ASC`
    );

    res.json({ ranking: result.recordset });
  } catch (error) {
    console.error("Error al obtener ranking:", error);
    res.status(500).json({ error: "Error al obtener ranking" });
  }
}

async function misPuntos(req, res) {
  try {
    const { usuarioId } = req.params;

    const result = await query(
      `SELECT usuario_id, nombre, total_puntos, posicion
       FROM ranking
       WHERE usuario_id = @uid`,
      { uid: { type: sql.Int, value: parseInt(usuarioId) } }
    );

    if (result.recordset.length === 0) {
      return res.json({ totalPuntos: 0, posicion: null });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener puntos:", error);
    res.status(500).json({ error: "Error al obtener puntos" });
  }
}

module.exports = {
  obtenerInsignias,
  completarModulo,
  obtenerRanking,
  misPuntos,
};
