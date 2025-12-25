// client/src/page/admin/LoginAdmin.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, AlertCircle, ChevronRight } from "lucide-react";

const LoginAdmin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mfaCode: "",
  });
  const [step, setStep] = useState("CREDENTIALS"); // Tahap 1: Email/Pass, Tahap 2: MFA
  const [preAuthToken, setPreAuthToken] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (step === "CREDENTIALS") {
        // --- TAHAP 1: INPUT KREDENSIAL ---
        const result = await login(formData.email, formData.password);

        if (result?.needMfa) {
          // Jika Server minta MFA, kita pindah ke tampilan input kode
          setPreAuthToken(result.preAuthToken);
          setStep("MFA");
        } else {
          // Jika lolos langsung, PASTIIN DIA ADMIN
          if (result.role !== "ADMIN") {
            throw new Error("Akses Ditolak: Anda bukan Admin.");
          }
          // Masuk ke Ruang Kendali
          navigate("/admin/dashboard");
        }
      } else {
        // --- TAHAP 2: INPUT KODE MFA ---
        const result = await verifyMfa(preAuthToken, formData.mfaCode);

        if (result.role !== "ADMIN") {
          throw new Error("Akses Ditolak: Anda bukan Admin.");
        }
        navigate("/admin/dashboard");
      }
    } catch (err) {
      // Tampilkan error cantik
      setError(
        err.response?.data?.message || err.message || "Gagal masuk sistem."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Hiasan Background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            ADMIN<span className="text-blue-500">PANEL</span>
          </h1>
          <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">
            Sistem Pemantauan Terpusat
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 text-sm animate-pulse">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === "CREDENTIALS" ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1 uppercase">
                  Email Akses
                </label>
                <input
                  type="email"
                  className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-700"
                  placeholder="admin@pusat.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1 uppercase">
                  Kode Sandi
                </label>
                <input
                  type="password"
                  className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-700"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>
          ) : (
            <div className="text-center animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-slate-300 text-sm mb-4">
                Masukkan Kode Authenticator 6 Digit
              </p>
              <div className="relative max-w-[200px] mx-auto">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 text-white pl-10 pr-4 py-3 rounded-lg text-center tracking-[0.5em] font-mono text-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                  placeholder="000000"
                  value={formData.mfaCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mfaCode: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  maxLength={6}
                  autoFocus
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                {step === "CREDENTIALS" ? "Buka Akses" : "Verifikasi"}{" "}
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800 pt-4">
          <p className="text-slate-600 text-[10px] uppercase tracking-wider">
            Protected by Server-Side Forensics & Rate Limiting
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginAdmin;
