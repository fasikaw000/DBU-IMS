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
  FileSpreadsheet,
  FileText,
  X,
  Printer
} from 'lucide-react';

const AdminReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('distribution');
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (filter = 'all') => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/reports/analytics?range=${filter}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const getActiveData = () => {
    if (!data) return [];
    if (activeTab === 'distribution') return data.distribution || [];
    if (activeTab === 'status') return data.statusSummary || [];
    if (activeTab === 'workload') return data.workload || [];
    if (activeTab === 'grades') return data.grades || [];
    return [];
  };

  const exportToCSV = () => {
    const reportData = getActiveData();
    if (!reportData || reportData.length === 0) return;
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IMS_Report_${activeTab}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const printReport = () => {
    const reportData = getActiveData();
    if (!reportData || reportData.length === 0) return;
    const tabLabels = { distribution: 'Student Distribution', status: 'Internship Status', workload: 'University Advisor Workload', grades: 'Grade Analytics' };
    const printWindow = window.open('', '_blank');
    const headers = reportData.length > 0 ? Object.keys(reportData[0]) : [];
    printWindow.document.write(`
      <html><head><title>IMS Report - ${tabLabels[activeTab]}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
        h1 { font-weight: 900; font-size: 24px; color: #1e3a5f; margin: 0; text-transform: uppercase; }
        h2 { font-weight: 700; font-size: 16px; color: #64748b; margin: 5px 0 0 0; }
        .meta { margin-top: 10px; font-size: 10px; font-weight: bold; color: #94a3b8; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 11px; }
        th { background: #f8fafc; font-weight: 900; text-transform: uppercase; color: #475569; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
      </style></head><body>
      <div class="header">
        <h1>Debre Berhan University</h1>
        <h2>Internship Management System</h2>
        <h2>${tabLabels[activeTab]} Report</h2>
        <div class="meta">Generated: ${new Date().toLocaleString()}</div>
      </div>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${reportData.map(row => `<tr>${Object.values(row).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
      <div class="footer"><p>© ${new Date().getFullYear()} Debre Berhan University. Administrative Document.</p></div>
      <script>window.onload=function(){window.print();setTimeout(()=>window.close(),500)}</script>
      </body></html>
    `);
    printWindow.document.close();
    setShowExportModal(false);
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
          <p className="text-slate-500 text-sm">Analytics and exports for internships, workload, and outcomes.</p>
        </div>
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center hover:bg-slate-50 transition-all shadow-sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            {dateFilter === 'all' ? 'All Time' : dateFilter === '7d' ? 'Last 7 Days' : 'This Month'}
          </button>
          {showFilterDropdown && (
            <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-2">
                {['all', '7d', '30d'].map(f => (
                  <button
                    key={f}
                    onClick={() => { setDateFilter(f); setShowFilterDropdown(false); fetchAnalytics(f); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${dateFilter === f ? 'bg-dbu-primary/10 text-dbu-primary' : 'hover:bg-slate-50 text-slate-500'}`}
                  >
                    {f === 'all' ? 'All Time' : f === '7d' ? 'Last 7 Days' : 'This Month'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-dbu-primary text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-100 gap-8 overflow-x-auto">
        {[
          { id: 'distribution', label: 'Student Distribution', icon: Users },
          { id: 'status', label: 'Internship Status', icon: Target },
          { id: 'workload', label: 'University Advisor Workload', icon: TrendingUp },
          { id: 'grades', label: 'Grade Analytics', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-dbu-primary text-dbu-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
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

      {/* Export Modal */}
      {showExportModal && (
        <>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" onClick={() => setShowExportModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden border border-slate-100 animate-in zoom-in-95">
            <div className="p-8 bg-slate-800 text-white flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2"><Printer className="w-5 h-5" /> Export Report</h3>
              <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400">Active Report: <span className="text-slate-800 capitalize">{activeTab.replace(/([A-Z])/g, ' $1')}</span></p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Records: <span className="text-slate-800">{getActiveData().length}</span></p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={printReport}
                  className="w-full py-4 bg-dbu-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-dbu-primary/20 hover:bg-dbu-accent transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate Document
                </button>
                <button
                  onClick={exportToCSV}
                  className="w-full py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Spreadsheet
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReports;
