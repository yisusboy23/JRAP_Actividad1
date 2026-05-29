/**
 * PointsRepository.js
 *
 * PATRÓN APLICADO: Repository (Estructural / GoF)
 *
 * Intención: Separar la lógica de acceso a datos de la
 * lógica de negocio. El repositorio actúa como una
 * colección en memoria desde el punto de vista del servicio,
 * ocultando los detalles del SQL subyacente.
 *
 * Problema que resuelve: En la versión anterior, pointsService.js
 * mezclaba la lógica de negocio ("¿ya tuvo puntos hoy?") con
 * el detalle de persistencia (INSERT INTO puntos...).
 * Si mañana cambia la DB, solo toca este archivo.
 *
 * Ahora: el servicio habla en términos de dominio (guardar,
 * obtenerTotal) y el repositorio traduce a SQL.
 */

const { query, sql } = require("../config/db");
const { MOTIVO_PUNTOS } = require("../utils/constants");

class PointsRepository {

  /**
   * Guarda un registro de puntos para un usuario.
   * @param {number} usuarioId
   * @param {number} cantidad
   * @param {string} motivo - usar constantes MOTIVO_PUNTOS
   */
  async guardar(usuarioId, cantidad, motivo) {
    await query(
      `INSERT INTO puntos (usuario_id, cantidad, motivo, fecha)
       VALUES (@usuarioId, @cantidad, @motivo, GETDATE())`,
      {
        usuarioId: { type: sql.Int,     value: usuarioId },
        cantidad:  { type: sql.Int,     value: cantidad  },
        motivo:    { type: sql.VarChar, value: motivo    },
      }
    );
  }

  /**
   * Retorna la suma total de puntos de un usuario.
   * @param {number} usuarioId
   * @returns {Promise<number>}
   */
  async obtenerTotal(usuarioId) {
    const result = await query(
      `SELECT ISNULL(SUM(cantidad), 0) AS total
       FROM puntos
       WHERE usuario_id = @usuarioId`,
      { usuarioId: { type: sql.Int, value: usuarioId } }
    );
    return result.recordset[0].total;
  }

  /**
   * Verifica si el usuario ya recibió puntos por un motivo
   * específico en el día actual.
   * @param {number} usuarioId
   * @param {string} motivo
   * @returns {Promise<boolean>}
   */
  async existeHoyPorMotivo(usuarioId, motivo) {
    const result = await query(
      `SELECT COUNT(*) AS veces
       FROM puntos
       WHERE usuario_id = @usuarioId
         AND motivo     = @motivo
         AND CAST(fecha AS DATE) = CAST(GETDATE() AS DATE)`,
      {
        usuarioId: { type: sql.Int,     value: usuarioId },
        motivo:    { type: sql.VarChar, value: motivo    },
      }
    );
    return result.recordset[0].veces > 0;
  }

  /**
   * Retorna el historial completo de puntos de un usuario.
   * @param {number} usuarioId
   * @returns {Promise<Array>}
   */
  async obtenerHistorial(usuarioId) {
    const result = await query(
      `SELECT cantidad, motivo, fecha
       FROM puntos
       WHERE usuario_id = @usuarioId
       ORDER BY fecha DESC`,
      { usuarioId: { type: sql.Int, value: usuarioId } }
    );
    return result.recordset;
  }
}

module.exports = { PointsRepository };