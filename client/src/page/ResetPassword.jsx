import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FaLock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // Ambil ?token=... dari URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState(""); // success | error
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Jika token tidak ada di URL
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">
        <p className="text-red-500 font-bold">Error: Token tidak ditemukan.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    setMessage("");

    if (formData.newPassword !== formData.confirmPassword) {
      setStatus("error");
      setMessage("Konfirmasi password tidak cocok!");
      setLoading(false);
      return;
    }

    try {
      // Kirim Token + Password Baru ke Backend
      await api.post("/auth/reset-password", {
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setStatus("success");
      setMessage("Password berhasil diubah! Mengarahkan ke login...");

      // Redirect ke login setelah 3 detik
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setStatus("error");
      setMessage(
        err.response?.data?.message ||
          "Gagal mereset password. Token mungkin sudah kedaluwarsa."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white">Reset Password</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Masukkan password baru Anda
          </p>
        </div>

        {/* Notifikasi Sukses / Gagal */}
        {message && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm flex items-center gap-3 font-bold
            ${
              status === "success"
                ? "bg-green-500/10 text-green-400 border border-green-500/30"
                : "bg-red-500/10 text-red-400 border border-red-500/30"
            }`}
          >
            {status === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">
              Password Baru
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="password"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                placeholder="Minimal 8 karakter"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">
              Ulangi Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-3.5 text-slate-500" />
              <input
                type="password"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                placeholder="Konfirmasi password baru"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Ubah Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
