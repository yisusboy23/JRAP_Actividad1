import { useEffect, useState } from "react";
import { getRanking } from "../services/api";

interface RankingItem {
  usuario_id: number;
  nombre: string;
  total_puntos: number;
  posicion: number;
}

function iconoPosicion(posicion: number): string | number {
  if (posicion === 1) return "🥇";
  if (posicion === 2) return "🥈";
  if (posicion === 3) return "🥉";
  return posicion;
}

export default function Ranking() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRanking()
      .then((res) => setRanking(res.data.ranking))
      .catch(() => setError("No se pudo cargar el ranking"))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p className="mensaje-centro">Cargando ranking...</p>;
  if (error) return <p className="error-texto">{error}</p>;

  return (
    <div className="contenedor">
      <h2>Ranking de estudiantes</h2>
      <table className="tabla">
        <thead>
          <tr>
            <th className="tabla-th">Posición</th>
            <th className="tabla-th">Estudiante</th>
            <th className="tabla-th">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((est) => (
            <tr key={est.usuario_id} className="tabla-fila">
              <td className="tabla-td">{iconoPosicion(est.posicion)}</td>
              <td className="tabla-td">{est.nombre}</td>
              <td className="tabla-td">{est.total_puntos} pts</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}