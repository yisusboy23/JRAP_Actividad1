const { query, sql } = require("../config/db");
const { PUNTOS, MOTIVO_PUNTOS } = require("../utils/constants");

async function asignarPuntos(usuarioId, cantidad, motivo) {
  await query(
    `INSERT INTO puntos (usuario_id, cantidad, motivo, fecha)
     VALUES (@usuarioId, @cantidad, @motivo, GETDATE())`,
    {
      usuarioId: { type: sql.Int, value: usuarioId },
      cantidad: { type: sql.Int, value: cantidad },
      motivo: { type: sql.VarChar, value: motivo },
    }
  );
}

async function obtenerTotalPuntos(usuarioId) {
  const result = await query(
    `SELECT ISNULL(SUM(cantidad), 0) AS total
     FROM puntos
     WHERE usuario_id = @usuarioId`,
    { usuarioId: { type: sql.Int, value: usuarioId } }
  );

  return result.recordset[0].total;
}

async function yaTuvoPuntosHoy(usuarioId) {
  const result = await query(
    `SELECT COUNT(*) AS veces
     FROM puntos
     WHERE usuario_id = @usuarioId
       AND motivo = @motivo
       AND CAST(fecha AS DATE) = CAST(GETDATE() AS DATE)`,
    {
      usuarioId: { type: sql.Int, value: usuarioId },
      motivo: { type: sql.VarChar, value: MOTIVO_PUNTOS.ACCESO },
    }
  );

  return result.recordset[0].veces > 0;
}

async function puntajeporModulo(usuarioId) {
  await asignarPuntos(
    usuarioId,
    PUNTOS.COMPLETAR_MODULO,
    MOTIVO_PUNTOS.MODULO
  );
}

async function puntajePorCurso(usuarioId) {
  await asignarPuntos(
    usuarioId,
    PUNTOS.COMPLETAR_CURSO,
    MOTIVO_PUNTOS.CURSO
  );
}

async function puntajePrimerAcceso(usuarioId) {
  const yaRecibio = await yaTuvoPuntosHoy(usuarioId);

  if (yaRecibio) return false;

  await asignarPuntos(
    usuarioId,
    PUNTOS.PRIMER_ACCESO,
    MOTIVO_PUNTOS.ACCESO
  );

  return true;
}

module.exports = {
  asignarPuntos,
  obtenerTotalPuntos,
  puntajeporModulo,
  puntajePorCurso,
  puntajePrimerAcceso,
};