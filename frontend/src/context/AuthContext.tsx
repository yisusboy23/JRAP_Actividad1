/**
 * AuthContext.tsx
 * Guarda el token JWT en localStorage y lo inyecta en axios.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../services/api";

interface DocenteAuth {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}

interface AuthContextType {
  docente: DocenteAuth | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  cargando: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [docente,  setDocente]  = useState<DocenteAuth | null>(null);
  const [cargando, setCargando] = useState(true);

  // Restaurar sesión al cargar la app
  useEffect(() => {
    const token         = localStorage.getItem("lms_token");
    const docenteGuardado = localStorage.getItem("lms_docente");
    if (token && docenteGuardado) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setDocente(JSON.parse(docenteGuardado));
    }
    setCargando(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    const { token, docente: d } = res.data;
    localStorage.setItem("lms_token",   token);
    localStorage.setItem("lms_docente", JSON.stringify(d));
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setDocente(d);
  }

  function logout() {
    localStorage.removeItem("lms_token");
    localStorage.removeItem("lms_docente");
    delete api.defaults.headers.common["Authorization"];
    setDocente(null);
  }

  return (
    <AuthContext.Provider value={{ docente, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
