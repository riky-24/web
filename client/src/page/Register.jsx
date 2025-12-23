import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Reset error saat user mengetik
    if (error) setError(null);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Validasi Frontend: Password Match
    if (formData.password !== formData.confirmPassword) {
      setError("Konfirmasi password tidak sesuai!");
      setLoading(false);
      return;
    }

    try {
      // 2. Kirim ke Backend
      const response = await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // 3. Sukses
      alert(response.data.message); // "Registrasi berhasil! Cek email..."
      navigate("/login");
    } catch (err) {
      // 4. Handle Error
      const msg = err.response?.data?.message || "Registrasi Gagal. Coba lagi.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 rounded-full blur-[40px] opacity-20"></div>
          <h2 className="text-3xl font-black text-white relative z-10">
            Buat Akun Baru
          </h2>
          <p className="text-slate-400 text-sm mt-2 relative z-10">
            Bergabung dan mulai topup game favoritmu!
          </p>
        </div>

        <div className="p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-3 animate-pulse">
              <FaExclamationCircle className="text-red-500 text-xl" />
              <p className="text-sm font-bold text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Nama */}
            <div className="relative group">
              <FaUser className="absolute top-4 left-4 text-slate-400 group-focus-within:text-blue-500" />
              <input
                type="text"
                name="name"
                required
                placeholder="Nama Lengkap"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div className="relative group">
              <FaEnvelope className="absolute top-4 left-4 text-slate-400 group-focus-within:text-blue-500" />
              <input
                type="email"
                name="email"
                required
                placeholder="Alamat Email"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <FaLock className="absolute top-4 left-4 text-slate-400 group-focus-within:text-blue-500" />
              <input
                type="password"
                name="password"
                required
                placeholder="Password (Min. 8 Karakter)"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {/* Confirm Password */}
            <div className="relative group">
              <FaCheckCircle className="absolute top-4 left-4 text-slate-400 group-focus-within:text-blue-500" />
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="Ulangi Password"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-medium"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? "Memproses Pendaftaran..." : "Daftar Sekarang"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="text-blue-600 font-bold hover:underline"
              >
                Login Disini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
