import { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

// =================================================================
// 1. MEMBUAT CONTEXT & EXPORT (WAJIB ADA 'export' AGAR TIDAK ERROR)
// =================================================================
export const AuthContext = createContext();

// =================================================================
// 2. CUSTOM HOOK (Agar bisa dipanggil pakai useAuth() di file lain)
// =================================================================
export const useAuth = () => {
  return useContext(AuthContext);
};

// =================================================================
// 3. PROVIDER (Pembungkus Logic Login)
// =================================================================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // --- CEK STATUS LOGIN SAAT APLIKASI DIMUAT ---
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          // Set token ke header axios agar request valid
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${storedToken}`;
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Auth Init Error:", error);
          logout();
        }
      } else {
        // Bersihkan sisa-sisa jika data tidak lengkap
        logout();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // --- FUNGSI LOGIN (REQ KE BACKEND) ---
  const login = async (email, password) => {
    try {
      // 1. Tembak API Backend
      const response = await api.post("/auth/login", { email, password });

      // 2. Ambil data dari respon backend
      const { token, user } = response.data.data;

      // 3. Simpan ke State & LocalStorage
      setUser(user);
      setToken(token);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // 4. Set Header Axios Global
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      return response;
    } catch (error) {
      // Lempar error agar bisa ditangkap catch di Login.jsx
      throw error;
    }
  };

  // --- FUNGSI LOGOUT ---
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];

    // Opsional: Redirect ke halaman login
    // window.location.href = "/login";
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
      {/* Cegah render anak komponen sebelum cek login selesai */}
      {!loading && children}
    </AuthContext.Provider>
  );
};
