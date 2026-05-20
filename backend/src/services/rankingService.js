const { query, sql } = require("../config/db");

function etiquetaDePosicion(posicion) {
  if (posicion === 1) return "🥇 Primer lugar";
  if (posicion === 2) return "🥈 Segundo lugar";
  if (posicion === 3) return "🥉 Tercer lugar";
  if (posicion <= 10) return "Top 10";
  return `Posición ${posicion}`;
}

async function obtenerRanking(limite = 10) {
  const result = await query(
    `SELECT TOP (@limite)
       u.id,
       u.nombre,
       ISNULL(SUM(p.cantidad), 0) AS total_puntos,
       RANK() OVER (ORDER BY ISNULL(SUM(p.cantidad), 0) DESC) AS posicion
     FROM usuarios u
     LEFT JOIN puntos p ON p.usuario_id = u.id
     WHERE u.rol = 'estudiante'
     GROUP BY u.id, u.nombre
     ORDER BY total_puntos DESC`,
    { limite: { type: sql.Int, value: limite } }
  );

  return result.recordset.map((fila) => ({
    ...fila,
    etiqueta: etiquetaDePosicion(fila.posicion),
  }));
}

async function obtenerPosicionDeUsuario(usuarioId) {
  const result = await query(
    `SELECT posicion, total_puntos, nombre
     FROM (
       SELECT
         u.id,
         u.nombre,
         ISNULL(SUM(p.cantidad), 0) AS total_puntos,
         RANK() OVER (ORDER BY ISNULL(SUM(p.cantidad), 0) DESC) AS posicion
       FROM usuarios u
       LEFT JOIN puntos p ON p.usuario_id = u.id
       WHERE u.rol = 'estudiante'
       GROUP BY u.id, u.nombre
     ) ranking
     WHERE id = @usuarioId`,
    { usuarioId: { type: sql.Int, value: usuarioId } }
  );

  if (result.recordset.length === 0) return null;

  const fila = result.recordset[0];

  return {
    ...fila,
    etiqueta: etiquetaDePosicion(fila.posicion),
  };
}

module.exports = {
  obtenerRanking,
  obtenerPosicionDeUsuario,
};