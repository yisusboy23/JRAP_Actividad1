import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider }  from "./context/AuthContext";
import Navbar            from "./components/Navbar";
import ProtectedRoute    from "./components/ProtectedRoute";
import Dashboard         from "./pages/Dashboard";
import Ranking           from "./pages/Ranking";
import Badges            from "./pages/Badges";
import Login             from "./pages/Login";
import AdminPanel        from "./pages/AdminPanel";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", padding: "1rem" }}>
          <Routes>
            <Route path="/login"   element={<Login />} />
            <Route path="/"        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>}   />
            <Route path="/badges"  element={<ProtectedRoute><Badges /></ProtectedRoute>}    />
            <Route path="/admin"   element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}