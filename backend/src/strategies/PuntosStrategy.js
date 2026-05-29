/**
 * PuntosStrategy.js
 *
 * PATRÓN APLICADO: Strategy (Comportamiento)
 *
 * Intención: Definir una familia de algoritmos (estrategias
 * de asignación de puntos), encapsular cada uno y hacerlos
 * intercambiables. El cliente (pointsService) usa la estrategia
 * sin conocer su implementación interna.
 *
 * Problema que resuelve: En la versión anterior, pointsService
 * tenía funciones sueltas (puntajeporModulo, puntajePorCurso,
 * puntajePrimerAcceso). Si se agrega un nuevo evento de puntos,
 * hay que editar ese archivo. Con Strategy, solo se agrega
 * una nueva clase sin tocar las existentes (principio Abierto/Cerrado).
 *
 * Estructura:
 *   PuntosStrategy (interfaz/contrato)
 *     ├── ModuloCompletadoStrategy
 *     ├── CursoCompletadoStrategy
 *     ├── PrimerAccesoStrategy
 *     └── RachaSemanalStrategy
 */

const { PUNTOS, MOTIVO_PUNTOS } = require("../utils/constants");

// ─────────────────────────────────────────────
// CONTRATO: todas las estrategias implementan
// los mismos métodos (duck typing en JS)
// ─────────────────────────────────────────────
class PuntosStrategy {
  /** @returns {number} cantidad de puntos a dar */
  getCantidad() {
    throw new Error("getCantidad() debe implementarse en la subclase");
  }
  /** @returns {string} motivo para registrar en DB */
  getMotivo() {
    throw new Error("getMotivo() debe implementarse en la subclase");
  }
  /**
   * Lógica de elegibilidad: ¿se pueden dar los puntos?
   * Por defecto siempre se pueden. Las subclases pueden sobreescribir.
   * @param {number} _usuarioId
   * @param {Object} _repositorio
   * @returns {Promise<boolean>}
   */
  async esElegible(_usuarioId, _repositorio) {
    return true;
  }
}

// ─────────────────────────────────────────────
// Estrategia 1: puntos por completar un módulo
// ─────────────────────────────────────────────
class ModuloCompletadoStrategy extends PuntosStrategy {
  getCantidad() { return PUNTOS.COMPLETAR_MODULO; }
  getMotivo()   { return MOTIVO_PUNTOS.MODULO; }
}

// ─────────────────────────────────────────────
// Estrategia 2: puntos por completar un curso
// ─────────────────────────────────────────────
class CursoCompletadoStrategy extends PuntosStrategy {
  getCantidad() { return PUNTOS.COMPLETAR_CURSO; }
  getMotivo()   { return MOTIVO_PUNTOS.CURSO; }
}

// ─────────────────────────────────────────────
// Estrategia 3: puntos de primer acceso del día
// Solo elegible si aún no los recibió hoy
// ─────────────────────────────────────────────
class PrimerAccesoStrategy extends PuntosStrategy {
  getCantidad() { return PUNTOS.PRIMER_ACCESO; }
  getMotivo()   { return MOTIVO_PUNTOS.ACCESO; }

  async esElegible(usuarioId, repositorio) {
    const yaRecibio = await repositorio.existeHoyPorMotivo(
      usuarioId,
      MOTIVO_PUNTOS.ACCESO
    );
    return !yaRecibio;
  }
}

// ─────────────────────────────────────────────
// Estrategia 4: puntos por racha semanal
// Solo elegible si completó 7 días seguidos
// ─────────────────────────────────────────────
class RachaSemanalStrategy extends PuntosStrategy {
  getCantidad() { return PUNTOS.RACHA_7_DIAS; }
  getMotivo()   { return MOTIVO_PUNTOS.RACHA; }

  async esElegible(usuarioId, repositorio) {
    // Verifica que no haya recibido puntos de racha esta semana
    const yaRecibio = await repositorio.existeHoyPorMotivo(
      usuarioId,
      MOTIVO_PUNTOS.RACHA
    );
    return !yaRecibio;
  }
}

// ─────────────────────────────────────────────
// CONTEXTO: usa la estrategia inyectada
// El servicio nunca sabe qué estrategia ejecuta
// ─────────────────────────────────────────────
class ContextoPuntos {
  /**
   * @param {PuntosStrategy} estrategia
   * @param {PointsRepository} repositorio
   */
  constructor(estrategia, repositorio) {
    this.estrategia  = estrategia;
    this.repositorio = repositorio;
  }

  /**
   * Ejecuta la estrategia: verifica elegibilidad y guarda puntos.
   * @param {number} usuarioId
   * @returns {Promise<{asignado: boolean, cantidad: number, motivo: string}>}
   */
  async ejecutar(usuarioId) {
    const elegible = await this.estrategia.esElegible(
      usuarioId,
      this.repositorio
    );

    if (!elegible) {
      return { asignado: false, cantidad: 0, motivo: this.estrategia.getMotivo() };
    }

    const cantidad = this.estrategia.getCantidad();
    const motivo   = this.estrategia.getMotivo();

    await this.repositorio.guardar(usuarioId, cantidad, motivo);

    return { asignado: true, cantidad, motivo };
  }
}

module.exports = {
  PuntosStrategy,
  ModuloCompletadoStrategy,
  CursoCompletadoStrategy,
  PrimerAccesoStrategy,
  RachaSemanalStrategy,
  ContextoPuntos,
};