import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Terminal,
  Search,
  Filter,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/logs?page=${page}&limit=50&search=${searchTerm}`);
      if (res.success) {
        setLogs(res.data.logs || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, searchTerm]);

  const actionLabels = {
    created_student: 'User Created (Student)',
    created_staff: 'User Created (Staff)',
    bulk_students_uploaded: 'Users Created (Students Bulk Upload)',
    bulk_staff_uploaded: 'Users Created (Staff Bulk Upload)',
    account_activated: 'Account Activated',
    user_status_toggled: 'User Status Changed',
    dept_created: 'Department Created',
    dept_updated: 'Department Updated',
    advisor_assigned: 'Student Assigned To Advisor',
    report_submitted: 'Report Submitted',
    report_reviewed: 'Report Reviewed',
    grade_assigned: 'Grade Assigned',
    student_evaluated: 'Grade Assigned'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Audit Logs</h1>
          <p className="text-slate-500 text-sm">Meaningful system activity only (creation, activation, status, department, assignment, reports, grades).</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-dbu-primary outline-none w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-dbu-primary" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Action History</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/30 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 text-left">Action</th>
                <th className="px-6 py-4 text-left">Details</th>
                <th className="px-6 py-4 text-left">Operator</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dbu-primary mx-auto"></div></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">No logs found.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-black text-slate-600 uppercase">
                        {(actionLabels[log.action] || log.action.replace(/_/g, ' ')).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{log.details}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User className="w-3 h-3" /></div>
                        <span className="font-bold text-slate-700">{log.user?.name || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] text-slate-400 font-bold">{new Date(log.createdAt).toLocaleString()}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-2 bg-white border rounded-xl disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="p-2 bg-white border rounded-xl disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;
