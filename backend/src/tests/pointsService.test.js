/**
 * pointsService.test.js — Pruebas UNITARIAS
 * Cubre: asignarPuntos, obtenerTotalPuntos, puntajePrimerAcceso
 */

jest.mock("../config/db", () => ({
  sql: { Int: "Int", VarChar: "VarChar" },
  query: jest.fn(),
}));

const { query } = require("../config/db");
const {
  asignarPuntos,
  obtenerTotalPuntos,
  puntajePrimerAcceso,
  puntajeporModulo,
  puntajePorCurso,
} = require("../services/pointsService");

const { PUNTOS, MOTIVO_PUNTOS } = require("../utils/constants");

describe("asignarPuntos()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("ejecuta INSERT con los valores correctos", async () => {
    query.mockResolvedValue({ recordset: [] });
    await asignarPuntos(1, 10, "modulo_completado");
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain("INSERT INTO puntos");
  });
});

describe("obtenerTotalPuntos()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna la suma total de puntos", async () => {
    query.mockResolvedValue({ recordset: [{ total: 75 }] });
    const total = await obtenerTotalPuntos(1);
    expect(total).toBe(75);
  });
});

describe("puntajePrimerAcceso()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("asigna puntos si el usuario no los tuvo hoy", async () => {
    // Primera llamada: yaTuvoPuntosHoy → 0 veces
    // Segunda llamada: asignarPuntos → INSERT
    query
      .mockResolvedValueOnce({ recordset: [{ veces: 0 }] })
      .mockResolvedValueOnce({ recordset: [] });

    const resultado = await puntajePrimerAcceso(1);
    expect(resultado).toBe(true);
    expect(query).toHaveBeenCalledTimes(2);
  });

  test("NO asigna puntos si el usuario ya los tuvo hoy", async () => {
    query.mockResolvedValueOnce({ recordset: [{ veces: 1 }] });
    const resultado = await puntajePrimerAcceso(1);
    expect(resultado).toBe(false);
    expect(query).toHaveBeenCalledTimes(1); // solo el SELECT, no el INSERT
  });
});

describe("puntajeporModulo()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("llama a asignarPuntos con COMPLETAR_MODULO", async () => {
    query.mockResolvedValue({ recordset: [] });

    await puntajeporModulo(1);

    expect(query).toHaveBeenCalledTimes(1);

    const [, params] = query.mock.calls[0];

    expect(params.cantidad.value).toBe(PUNTOS.COMPLETAR_MODULO);
    expect(params.motivo.value).toBe(MOTIVO_PUNTOS.MODULO);
  });
});

describe("puntajePorCurso()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("llama a asignarPuntos con COMPLETAR_CURSO", async () => {
    query.mockResolvedValue({ recordset: [] });

    await puntajePorCurso(1);

    expect(query).toHaveBeenCalledTimes(1);

    const [, params] = query.mock.calls[0];

    expect(params.cantidad.value).toBe(PUNTOS.COMPLETAR_CURSO);
    expect(params.motivo.value).toBe(MOTIVO_PUNTOS.CURSO);
  });
});