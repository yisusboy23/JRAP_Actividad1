/**
 * courseController.test.js — Suite COMPLETA
 *
 * Cubre: calcularPorcentaje, listarCursos, crearCurso,
 *        obtenerCurso, actualizarCurso, eliminarCurso,
 *        agregarModulo, verificarCursoCompleto,
 *        actualizarModuloDeCurso, eliminarModuloDeCurso
 *
 * Tipo: Pruebas UNITARIAS (DB simulada con jest.mock)
 */

// ─────────────────────────────────────────────
// Mock de DB y dependencias externas
// ─────────────────────────────────────────────
jest.mock("../config/db", () => ({
  sql: { Int: "Int", VarChar: "VarChar", TinyInt: "TinyInt" },
  query: jest.fn(),
}));

jest.mock("../services/pointsService", () => ({
  puntajePorCurso: jest.fn().mockResolvedValue(undefined),
}));

const { query } = require("../config/db");
const { puntajePorCurso } = require("../services/pointsService");

const {
  calcularPorcentaje,
  listarCursos,
  crearCurso,
  obtenerCurso,
  actualizarCurso,
  eliminarCurso,
  agregarModulo,
  verificarCursoCompleto,
  actualizarModuloDeCurso,
  eliminarModuloDeCurso,
} = require("../controllers/courseController");

// ─────────────────────────────────────────────
// Helper: crea un objeto res mock reutilizable
// ─────────────────────────────────────────────
function crearRes() {
  const res = {
    json:   jest.fn(),
    status: jest.fn(),
  };
  res.status.mockReturnValue(res); // permite encadenar .status().json()
  return res;
}

// ══════════════════════════════════════════════
// 1. calcularPorcentaje — función pura
// ══════════════════════════════════════════════
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

  test("redondea correctamente (2/3 = 67%)", () => {
    expect(calcularPorcentaje(2, 3)).toBe(67);
  });

  test("retorna 100 solo cuando completados === total", () => {
    expect(calcularPorcentaje(10, 10)).toBe(100);
    expect(calcularPorcentaje(9, 10)).not.toBe(100);
  });

});

// ══════════════════════════════════════════════
// 2. listarCursos
// ══════════════════════════════════════════════
describe("listarCursos()", () => {

  beforeEach(() => jest.clearAllMocks());

  test("retorna lista de cursos correctamente", async () => {
    query.mockResolvedValue({
      recordset: [
        { id: 1, titulo: "JavaScript", descripcion: "Curso básico", instructor: "Ana", total_modulos: 5 },
      ],
    });

    const req = {};
    const res = crearRes();

    await listarCursos(req, res);

    expect(query).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      cursos: [{ id: 1, titulo: "JavaScript", descripcion: "Curso básico", instructor: "Ana", total_modulos: 5 }],
    });
  });

  test("retorna lista vacía si no hay cursos", async () => {
    query.mockResolvedValue({ recordset: [] });

    const req = {};
    const res = crearRes();

    await listarCursos(req, res);

    expect(res.json).toHaveBeenCalledWith({ cursos: [] });
  });

  test("retorna 500 si la DB falla", async () => {
    query.mockRejectedValue(new Error("DB caída"));

    const req = {};
    const res = crearRes();

    await listarCursos(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error al obtener cursos" });
  });

});

// ══════════════════════════════════════════════
// 3. crearCurso
// ══════════════════════════════════════════════
describe("crearCurso()", () => {

  beforeEach(() => jest.clearAllMocks());

  test("crea un curso correctamente", async () => {
    query.mockResolvedValue({ recordset: [{ id: 15 }] });

    const req = { body: { titulo: "Node.js", descripcion: "Backend" }, usuario: { id: 1 } };
    const res = crearRes();

    await crearCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ mensaje: "Curso creado correctamente", cursoId: 15 });
  });

  test("retorna 400 si falta el título", async () => {
    const req = { body: { descripcion: "Backend" }, usuario: { id: 1 } };
    const res = crearRes();

    await crearCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "El título es requerido" });
  });

  test("retorna 500 si la DB falla", async () => {
    query.mockRejectedValue(new Error("Timeout"));

    const req = { body: { titulo: "React" }, usuario: { id: 1 } };
    const res = crearRes();

    await crearCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error al crear curso" });
  });

});

// ══════════════════════════════════════════════
// 4. obtenerCurso
// ══════════════════════════════════════════════
describe("obtenerCurso()", () => {

  beforeEach(() => jest.clearAllMocks());

  test("retorna el curso con módulos y progreso", async () => {
    // Primera query: datos del curso
    query.mockResolvedValueOnce({
      recordset: [{ id: 1, titulo: "JavaScript", descripcion: "Básico", instructor: "Ana" }],
    });
    // Segunda query: módulos con progreso
    query.mockResolvedValueOnce({
      recordset: [
        { id: 10, titulo: "Módulo 1", orden: 1, completado: 1 },
        { id: 11, titulo: "Módulo 2", orden: 2, completado: 0 },
      ],
    });

    const req = { params: { id: "1" }, usuario: { id: 5 } };
    const res = crearRes();

    await obtenerCurso(req, res);

    expect(res.json).toHaveBeenCalledWith({
      curso: { id: 1, titulo: "JavaScript", descripcion: "Básico", instructor: "Ana" },
      modulos: [
        { id: 10, titulo: "Módulo 1", orden: 1, completado: 1 },
        { id: 11, titulo: "Módulo 2", orden: 2, completado: 0 },
      ],
      progreso: { completados: 1, total: 2, porcentaje: 50 },
    });
  });

  test("retorna 404 si el curso no existe", async () => {
    query.mockResolvedValueOnce({ recordset: [] });

    const req = { params: { id: "999" }, usuario: { id: 1 } };
    const res = crearRes();

    await obtenerCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Curso no encontrado" });
  });

  test("calcula progreso 0% si ningún módulo está completado", async () => {
    query.mockResolvedValueOnce({
      recordset: [{ id: 2, titulo: "Python", descripcion: null, instructor: "Luis" }],
    });
    query.mockResolvedValueOnce({
      recordset: [
        { id: 20, titulo: "Intro", orden: 1, completado: 0 },
        { id: 21, titulo: "Variables", orden: 2, completado: 0 },
      ],
    });

    const req = { params: { id: "2" }, usuario: { id: 3 } };
    const res = crearRes();

    await obtenerCurso(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        progreso: { completados: 0, total: 2, porcentaje: 0 },
      })
    );
  });

  test("retorna 500 si la DB falla", async () => {
    query.mockRejectedValue(new Error("DB error"));

    const req = { params: { id: "1" }, usuario: { id: 1 } };
    const res = crearRes();

    await obtenerCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error al obtener curso" });
  });

});

// ══════════════════════════════════════════════
// 5. actualizarCurso
// ══════════════════════════════════════════════
describe("actualizarCurso()", () => {

  beforeEach(() => jest.clearAllMocks());

  test("actualiza correctamente cuando el curso existe", async () => {
    query.mockResolvedValue({ rowsAffected: [1] });

    const req = { params: { id: "1" }, body: { titulo: "Nuevo título", descripcion: "Nueva desc" } };
    const res = crearRes();

    await actualizarCurso(req, res);

    expect(res.json).toHaveBeenCalledWith({ mensaje: "Curso actualizado correctamente" });
  });

  test("retorna 400 si falta el título", async () => {
    const req = { params: { id: "1" }, body: { descripcion: "Solo descripción" } };
    const res = crearRes();

    await actualizarCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "El título es requerido" });
  });

  test("retorna 404 si el curso no existe (rowsAffected = 0)", async () => {
    query.mockResolvedValue({ rowsAffected: [0] });

    const req = { params: { id: "999" }, body: { titulo: "Fantasma" } };
    const res = crearRes();

    await actualizarCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Curso no encontrado" });
  });

  test("retorna 500 si la DB falla", async () => {
    query.mockRejectedValue(new Error("Timeout"));

    const req = { params: { id: "1" }, body: { titulo: "Algo" } };
    const res = crearRes();

    await actualizarCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error al actualizar curso" });
  });

});

// ══════════════════════════════════════════════
// 6. eliminarCurso
// ══════════════════════════════════════════════
describe("eliminarCurso()", () => {

  beforeEach(() => jest.clearAllMocks());

  test("elimina correctamente un curso sin módulos exclusivos", async () => {
    // query 1: módulos exclusivos (ninguno)
    query.mockResolvedValueOnce({ recordset: [] });
    // query 2: DELETE progreso
    query.mockResolvedValueOnce({ rowsAffected: [0] });
    // query 3: DELETE curso_modulo
    query.mockResolvedValueOnce({ rowsAffected: [0] });
    // query 4: DELETE cursos
    query.mockResolvedValueOnce({ rowsAffected: [1] });

    const req = { params: { id: "1" } };
    const res = crearRes();

    await eliminarCurso(req, res);

    expect(res.json).toHaveBeenCalledWith({ mensaje: "Curso eliminado correctamente" });
  });

  test("retorna 400 si el ID es inválido", async () => {
    const req = { params: { id: "abc" } };
    const res = crearRes();

    await eliminarCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "ID inválido" });
  });

  test("retorna 400 si el ID es 0 o negativo", async () => {
    const req = { params: { id: "0" } };
    const res = crearRes();

    await eliminarCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("retorna 404 si el curso no existe", async () => {
    // query 1: módulos exclusivos
    query.mockResolvedValueOnce({ recordset: [] });
    // query 2: DELETE progreso
    query.mockResolvedValueOnce({ rowsAffected: [0] });
    // query 3: DELETE curso_modulo
    query.mockResolvedValueOnce({ rowsAffected: [0] });
    // query 4: DELETE cursos → 0 filas afectadas
    query.mockResolvedValueOnce({ rowsAffected: [0] });

    const req = { params: { id: "999" } };
    const res = crearRes();

    await eliminarCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Curso no encontrado" });
  });

  test("retorna 500 si la DB falla", async () => {
    query.mockRejectedValue(new Error("DB caída"));

    const req = { params: { id: "1" } };
    const res = crearRes();

    await eliminarCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error al eliminar curso" });
  });

});

// ══════════════════════════════════════════════
// 7. agregarModulo
// ══════════════════════════════════════════════
describe("agregarModulo()", () => {

  beforeEach(() => jest.clearAllMocks());

  test("crea y agrega un módulo nuevo al curso", async () => {
    // query 1: verificar que el curso existe
    query.mockResolvedValueOnce({ recordset: [{ id: 1 }] });
    // query 2: INSERT módulo nuevo
    query.mockResolvedValueOnce({ recordset: [{ id: 99 }] });
    // query 3: INSERT curso_modulo
    query.mockResolvedValueOnce({ rowsAffected: [1] });

    const req = {
      params: { id: "1" },
      body: { titulo: "Intro a Clases", orden: 1, nivel_id: 2 },
    };
    const res = crearRes();

    await agregarModulo(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ mensaje: "Módulo agregado correctamente", moduloId: 99 });
  });

  test("vincula un módulo existente al curso", async () => {
    // query 1: verificar curso
    query.mockResolvedValueOnce({ recordset: [{ id: 1 }] });
    // query 2: verificar que NO está ya en el curso
    query.mockResolvedValueOnce({ recordset: [] });
    // query 3: INSERT curso_modulo
    query.mockResolvedValueOnce({ rowsAffected: [1] });

    const req = {
      params: { id: "1" },
      body: { modulo_id: 5, orden: 2 },
    };
    const res = crearRes();

    await agregarModulo(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ mensaje: "Módulo agregado correctamente", moduloId: 5 });
  });

  test("retorna 409 si el módulo ya está en el curso", async () => {
    // query 1: verificar curso
    query.mockResolvedValueOnce({ recordset: [{ id: 1 }] });
    // query 2: ya existe la relación
    query.mockResolvedValueOnce({ recordset: [{ 1: 1 }] });

    const req = {
      params: { id: "1" },
      body: { modulo_id: 5, orden: 1 },
    };
    const res = crearRes();

    await agregarModulo(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "El módulo ya está en este curso" });
  });

  test("retorna 400 si falta el campo orden", async () => {
    const req = { params: { id: "1" }, body: { titulo: "Módulo X" } };
    const res = crearRes();

    await agregarModulo(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "orden es requerido" });
  });

  test("retorna 404 si el curso no existe", async () => {
    query.mockResolvedValueOnce({ recordset: [] });

    const req = { params: { id: "999" }, body: { orden: 1, titulo: "X" } };
    const res = crearRes();

    await agregarModulo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Curso no encontrado" });
  });

});

// ══════════════════════════════════════════════
// 8. verificarCursoCompleto
// ══════════════════════════════════════════════
describe("verificarCursoCompleto()", () => {

  beforeEach(() => jest.clearAllMocks());

  test("retorna porcentaje y cursoCompleto=false cuando no está completo", async () => {
    query.mockResolvedValue({ recordset: [{ total: 4, completados: 2 }] });

    const req = { params: { id: "1", usuarioId: "5" } };
    const res = crearRes();

    await verificarCursoCompleto(req, res);

    expect(res.json).toHaveBeenCalledWith({ porcentaje: 50, cursoCompleto: false });
    expect(puntajePorCurso).not.toHaveBeenCalled();
  });

  test("retorna cursoCompleto=true y asigna puntos cuando está al 100%", async () => {
    query.mockResolvedValue({ recordset: [{ total: 3, completados: 3 }] });

    const req = { params: { id: "1", usuarioId: "5" } };
    const res = crearRes();

    await verificarCursoCompleto(req, res);

    expect(res.json).toHaveBeenCalledWith({ porcentaje: 100, cursoCompleto: true });
    expect(puntajePorCurso).toHaveBeenCalledWith(5);
  });

  test("retorna cursoCompleto=false si no hay módulos (total=0)", async () => {
    query.mockResolvedValue({ recordset: [{ total: 0, completados: 0 }] });

    const req = { params: { id: "1", usuarioId: "5" } };
    const res = crearRes();

    await verificarCursoCompleto(req, res);

    expect(res.json).toHaveBeenCalledWith({ porcentaje: 0, cursoCompleto: false });
    expect(puntajePorCurso).not.toHaveBeenCalled();
  });

  test("retorna 500 si la DB falla", async () => {
    query.mockRejectedValue(new Error("Timeout"));

    const req = { params: { id: "1", usuarioId: "5" } };
    const res = crearRes();

    await verificarCursoCompleto(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error al verificar progreso del curso" });
  });

});

// ══════════════════════════════════════════════
// 9. actualizarModuloDeCurso
// ══════════════════════════════════════════════
describe("actualizarModuloDeCurso()", () => {

  beforeEach(() => jest.clearAllMocks());

  test("actualiza módulo correctamente con curso_id", async () => {
    // query 1: UPDATE modulos
    query.mockResolvedValueOnce({ rowsAffected: [1] });
    // query 2: UPDATE curso_modulo
    query.mockResolvedValueOnce({ rowsAffected: [1] });

    const req = {
      params: { moduloId: "10" },
      body: { titulo: "Nuevo título", orden: 2, nivel_id: 1, curso_id: 1 },
    };
    const res = crearRes();

    await actualizarModuloDeCurso(req, res);

    expect(res.json).toHaveBeenCalledWith({ mensaje: "Módulo actualizado correctamente" });
  });

  test("retorna 400 si el título está vacío", async () => {
    const req = {
      params: { moduloId: "10" },
      body: { titulo: "", orden: 1, nivel_id: 1 },
    };
    const res = crearRes();

    await actualizarModuloDeCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "titulo es requerido" });
  });

  test("retorna 400 si nivel_id es inválido", async () => {
    const req = {
      params: { moduloId: "10" },
      body: { titulo: "Módulo X", orden: 1, nivel_id: 99 },
    };
    const res = crearRes();

    await actualizarModuloDeCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "nivel_id inválido" });
  });

  test("retorna 400 si el orden es menor que 1", async () => {
    const req = {
      params: { moduloId: "10" },
      body: { titulo: "Módulo X", orden: 0, nivel_id: 1 },
    };
    const res = crearRes();

    await actualizarModuloDeCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "orden inválido" });
  });

  test("retorna 500 si la DB falla", async () => {
    query.mockRejectedValue(new Error("DB error"));

    const req = {
      params: { moduloId: "10" },
      body: { titulo: "X", orden: 1, nivel_id: 2 },
    };
    const res = crearRes();

    await actualizarModuloDeCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error al actualizar módulo" });
  });

});

// ══════════════════════════════════════════════
// 10. eliminarModuloDeCurso
// ══════════════════════════════════════════════
describe("eliminarModuloDeCurso()", () => {

  beforeEach(() => jest.clearAllMocks());

  test("elimina el módulo completamente si no está en otros cursos", async () => {
    // query 1: DELETE progreso
    query.mockResolvedValueOnce({ rowsAffected: [1] });
    // query 2: DELETE curso_modulo (con cursoId)
    query.mockResolvedValueOnce({ rowsAffected: [1] });
    // query 3: COUNT otras relaciones → 0
    query.mockResolvedValueOnce({ recordset: [{ count: 0 }] });
    // query 4: DELETE modulos
    query.mockResolvedValueOnce({ rowsAffected: [1] });

    const req = { params: { id: "1", moduloId: "10" } };
    const res = crearRes();

    await eliminarModuloDeCurso(req, res);

    expect(res.json).toHaveBeenCalledWith({ mensaje: "Módulo eliminado correctamente del curso" });
  });

  test("solo desvincula el módulo si está en otros cursos", async () => {
    // query 1: DELETE progreso
    query.mockResolvedValueOnce({ rowsAffected: [1] });
    // query 2: DELETE curso_modulo
    query.mockResolvedValueOnce({ rowsAffected: [1] });
    // query 3: COUNT otras relaciones → 2 (está en otros cursos)
    query.mockResolvedValueOnce({ recordset: [{ count: 2 }] });
    // NO se llama a DELETE modulos

    const req = { params: { id: "1", moduloId: "10" } };
    const res = crearRes();

    await eliminarModuloDeCurso(req, res);

    expect(res.json).toHaveBeenCalledWith({ mensaje: "Módulo eliminado correctamente del curso" });
    // Solo 3 queries (no se elimina el módulo base)
    expect(query).toHaveBeenCalledTimes(3);
  });

  test("retorna 500 si la DB falla", async () => {
    query.mockRejectedValue(new Error("Error grave"));

    const req = { params: { id: "1", moduloId: "10" } };
    const res = crearRes();

    await eliminarModuloDeCurso(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error al eliminar módulo" });
  });

});