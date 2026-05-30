/**
 * AdminPanel.tsx
 * Usa las rutas ya existentes en el backend:
 *   POST /api/courses           → crearCurso
 *   POST /api/courses/:id/modulos → agregarModulo
 *   GET  /api/courses           → listar cursos
 */

import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

interface Curso {
  id: number;
  titulo: string;
  descripcion: string;
  instructor: string;
  total_modulos: number;
}

type Seccion = "cursos" | "crearCurso" | "crearModulo";

const NIVELES = [
  { id: 1, nombre: "Básico"     },
  { id: 2, nombre: "Intermedio" },
  { id: 3, nombre: "Avanzado"   },
];

export default function AdminPanel() {
  const { docente, logout } = useAuth();
  const navigate = useNavigate();

  const [cursos,    setCursos]    = useState<Curso[]>([]);
  const [seccion,   setSeccion]   = useState<Seccion>("cursos");
  const [feedback,  setFeedback]  = useState<{ tipo: "ok" | "err"; msg: string } | null>(null);

  // Form: nuevo curso
  const [tituloCurso, setTituloCurso] = useState("");
  const [descCurso,   setDescCurso]   = useState("");

  // Form: nuevo módulo
  const [cursoSelec, setCursoSelec] = useState<number>(0);
  const [tituloMod,  setTituloMod]  = useState("");
  const [ordenMod,   setOrdenMod]   = useState(1);
  const [nivelMod,   setNivelMod]   = useState(1);

  useEffect(() => {
    cargarCursos();
  }, []);

  async function cargarCursos() {
    const res = await api.get("/courses");
    setCursos(res.data.cursos);
  }

  function mostrarFeedback(tipo: "ok" | "err", msg: string) {
    setFeedback({ tipo, msg });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleCrearCurso(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post("/courses", { titulo: tituloCurso, descripcion: descCurso });
      mostrarFeedback("ok", `Curso creado (ID: ${res.data.cursoId})`);
      setTituloCurso("");
      setDescCurso("");
      cargarCursos();
    } catch (err: any) {
      mostrarFeedback("err", err?.response?.data?.error || "Error al crear curso");
    }
  }

  async function handleCrearModulo(e: FormEvent) {
    e.preventDefault();
    if (cursoSelec === 0) return mostrarFeedback("err", "Seleccioná un curso");
    try {
      const res = await api.post(`/courses/${cursoSelec}/modulos`, {
        titulo:   tituloMod,
        orden:    ordenMod,
        nivel_id: nivelMod,
      });
      mostrarFeedback("ok", `Módulo creado (ID: ${res.data.moduloId})`);
      setTituloMod("");
      setOrdenMod((n) => n + 1);
      cargarCursos();
    } catch (err: any) {
      mostrarFeedback("err", err?.response?.data?.error || "Error al crear módulo");
    }
  }

  return (
    <div className="contenedor">

      {/* Header */}
      <div className="admin-header">
        <div>
          <h2>Panel de Docente</h2>
          <p className="subtitulo">
            Bienvenido/a, <strong>{docente?.nombre} {docente?.apellido}</strong>
          </p>
        </div>
        <button className="boton-secundario" onClick={() => { logout(); navigate("/"); }}>
          Cerrar sesión
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {(["cursos", "crearCurso", "crearModulo"] as Seccion[]).map((s) => (
          <button
            key={s}
            className={`tab${seccion === s ? " tab-activo" : ""}`}
            onClick={() => setSeccion(s)}
          >
            {{ cursos: "📚 Cursos", crearCurso: "➕ Nuevo curso", crearModulo: "📝 Nuevo módulo" }[s]}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`alerta ${feedback.tipo === "ok" ? "alerta-ok" : "alerta-err"}`}>
          {feedback.msg}
        </div>
      )}

      {/* ── Lista de cursos ── */}
      {seccion === "cursos" && (
        cursos.length === 0
          ? <p className="vacio">No hay cursos. ¡Crea el primero!</p>
          : <div className="grilla">
              {cursos.map((c) => (
                <div key={c.id} className="tarjeta">
                  <h3 className="nombre-curso">{c.titulo}</h3>
                  <p className="descripcion">{c.descripcion || "Sin descripción"}</p>
                  <p className="instructor">Instructor: {c.instructor || "—"}</p>
                  <span className="badge-fecha">{c.total_modulos} módulo(s)</span>
                </div>
              ))}
            </div>
      )}

      {/* ── Crear curso ── */}
      {seccion === "crearCurso" && (
        <div className="form-card">
          <h3>Crear nuevo curso</h3>
          <form onSubmit={handleCrearCurso}>
            <div className="campo">
              <label className="campo-label">Título *</label>
              <input
                type="text"
                className="campo-input"
                placeholder="Ej: Programación Web con React"
                value={tituloCurso}
                onChange={(e) => setTituloCurso(e.target.value)}
                maxLength={150}
                required
              />
            </div>
            <div className="campo">
              <label className="campo-label">Descripción</label>
              <textarea
                className="campo-input campo-textarea"
                placeholder="Describe el contenido del curso..."
                value={descCurso}
                onChange={(e) => setDescCurso(e.target.value)}
                rows={4}
              />
            </div>
            <button type="submit" className="boton-primario">Crear curso</button>
          </form>
        </div>
      )}

      {/* ── Crear módulo ── */}
      {seccion === "crearModulo" && (
        <div className="form-card">
          <h3>Agregar módulo</h3>
          <form onSubmit={handleCrearModulo}>
            <div className="campo">
              <label className="campo-label">Curso *</label>
              <select
                className="campo-input"
                value={cursoSelec}
                onChange={(e) => setCursoSelec(Number(e.target.value))}
                required
              >
                <option value={0}>-- Seleccioná un curso --</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titulo} ({c.total_modulos} módulos)
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label className="campo-label">Título del módulo *</label>
              <input
                type="text"
                className="campo-input"
                placeholder="Ej: Introducción a React"
                value={tituloMod}
                onChange={(e) => setTituloMod(e.target.value)}
                maxLength={150}
                required
              />
            </div>
            <div className="campo-fila">
              <div className="campo">
                <label className="campo-label">Orden *</label>
                <input
                  type="number"
                  className="campo-input"
                  min={1}
                  value={ordenMod}
                  onChange={(e) => setOrdenMod(Number(e.target.value))}
                  required
                />
              </div>
              <div className="campo">
                <label className="campo-label">Nivel *</label>
                <select
                  className="campo-input"
                  value={nivelMod}
                  onChange={(e) => setNivelMod(Number(e.target.value))}
                >
                  {NIVELES.map((n) => (
                    <option key={n.id} value={n.id}>{n.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="boton-primario">Agregar módulo</button>
          </form>
        </div>
      )}
    </div>
  );
}
