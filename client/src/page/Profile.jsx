import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  FaUserCircle,
  FaHistory,
  FaSignOutAlt,
  FaWallet,
} from "react-icons/fa";

export default function Profile() {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect jika belum login
  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  // Ambil data transaksi user
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Pastikan endpoint ini ada di backend (GET /api/orders/my-orders)
        const res = await api.get("/orders/my-orders");
        setTransactions(res.data.data);
      } catch (err) {
        console.error("Gagal ambil transaksi", err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) fetchTransactions();
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0F172A] p-4 pt-24 text-slate-100">
      <div className="max-w-4xl mx-auto">
        {/* Header Profile */}
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 flex flex-col md:flex-row items-center gap-6 shadow-xl">
          <FaUserCircle className="text-8xl text-slate-600" />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-black text-white">{user.name}</h1>
            <p className="text-slate-400">{user.email}</p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
              <span className="bg-blue-600/20 text-blue-400 px-4 py-1 rounded-full text-sm font-bold border border-blue-600/30">
                Member
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500/10 text-red-400 px-4 py-1 rounded-full text-sm font-bold border border-red-500/30 hover:bg-red-500/20 flex items-center gap-2 transition-colors"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <FaHistory className="text-blue-500" /> Riwayat Transaksi
          </h2>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                Memuat data...
              </div>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4">ID Order</th>
                      <th className="px-6 py-4">Game</th>
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4">Harga</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {transactions.map((trx) => (
                      <tr
                        key={trx.id}
                        className="hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-sm">
                          {trx.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 font-bold">
                          {trx.product?.game?.name || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {trx.product?.name || "-"}
                        </td>
                        <td className="px-6 py-4 font-bold text-blue-400">
                          Rp {trx.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold capitalize 
                            ${
                              trx.status === "success"
                                ? "bg-green-500/20 text-green-400"
                                : trx.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {trx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <FaWallet className="text-4xl mb-4 opacity-20" />
                <p>Belum ada transaksi.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
