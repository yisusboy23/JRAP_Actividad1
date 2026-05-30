import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { JSX } from "react/jsx-runtime";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { docente, cargando } = useAuth();
  if (cargando) return <p className="mensaje-centro">Cargando...</p>;
  if (!docente) return <Navigate to="/login" replace />;
  return children;
}
