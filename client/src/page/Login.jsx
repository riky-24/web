import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Sesuaikan endpoint dengan backend Anda
      const response = await api.post("/auth/login", { email, password });

      // Asumsi response backend: { data: { user: {...}, token: "..." } }
      const { user, token } = response.data.data;

      login(user, token);
      navigate("/"); // Redirect ke Home setelah login
    } catch (err) {
      setError(
        err.response?.data?.message || "Gagal login. Periksa kredensial Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white">Selamat Datang</h1>
          <p className="text-slate-400 mt-2">
            Masuk untuk mengelola pesanan Anda
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="email"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="password"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="text-right mt-2">
              <Link
                to="/forgot-password"
                class="text-xs text-blue-400 hover:text-blue-300"
              >
                Lupa Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              "Memproses..."
            ) : (
              <>
                <FaSignInAlt /> Masuk Sekarang
              </>
            )}
          </button>
        </form>

        <p className="text-slate-500 text-center mt-8 text-sm">
          Belum punya akun?{" "}
          <Link
            to="/register"
            className="text-blue-400 font-bold hover:text-blue-300"
          >
            Daftar Disini
          </Link>
        </p>
      </div>
    </div>
  );
}
