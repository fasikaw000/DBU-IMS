import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    Users, 
    FileText, 
    Clock, 
    MessageSquare, 
    CheckCircle, 
    AlertCircle,
    TrendingUp,
    Briefcase,
    Calendar,
    ChevronRight,
    Loader2,
    Book
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

const AdvisorDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeInternships: 0,
        pendingReports: 0,
        unreadMessages: 0
    });
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, studentsRes] = await Promise.all([
                api.get('/advisor/stats'),
                api.get('/advisor/students')
            ]);
            setStats(statsRes.data);
            setStudents(studentsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-12 h-12 animate-spin text-dbu-primary" />
        </div>
    );

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        Advisor Overview
                        <span className="bg-dbu-primary/10 text-dbu-primary text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest border border-dbu-primary/10">
                            Department: {user?.department?.name || 'Unknown Department'}
                        </span>
                    </h1>
                    <p className="text-slate-500 mt-2 flex items-center gap-2">
                        <Calendar size={16} className="text-dbu-primary" />
                        Supervising student progress and academic performance.
                    </p>
                </div>
                <TrendingUp size={120} className="absolute -right-8 -bottom-8 text-slate-50 opacity-[0.03] rotate-12" />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Assigned Students', value: stats.totalStudents, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Active Internships', value: stats.activeInternships, icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Pending Reports', value: stats.pendingReports, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Unread Messages', value: stats.unreadMessages, icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50' }
                ].map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{card.label}</p>
                                <h3 className="text-3xl font-black text-slate-800">{card.value}</h3>
                            </div>
                            <div className={`${card.bg} ${card.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                                <card.icon size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Students Table / List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-dbu-primary" />
                        Recently Assigned Students
                    </h3>
                    <button 
                        onClick={() => navigate('/students')}
                        className="text-xs font-black text-dbu-primary hover:text-dbu-accent transition uppercase tracking-widest"
                    >
                        View All
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/30">
                                <th className="p-6">Student Information</th>
                                <th className="p-6">Internship Target</th>
                                <th className="p-6">Reports</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <AlertCircle size={40} className="opacity-20 mb-2" />
                                            <p className="text-lg font-bold">No students assigned yet</p>
                                            <p className="text-sm">Wait for the Department Dean to assign students to you.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                students.slice(0, 5).map((intern) => (
                                    <tr key={intern._id} className="hover:bg-slate-50/50 transition group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-black">
                                                    {intern.student?.user?.name?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{intern.student?.user?.name}</span>
                                                    <span className="text-xs text-slate-400 font-medium">{intern.student?.studentId}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-700 text-sm">{intern.companyName}</span>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                                    <Briefcase size={12} className="text-dbu-primary" />
                                                    {intern.field}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-dbu-primary" 
                                                                style={{ width: `${(intern.reportCounts?.approved / (intern.reportCounts?.total || 1)) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400">{intern.reportCounts?.approved}/{intern.reportCounts?.total}</span>
                                                    </div>
                                                    {intern.reportCounts?.pending > 0 && (
                                                        <span className="text-[9px] text-amber-500 font-black uppercase tracking-tighter animate-pulse">
                                                            {intern.reportCounts.pending} Pending Review
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                intern.status === 'ACTIVE' || intern.status === 'Active' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : intern.status === 'COMPLETED'
                                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                : 'bg-slate-50 text-slate-600 border-slate-100'
                                            }`}>
                                                {intern.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => navigate(`/logbook?studentId=${intern.student?._id}`)}
                                                    className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-dbu-primary hover:bg-dbu-primary/10 transition-all"
                                                    title="View Logbook"
                                                >
                                                    <Book size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => navigate('/students')}
                                                    className="inline-flex items-center gap-1 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black tracking-widest hover:border-dbu-primary hover:text-dbu-primary transition shadow-sm"
                                                >
                                                    MANAGE
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdvisorDashboard;
