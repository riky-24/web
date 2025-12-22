import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FaUser, FaEnvelope, FaLock, FaUserPlus } from "react-icons/fa";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Konfirmasi password tidak cocok.");
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      alert("Registrasi berhasil! Silakan login.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mendaftar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white">Buat Akun Baru</h1>
          <p className="text-slate-400 mt-2">
            Gabung komunitas gamers terbesar
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">
              Nama Lengkap
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="text"
                name="name"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                placeholder="John Doe"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">
              Email
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="email"
                name="email"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                placeholder="nama@email.com"
                onChange={handleChange}
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
                name="password"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">
              Konfirmasi Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="password"
                name="confirmPassword"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              "Mendaftar..."
            ) : (
              <>
                <FaUserPlus /> Daftar Akun
              </>
            )}
          </button>
        </form>

        <p className="text-slate-500 text-center mt-6 text-sm">
          Sudah punya akun?{" "}
          <Link
            to="/login"
            className="text-blue-400 font-bold hover:text-blue-300"
          >
            Login Disini
          </Link>
        </p>
      </div>
    </div>
  );
}
