/**
 * gamification.integration.test.js — Prueba de INTEGRACIÓN
 *
 * Qué se prueba: los endpoints HTTP responden correctamente.
 * La DB se simula con jest.mock() — no necesita SQL Server.
 * Herramienta: Jest + Supertest.
 */

const request = require("supertest");

jest.mock("../config/db", () => ({
  sql: { Int: "Int", VarChar: "VarChar" },
  query: jest.fn(),
  getPool: jest.fn(),
}));

const { query } = require("../config/db");

const express = require("express");
const gamificationRoutes = require("../routes/gamificationRoutes");

const app = express();
app.use(express.json());
app.use("/api/gamification", gamificationRoutes);

// ──────────────────────────────────────────────────────────
describe("POST /api/gamification/completar-modulo", () => {

  beforeEach(() => jest.clearAllMocks());

  test("retorna 200 con totalPuntos y nuevasInsignias", async () => {
    // El mock devuelve lo correcto para CUALQUIER llamada a query()
    query.mockResolvedValue({ recordset: [{ total: 10, veces: 0 }] });

    const res = await request(app)
      .post("/api/gamification/completar-modulo")
      .send({ usuarioId: 1, moduloId: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("mensaje", "Módulo completado");
    expect(res.body).toHaveProperty("totalPuntos");
    expect(res.body).toHaveProperty("nuevasInsignias");
    expect(Array.isArray(res.body.nuevasInsignias)).toBe(true);
  });

  test("retorna 400 si falta usuarioId", async () => {
    const res = await request(app)
      .post("/api/gamification/completar-modulo")
      .send({ moduloId: 2 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("retorna 400 si falta moduloId", async () => {
    const res = await request(app)
      .post("/api/gamification/completar-modulo")
      .send({ usuarioId: 1 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("retorna 500 si la DB falla", async () => {
    query.mockRejectedValue(new Error("SQL Server no disponible"));

    const res = await request(app)
      .post("/api/gamification/completar-modulo")
      .send({ usuarioId: 1, moduloId: 2 });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });

});

describe("GET /api/gamification/ranking", () => {

  beforeEach(() => jest.clearAllMocks());

  test("retorna 200 con array de ranking", async () => {
    query.mockResolvedValueOnce({
      recordset: [
        { usuario_id: 1, nombre: "Ana",  total_puntos: 150, posicion: 1 },
        { usuario_id: 2, nombre: "Luis", total_puntos: 100, posicion: 2 },
      ],
    });

    const res = await request(app).get("/api/gamification/ranking");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ranking");
    expect(res.body.ranking).toHaveLength(2);
    expect(res.body.ranking[0].nombre).toBe("Ana");
  });

  test("retorna 500 si la DB falla", async () => {
    query.mockRejectedValueOnce(new Error("Timeout"));

    const res = await request(app).get("/api/gamification/ranking");

    expect(res.status).toBe(500);
  });

});