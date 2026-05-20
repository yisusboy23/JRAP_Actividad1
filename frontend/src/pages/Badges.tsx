import { useEffect, useState } from "react";
import { getInsignias } from "../services/api";
import api from "../services/api";

interface Insignia {
  id: number;
  nombre: string;
  descripcion: string;
  fecha_obtenida: string;
}

interface Estudiante {
  id: number;
  nombre: string;
}

export default function Badges() {
  const [insignias, setInsignias] = useState<Insignia[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estudianteId, setEstudianteId] = useState<number>(0);
  const [nombreEstudiante, setNombreEstudiante] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/users/estudiantes").then((res) => {
      setEstudiantes(res.data.estudiantes);
    });
  }, []);

  function handleSeleccionar(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(e.target.value);
    const est = estudiantes.find((e) => e.id === id);
    setEstudianteId(id);
    setNombreEstudiante(est?.nombre || "");
    setInsignias([]);
    if (id === 0) return;

    setCargando(true);
    getInsignias(id)
      .then((res) => setInsignias(res.data.insignias))
      .catch(() => setError("No se pudieron cargar las insignias"))
      .finally(() => setCargando(false));
  }

  return (
    <div className="contenedor">
      <h2>Insignias por estudiante</h2>

      <div className="selector-estudiante">
        <label>Estudiante:</label>
        <select onChange={handleSeleccionar} value={estudianteId}>
          <option value={0}>-- Seleccioná un estudiante --</option>
          {estudiantes.map((est) => (
            <option key={est.id} value={est.id}>{est.nombre}</option>
          ))}
        </select>
      </div>

      {cargando && <p className="mensaje-centro">Cargando insignias...</p>}
      {error && <p className="error-texto">{error}</p>}

      {estudianteId > 0 && !cargando && (
        <>
          <p className="subtitulo">Insignias de <strong>{nombreEstudiante}</strong>:</p>
          {insignias.length === 0 ? (
            <p className="vacio">Aún no tiene insignias. ¡Debe completar módulos para ganarlas!</p>
          ) : (
            <div className="grilla-badges">
              {insignias.map((ins) => (
                <div key={ins.id} className="tarjeta-badge">
                  <div className="badge-icono">🏅</div>
                  <h3 className="badge-nombre">{ins.nombre}</h3>
                  <p className="descripcion">{ins.descripcion}</p>
                  <span className="badge-fecha">
                    {new Date(ins.fecha_obtenida).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}