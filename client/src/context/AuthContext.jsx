import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cek sesi saat refresh
  useEffect(() => {
    const token = localStorage.getItem("token");
    // Di real app, kita harusnya hit endpoint /auth/me untuk validasi token
    // Untuk sekarang kita anggap jika ada token, user "logged in" (nanti API akan tolak jika invalid)
    if (token) {
      // Simulasi decode user dari token/storage jika perlu
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.login({ email, password });

      // Skenario A: Butuh MFA (Admin biasanya kena ini)
      if (data.status === "success" && data.data?.needMfa) {
        return data.data; // Return { needMfa: true, preAuthToken: ... }
      }

      // Skenario B: Login Langsung
      const { user, token } = data.data;

      // Simpan Sesi
      localStorage.setItem("token", token);
      setUser(user);

      // Return Role untuk validasi di Frontend
      return { success: true, role: user.role };
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const verifyMfa = async (preAuthToken, mfaCode) => {
    try {
      const { data } = await api.verifyMfa({ preAuthToken, mfaCode });
      const { user, token } = data.data;

      localStorage.setItem("token", token);
      setUser(user);

      return { success: true, role: user.role };
    } catch (error) {
      console.error("MFA Error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    // Kita biarkan komponen yang melakukan navigasi ke /login
  };

  return (
    <AuthContext.Provider value={{ user, login, verifyMfa, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
