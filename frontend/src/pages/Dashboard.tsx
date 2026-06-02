import { useEffect, useState } from "react";
import { completarModulo, getMisPuntos } from "../services/api";
import api from "../services/api";

interface Modulo {
  id: number;
  titulo: string;
  orden: number;
  completado: number; // 0 o 1 — viene del backend
}

interface Curso {
  id: number;
  titulo: string;
  descripcion: string;
  instructor: string;
  total_modulos: number;
  modulos?: Modulo[];
}

interface PuntosUsuario {
  total_puntos: number;
  posicion?: number;
}

interface Estudiante {
  id: number;
  nombre: string;
}

export default function Dashboard() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [puntos, setPuntos] = useState<PuntosUsuario | null>(null);
  const [mensaje, setMensaje] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(true);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estudianteId, setEstudianteId] = useState<number>(0);

  useEffect(() => {
    Promise.all([
      api.get("/courses"),
      api.get("/users/estudiantes"),
    ]).then(([resCursos, resEst]) => {
      setCursos(resCursos.data.cursos);
      setEstudiantes(resEst.data.estudiantes);
    }).finally(() => setCargando(false));
  }, []);

  // Cuando cambia el estudiante, recargamos los módulos abiertos
  // con el progreso actualizado de ESE estudiante
  useEffect(() => {
    if (estudianteId > 0) {
      getMisPuntos(estudianteId).then((res) => setPuntos(res.data));

      // Refrescar módulos ya abiertos con el progreso del nuevo estudiante
      setCursos((prev) =>
        prev.map((c) =>
          c.modulos ? { ...c, modulos: undefined } : c
        )
      );
    } else {
      setPuntos(null);
      // Limpiar módulos al deseleccionar estudiante
      setCursos((prev) => prev.map((c) => ({ ...c, modulos: undefined })));
    }
  }, [estudianteId]);

  async function handleCompletarModulo(cursoId: number, moduloId: number): Promise<void> {
    if (estudianteId === 0) {
      setMensaje("Seleccioná un estudiante primero");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }
    try {
      const res = await completarModulo({ usuarioId: estudianteId, moduloId });
      const { totalPuntos, nuevasInsignias } = res.data;

      setPuntos((prev) => ({ total_puntos: totalPuntos, posicion: prev?.posicion }));

      // ── FIX PRINCIPAL: marcar el módulo como completado en el estado local ──
      setCursos((prev) =>
        prev.map((c) => {
          if (c.id !== cursoId || !c.modulos) return c;
          return {
            ...c,
            modulos: c.modulos.map((m) =>
              m.id === moduloId ? { ...m, completado: 1 } : m
            ),
          };
        })
      );

      setMensaje(
        nuevasInsignias.length > 0
          ? `🏅 Nueva insignia: ${nuevasInsignias.join(", ")}`
          : "✅ Módulo completado. +10 puntos"
      );
      setTimeout(() => setMensaje(""), 3000);
    } catch {
      setMensaje("Error al completar módulo");
    }
  }

  // Carga los módulos del curso CON el progreso del estudiante seleccionado
  async function handleVerModulos(cursoId: number): Promise<void> {
    const url = estudianteId > 0
      ? `/courses/${cursoId}?uid=${estudianteId}` // el backend ya usa req.usuario?.id
      : `/courses/${cursoId}`;

    const res = await api.get(url);
    setCursos((prev) =>
      prev.map((c) =>
        c.id === cursoId ? { ...c, modulos: res.data.modulos } : c
      )
    );
  }

  if (cargando) return <p className="mensaje-centro">Cargando...</p>;

  return (
    <div className="contenedor">

      <div className="selector-estudiante">
        <label>Estudiante:</label>
        <select
          onChange={(e) => setEstudianteId(Number(e.target.value))}
          value={estudianteId}
        >
          <option value={0}>-- Seleccioná un estudiante --</option>
          {estudiantes.map((est) => (
            <option key={est.id} value={est.id}>{est.nombre}</option>
          ))}
        </select>
      </div>

      {puntos && estudianteId > 0 && (
        <div className="banner">
          <span>Mis puntos: <strong>{puntos.total_puntos || 0}</strong></span>
          {puntos.posicion && <span>Posición: <strong>#{puntos.posicion}</strong></span>}
        </div>
      )}

      {mensaje && <div className="alerta">{mensaje}</div>}

      <h2>Cursos disponibles</h2>
      <div className="grilla">
        {cursos.map((curso) => (
          <div key={curso.id} className="tarjeta">
            <h3 className="nombre-curso">{curso.titulo}</h3>
            <p className="descripcion">{curso.descripcion}</p>
            <p className="instructor">Instructor: {curso.instructor}</p>

            <button
              className="boton-secundario"
              onClick={() => handleVerModulos(curso.id)}
            >
              Ver módulos
            </button>

            {curso.modulos && (
              <ul className="lista-modulos">
                {curso.modulos.map((mod) => {
                  const yaCompletado = mod.completado === 1;
                  return (
                    <li key={mod.id} className="modulo-item">
                      <span>
                        {mod.orden}. {mod.titulo}
                        {yaCompletado && (
                          <span style={{ marginLeft: "0.4rem", color: "#16a34a" }}>
                            ✓
                          </span>
                        )}
                      </span>

                      {/* ── FIX: botón deshabilitado si ya fue completado ── */}
                      <button
                        className="boton-modulo"
                        onClick={() => handleCompletarModulo(curso.id, mod.id)}
                        disabled={yaCompletado}
                        title={yaCompletado ? "Ya completaste este módulo" : "Completar módulo"}
                        style={
                          yaCompletado
                            ? { opacity: 0.45, cursor: "not-allowed" }
                            : {}
                        }
                      >
                        {yaCompletado ? "✓ Completado" : "✓ Completar"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
