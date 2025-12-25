// client/src/layouts/AdminLayout.jsx
import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Gamepad2,
  ShieldAlert,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 1. Proteksi Halaman (Double Check di Frontend)
  if (!user || user.role !== "ADMIN") {
    // Redirect paksa jika bukan admin
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { name: "Orders", path: "/admin/orders", icon: <ShoppingCart size={20} /> },
    { name: "Users & Access", path: "/admin/users", icon: <Users size={20} /> },
    {
      name: "Game Products",
      path: "/admin/games",
      icon: <Gamepad2 size={20} />,
    },
    {
      name: "Forensic Logs",
      path: "/admin/logs",
      icon: <ShieldAlert size={20} />,
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* --- SIDEBAR --- */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-xl z-50`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700 bg-slate-950">
          {isSidebarOpen ? (
            <span className="text-xl font-bold tracking-wider text-blue-400">
              ADMIN<span className="text-white">PANEL</span>
            </span>
          ) : (
            <span className="text-xl font-bold text-blue-400 mx-auto">AP</span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-slate-800 rounded"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-2 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <div>{item.icon}</div>
              {isSidebarOpen && (
                <span className="font-medium text-sm">{item.name}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div
            className={`flex items-center gap-3 ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
              {user.username.charAt(0).toUpperCase()}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">
                  {user.username}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            )}
            {isSidebarOpen && (
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header Mobile / Title */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-700">
            Control Center
          </h1>
          <div className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            System Status:{" "}
            <span className="text-green-500 font-bold">● Online</span>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
