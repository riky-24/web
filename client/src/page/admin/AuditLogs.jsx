// client/src/page/admin/AuditLogs.jsx
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
// Pastikan Anda membuat endpoint API untuk fetch logs di backend & client
import api from "../../services/api";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulasi data dulu sebelum API logs ready
  useEffect(() => {
    // Nanti ganti: api.get('/admin/logs')...
    setTimeout(() => {
      setLogs([
        {
          id: 1,
          action: "AUTH_LOGIN",
          details: "Login success",
          ipAddress: "192.168.1.1",
          user: { username: "admin" },
          isSuspicious: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          action: "AUTH_MFA_FAIL",
          details: "Wrong OTP Code",
          ipAddress: "10.0.0.5",
          user: { username: "hacker01" },
          isSuspicious: true,
          createdAt: new Date(Date.now() - 3600000),
        },
        {
          id: 3,
          action: "ORDER_CREATE",
          details: "Created Order #ORD-123",
          ipAddress: "192.168.1.10",
          user: { username: "user_vip" },
          isSuspicious: false,
          createdAt: new Date(Date.now() - 7200000),
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getIcon = (action, suspicious) => {
    if (suspicious) return <ShieldAlert className="text-red-500" size={18} />;
    if (action.includes("AUTH"))
      return <ShieldCheck className="text-blue-500" size={18} />;
    return <AlertTriangle className="text-slate-400" size={18} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Forensic Logs</h2>
          <p className="text-slate-500 text-sm">
            Monitor semua aktivitas sistem dan keamanan.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Cari IP, User, atau Action..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
          <Filter size={18} /> Filter
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Severity</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">IP Address</th>
              <th className="px-6 py-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr
                key={log.id}
                className={`hover:bg-slate-50 transition-colors ${
                  log.isSuspicious ? "bg-red-50/30" : ""
                }`}
              >
                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                  {format(new Date(log.createdAt), "dd MMM yyyy HH:mm:ss")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getIcon(log.action, log.isSuspicious)}
                    <span
                      className={`font-medium ${
                        log.isSuspicious ? "text-red-600" : "text-slate-600"
                      }`}
                    >
                      {log.isSuspicious ? "HIGH" : "NORMAL"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-700">
                  {log.action}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {log.user?.username || "Guest"}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500 bg-slate-100 rounded px-2 w-fit">
                  {log.ipAddress}
                </td>
                <td className="px-6 py-4 text-slate-600">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
