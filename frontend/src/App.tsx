// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar     from "./components/Navbar";
import Dashboard  from "./pages/Dashboard";
import Ranking    from "./pages/Ranking";
import Badges     from "./pages/Badges";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", padding: "1rem" }}>
        <Routes>
          <Route path="/"        element={<Dashboard />} />
          <Route path="/ranking" element={<Ranking />}   />
          <Route path="/badges"  element={<Badges />}    />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
