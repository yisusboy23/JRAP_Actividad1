/**
 * pointsRepository.test.js — Pruebas UNITARIAS
 * Cubre: guardar, obtenerTotal, existeHoyPorMotivo, obtenerHistorial
 */

jest.mock("../config/db", () => ({
  sql: { Int: "Int", VarChar: "VarChar" },
  query: jest.fn(),
}));

const { query } = require("../config/db");
const { PointsRepository } = require("../repositories/PointsRepository");

describe("PointsRepository", () => {
  let repo;
  beforeEach(() => {
    repo = new PointsRepository();
    jest.clearAllMocks();
  });

  describe("guardar()", () => {
    test("ejecuta INSERT con los parámetros correctos", async () => {
      query.mockResolvedValue({ recordset: [] });
      await repo.guardar(1, 10, "modulo_completado");
      expect(query).toHaveBeenCalledTimes(1);
      const [sql, params] = query.mock.calls[0];
      expect(sql).toContain("INSERT INTO puntos");
      expect(params.usuarioId.value).toBe(1);
      expect(params.cantidad.value).toBe(10);
      expect(params.motivo.value).toBe("modulo_completado");
    });

    test("propaga el error si la DB falla", async () => {
      query.mockRejectedValue(new Error("DB error"));
      await expect(repo.guardar(1, 10, "modulo_completado")).rejects.toThrow("DB error");
    });
  });

  describe("obtenerTotal()", () => {
    test("retorna el total de puntos del usuario", async () => {
      query.mockResolvedValue({ recordset: [{ total: 150 }] });
      const total = await repo.obtenerTotal(5);
      expect(total).toBe(150);
    });

    test("retorna 0 si el usuario no tiene puntos", async () => {
      query.mockResolvedValue({ recordset: [{ total: 0 }] });
      const total = await repo.obtenerTotal(99);
      expect(total).toBe(0);
    });
  });

  describe("existeHoyPorMotivo()", () => {
    test("retorna true si ya recibió puntos hoy", async () => {
      query.mockResolvedValue({ recordset: [{ veces: 1 }] });
      const existe = await repo.existeHoyPorMotivo(1, "primer_acceso_dia");
      expect(existe).toBe(true);
    });

    test("retorna false si no recibió puntos hoy", async () => {
      query.mockResolvedValue({ recordset: [{ veces: 0 }] });
      const existe = await repo.existeHoyPorMotivo(1, "primer_acceso_dia");
      expect(existe).toBe(false);
    });
  });

  describe("obtenerHistorial()", () => {
    test("retorna el array de registros de puntos", async () => {
      const mockData = [
        { cantidad: 10, motivo: "modulo_completado", fecha: "2025-01-01" },
        { cantidad: 5,  motivo: "primer_acceso_dia", fecha: "2025-01-02" },
      ];
      query.mockResolvedValue({ recordset: mockData });
      const historial = await repo.obtenerHistorial(1);
      expect(historial).toHaveLength(2);
      expect(historial[0].motivo).toBe("modulo_completado");
    });

    test("retorna array vacío si no hay historial", async () => {
      query.mockResolvedValue({ recordset: [] });
      const historial = await repo.obtenerHistorial(99);
      expect(historial).toHaveLength(0);
    });
  });
});