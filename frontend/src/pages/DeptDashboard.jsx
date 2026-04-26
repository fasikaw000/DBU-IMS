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
    Loader2,
    Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

const DeptDashboard = () => {
    const { user } = useContext(AuthContext);
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
    });
    const [selectedApp, setSelectedApp] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [revisionReason, setRevisionReason] = useState('');
    const [isRevising, setIsRevising] = useState(false);
    const [actionType, setActionType] = useState('Revision Required');

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
                .filter(s => s.internship && ['PENDING', 'PENDING_APPROVAL', 'RESUBMITTED', 'REVISION_REQUIRED'].includes(s.internship.status))
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

    const handleAction = async (id, status, revisionMessage = '') => {
        setActionLoading(true);
        try {
            await api.put(`/department/internship/${id}`, { status, message: revisionMessage });
            setMessage({ type: 'success', text: status === 'Revision Required' ? 'Revision request sent.' : `Application ${status.toLowerCase()}ed.` });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || err.message });
        } finally {
            setActionLoading(false);
            setIsRevising(false);
            setRevisionReason('');
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
                            Department: {user?.department?.name || 'Unknown Department'}
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
                    { label: 'Placement', value: stats.awaitingAdvisor, icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-50' },
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
                                                    <span className="font-bold text-slate-700 text-sm">{app.company?.name || 'N/A'}</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${
                                                        app.status === 'RESUBMITTED' ? 'bg-indigo-100 text-indigo-700' : 'text-dbu-primary bg-dbu-primary/5'
                                                    }`}>
                                                        {app.status === 'RESUBMITTED' ? '★ RESUBMITTED' : app.field}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                    {new Date(app.startDate).toLocaleDateString()} - {new Date(app.endDate).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => { setSelectedApp(app); setShowDetails(true); }} className="bg-slate-100 text-slate-500 p-2 rounded-xl hover:bg-dbu-primary hover:text-white transition shadow-sm" title="View Details"><Eye size={16} /></button>
                                                    <button onClick={() => handleAction(app._id, 'Approved')} className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 transition shadow-md" title="Approve"><CheckCircle size={16} /></button>
                                                    <button onClick={() => handleAction(app._id, 'Rejected')} className="bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition shadow-md" title="Reject"><X size={16} /></button>
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
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                        s.internship?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        s.internship?.status === 'PENDING_APPROVAL' || s.internship?.status === 'RESUBMITTED' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        s.internship?.status === 'REVISION_REQUIRED' ? 'bg-red-50 text-red-600 border-red-100' :
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
            {/* Application Details Modal */}
            {showDetails && selectedApp && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-dbu-primary p-8 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black">Application Details</h3>
                                <p className="text-dbu-light/80 text-xs font-bold uppercase tracking-widest mt-1">Reviewing: {selectedApp.studentName}</p>
                            </div>
                            <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-10 space-y-10">
                            <div className="grid grid-cols-2 gap-10">
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-3">Placement Details</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Company</label>
                                            <p className="text-sm font-black text-slate-800">{selectedApp.company?.name || selectedApp.companyName}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Internship Field</label>
                                            <p className="text-sm font-black text-slate-800">{selectedApp.field || 'General'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Period</label>
                                            <p className="text-sm font-black text-slate-800">
                                                {new Date(selectedApp.startDate).toLocaleDateString()} - {new Date(selectedApp.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-3">Company Supervisor</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Full Name</label>
                                            <p className="text-sm font-black text-slate-800">{selectedApp.companySupervisorName || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Email Address</label>
                                            <p className="text-sm font-black text-slate-800">{selectedApp.companySupervisorEmail || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Phone Number</label>
                                            <p className="text-sm font-black text-slate-800">{selectedApp.companySupervisorPhone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="flex flex-col gap-6 pt-6 border-t border-slate-100">
                                {isRevising ? (
                                    <div className="space-y-4 animate-in slide-in-from-bottom-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {actionType === 'Rejected' ? 'Reason for Rejection' : 'Correction Instructions for Student'}
                                        </label>
                                        <textarea 
                                            autoFocus
                                            value={revisionReason}
                                            onChange={e => setRevisionReason(e.target.value)}
                                            placeholder={actionType === 'Rejected' ? "Example: This company is not approved for internships..." : "Example: Please correct the supervisor email..."}
                                            className={`w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 transition-all min-h-[100px] ${actionType === 'Rejected' ? 'focus:ring-red-500' : 'focus:ring-amber-500'}`}
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => { handleAction(selectedApp._id, actionType, revisionReason); setShowDetails(false); setIsRevising(false); }}
                                                disabled={!revisionReason.trim()}
                                                className={`flex-1 py-4 rounded-2xl font-black text-sm text-white transition-all shadow-lg disabled:opacity-50 ${actionType === 'Rejected' ? 'bg-red-600 shadow-red-600/20 hover:bg-red-700' : 'bg-amber-600 shadow-amber-600/20 hover:bg-amber-700'}`}
                                            >
                                                {actionType === 'Rejected' ? 'Confirm Rejection' : 'Send Correction Request'}
                                            </button>
                                            <button 
                                                onClick={() => setIsRevising(false)}
                                                className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => { handleAction(selectedApp._id, 'Approved'); setShowDetails(false); }}
                                            className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest"
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => { setActionType('Revision Required'); setIsRevising(true); }}
                                            className="flex-1 bg-amber-500 text-white py-4 rounded-2xl font-black text-sm hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 uppercase tracking-widest"
                                        >
                                            Request Correction
                                        </button>
                                        <button 
                                            onClick={() => { setActionType('Rejected'); setIsRevising(true); }}
                                            className="bg-red-50 text-red-500 px-6 py-4 rounded-2xl font-black text-sm hover:bg-red-100 transition-all uppercase tracking-widest"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeptDashboard;
