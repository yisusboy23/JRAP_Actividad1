import { Link, useLocation } from "react-router-dom";

const LINKS = [
  { ruta: "/",        etiqueta: "Dashboard" },
  { ruta: "/ranking", etiqueta: "Ranking"   },
  { ruta: "/badges",  etiqueta: "Insignias" },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="nav">
      <span className="nav-logo">LMS Gamification</span>
      <div className="nav-links">
        {LINKS.map((link) => (
          <Link
            key={link.ruta}
            to={link.ruta}
            className={`nav-link${pathname === link.ruta ? " nav-link-activo" : ""}`}
          >
            {link.etiqueta}
          </Link>
        ))}
      </div>
    </nav>
  );
}