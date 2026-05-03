import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    ClipboardList,
    UserPlus,
    Search,
    UserCheck,
    AlertCircle,
    CheckCircle,
    Loader2,
    Briefcase,
    Building,
    History,
    Clock,
    User,
    X
} from 'lucide-react';

const AssignmentsPage = () => {
    const [assignments, setAssignments] = useState([]);
    const [advisorsWorkload, setAdvisorsWorkload] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedStudentName, setSelectedStudentName] = useState('');

    const MAX_WORKLOAD = 5;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [studentsRes, advisorsRes] = await Promise.all([
                api.get('/department/students'),
                api.get('/department/advisors/workload')
            ]);

            // Filter students who have an approved internship or active internship
            const list = studentsRes.data
                .filter(s => s.internship && (s.internship.status === 'Approved' || s.internship.status === 'Active' || s.internship.status === 'APPROVED' || s.internship.status === 'ACTIVE'))
                .map(s => ({
                    internshipId: s.internship._id,
                    studentName: s.user?.name,
                    studentId: s.studentId,
                    department: s.department?.name || s.department?.code,
                    assignedAdvisorId: s.internship.advisor_id || s.internship.advisor?._id,
                    assignedAdvisorName: s.internship.advisor?.name || 'Not Assigned',
                    companyName: s.internship.company?.name || s.internship.companyName || 'Unknown Company',
                    status: s.internship.status
                }));

            // Point 5: FIX ASSIGNMENTS PAGE - Only show APPROVED (awaiting assignment)
            // UPDATED: Show both assigned and unassigned to allow reassignment
            const filteredList = list.filter(item =>
                ['Approved', 'APPROVED', 'Active', 'ACTIVE', 'Ongoing', 'ONGOING'].includes(item.status)
            );

            setAssignments(filteredList);
            setAdvisorsWorkload(advisorsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignAdvisor = async (internshipId, advisorId) => {
        setActionLoading(true);
        setMessage(null);
        try {
            await api.put(`/department/internship/${internshipId}/advisor`, { advisorId });
            setMessage({ type: 'success', text: 'Advisor assigned successfully!' });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Assignment failed' });
        } finally {
            setActionLoading(false);
        }
    };

    const fetchHistory = async (internshipId, studentName) => {
        if (!internshipId) return;
        console.log("Fetching history for:", internshipId);
        setHistoryLoading(true);
        setSelectedStudentName(studentName);
        setShowHistory(true);
        try {
            const res = await api.get(`/department/internship/${internshipId}/history`);
            setSelectedHistory(res.data?.data || []);
        } catch (err) {
            console.error("History fetch error:", err);
            setSelectedHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const filteredAssignments = assignments.filter(a =>
        a.studentName.toLowerCase().includes(search.toLowerCase()) ||
        a.studentId.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-dbu-primary" />
        </div>
    );

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <ClipboardList className="w-8 h-8 text-dbu-primary" />
                        University Advisor Assignments
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Assign university advisors to approved student internships.</p>
                </div>
            </div>

            {/* Advisor Workload Summary - Redesigned for Scalability */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-dbu-primary" />
                        University Advisor Workload
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Almost Full</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Full</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {advisorsWorkload.map((w, idx) => {
                        const percentage = (w.count / MAX_WORKLOAD) * 100;
                        let statusColor = "bg-emerald-500";
                        let statusText = "Available";
                        let textColor = "text-emerald-600";
                        let bgColor = "bg-emerald-50";

                        if (w.count >= MAX_WORKLOAD) {
                            statusColor = "bg-red-500";
                            statusText = "Full";
                            textColor = "text-red-600";
                            bgColor = "bg-red-50";
                        } else if (w.count === 4) {
                            statusColor = "bg-amber-500";
                            statusText = "Almost Full";
                            textColor = "text-amber-600";
                            bgColor = "bg-amber-50";
                        }

                        return (
                            <div key={idx} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-dbu-primary/20 transition-all">
                                <div className="md:w-1/3">
                                    <p className="text-sm font-black text-slate-700">{w.advisor?.name}</p>
                                    <p className="text-[10px] font-mono text-slate-400">({w.advisor?.username})</p>
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Capacity Usage</span>
                                        <span className="text-xs font-black text-slate-700">{w.count} / {MAX_WORKLOAD}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${statusColor} transition-all duration-1000 ease-out`}
                                            style={{ width: `${Math.min(100, percentage)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="md:w-32 flex justify-end">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${bgColor} ${textColor} border-current opacity-80`}>
                                        {statusText}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {advisorsWorkload.length === 0 && (
                        <div className="py-12 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            No university advisors found in this department.
                        </div>
                    )}
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search students by name or ID..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                    }`}>
                    {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    <p className="font-bold text-sm">{message.text}</p>
                </div>
            )}

            {/* Assignments Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/30">
                                <th className="p-6">Student</th>
                                <th className="p-6">Placement</th>
                                <th className="p-6">University Advisor</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <UserPlus size={40} className="opacity-20 mb-2" />
                                            <p className="text-lg font-bold">No students awaiting assignment</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAssignments.map((item) => (
                                    <tr key={item.internshipId} className="hover:bg-slate-50/30 transition">
                                        <td className="p-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{item.studentName}</span>
                                                <span className="text-xs text-slate-400 font-medium">{item.studentId}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                                    <Building size={14} className="text-dbu-primary" />
                                                    {item.companyName}
                                                </div>
                                                <span className="text-[10px] text-slate-400 uppercase font-black ml-5">{item.department}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2">
                                                {item.assignedAdvisorId ? (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                                                        <UserCheck size={14} />
                                                        <span className="text-xs font-bold">{item.assignedAdvisorName}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 animate-pulse">
                                                        <AlertCircle size={14} />
                                                        <span className="text-xs font-bold uppercase tracking-tighter">Awaiting Assignment</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${item.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex justify-end gap-2">
                                                <select
                                                    className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-dbu-primary font-bold text-slate-600 min-w-[180px]"
                                                    onChange={(e) => handleAssignAdvisor(item.internshipId, e.target.value)}
                                                    value={item.assignedAdvisorId || ''}
                                                >
                                                    <option value="" disabled>Select University Advisor</option>
                                                    {advisorsWorkload.map(w => (
                                                        <option
                                                            key={w.advisor?._id}
                                                            value={w.advisor?._id}
                                                            disabled={w.count >= MAX_WORKLOAD && item.assignedAdvisorId !== w.advisor?._id}
                                                        >
                                                            {w.advisor?.name} ({w.count}/{MAX_WORKLOAD}) {w.count >= MAX_WORKLOAD ? '— FULL' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        fetchHistory(item.internshipId, item.studentName);
                                                    }}
                                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-dbu-primary transition"
                                                    title="View History"
                                                >
                                                    <History size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            {assignments.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-slate-400 font-bold">
                                        No approved students yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">Assignment History</h2>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">Timeline for {selectedStudentName}</p>
                            </div>
                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 rounded-xl transition text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {historyLoading ? (
                                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-dbu-primary" /></div>
                            ) : selectedHistory.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 font-bold italic">No history found for this internship.</div>
                            ) : (
                                <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                    {selectedHistory.map((log, idx) => (
                                        <div key={log._id} className="relative pl-10">
                                            <div className="absolute left-0 top-0 w-8 h-8 bg-white border-2 border-dbu-primary rounded-full flex items-center justify-center z-10 shadow-sm">
                                                <Clock size={14} className="text-dbu-primary" />
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-dbu-primary/20 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-dbu-primary">{log.action.replace('_', ' ')}</span>
                                                    <span className="text-[9px] font-bold text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-700 leading-relaxed mb-3">{log.details}</p>
                                                <div className="flex items-center gap-2 pt-3 border-t border-slate-200/50">
                                                    <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center">
                                                        <User size={10} className="text-slate-500" />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500">Performed by <span className="text-slate-800">{log.user?.name || 'System'}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setShowHistory(false)} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] tracking-widest hover:bg-slate-100 transition shadow-sm">
                                CLOSE HISTORY
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentsPage;
