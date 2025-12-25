// client/src/page/admin/Dashboard.jsx
import { DollarSign, ShoppingBag, Users, Activity } from "lucide-react";

const StatCard = ({ title, value, icon, color, trend }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div
        className={`p-3 rounded-lg ${color} text-white shadow-lg shadow-opacity-20`}
      >
        {icon}
      </div>
      <span
        className={`text-xs font-bold ${
          trend >= 0 ? "text-green-500" : "text-red-500"
        } bg-slate-50 px-2 py-1 rounded`}
      >
        {trend > 0 ? "+" : ""}
        {trend}%
      </span>
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
  </div>
);

const AdminDashboard = () => {
  // Nanti data ini diambil dari API
  const stats = [
    {
      title: "Total Revenue",
      value: "Rp 125.000.000",
      icon: <DollarSign size={24} />,
      color: "bg-emerald-500",
      trend: 12.5,
    },
    {
      title: "Active Orders",
      value: "1,245",
      icon: <ShoppingBag size={24} />,
      color: "bg-blue-500",
      trend: 8.2,
    },
    {
      title: "Total Users",
      value: "8,549",
      icon: <Users size={24} />,
      color: "bg-purple-500",
      trend: -2.4,
    },
    {
      title: "System Load",
      value: "24%",
      icon: <Activity size={24} />,
      color: "bg-orange-500",
      trend: 0.5,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">
          Dashboard Overview
        </h2>
        <button className="px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800">
          Download Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Content Placeholder for Charts/Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-96 flex items-center justify-center text-slate-400">
          Area Grafik Penjualan (Akan Datang)
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-96 flex items-center justify-center text-slate-400">
          Area Aktivitas Terbaru
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
