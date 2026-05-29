/**
 * gamificationController.js — versión refactorizada con patrones
 *
 * CAMBIO PRINCIPAL:
 * completarModulo() ya NO llama directamente a puntos e insignias.
 * Ahora emite un evento al canalGamificacion (Observer),
 * y los observadores suscritos reaccionan de forma independiente.
 *
 * Resultado: el controlador no sabe nada de puntos ni de insignias.
 * Solo sabe que "ocurrió algo" y lo anuncia.
 */

const { query, sql } = require("../config/db");
const { PointsRepository } = require("../repositories/PointsRepository");
const { canalGamificacion } = require("../observers/GamificationObserver");

// ─────────────────────────────────────────────
// GET /api/gamification/insignias/:usuarioId
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// POST /api/gamification/completar-modulo
// Ahora usa Observer — emite evento y listo
// ─────────────────────────────────────────────
async function completarModulo(req, res) {
  try {
    const { usuarioId, moduloId } = req.body;

    if (!usuarioId || !moduloId) {
      return res.status(400).json({ error: "usuarioId y moduloId son requeridos" });
    }

    // 1. Registrar progreso en DB
    await query(
      `IF NOT EXISTS (
         SELECT 1 FROM progreso WHERE usuario_id = @uid AND modulo_id = @mid
       )
       INSERT INTO progreso (usuario_id, modulo_id, completado) VALUES (@uid, @mid, 1)
       ELSE
       UPDATE progreso SET completado = 1, fecha = GETDATE()
       WHERE usuario_id = @uid AND modulo_id = @mid`,
      {
        uid: { type: sql.Int, value: usuarioId },
        mid: { type: sql.Int, value: moduloId  },
      }
    );

    // 2. Emitir evento — Observer notifica a PuntosObserver e InsigniasObserver
    const resultados = await canalGamificacion.emitir("modulo:completado", { usuarioId, moduloId });

    // 3. Extraer resultados de los observadores
    // resultados[0] = LogObserver (undefined), [1] = PuntosObserver, [2] = InsigniasObserver
    const resPuntos    = resultados[1] || {};
    const nuevasInsignias = resultados[2] || [];

    // 4. Obtener total de puntos actualizado
    const repositorio  = new PointsRepository();
    const totalPuntos  = await repositorio.obtenerTotal(usuarioId);

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

// ─────────────────────────────────────────────
// GET /api/gamification/ranking
// ─────────────────────────────────────────────
async function obtenerRanking(req, res) {
  try {
    const result = await query(
      `SELECT TOP 10 usuario_id, nombre, total_puntos, posicion
       FROM ranking ORDER BY posicion ASC`
    );
    res.json({ ranking: result.recordset });
  } catch (error) {
    console.error("Error al obtener ranking:", error);
    res.status(500).json({ error: "Error al obtener ranking" });
  }
}

// ─────────────────────────────────────────────
// GET /api/gamification/mis-puntos/:usuarioId
// ─────────────────────────────────────────────
async function misPuntos(req, res) {
  try {
    const { usuarioId } = req.params;
    const result = await query(
      `SELECT usuario_id, nombre, total_puntos, posicion
       FROM ranking WHERE usuario_id = @uid`,
      { uid: { type: sql.Int, value: parseInt(usuarioId) } }
    );
    if (!result.recordset.length) {
      return res.json({ totalPuntos: 0, posicion: null });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener puntos:", error);
    res.status(500).json({ error: "Error al obtener puntos" });
  }
}

module.exports = { obtenerInsignias, completarModulo, obtenerRanking, misPuntos };