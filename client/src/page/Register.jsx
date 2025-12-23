import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Swal from "sweetalert2"; // <--- IMPORT INI
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaCheckCircle,
  FaExclamationCircle,
  FaRocket,
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
    if (error) setError(null);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Konfirmasi password tidak sesuai!");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // --- PERBAIKAN: GANTI ALERT DENGAN SWEETALERT CUSTOM ---
      Swal.fire({
        title: "Registrasi Berhasil! 🚀",
        text: "Akun Anda telah dibuat. Silakan cek email untuk verifikasi.",
        icon: "success",
        background: "#1e293b", // Warna Slate-800 (Dark Mode)
        color: "#ffffff", // Teks Putih
        confirmButtonColor: "#2563eb", // Tombol Biru
        confirmButtonText: "Siap, Login Sekarang!",
        backdrop: `
          rgba(15, 23, 42, 0.6)
          backdrop-filter: blur(8px)
        `,
        // Efek backdrop gelap
        customClass: {
          popup: "rounded-3xl border border-slate-700 shadow-2xl", // Sudut membulat & border
        },
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });
      // -------------------------------------------------------
    } catch (err) {
      // Error Notification juga bisa dipercantik (Opsional)
      // Tapi menampilkan teks di form (seperti sekarang) juga sudah bagus untuk UX.
      setError(err.response?.data?.message || "Registrasi Gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse"></div>

      <div className="relative w-full max-w-lg bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl p-8 z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-700 p-3 rounded-full ring-4 ring-slate-800 shadow-lg transform hover:scale-110 transition-transform">
              <FaRocket className="text-3xl text-blue-400" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Buat Akun Baru
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            Bergabung dan nikmati harga termurah!
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 animate-bounce-short">
            <FaExclamationCircle className="text-red-400 text-xl flex-shrink-0" />
            <p className="text-sm font-bold text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Nama */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase ml-1">
              Nama Lengkap
            </label>
            <div className="relative group">
              <FaUser className="absolute top-4 left-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                name="name"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                placeholder="Nama Kamu"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase ml-1">
              Email
            </label>
            <div className="relative group">
              <FaEnvelope className="absolute top-4 left-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                name="email"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                placeholder="email@contoh.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase ml-1">
                Password
              </label>
              <div className="relative group">
                <FaLock className="absolute top-4 left-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  placeholder="Min. 8 Karakter"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase ml-1">
                Ulangi Password
              </label>
              <div className="relative group">
                <FaCheckCircle className="absolute top-4 left-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                  placeholder="Ketik Ulang"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Mendaftarkan...
              </span>
            ) : (
              "Buat Akun Sekarang"
            )}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-700/50">
          <p className="text-slate-400 text-sm">
            Sudah punya akun?{" "}
            <Link
              to="/login"
              className="text-blue-400 font-bold hover:text-blue-300 hover:underline transition-all"
            >
              Login Disini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
