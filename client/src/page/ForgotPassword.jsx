import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { FaEnvelope, FaPaperPlane, FaArrowLeft } from "react-icons/fa";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(""); // success | error
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    setMessage("");

    try {
      // Endpoint Backend: POST /api/auth/forgot-password
      await api.post("/auth/forgot-password", { email });
      setStatus("success");
      setMessage("Link reset password telah dikirim ke email Anda.");
    } catch (err) {
      setStatus("error");
      setMessage(
        err.response?.data?.message ||
          "Gagal mengirim permintaan. Cek email Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
        <Link
          to="/login"
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"
        >
          <FaArrowLeft /> Kembali ke Login
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white">Lupa Password?</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Masukkan email Anda untuk instruksi reset password
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm text-center font-medium
            ${
              status === "success"
                ? "bg-green-500/10 text-green-400 border border-green-500/30"
                : "bg-red-500/10 text-red-400 border border-red-500/30"
            }`}
          >
            {message}
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
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              "Mengirim..."
            ) : (
              <>
                <FaPaperPlane /> Kirim Link Reset
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
