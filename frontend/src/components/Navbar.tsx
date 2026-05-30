import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LINKS_PUBLICOS = [
  { ruta: "/",        etiqueta: "Dashboard" },
  { ruta: "/ranking", etiqueta: "Ranking"   },
  { ruta: "/badges",  etiqueta: "Insignias" },
];

export default function Navbar() {
  const { pathname }        = useLocation();
  const { docente, logout } = useAuth();
  const navigate            = useNavigate();

  return (
    <nav className="nav">
      <span className="nav-logo">LMS Gamification</span>
      <div className="nav-links">
        {LINKS_PUBLICOS.map((link) => (
          <Link
            key={link.ruta}
            to={link.ruta}
            className={`nav-link${pathname === link.ruta ? " nav-link-activo" : ""}`}
          >
            {link.etiqueta}
          </Link>
        ))}

        {docente ? (
          <>
            <Link
              to="/admin"
              className={`nav-link${pathname === "/admin" ? " nav-link-activo" : ""}`}
            >
              Panel docente
            </Link>
            <button
              className="nav-link nav-link-btn"
              onClick={() => { logout(); navigate("/"); }}
            >
              Salir
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className={`nav-link${pathname === "/login" ? " nav-link-activo" : ""}`}
          >
            Docentes
          </Link>
        )}
      </div>
    </nav>
  );
}
