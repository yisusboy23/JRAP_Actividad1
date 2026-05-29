/**
 * courseController.test.js — Pruebas UNITARIAS
 *
 * Qué se prueba: calcularPorcentaje()
 * Por qué es unitaria: función pura, sin DB, sin red.
 * Se extrae la función para testearla aislada del controlador.
 */

// ── Extraemos la función pura del controlador ──────────────
// En tu proyecto real, podés exportarla desde courseController.js
// agregando: module.exports = { ..., calcularPorcentaje }
// Acá la redefinimos idénticamente para mostrar el test:

const { calcularPorcentaje } = require("../controllers/courseController");

// ── Tests ──────────────────────────────────────────────────

describe("calcularPorcentaje()", () => {

  test("retorna 0 si no hay módulos (evita división por cero)", () => {
    expect(calcularPorcentaje(0, 0)).toBe(0);
  });

  test("retorna 0 si ningún módulo está completado", () => {
    expect(calcularPorcentaje(0, 5)).toBe(0);
  });

  test("retorna 100 si todos los módulos están completados", () => {
    expect(calcularPorcentaje(5, 5)).toBe(100);
  });

  test("retorna 50 si la mitad está completada", () => {
    expect(calcularPorcentaje(3, 6)).toBe(50);
  });

  test("redondea correctamente (2 de 3 = 67%)", () => {
    expect(calcularPorcentaje(2, 3)).toBe(67);
  });

  test("retorna 100 solo cuando completados === totalModulos", () => {
    expect(calcularPorcentaje(10, 10)).toBe(100);
    expect(calcularPorcentaje(9,  10)).not.toBe(100);
  });

});