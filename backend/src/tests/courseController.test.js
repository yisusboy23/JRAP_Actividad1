/**
 * courseController.test.js
 */

jest.mock("../config/db", () => ({
  sql: { Int: "Int", VarChar: "VarChar" },
  query: jest.fn(),
}));

const { query } = require("../config/db");

const {
  calcularPorcentaje,
  listarCursos,
  crearCurso,
} = require("../controllers/courseController");

describe("calcularPorcentaje()", () => {

  test("retorna 0 si no hay módulos", () => {
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

  test("redondea correctamente", () => {
    expect(calcularPorcentaje(2, 3)).toBe(67);
  });

  test("retorna 100 solo cuando completados === total", () => {
    expect(calcularPorcentaje(10, 10)).toBe(100);
    expect(calcularPorcentaje(9, 10)).not.toBe(100);
  });

});

describe("listarCursos()", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("retorna lista de cursos correctamente", async () => {

    query.mockResolvedValue({
      recordset: [
        {
          id: 1,
          titulo: "JavaScript",
          descripcion: "Curso básico",
          instructor: "Ana",
          total_modulos: 5,
        },
      ],
    });

    const req = {};

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await listarCursos(req, res);

    expect(query).toHaveBeenCalledTimes(1);

    expect(res.json).toHaveBeenCalledWith({
      cursos: [
        {
          id: 1,
          titulo: "JavaScript",
          descripcion: "Curso básico",
          instructor: "Ana",
          total_modulos: 5,
        },
      ],
    });

  });

});

describe("crearCurso()", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("crea un curso correctamente", async () => {

    query.mockResolvedValue({
      recordset: [{ id: 15 }],
    });

    const req = {
      body: {
        titulo: "Node.js",
        descripcion: "Backend",
      },
      usuario: {
        id: 1,
      },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await crearCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith({
      mensaje: "Curso creado correctamente",
      cursoId: 15,
    });

  });

  test("retorna 400 si falta el título", async () => {

    const req = {
      body: {
        descripcion: "Backend",
      },
      usuario: {
        id: 1,
      },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await crearCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      error: "El título es requerido",
    });

  });

});