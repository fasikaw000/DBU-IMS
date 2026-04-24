import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Building,
    ShieldCheck,
    UserCheck,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
    Briefcase,
    Users,
    Search,
    Printer,
    Megaphone,
    X,
    Filter,
    ChevronRight,
    ArrowLeft,
    MessageSquare,
    Send,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DeptDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pendingApplications: 0,
        totalAdvisors: 0,
        awaitingAdvisor: 0,
        activeInternships: 0
    });
    const [students, setStudents] = useState([]);
    const [applications, setApplications] = useState([]);
    const [departmentName, setDepartmentName] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [search, setSearch] = useState('');
    const [view, setView] = useState('overview'); // overview, students

    // Print Modal State
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printFields, setPrintFields] = useState({
        name: true,
        studentId: true,
        username: true,
        year: true,
        cbeAccount: true,
        phone: true,
        status: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, studentsRes] = await Promise.all([
                api.get('/department/stats'),
                api.get('/department/students')
            ]);

            setStats(statsRes.data);
            setStudents(studentsRes.data);

            const pending = studentsRes.data
                .filter(s => s.internship && s.internship.status === 'PENDING_APPROVAL')
                .map(s => ({
                    ...s.internship,
                    studentName: s.user?.name,
                    studentId: s.studentId,
                    department: s.department?.name || s.department?.code
                }));
            setApplications(pending);

            if (studentsRes.data.length > 0) {
                const dept = studentsRes.data[0].department;
                setDepartmentName(dept?.name || dept?.code);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        setActionLoading(true);
        try {
            await api.put(`/department/internship/${id}`, { status });
            setMessage({ type: 'success', text: `Application ${status.toLowerCase()}ed.` });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || err.message });
        } finally {
            setActionLoading(false);
        }
    };

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(null), 2500);
        return () => clearTimeout(timer);
    }, [message]);

    const handleExportCSV = null; // Removed - use Students page

    const filteredStudents = students.filter(s => {
        if (!s) return false;
        const nameStr = s.user?.name || '';
        const idStr = s.studentId || '';
        const searchStr = search.toLowerCase();
        return String(nameStr).toLowerCase().includes(searchStr) || String(idStr).toLowerCase().includes(searchStr);
    });

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dbu-primary"></div>
        </div>
    );

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-dbu-primary/5 rounded-full -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        Dean Overview
                        <span className="bg-dbu-primary/10 text-dbu-primary text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest border border-dbu-primary/10">
                            {departmentName}
                        </span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Monitoring departmental student progress and approvals.</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Pending Apps', value: stats.pendingApplications, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Dept Advisors', value: stats.totalAdvisors, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'No Placement', value: stats.awaitingAdvisor, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                    { label: 'Active Field', value: stats.activeInternships, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                ].map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-default">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
                                <h3 className="text-4xl font-black text-slate-800">{card.value}</h3>
                            </div>
                            <div className={`${card.bg} ${card.color} p-4 rounded-2xl group-hover:rotate-12 transition-transform shadow-sm`}>
                                <card.icon size={24} strokeWidth={3} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Tabs */}
            <div className="space-y-6">
                <div className="flex p-1 bg-white border border-slate-100 rounded-2xl w-fit shadow-sm">
                    <button
                        onClick={() => setView('overview')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'overview' ? 'bg-dbu-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Pending Approvals
                    </button>
                    <button
                        onClick={() => navigate('/dean/students')}
                        className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    >
                        View All Students
                    </button>
                </div>

                {message && (
                    <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                        {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                        {message.text}
                    </div>
                )}

                {view === 'overview' ? (
                    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Awaiting Decision</h3>
                            <span className="text-[10px] font-black text-slate-400">{applications.length} Students</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                                        <th className="px-8 py-4">Student</th>
                                        <th className="px-8 py-4">Placement</th>
                                        <th className="px-8 py-4">Duration</th>
                                        <th className="px-8 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {applications.map(app => (
                                        <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800 text-sm">{app.studentName}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{app.studentId}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700 text-sm">{app.companyName}</span>
                                                    <span className="text-[10px] text-dbu-primary font-black uppercase tracking-tighter">{app.field}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                    {new Date(app.startDate).toLocaleDateString()} - {new Date(app.endDate).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleAction(app._id, 'Approved')} className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 transition shadow-md"><CheckCircle size={16} /></button>
                                                    <button onClick={() => handleAction(app._id, 'Rejected')} className="bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition shadow-md"><X size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {applications.length === 0 && <tr><td colSpan="4" className="p-20 text-center text-slate-400 italic">No pending applications.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search students in your department..."
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                                        <th className="px-8 py-4">Student</th>
                                        <th className="px-8 py-4">CBE Account</th>
                                        <th className="px-8 py-4">Phone</th>
                                        <th className="px-8 py-4">Placement Status</th>
                                        <th className="px-8 py-4 text-right">Contact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStudents.map(s => (
                                        <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-800 text-sm">{s.user?.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{s.studentId}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-[11px] font-mono font-bold text-slate-600">{s.cbeAccount || '---'}</td>
                                            <td className="px-8 py-6 text-[11px] font-bold text-slate-600">{s.phone || '---'}</td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.internship?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        s.internship?.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}>
                                                    {s.internship?.status || 'NOT APPLIED'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => navigate(`/messages?userId=${s.user?._id}`)}
                                                    className="p-2.5 bg-dbu-primary/10 text-dbu-primary rounded-xl hover:bg-dbu-primary hover:text-white transition-all shadow-sm"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Print Modal Removed */}
        </div>
    );
};

export default DeptDashboard;
