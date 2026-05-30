import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { docente, cargando } = useAuth();
  if (cargando) return <p className="mensaje-centro">Cargando...</p>;
  if (!docente) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
