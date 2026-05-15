import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
    Users,
    ArrowLeft,
    Loader2,
    Mail,
    Phone,
    Calendar,
    Search,
    MapPin,
    User,
    UserCheck
} from 'lucide-react';

const CompanyStudentsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [placements, setPlacements] = useState([]);
    const [advisorsWorkload, setAdvisorsWorkload] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const MAX_WORKLOAD = 5;

    useEffect(() => {
        const fetchCompanyAndPlacements = async () => {
            try {
                // Fetch company details
                const compRes = await api.get('/department/companies');
                const currentComp = compRes.data.find(c => c._id === id);
                setCompany(currentComp);

                // Fetch placements
                const [placementsRes, workloadRes] = await Promise.all([
                    api.get(`/department/companies/${id}/placements`),
                    api.get('/department/advisors/workload')
                ]);
                setPlacements(placementsRes.data || []);
                setAdvisorsWorkload(workloadRes.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyAndPlacements();
        const interval = setInterval(fetchCompanyAndPlacements, 30000); // 30s auto-refresh
        return () => clearInterval(interval);
    }, [id]);

    const filteredPlacements = placements.filter(p =>
        (p.student?.user?.fullName || p.student?.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        p.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
        p.field?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-dbu-primary" />
        </div>
    );

    if (!company) return (
        <div className="p-6 text-center">
            <h2 className="text-xl font-bold">Company not found</h2>
            <button onClick={() => navigate('/companies')} className="mt-4 text-dbu-primary flex items-center gap-2 mx-auto">
                <ArrowLeft size={16} /> Back to Companies
            </button>
        </div>
    );

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/companies')}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-dbu-primary hover:border-dbu-primary/20 transition shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            <Users className="w-8 h-8 text-dbu-primary" />
                            Students at {company.name}
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                <MapPin size={12} /> {company.country}, {company.city}
                                {company.subcity && ` (${company.subcity})`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Placement Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Students</span>
                    <span className="text-2xl font-black text-slate-800">{placements.length}</span>
                </div>
                <div className="bg-emerald-50/30 p-6 rounded-[2rem] border border-emerald-100/50 shadow-sm flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Active</span>
                    <span className="text-2xl font-black text-emerald-600">
                        {placements.filter(p => p.status === 'ACTIVE' || p.status === 'ONGOING').length}
                    </span>
                </div>
                <div className="bg-blue-50/30 p-6 rounded-[2rem] border border-blue-100/50 shadow-sm flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600/60">Completed</span>
                    <span className="text-2xl font-black text-blue-600">
                        {placements.filter(p => p.status === 'COMPLETED' || p.status === 'EVALUATED').length}
                    </span>
                </div>
                <div className="bg-amber-50/30 p-6 rounded-[2rem] border border-amber-100/50 shadow-sm flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/60">Pending</span>
                    <span className="text-2xl font-black text-amber-600">
                        {placements.filter(p => ['PENDING', 'PENDING_APPROVAL', 'APPROVED', 'SUBMITTED'].includes(p.status)).length}
                    </span>
                </div>
            </div>

            {/* Advisor Workload Summary - Redesigned for Scalability */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-dbu-primary" />
                        Faculty Advisor Workload
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
                                    <p className="text-sm font-black text-slate-700">{w.advisor?.fullName || w.advisor?.name}</p>
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
                            No faculty advisors found.
                        </div>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search students by name, ID or field..."
                    className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlacements.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <Users size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">No students found matching your search</p>
                    </div>
                ) : (
                    filteredPlacements.map((intern) => (
                        <div key={intern._id} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-dbu-primary/10 rounded-2xl flex items-center justify-center text-dbu-primary font-black text-xl">
                                        {(intern.student?.user?.fullName || intern.student?.user?.name || 'S').charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 leading-tight">{intern.student?.user?.fullName || intern.student?.user?.name || 'N/A'}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{intern.student?.studentId}</p>
                                        <p className="text-[10px] text-dbu-primary font-black uppercase tracking-wider mt-1">{intern.field}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${intern.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    intern.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        'bg-slate-50 text-slate-500 border-slate-100'
                                    }`}>{intern.status}</span>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-50/50 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <User size={14} className="text-slate-400" />
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company Supervisor</p>
                                            <p className="text-xs font-bold text-slate-700">{intern.companySupervisorName || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail size={14} className="text-slate-400" />
                                        <div className="truncate">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company Supervisor Email</p>
                                            <p className="text-xs font-bold text-slate-700 truncate">{intern.companySupervisorEmail || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone size={14} className="text-slate-400" />
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Company Supervisor Phone</p>
                                            <p className="text-xs font-bold text-slate-700">{intern.companySupervisorPhone || '—'}</p>
                                        </div>
                                    </div>

                                    {/* University Advisor Info */}
                                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                                        <UserCheck size={14} className="text-dbu-primary" />
                                        <div>
                                            <p className="text-[9px] font-black text-dbu-primary uppercase tracking-widest">Faculty Advisor</p>
                                            {intern.advisor_id ? (
                                                <p className="text-xs font-bold text-slate-700">
                                                    {intern.advisor_id.fullName || intern.advisor_id.name} <span className="text-[9px] text-slate-400 font-mono">({intern.advisor_id.username})</span>
                                                </p>
                                            ) : (
                                                <p className="text-xs font-bold text-amber-600 italic">Pending Assignment</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-slate-500 pl-2">
                                    <Calendar size={14} className="text-dbu-primary" />
                                    <div className="text-xs font-bold">
                                        {intern.startDate ? new Date(intern.startDate).toLocaleDateString() : '—'}
                                        {' → '}
                                        {intern.endDate ? new Date(intern.endDate).toLocaleDateString() : '—'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CompanyStudentsPage;
