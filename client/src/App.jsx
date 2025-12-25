// client/src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layout & Pages (Hanya Admin)
import AdminLayout from "./layouts/AdminLayout";
import LoginAdmin from "./page/admin/LoginAdmin"; // Pastikan file ini ada (yang desain gelap tadi)
import AdminDashboard from "./page/admin/DashBoard";
import AuditLogs from "./page/admin/AuditLogs";

// Kita tidak butuh Home, GameDetail, dll di sini karena ini web khusus Admin.

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="font-sans text-slate-800 antialiased bg-slate-50 min-h-screen">
          <Routes>
            {/* --- PUBLIC ROUTES --- */}
            {/* Redirect root '/' langsung ke Login Admin */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Pintu Masuk Tunggal (Kita rename pathnya jadi /login biasa karena ini web khusus admin) */}
            <Route path="/login" element={<LoginAdmin />} />

            {/* --- PROTECTED ADMIN AREA --- */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route
                index
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="logs" element={<AuditLogs />} />

              {/* Nanti tambah: Orders, Users, Products di sini */}
            </Route>

            {/* --- FALLBACK --- */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
