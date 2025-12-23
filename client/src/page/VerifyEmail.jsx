import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api"; // Pastikan path ini benar sesuai struktur folder Anda
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("Sedang memverifikasi akun Anda...");

  useEffect(() => {
    const verifyAccount = async () => {
      // Jika tidak ada token di URL
      if (!token) {
        setStatus("error");
        setMessage("Token verifikasi tidak ditemukan / URL tidak valid.");
        return;
      }

      try {
        // Kirim token ke backend
        const response = await api.post("/auth/verify-email", { token });

        setStatus("success");
        setMessage(response.data.message || "Verifikasi Berhasil!");

        // Redirect otomatis ke login setelah 3 detik
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "Verifikasi Gagal atau Token Kadaluarsa."
        );
      }
    };

    verifyAccount();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        {/* --- STATE: LOADING --- */}
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <FaSpinner className="text-4xl text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-800">
              Memproses Verifikasi
            </h2>
            <p className="text-slate-500 mt-2">{message}</p>
          </div>
        )}

        {/* --- STATE: SUKSES --- */}
        {status === "success" && (
          <div className="flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FaCheckCircle className="text-4xl text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Verifikasi Berhasil!
            </h2>
            <p className="text-slate-500 mb-6">{message}</p>
            <p className="text-xs text-slate-400">
              Anda akan diarahkan ke halaman login...
            </p>

            <button
              onClick={() => navigate("/login")}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
            >
              Login Sekarang
            </button>
          </div>
        )}

        {/* --- STATE: ERROR --- */}
        {status === "error" && (
          <div className="flex flex-col items-center animate-[shake_0.5s_ease-in-out]">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FaTimesCircle className="text-4xl text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Verifikasi Gagal
            </h2>
            <p className="text-red-500 font-medium mb-6 bg-red-50 px-4 py-2 rounded-lg">
              {message}
            </p>

            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition"
            >
              Kembali ke Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
