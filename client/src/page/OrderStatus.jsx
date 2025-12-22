import { useState } from "react";
import api from "../services/api";
import {
  FaSearch,
  FaReceipt,
  FaCheckCircle,
  FaSpinner,
  FaTimesCircle,
} from "react-icons/fa";

export default function OrderStatus() {
  const [orderId, setOrderId] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!orderId) return;

    setLoading(true);
    setError("");
    setOrderData(null);

    try {
      // Endpoint cek status order publik
      const res = await api.get(`/orders/${orderId}`);
      setOrderData(res.data.data);
    } catch (err) {
      setError("Order ID tidak ditemukan atau terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-4 pt-24 text-slate-100 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white mb-2">
            Cek Status Pesanan
          </h1>
          <p className="text-slate-400">
            Pantau status top up Anda secara realtime
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 mb-8">
          <form onSubmit={handleCheck} className="flex gap-4">
            <div className="relative flex-1">
              <FaReceipt className="absolute left-4 top-4 text-slate-500" />
              <input
                type="text"
                className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-blue-500 font-mono"
                placeholder="Masukkan Order ID / Invoice..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin" /> : "Cek"}
            </button>
          </form>
          {error && (
            <p className="text-red-400 mt-4 text-sm text-center font-bold">
              {error}
            </p>
          )}
        </div>

        {/* Result Card */}
        {orderData && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">
                  Order ID
                </p>
                <p className="font-mono text-lg font-bold text-white">
                  {orderData.id}
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2
                ${
                  orderData.status === "success"
                    ? "bg-green-500/20 text-green-400"
                    : orderData.status === "pending"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {orderData.status === "success" && <FaCheckCircle />}
                {orderData.status === "pending" && (
                  <FaSpinner className="animate-spin" />
                )}
                {orderData.status === "failed" && <FaTimesCircle />}
                {orderData.status.toUpperCase()}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Item</span>
                <span className="font-bold">
                  {orderData.product?.game?.name} - {orderData.product?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target ID</span>
                <span className="font-mono bg-slate-700 px-2 py-0.5 rounded text-sm">
                  {orderData.playerId} ({orderData.serverZone || "-"})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Harga</span>
                <span className="font-bold text-blue-400 text-xl">
                  Rp {orderData.amount.toLocaleString()}
                </span>
              </div>

              {orderData.status === "pending" && orderData.paymentUrl && (
                <div className="mt-6">
                  <a
                    href={orderData.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full bg-green-600 text-white text-center py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
                  >
                    Lanjutkan Pembayaran
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
