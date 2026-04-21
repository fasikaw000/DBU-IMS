import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  Download, 
  Filter, 
  Users, 
  Target, 
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

const AdminReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('distribution');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/reports/analytics');
      setData(res.data);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (reportData, fileName) => {
    if (!reportData || reportData.length === 0) return;
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dbu-primary"></div>
    </div>
  );

  const StatBar = ({ label, value, max, color = "bg-dbu-primary" }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] font-bold text-slate-600 uppercase tracking-tight">
          <span>{label}</span>
          <span>{value}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-1000 ease-out`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Reports</h1>
          <p className="text-slate-500 text-sm">Actionable insights and distribution analytics for the internship system.</p>
        </div>
        <div className="flex items-center gap-2">
            <button className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center hover:bg-slate-50 transition-all">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
            </button>
            <button 
                onClick={() => exportToCSV(data ? data[activeTab === 'distribution' ? 'distribution' : activeTab] : [], 'IMS_Report')}
                className="bg-dbu-primary text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all"
            >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
            </button>
        </div>
      </div>

      <div className="flex border-b border-slate-100 gap-8 overflow-x-auto">
        {[
          { id: 'distribution', label: 'Student Distribution', icon: Users },
          { id: 'status', label: 'Internship Status', icon: Target },
          { id: 'workload', label: 'Advisor Workload', icon: TrendingUp },
          { id: 'grades', label: 'Grade Analytics', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id ? 'border-dbu-primary text-dbu-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Visualization Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center">
            <PieChartIcon className="w-5 h-5 mr-3 text-dbu-primary" />
            {activeTab.replace(/^\w/, c => c.toUpperCase())} Visualization
          </h3>
          <div className="space-y-6">
            {activeTab === 'distribution' && (data?.distribution || []).map((d, i) => (
              <StatBar key={i} label={d.name} value={d.count} max={Math.max(1, ...(data?.distribution || []).map(x => x.count))} />
            ))}
            {activeTab === 'status' && (data?.statusSummary || []).map((s, i) => (
              <StatBar key={i} label={s._id.replace('_', ' ')} value={s.count} max={Math.max(1, ...(data?.statusSummary || []).map(x => x.count))} color="bg-orange-500" />
            ))}
            {activeTab === 'workload' && (data?.workload || []).map((w, i) => (
              <StatBar key={i} label={w.name} value={w.count} max={Math.max(1, ...(data?.workload || []).map(x => x.count))} color="bg-purple-500" />
            ))}
            {activeTab === 'grades' && (data?.grades || []).map((g, i) => (
              <StatBar key={i} label={`Score Range: ${g._id}+`} value={g.count} max={Math.max(1, ...(data?.grades || []).map(x => x.count))} color="bg-green-500" />
            ))}
            {(!data || (data[activeTab === 'distribution' ? 'distribution' : activeTab === 'status' ? 'statusSummary' : activeTab] || []).length === 0) && (
              <div className="py-12 text-center text-slate-400 italic">No data available for this metric.</div>
            )}
          </div>
        </div>

        {/* Data Table Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Detail Data View</h3>
            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded">Live Data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Attribute</th>
                  <th className="px-6 py-4 text-right">Count / Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeTab === 'distribution' && (data?.distribution || []).map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{d.name}</td>
                    <td className="px-6 py-4 text-sm text-right font-mono text-dbu-primary">{d.count} Students</td>
                  </tr>
                ))}
                {activeTab === 'status' && (data?.statusSummary || []).map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{s._id.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-sm text-right font-mono text-orange-500">{s.count} Internships</td>
                  </tr>
                ))}
                {activeTab === 'workload' && (data?.workload || []).map((w, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{w.name}</td>
                        <td className="px-6 py-4 text-sm text-right font-mono text-purple-500">{w.count} Students</td>
                    </tr>
                ))}
                {activeTab === 'grades' && (data?.grades || []).map((g, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">Grade Band: {g._id}+</td>
                        <td className="px-6 py-4 text-sm text-right font-mono text-green-500">{g.count} Submissions</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
