/**
 * flujoEstudiante.acceptance.test.js — Prueba de ACEPTACIÓN
 *
 * Historia de usuario:
 * "Como estudiante, quiero completar módulos para acumular
 *  puntos y ganar insignias que muestren mi progreso."
 *
 * Criterios de aceptación:
 *   ✓ Al completar un módulo el sistema responde con éxito
 *   ✓ Los puntos aumentan después de completar el módulo
 *   ✓ Al consultar mis puntos, la posición es visible
 *   ✓ Las insignias se pueden consultar correctamente
 *   ✓ El ranking muestra al estudiante con sus puntos
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

let puntosAcumulados = 0;

describe("Historia: Estudiante completa módulos y gana insignias", () => {

  beforeEach(() => jest.clearAllMocks());

  test("ESCENA 1 — completa el primer módulo y recibe puntos", async () => {
    query.mockResolvedValue({ recordset: [{ total: 10, veces: 0 }] });

    const res = await request(app)
      .post("/api/gamification/completar-modulo")
      .send({ usuarioId: 1, moduloId: 101 });

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe("Módulo completado");
    expect(typeof res.body.totalPuntos).toBe("number");
    expect(Array.isArray(res.body.nuevasInsignias)).toBe(true);

    puntosAcumulados = res.body.totalPuntos;
  });

  test("ESCENA 2 — consulta su posición en el ranking", async () => {
    query.mockResolvedValueOnce({
      recordset: [{ usuario_id: 1, nombre: "Ana", total_puntos: 10, posicion: 3 }],
    });

    const res = await request(app).get("/api/gamification/mis-puntos/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("total_puntos");
    expect(res.body).toHaveProperty("posicion");
  });

  test("ESCENA 3 — consulta las insignias obtenidas", async () => {
    query.mockResolvedValueOnce({
      recordset: [{
        id: 1, nombre: "Primer paso",
        descripcion: "Completaste tu primer módulo",
        icono: "🏅", fecha_obtenida: new Date().toISOString(),
      }],
    });

    const res = await request(app).get("/api/gamification/insignias/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("insignias");
    expect(Array.isArray(res.body.insignias)).toBe(true);
    expect(res.body.insignias[0].nombre).toBe("Primer paso");
  });

  test("ESCENA 4 — completa un segundo módulo acumulando más puntos", async () => {
    query.mockResolvedValue({ recordset: [{ total: 20, veces: 0 }] });

    const res = await request(app)
      .post("/api/gamification/completar-modulo")
      .send({ usuarioId: 1, moduloId: 102 });

    expect(res.status).toBe(200);
    expect(res.body.totalPuntos).toBeGreaterThanOrEqual(puntosAcumulados);
  });

  test("ESCENA 5 — el ranking muestra al estudiante con sus puntos", async () => {
    query.mockResolvedValueOnce({
      recordset: [
        { usuario_id: 1, nombre: "Ana",    total_puntos: 20, posicion: 1 },
        { usuario_id: 2, nombre: "Carlos", total_puntos: 10, posicion: 2 },
      ],
    });

    const res = await request(app).get("/api/gamification/ranking");

    expect(res.status).toBe(200);
    expect(res.body.ranking.length).toBeGreaterThan(0);
    expect(res.body.ranking[0].posicion).toBe(1);
  });

});