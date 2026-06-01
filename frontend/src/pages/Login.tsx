import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

type Modo = "login" | "registro";

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const [modo,       setModo]       = useState<Modo>("login");
  const [nombre,     setNombre]     = useState("");
  const [apellido,   setApellido]   = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [ci,         setCi]         = useState("");
  const [error,      setError]      = useState<string | null>(null);
  const [exito,      setExito]      = useState<string | null>(null);
  const [enviando,   setEnviando]   = useState(false);

  function limpiarFormulario() {
    setNombre(""); setApellido(""); setEmail("");
    setPassword(""); setEspecialidad(""); setCi("");
    setError(null); setExito(null);
  }

  function cambiarModo(m: Modo) {
    setModo(m);
    limpiarFormulario();
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setEnviando(false);
    }
  }

  async function handleRegistro(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(null);
    setEnviando(true);
    try {
      await api.post("/auth/register", {
        nombre, apellido, email, password,
        especialidad: especialidad || undefined,
        ci: ci || undefined,
      });
      setExito("Cuenta creada correctamente. Ya podés iniciar sesión.");
      setTimeout(() => cambiarModo("login"), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al registrarse");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-logo">🎓</span>
          <h1 className="login-titulo">LMS Gamification</h1>
          <p className="login-subtitulo">Acceso para docentes</p>
        </div>

        {/* Tabs login / registro */}
        <div style={{ display: "flex", marginBottom: "1.25rem", borderBottom: "1px solid #e5e7eb" }}>
          {(["login", "registro"] as Modo[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => cambiarModo(m)}
              style={{
                flex: 1, padding: "0.6rem", border: "none", background: "transparent",
                cursor: "pointer", fontWeight: modo === m ? 600 : 400,
                borderBottom: modo === m ? "2px solid #6366f1" : "2px solid transparent",
                color: modo === m ? "#6366f1" : "#6b7280",
                fontSize: "0.95rem",
              }}
            >
              {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          ))}
        </div>

        {/* LOGIN */}
        {modo === "login" && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="campo">
              <label className="campo-label">Email</label>
              <input type="email" className="campo-input"
                placeholder="docente@mail.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required autoFocus />
            </div>
            <div className="campo">
              <label className="campo-label">Contraseña</label>
              <input type="password" className="campo-input"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="boton-primario w-full" disabled={enviando}>
              {enviando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        )}

        {/* REGISTRO */}
        {modo === "registro" && (
          <form onSubmit={handleRegistro} className="login-form">
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div className="campo" style={{ flex: 1 }}>
                <label className="campo-label">Nombre *</label>
                <input type="text" className="campo-input"
                  value={nombre} onChange={(e) => setNombre(e.target.value)}
                  required autoFocus />
              </div>
              <div className="campo" style={{ flex: 1 }}>
                <label className="campo-label">Apellido *</label>
                <input type="text" className="campo-input"
                  value={apellido} onChange={(e) => setApellido(e.target.value)}
                  required />
              </div>
            </div>
            <div className="campo">
              <label className="campo-label">Email *</label>
              <input type="email" className="campo-input"
                placeholder="docente@mail.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required />
            </div>
            <div className="campo">
              <label className="campo-label">Contraseña * (mín. 6 caracteres)</label>
              <input type="password" className="campo-input"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required />
            </div>
            <div className="campo">
              <label className="campo-label">Especialidad</label>
              <input type="text" className="campo-input"
                placeholder="Ej: Matemáticas, Programación..."
                value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} />
            </div>
            <div className="campo">
              <label className="campo-label">CI (opcional, 7 dígitos)</label>
              <input type="number" className="campo-input"
                placeholder="1234567"
                value={ci} onChange={(e) => setCi(e.target.value)}
                min={1000000} max={9999999} />
            </div>
            {error  && <p className="login-error">{error}</p>}
            {exito  && <p style={{ color: "#16a34a", fontSize: "0.875rem" }}>{exito}</p>}
            <button type="submit" className="boton-primario w-full" disabled={enviando}>
              {enviando ? "Registrando..." : "Crear cuenta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}