/**
 * GamificationObserver.js
 *
 * PATRÓN APLICADO: Observer (Comportamiento)
 *
 * Intención: Definir una dependencia uno-a-muchos entre objetos
 * de manera que, cuando uno cambie de estado, todos sus
 * dependientes sean notificados y actualizados automáticamente.
 *
 * Problema que resuelve: En gamificationController.js, completarModulo()
 * llama directamente a puntos → insignias → ranking en secuencia rígida.
 * Si se agrega un nuevo efecto (ej: notificación push, email, logro especial),
 * hay que editar el controlador. Con Observer, solo se registra un nuevo
 * suscriptor sin tocar el código existente.
 *
 * Roles:
 *   EventoGamificacion → Sujeto (Subject): emite eventos
 *   ObserverGamificacion → Interfaz del observador
 *   PuntosObserver → observador concreto: da puntos
 *   InsigniasObserver → observador concreto: verifica badges
 *   LogObserver → observador concreto: registra en consola
 */

const { PointsRepository } = require("../repositories/PointsRepository");
const {
  ModuloCompletadoStrategy,
  CursoCompletadoStrategy,
  PrimerAccesoStrategy,
  ContextoPuntos,
} = require("../strategies/PuntosStrategy");
const { query, sql } = require("../config/db");
const { UMBRAL_INSIGNIA, INSIGNIA } = require("../utils/constants");

// ─────────────────────────────────────────────
// INTERFAZ: contrato de todos los observadores
// ─────────────────────────────────────────────
class ObserverGamificacion {
  /**
   * @param {string} evento - nombre del evento emitido
   * @param {{ usuarioId: number, [key: string]: any }} datos
   */
  async actualizar(evento, datos) {
    throw new Error("actualizar() debe implementarse en la subclase");
  }
}

// ─────────────────────────────────────────────
// OBSERVADOR 1: maneja la asignación de puntos
// ─────────────────────────────────────────────
class PuntosObserver extends ObserverGamificacion {
  async actualizar(evento, { usuarioId }) {
    const repositorio = new PointsRepository();

    const estrategiaPorEvento = {
      "modulo:completado": new ModuloCompletadoStrategy(),
      "curso:completado":  new CursoCompletadoStrategy(),
      "usuario:acceso":    new PrimerAccesoStrategy(),
    };

    const estrategia = estrategiaPorEvento[evento];
    if (!estrategia) return; // evento no relacionado con puntos

    const contexto = new ContextoPuntos(estrategia, repositorio);
    const resultado = await contexto.ejecutar(usuarioId);

    if (resultado.asignado) {
      console.log(`[PuntosObserver] +${resultado.cantidad} pts a usuario ${usuarioId} por ${resultado.motivo}`);
    }

    return resultado;
  }
}

// ─────────────────────────────────────────────
// OBSERVADOR 2: verifica y asigna insignias
// ─────────────────────────────────────────────
class InsigniasObserver extends ObserverGamificacion {
  async actualizar(evento, { usuarioId }) {
    // Solo reacciona a eventos de progreso
    if (!["modulo:completado", "curso:completado"].includes(evento)) return;

    const resModulos = await query(
      `SELECT COUNT(*) AS total FROM progreso
       WHERE usuario_id = @uid AND completado = 1`,
      { uid: { type: sql.Int, value: usuarioId } }
    );
    const modulosCompletados = resModulos.recordset[0].total;

    const repositorio = new PointsRepository();
    const totalPuntos = await repositorio.obtenerTotal(usuarioId);

    const reglas = [
      { umbral: UMBRAL_INSIGNIA.PRIMER_MODULO,     nombre: INSIGNIA.PRIMER_PASO,       tipo: "modulos" },
      { umbral: UMBRAL_INSIGNIA.ESTUDIANTE_ACTIVO, nombre: INSIGNIA.ESTUDIANTE_ACTIVO, tipo: "modulos" },
      { umbral: UMBRAL_INSIGNIA.EXPERTO,           nombre: INSIGNIA.EXPERTO,           tipo: "modulos" },
      { umbral: UMBRAL_INSIGNIA.MAESTRO,           nombre: INSIGNIA.MAESTRO,           tipo: "modulos" },
      { umbral: UMBRAL_INSIGNIA.PUNTAJE_BRONCE,    nombre: INSIGNIA.BRONCE,            tipo: "puntos"  },
      { umbral: UMBRAL_INSIGNIA.PUNTAJE_PLATA,     nombre: INSIGNIA.PLATA,             tipo: "puntos"  },
      { umbral: UMBRAL_INSIGNIA.PUNTAJE_ORO,       nombre: INSIGNIA.ORO,               tipo: "puntos"  },
    ];

    const nuevas = [];

    for (const regla of reglas) {
      const valor = regla.tipo === "modulos" ? modulosCompletados : totalPuntos;
      if (valor < regla.umbral) continue;

      const resInsignia = await query(
        `SELECT id FROM insignias WHERE nombre = @nombre`,
        { nombre: { type: sql.VarChar, value: regla.nombre } }
      );
      if (!resInsignia.recordset.length) continue;

      const insigniaId = resInsignia.recordset[0].id;

      const yaLaTiene = await query(
        `SELECT id FROM usuario_insignias
         WHERE usuario_id = @uid AND insignia_id = @iid`,
        {
          uid: { type: sql.Int, value: usuarioId  },
          iid: { type: sql.Int, value: insigniaId },
        }
      );
      if (yaLaTiene.recordset.length) continue;

      await query(
        `INSERT INTO usuario_insignias (usuario_id, insignia_id) VALUES (@uid, @iid)`,
        {
          uid: { type: sql.Int, value: usuarioId  },
          iid: { type: sql.Int, value: insigniaId },
        }
      );
      nuevas.push(regla.nombre);
      console.log(`[InsigniasObserver] 🏅 ${regla.nombre} para usuario ${usuarioId}`);
    }

    return nuevas;
  }
}

// ─────────────────────────────────────────────
// OBSERVADOR 3: log de auditoría (simple)
// ─────────────────────────────────────────────
class LogObserver extends ObserverGamificacion {
  async actualizar(evento, datos) {
    const ts = new Date().toISOString();
    console.log(`[LogObserver] ${ts} | evento: ${evento} | usuario: ${datos.usuarioId}`);
  }
}

// ─────────────────────────────────────────────
// SUJETO: emite eventos y notifica observadores
// ─────────────────────────────────────────────
class EventoGamificacion {
  constructor() {
    /** @type {ObserverGamificacion[]} */
    this.observadores = [];
  }

  /**
   * Registra un nuevo observador.
   * @param {ObserverGamificacion} observador
   */
  suscribir(observador) {
    this.observadores.push(observador);
  }

  /**
   * Elimina un observador.
   * @param {ObserverGamificacion} observador
   */
  desuscribir(observador) {
    this.observadores = this.observadores.filter((o) => o !== observador);
  }

  /**
   * Notifica a todos los observadores con el evento y sus datos.
   * @param {string} evento
   * @param {Object} datos
   * @returns {Promise<any[]>} resultados de cada observador
   */
  async emitir(evento, datos) {
    const resultados = await Promise.all(
      this.observadores.map((obs) => obs.actualizar(evento, datos))
    );
    return resultados;
  }
}

// ─────────────────────────────────────────────
// INSTANCIA LISTA PARA USAR: canal con los
// 3 observadores ya registrados
// ─────────────────────────────────────────────
const canalGamificacion = new EventoGamificacion();
canalGamificacion.suscribir(new LogObserver());
canalGamificacion.suscribir(new PuntosObserver());
canalGamificacion.suscribir(new InsigniasObserver());

module.exports = {
  canalGamificacion,
  EventoGamificacion,
  ObserverGamificacion,
  PuntosObserver,
  InsigniasObserver,
  LogObserver,
};