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
    User
} from 'lucide-react';

const CompanyStudentsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [placements, setPlacements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchCompanyAndPlacements = async () => {
            try {
                // Fetch company details
                const compRes = await api.get('/department/companies');
                const currentComp = compRes.data.find(c => c._id === id);
                setCompany(currentComp);

                // Fetch placements
                const placementsRes = await api.get(`/department/companies/${id}/placements`);
                setPlacements(placementsRes.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyAndPlacements();
    }, [id]);

    const filteredPlacements = placements.filter(p =>
        p.student?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
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
                                        {intern.student?.user?.name?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 leading-tight">{intern.student?.user?.name || 'N/A'}</h3>
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
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Supervisor</p>
                                            <p className="text-xs font-bold text-slate-700">{intern.companySupervisorName || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail size={14} className="text-slate-400" />
                                        <div className="truncate">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Supervisor Email</p>
                                            <p className="text-xs font-bold text-slate-700 truncate">{intern.companySupervisorEmail || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone size={14} className="text-slate-400" />
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Supervisor Phone</p>
                                            <p className="text-xs font-bold text-slate-700">{intern.companySupervisorPhone || '—'}</p>
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
