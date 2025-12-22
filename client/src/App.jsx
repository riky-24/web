import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
//import { AuthProvider } from "./context/AuthContext"; // Integrasi Context Login

// --- IMPORT HALAMAN ---
// Pastikan nama file di folder 'page' sudah Huruf Besar semua (Home.jsx, Login.jsx, dst)
import Home from "./page/Home";
import GameDetail from "./page/GameDetail";
//import Login from "./page/Login";
//import Register from "./page/Register";
//import Profile from "./page/Profile";
//import OrderStatus from "./page/OrderStatus";
//import ForgotPassword from "./page/ForgotPassword";

function App() {
  return (
    // 1. Bungkus dengan AuthProvider agar status login terbaca di semua halaman
    <AuthProvider>
      <Router>
        <div className="font-sans text-slate-800 antialiased">
          <Routes>
            {/* --- PUBLIC ROUTES (Bisa diakses siapa saja) --- */}
            <Route path="/" element={<Home />} />
            <Route path="/game/:slug" element={<GameDetail />} />
            <Route path="/order-status" element={<OrderStatus />} />

            {/* --- AUTH ROUTES (Login/Register) --- */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* --- PROTECTED ROUTES (Halaman User Login) --- */}
            {/* Nanti kita bisa tambahkan logika redirect jika belum login */}
            <Route path="/profile" element={<Profile />} />

            {/* --- 404 NOT FOUND --- */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404</h1>
                    <p>Halaman tidak ditemukan.</p>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
