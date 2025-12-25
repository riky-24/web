import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, ShieldCheck, Stars } from "lucide-react";
import api from "../../services/api"; // Pastikan path ini benar
import { useAuth } from "../../context/AuthContext"; // Asumsi ada context

const LoginAdmin = () => {
  const navigate = useNavigate();
  // const { login } = useAuth(); // Jika pakai context, aktifkan ini

  // State Management
  const [step, setStep] = useState(1); // 1: Credential, 2: MFA
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const [preAuthToken, setPreAuthToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- LOGIC TAHAP 1: KIRIM EMAIL & PASSWORD ---
  const handleInitiateLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const response = await api.post("/admin/auth/login", formData);
      
      // Jika Backend minta MFA (Sesuai logic server kita)
      if (response.data.data.mfaRequired) {
        setPreAuthToken(response.data.data.preAuthToken);
        setStep(2); // Pindah ke layar MFA
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Login gagal. Cek koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC TAHAP 2: KIRIM OTP ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const response = await api.post("/admin/auth/verify-otp", {
        preAuthToken,
        otpCode,
      });

      // Login Sukses Full
      const { accessToken } = response.data.data;
      localStorage.setItem("token", accessToken); // Simpan token
      // login(accessToken); // Jika pakai AuthContext
      
      navigate("/admin/dashboard"); // Redirect ke markas
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Kode OTP salah/kadaluwarsa.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f0c29] overflow-hidden relative font-sans text-white">
      {/* --- BACKGROUND ANIMATION (Sagittarius Cosmos) --- */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#240b36] via-[#1a0b2e] to-[#000000]"></div>
      
      {/* Stars Effect */}
      <div className="absolute inset-0 opacity-40">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random(),
            }}
            animate={{
              y: [null, Math.random() * -100],
              opacity: [0.2, 1, 0.2],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ width: Math.random() * 3 + "px", height: Math.random() * 3 + "px" }}
          />
        ))}
      </div>

      {/* --- MAIN CARD (Glassmorphism) --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
      >
        {/* Header Icon: Sagittarius Arrow Vibes */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50 rounded-full animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-purple-600 to-indigo-600 p-4 rounded-full border border-purple-400/30">
              <Stars className="w-8 h-8 text-yellow-300" />
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 tracking-wider">
            ADMIN PANEL
          </h1>
          <p className="text-purple-200/60 text-sm mt-2">
            Gatekeeper Access Level 99
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center backdrop-blur-sm"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- FORM AREA --- */}
        <div className="relative overflow-hidden min-h-[200px]">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: CREDENTIALS */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleInitiateLogin}
                className="space-y-5"
              >
                <div className="group">
                  <label className="block text-xs font-medium text-purple-300 mb-1 ml-1 uppercase tracking-widest">Email Identity</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-purple-400 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                      type="email"
                      required
                      className="w-full bg-[#160e2e]/60 border border-purple-500/30 rounded-xl py-3 pl-10 pr-4 text-purple-100 placeholder-purple-500/30 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all duration-300"
                      placeholder="admin@universe.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-medium text-purple-300 mb-1 ml-1 uppercase tracking-widest">Passcode</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-purple-400 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                      type="password"
                      required
                      className="w-full bg-[#160e2e]/60 border border-purple-500/30 rounded-xl py-3 pl-10 pr-4 text-purple-100 placeholder-purple-500/30 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all duration-300"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(234, 179, 8, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="w-full mt-4 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 rounded-xl border border-white/10 flex items-center justify-center gap-2 group transition-all"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      INITIATE ACCESS <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}

            {/* STEP 2: MFA CHALLENGE */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleVerifyOtp}
                className="space-y-6 pt-2"
              >
                <div className="text-center space-y-2">
                  <div className="inline-block p-3 bg-yellow-500/10 rounded-full border border-yellow-500/30 animate-pulse">
                    <ShieldCheck className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Security Check</h3>
                  <p className="text-xs text-purple-300">Enter the 6-digit code from your authenticator app.</p>
                </div>

                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength="6"
                    autoFocus
                    className="w-2/3 bg-[#160e2e]/80 border-2 border-yellow-500/40 rounded-xl py-3 text-center text-2xl tracking-[0.5em] font-mono text-yellow-400 placeholder-yellow-800/30 focus:outline-none focus:border-yellow-400 focus:shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(168, 85, 247, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl border border-white/10 shadow-lg flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "VERIFY & ENTER"
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-xs text-purple-400 hover:text-purple-200 underline decoration-dashed underline-offset-4 transition-colors"
                >
                  Cancel and return to login
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer Decoration */}
      <div className="absolute bottom-4 text-purple-500/20 text-[10px] tracking-[0.3em] font-mono select-none">
        SECURE SAGITTARIUS SYSTEM v2.0
      </div>
    </div>
  );
};

export default LoginAdmin;