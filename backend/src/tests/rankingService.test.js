/**
 * rankingService.test.js — Pruebas UNITARIAS con mock de DB
 * Cubre: obtenerRanking, obtenerPosicionDeUsuario, etiquetaDePosicion
 */

jest.mock("../config/db", () => ({
  sql: { Int: "Int", VarChar: "VarChar" },
  query: jest.fn(),
}));

const { query } = require("../config/db");
const { obtenerRanking, obtenerPosicionDeUsuario } = require("../services/rankingService");

describe("obtenerRanking()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna el ranking enriquecido con etiquetas", async () => {
    query.mockResolvedValue({
      recordset: [
        { id: 1, nombre: "Ana",   total_puntos: 200, posicion: 1 },
        { id: 2, nombre: "Luis",  total_puntos: 100, posicion: 2 },
        { id: 3, nombre: "María", total_puntos: 50,  posicion: 3 },
      ],
    });
    const ranking = await obtenerRanking(3);
    expect(ranking).toHaveLength(3);
    expect(ranking[0].etiqueta).toBe("🥇 Primer lugar");
    expect(ranking[1].etiqueta).toBe("🥈 Segundo lugar");
    expect(ranking[2].etiqueta).toBe("🥉 Tercer lugar");
  });

  test("retorna array vacío si no hay estudiantes", async () => {
    query.mockResolvedValue({ recordset: [] });
    const ranking = await obtenerRanking();
    expect(ranking).toHaveLength(0);
  });

  test("posición 5 tiene etiqueta Top 10", async () => {
    query.mockResolvedValue({
      recordset: [{ id: 5, nombre: "Pedro", total_puntos: 30, posicion: 5 }],
    });
    const ranking = await obtenerRanking(1);
    expect(ranking[0].etiqueta).toBe("Top 10");
  });
});

describe("obtenerPosicionDeUsuario()", () => {
  beforeEach(() => jest.clearAllMocks());

  test("retorna posición y etiqueta del usuario", async () => {
    query.mockResolvedValue({
      recordset: [{ nombre: "Ana", total_puntos: 200, posicion: 1 }],
    });
    const resultado = await obtenerPosicionDeUsuario(1);
    expect(resultado.posicion).toBe(1);
    expect(resultado.etiqueta).toBe("🥇 Primer lugar");
  });

  test("retorna null si el usuario no existe", async () => {
    query.mockResolvedValue({ recordset: [] });
    const resultado = await obtenerPosicionDeUsuario(999);
    expect(resultado).toBeNull();
  });
});