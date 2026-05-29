/**
 * strategy.test.js — Pruebas UNITARIAS
 *
 * Qué se prueba: todas las clases Strategy de PuntosStrategy.js
 * Por qué es unitaria: getCantidad() y getMotivo() son métodos
 * puros que no tocan la DB. esElegible() se prueba con mock.
 *
 * TÉCNICA USADA: jest.fn() para simular el repositorio
 * sin necesitar una base de datos real.
 */

const {
  ModuloCompletadoStrategy,
  CursoCompletadoStrategy,
  PrimerAccesoStrategy,
  RachaSemanalStrategy,
  ContextoPuntos,
} = require("../strategies/PuntosStrategy");

const { PUNTOS, MOTIVO_PUNTOS } = require("../utils/constants");

// ──────────────────────────────────────────────────────────
// Pruebas de ModuloCompletadoStrategy
// ──────────────────────────────────────────────────────────
describe("ModuloCompletadoStrategy", () => {
  const estrategia = new ModuloCompletadoStrategy();

  test("getCantidad() retorna los puntos correctos", () => {
    expect(estrategia.getCantidad()).toBe(PUNTOS.COMPLETAR_MODULO);
  });

  test("getMotivo() retorna el motivo correcto", () => {
    expect(estrategia.getMotivo()).toBe(MOTIVO_PUNTOS.MODULO);
  });

  test("esElegible() siempre retorna true (sin restricciones)", async () => {
    const repoMock = {};
    expect(await estrategia.esElegible(1, repoMock)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────
// Pruebas de CursoCompletadoStrategy
// ──────────────────────────────────────────────────────────
describe("CursoCompletadoStrategy", () => {
  const estrategia = new CursoCompletadoStrategy();

  test("getCantidad() retorna puntos de curso completo", () => {
    expect(estrategia.getCantidad()).toBe(PUNTOS.COMPLETAR_CURSO);
  });

  test("getCantidad() es mayor que por módulo (bonus de curso)", () => {
    expect(estrategia.getCantidad()).toBeGreaterThan(PUNTOS.COMPLETAR_MODULO);
  });

  test("getMotivo() retorna el motivo de curso", () => {
    expect(estrategia.getMotivo()).toBe(MOTIVO_PUNTOS.CURSO);
  });
});

// ──────────────────────────────────────────────────────────
// Pruebas de PrimerAccesoStrategy
// ──────────────────────────────────────────────────────────
describe("PrimerAccesoStrategy", () => {
  const estrategia = new PrimerAccesoStrategy();

  test("getCantidad() retorna puntos de primer acceso", () => {
    expect(estrategia.getCantidad()).toBe(PUNTOS.PRIMER_ACCESO);
  });

  test("esElegible() retorna TRUE si el usuario NO tuvo puntos hoy", async () => {
    // Simulamos repositorio que dice "no tuvo puntos hoy"
    const repoMock = {
      existeHoyPorMotivo: jest.fn().mockResolvedValue(false),
    };
    const resultado = await estrategia.esElegible(42, repoMock);
    expect(resultado).toBe(true);
  });

  test("esElegible() retorna FALSE si el usuario YA tuvo puntos hoy", async () => {
    // Simulamos repositorio que dice "ya tuvo puntos hoy"
    const repoMock = {
      existeHoyPorMotivo: jest.fn().mockResolvedValue(true),
    };
    const resultado = await estrategia.esElegible(42, repoMock);
    expect(resultado).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────
// Pruebas del ContextoPuntos (integra Strategy + Repository)
// ──────────────────────────────────────────────────────────
describe("ContextoPuntos", () => {

  test("ejecutar() guarda puntos cuando la estrategia es elegible", async () => {
    const estrategiaMock = {
      getCantidad:  jest.fn().mockReturnValue(10),
      getMotivo:    jest.fn().mockReturnValue("modulo_completado"),
      esElegible:   jest.fn().mockResolvedValue(true),
    };
    const repoMock = {
      guardar: jest.fn().mockResolvedValue(undefined),
    };

    const contexto  = new ContextoPuntos(estrategiaMock, repoMock);
    const resultado = await contexto.ejecutar(1);

    expect(resultado.asignado).toBe(true);
    expect(resultado.cantidad).toBe(10);
    expect(repoMock.guardar).toHaveBeenCalledWith(1, 10, "modulo_completado");
  });

  test("ejecutar() NO guarda puntos cuando la estrategia NO es elegible", async () => {
    const estrategiaMock = {
      getCantidad:  jest.fn().mockReturnValue(5),
      getMotivo:    jest.fn().mockReturnValue("primer_acceso_dia"),
      esElegible:   jest.fn().mockResolvedValue(false), // ya recibió puntos hoy
    };
    const repoMock = {
      guardar: jest.fn(),
    };

    const contexto  = new ContextoPuntos(estrategiaMock, repoMock);
    const resultado = await contexto.ejecutar(1);

    expect(resultado.asignado).toBe(false);
    expect(repoMock.guardar).not.toHaveBeenCalled(); // no se guardó nada
  });

});