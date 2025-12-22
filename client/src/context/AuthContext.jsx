import { createContext, useState, useEffect } from "react";
import api from "../services/api";

// 1. Buat Context
export const AuthContext = createContext();

// 2. Buat Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Cek status login saat aplikasi dimuat
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Set default header Authorization untuk semua request axios
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Opsional: Anda bisa tambahkan endpoint /auth/me di backend untuk validasi token
          // const res = await api.get('/auth/me');
          // setUser(res.data.user);

          // Untuk sementara, kita anggap token valid & user tersimpan (bisa dikembangkan)
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch (err) {
          console.error("Auth Error:", err);
          logout();
        }
      } else {
        delete api.defaults.headers.common["Authorization"];
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  // Fungsi Login
  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem("token", userToken);
    localStorage.setItem("user", JSON.stringify(userData)); // Simpan data user sederhana

    // Set token ke axios agar request selanjutnya otomatis terotentikasi
    api.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;
  };

  // Fungsi Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    window.location.href = "/login"; // Redirect paksa ke login
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
