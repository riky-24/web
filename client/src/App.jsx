// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AdminLayout from "./layouts/AdminLayout";
import LoginAdmin from "./page/admin/LoginAdmin";
import Dashboard from "./page/admin/DashBoard";
import AuditLogs from "./page/admin/AuditLogs";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ROOT: Redirect ke Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginAdmin />} />

          {/* PROTECTED AREA */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="logs" element={<AuditLogs />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;
