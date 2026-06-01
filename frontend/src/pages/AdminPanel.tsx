import { useEffect, useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

interface Modulo {
  id: number;
  titulo: string;
  orden: number;
  nivel_id: number;
}

interface Curso {
  id: number;
  titulo: string;
  descripcion: string;
  instructor: string;
  total_modulos: number;
}

interface CursoDetalle extends Curso {
  modulos: Modulo[];
}

type Seccion = "cursos" | "modulos" | "crearCurso" | "crearModulo" | "crearEstudiante" | "editarCurso";

const NIVELES = [
  { id: 1, nombre: "Básico"     },
  { id: 2, nombre: "Intermedio" },
  { id: 3, nombre: "Avanzado"   },
];

export default function AdminPanel() {
const { docente } = useAuth();

  const [cursos,   setCursos]   = useState<Curso[]>([]);
  const [seccion,  setSeccion]  = useState<Seccion>("cursos");
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "err"; msg: string } | null>(null);
  const [todosModulos, setTodosModulos] = useState<Modulo[]>([]);

  // Crear curso
  const [tituloCurso, setTituloCurso] = useState("");
  const [descCurso,   setDescCurso]   = useState("");

  // Crear módulo
  const [cursoSelec, setCursoSelec] = useState<number>(0);
  const [tituloMod,  setTituloMod]  = useState("");
  const [nivelMod,   setNivelMod]   = useState(1);

  // Crear estudiante
  const [nomEst,   setNomEst]   = useState("");
  const [emailEst, setEmailEst] = useState("");
  const [passEst,  setPassEst]  = useState("");
  const [ciEst,    setCiEst]    = useState("");

  // Editar curso
  const [cursoEditar,        setCursoEditar]        = useState<CursoDetalle | null>(null);
  const [modulosDisponibles, setModulosDisponibles] = useState<Modulo[]>([]);
  const [moduloAgregar,      setModuloAgregar]      = useState<number>(0);
  const [tituloEdit,         setTituloEdit]         = useState("");
  const [descEdit,           setDescEdit]           = useState("");
  const [moduloEditando,     setModuloEditando]     = useState<number | null>(null);
  const [tituloModEdit,      setTituloModEdit]      = useState("");
  const [nivelModEdit,       setNivelModEdit]       = useState(1);

  useEffect(() => {
    cargarCursos();
    cargarModulos();
  }, []);

  async function cargarCursos() {
    const res = await api.get("/courses");
    setCursos(res.data.cursos);
  }

  async function cargarModulos() {
    const res = await api.get("/modulos/todos");
    setTodosModulos(res.data.modulos);
  }

  async function handleEliminarModuloCompleto(moduloId: number) {
    if (!confirm("¿Eliminar este módulo permanentemente?")) return;
    try {
      await api.delete(`/courses/0/modulos/${moduloId}`);
      mostrarFeedback("ok", "Módulo eliminado");
      cargarModulos();
      cargarCursos();
    } catch (err: any) {
      mostrarFeedback("err", err?.response?.data?.error || "Error al eliminar módulo");
    }
  }

  function mostrarFeedback(tipo: "ok" | "err", msg: string) {
    setFeedback({ tipo, msg });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function abrirEditorCurso(cursoId: number) {
    try {
      const [resCurso, resTodos] = await Promise.all([
        api.get(`/courses/${cursoId}`),
        api.get(`/modulos/todos`),
      ]);
      const { curso, modulos } = resCurso.data;
      setCursoEditar({ ...curso, modulos, total_modulos: modulos.length });
      setTituloEdit(curso.titulo);
      setDescEdit(curso.descripcion || "");
      setModulosDisponibles(resTodos.data.modulos);
      setModuloAgregar(0);
      setModuloEditando(null);
      setSeccion("editarCurso");
    } catch (error) {
      console.error("Error al abrir editor:", error);
      mostrarFeedback("err", "Error al cargar datos");
    }
  }

  async function handleGuardarCurso(e: FormEvent) {
    e.preventDefault();
    if (!cursoEditar) return;
    try {
      await api.put(`/courses/${cursoEditar.id}`, { titulo: tituloEdit, descripcion: descEdit });
      mostrarFeedback("ok", "Curso actualizado correctamente");
      setCursoEditar((prev) => prev ? { ...prev, titulo: tituloEdit, descripcion: descEdit } : prev);
      cargarCursos();
    } catch (err: any) {
      mostrarFeedback("err", err?.response?.data?.error || "Error al actualizar curso");
    }
  }

  async function handleEliminarCurso(id: number) {
    if (!confirm("¿Eliminar este curso y todos sus módulos?")) return;
    try {
      await api.delete(`/courses/${id}`);
      mostrarFeedback("ok", "Curso eliminado");
      setSeccion("cursos");
      cargarCursos();
    } catch (err: any) {
      mostrarFeedback("err", err?.response?.data?.error || "Error al eliminar curso");
    }
  }

  function iniciarEditarModulo(mod: Modulo) {
    setModuloEditando(mod.id);
    setTituloModEdit(mod.titulo);
    setNivelModEdit(mod.nivel_id);
  }

  async function handleGuardarModulo(moduloId: number) {
    if (!cursoEditar) return;
    try {
      await api.put(`/courses/${cursoEditar.id}/modulos/${moduloId}`, {
        titulo:   tituloModEdit,
        nivel_id: nivelModEdit,
        curso_id: cursoEditar.id,
      });
      mostrarFeedback("ok", "Módulo actualizado");
      setModuloEditando(null);
      const res = await api.get(`/courses/${cursoEditar.id}`);
      setCursoEditar((prev) => prev ? { ...prev, modulos: res.data.modulos } : prev);
    } catch (err: any) {
      mostrarFeedback("err", err?.response?.data?.error || "Error al actualizar módulo");
    }
  }

  async function handleEliminarModulo(moduloId: number) {
    if (!cursoEditar) return;
    if (!confirm("¿Eliminar este módulo?")) return;
    try {
      await api.delete(`/courses/${cursoEditar.id}/desvincular/${moduloId}`);
      mostrarFeedback("ok", "Módulo desvinculado del curso");
      setCursoEditar((prev) =>
        prev ? { ...prev, modulos: prev.modulos.filter((m) => m.id !== moduloId) } : prev
      );
      cargarCursos();
    } catch (err: any) {
      mostrarFeedback("err", err?.response?.data?.error || "Error al eliminar módulo");
    }
  }

  async function handleCrearCurso(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post("/courses", { titulo: tituloCurso, descripcion: descCurso });
      mostrarFeedback("ok", `Curso creado (ID: ${res.data.cursoId})`);
      setTituloCurso(""); setDescCurso("");
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
        nivel_id: nivelMod,
      });
      mostrarFeedback("ok", `Módulo creado (ID: ${res.data.moduloId})`);
      setTituloMod("");
      cargarCursos();
      cargarModulos();
    } catch (err: any) {
      mostrarFeedback("err", err?.response?.data?.error || "Error al crear módulo");
    }
  }

  async function handleCrearEstudiante(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post("/users/estudiantes", {
        nombre: nomEst, email: emailEst, password: passEst, ci: ciEst || undefined,
      });
      mostrarFeedback("ok", `Estudiante creado (ID: ${res.data.estudianteId})`);
      setNomEst(""); setEmailEst(""); setPassEst(""); setCiEst("");
    } catch (err: any) {
      mostrarFeedback("err", err?.response?.data?.error || "Error al crear estudiante");
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
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {(["cursos", "modulos", "crearCurso", "crearModulo", "crearEstudiante"] as Seccion[]).map((s) => (
          <button key={s}
            className={`tab${seccion === s ? " tab-activo" : ""}`}
            onClick={() => { setSeccion(s); setModuloEditando(null); }}
          >
            {{ cursos: "📚 Cursos", modulos: "📝 Módulos", crearCurso: "➕ Nuevo curso", crearModulo: "📝 Nuevo módulo", crearEstudiante: "🧑 Nuevo estudiante", editarCurso: "✏️ Editar" }[s]}
          </button>
        ))}
        {seccion === "editarCurso" && cursoEditar && (
          <button className="tab tab-activo">✏️ {cursoEditar.titulo}</button>
        )}
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
                  <p className="instructor">Instructor: {c.instructor}</p>
                  <span className="badge-fecha">{c.total_modulos} módulo(s)</span>
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                    <button className="boton-secundario" onClick={() => abrirEditorCurso(c.id)}>
                      ✏️ Editar
                    </button>
                    <button className="boton-peligro" onClick={() => handleEliminarCurso(c.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
      )}

      {/* ── Editor de curso ── */}
      {seccion === "editarCurso" && cursoEditar && (
        <div>
          <div className="form-card" style={{ marginBottom: "1.5rem" }}>
            <h3>Editar curso</h3>
            <form onSubmit={handleGuardarCurso}>
              <div className="campo">
                <label className="campo-label">Título *</label>
                <input type="text" className="campo-input"
                  value={tituloEdit} onChange={(e) => setTituloEdit(e.target.value)}
                  maxLength={150} required />
              </div>
              <div className="campo">
                <label className="campo-label">Descripción</label>
                <textarea className="campo-input campo-textarea" rows={3}
                  value={descEdit} onChange={(e) => setDescEdit(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="submit" className="boton-primario">Guardar cambios</button>
                <button type="button" className="boton-peligro"
                  onClick={() => handleEliminarCurso(cursoEditar.id)}>
                  🗑️ Eliminar curso
                </button>
              </div>
            </form>
          </div>

          <div className="form-card">
            <h3>Módulos del curso</h3>
            {cursoEditar.modulos.length === 0
              ? <p className="vacio">Sin módulos aún.</p>
              : cursoEditar.modulos.map((mod) => (
                <div key={mod.id} style={{ borderBottom: "1px solid #e5e7eb", padding: "0.75rem 0" }}>
                  {moduloEditando === mod.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <input type="text" className="campo-input"
                        value={tituloModEdit} onChange={(e) => setTituloModEdit(e.target.value)}
                        placeholder="Título" />
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <select className="campo-input"
                          value={nivelModEdit} onChange={(e) => setNivelModEdit(Number(e.target.value))}>
                          {NIVELES.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                        </select>
                        <button className="boton-primario" onClick={() => handleGuardarModulo(mod.id)}>
                          Guardar
                        </button>
                        <button className="boton-secundario" onClick={() => setModuloEditando(null)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>
                        <strong>{mod.orden}.</strong> {mod.titulo}
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#6b7280" }}>
                          ({NIVELES.find((n) => n.id === mod.nivel_id)?.nombre})
                        </span>
                      </span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="boton-secundario" onClick={() => iniciarEditarModulo(mod)}>✏️</button>
                        <button className="boton-peligro" onClick={() => handleEliminarModulo(mod.id)}>🗑️</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            }
          </div>

          {/* ── Agregar módulo existente a este curso ── */}
          <div className="form-card" style={{ marginTop: "1.5rem" }}>
            <h3>Agregar módulo existente a este curso</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!cursoEditar || moduloAgregar === 0) {
                mostrarFeedback("err", "Seleccioná un módulo");
                return;
              }
              try {
                await api.post(`/courses/${cursoEditar.id}/modulos`, {
                  modulo_id: moduloAgregar,
                });
                mostrarFeedback("ok", "Módulo agregado al curso");
                setModuloAgregar(0);
                const res = await api.get(`/courses/${cursoEditar.id}`);
                setCursoEditar((prev) => prev ? { ...prev, modulos: res.data.modulos } : prev);
                cargarCursos();
              } catch (err: any) {
                mostrarFeedback("err", err?.response?.data?.error || "Error al agregar módulo");
              }
            }}>
              <div className="campo">
                <label className="campo-label">Módulo *</label>
                <select
                  className="campo-input"
                  value={moduloAgregar}
                  onChange={(e) => setModuloAgregar(Number(e.target.value))}
                  required
                >
                  <option value={0}>-- Seleccioná un módulo --</option>
                  {modulosDisponibles
                    .filter((m) => !cursoEditar?.modulos?.some((cm) => cm.id === m.id))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.titulo} ({NIVELES.find((n) => n.id === m.nivel_id)?.nombre || "Nivel"})
                      </option>
                    ))}
                </select>
              </div>
              <button type="submit" className="boton-primario">➕ Agregar al curso</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Lista de módulos ── */}
      {seccion === "modulos" && (
        <div className="form-card">
          <h3>Lista de módulos</h3>
          {todosModulos.length === 0
            ? <p className="vacio">No hay módulos.</p>
            : todosModulos.map((mod) => (
                <div key={mod.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", padding: "0.75rem 0" }}>
                  <span>
                    <strong>{mod.titulo}</strong>
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#6b7280" }}>
                      ({NIVELES.find((n) => n.id === mod.nivel_id)?.nombre || "Sin nivel"})
                    </span>
                  </span>
                  <button className="boton-peligro" onClick={() => handleEliminarModuloCompleto(mod.id)}>
                    🗑️ Eliminar
                  </button>
                </div>
              ))
          }
        </div>
      )}

      {/* ── Crear curso ── */}
      {seccion === "crearCurso" && (
        <div className="form-card">
          <h3>Crear nuevo curso</h3>
          <form onSubmit={handleCrearCurso}>
            <div className="campo">
              <label className="campo-label">Título *</label>
              <input type="text" className="campo-input"
                placeholder="Ej: Programación Web con React"
                value={tituloCurso} onChange={(e) => setTituloCurso(e.target.value)}
                maxLength={150} required />
            </div>
            <div className="campo">
              <label className="campo-label">Descripción</label>
              <textarea className="campo-input campo-textarea" rows={4}
                placeholder="Describe el contenido del curso..."
                value={descCurso} onChange={(e) => setDescCurso(e.target.value)} />
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
              <select className="campo-input" value={cursoSelec}
                onChange={(e) => setCursoSelec(Number(e.target.value))} required>
                <option value={0}>-- Seleccioná un curso --</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>{c.titulo} ({c.total_modulos} módulos)</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label className="campo-label">Título del módulo *</label>
              <input type="text" className="campo-input"
                placeholder="Ej: Introducción a React"
                value={tituloMod} onChange={(e) => setTituloMod(e.target.value)}
                maxLength={150} required />
            </div>
            <div className="campo-fila">
              <div className="campo">
                <label className="campo-label">Nivel *</label>
                <select className="campo-input" value={nivelMod}
                  onChange={(e) => setNivelMod(Number(e.target.value))}>
                  {NIVELES.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="boton-primario">Agregar módulo</button>
          </form>
        </div>
      )}

      {/* ── Crear estudiante ── */}
      {seccion === "crearEstudiante" && (
        <div className="form-card">
          <h3>Crear nuevo estudiante</h3>
          <form onSubmit={handleCrearEstudiante}>
            <div className="campo">
              <label className="campo-label">Nombre *</label>
              <input type="text" className="campo-input"
                value={nomEst} onChange={(e) => setNomEst(e.target.value)} required />
            </div>
            <div className="campo">
              <label className="campo-label">Email *</label>
              <input type="email" className="campo-input"
                value={emailEst} onChange={(e) => setEmailEst(e.target.value)} required />
            </div>
            <div className="campo">
              <label className="campo-label">Contraseña *</label>
              <input type="password" className="campo-input"
                value={passEst} onChange={(e) => setPassEst(e.target.value)} required />
            </div>
            <div className="campo">
              <label className="campo-label">CI (opcional)</label>
              <input type="number" className="campo-input"
                value={ciEst} onChange={(e) => setCiEst(e.target.value)}
                min={1000000} max={9999999} />
            </div>
            <button type="submit" className="boton-primario">Crear estudiante</button>
          </form>
        </div>
      )}

    </div>
  );
}
