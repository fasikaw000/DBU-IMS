import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Briefcase,
    MapPin,
    User,
    Calendar,
    Mail,
    Phone,
    Plus,
    ChevronRight,
    ArrowRight,
    Loader2,
    Activity,
    CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [internship, setInternship] = useState(null);
    const [status, setStatus] = useState('NOT_APPLIED');
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showApply, setShowApply] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [errors, setErrors] = useState({});
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(null), 2500);
        return () => clearTimeout(timer);
    }, [message]);

    // Form State
    const [applyData, setApplyData] = useState({
        companyName: '',
        location: '',
        field: '',
        startDate: '',
        endDate: '',
        companySupervisorName: '',
        companySupervisorPhone: '',
        companySupervisorEmail: ''
    });

    useEffect(() => {
        fetchData();
        console.log("Current User Object:", user);
    }, []);

    const fetchData = async () => {
        try {
            const [intRes, actRes, compRes] = await Promise.all([
                api.get('/internships/my-internship'),
                api.get('/student/activity'),
                api.get('/department/companies')
            ]);
            setInternship(intRes.data);
            setStatus(intRes.data?.status || 'NOT_APPLIED');
            setActivities(actRes.data || []);
            setCompanies(compRes.data || []);
        } catch (err) {
            if (err.response?.status === 404) setStatus('NOT_APPLIED');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        let newErrors = {};
        const required = ['companyName', 'location', 'field', 'startDate', 'endDate', 'companySupervisorName', 'companySupervisorPhone', 'companySupervisorEmail'];
        required.forEach(field => {
            if (!applyData[field]) newErrors[field] = "Required";
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setMessage({ type: 'error', text: 'Please fill out all required fields' });
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/internships/apply', applyData);
            setMessage({ type: 'success', text: 'Application submitted successfully!' });
            setShowApply(false);
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Submission failed' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-dbu-primary" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Top Header & Status */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Student Dashboard</h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <User size={16} className="text-dbu-primary" />
                        {user?.name || user?.fullName} • ID: {user?.studentId || "N/A"}
                    </p>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className={`px-5 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${status === 'APPROVED' || status === 'ACTIVE' || status === 'COMPLETED' || status === 'Active' || status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : status === 'PENDING_APPROVAL' || status === 'Pending'
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                        {status === 'NOT_APPLIED' ? <Clock size={14} /> : <CheckCircle size={14} />}
                        Status: {status.replace('_', ' ')}
                    </div>
                    {status === 'NOT_APPLIED' && (
                        <button
                            onClick={() => setShowApply(true)}
                            className="px-6 py-3 bg-dbu-primary text-white rounded-2xl font-black text-[10px] tracking-widest hover:bg-dbu-accent transition shadow-lg shadow-dbu-primary/20 flex items-center gap-2"
                        >
                            <Plus size={16} />
                            APPLY FOR INTERNSHIP
                        </button>
                    )}
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                    }`}>
                    <AlertCircle size={20} />
                    <p className="font-bold text-sm">{message.text}</p>
                </div>
            )}

            {showApply ? (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-800">Internship Application</h2>
                        <button onClick={() => setShowApply(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest">Cancel</button>
                    </div>
                    <form onSubmit={handleApply} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-dbu-primary uppercase tracking-widest border-b border-dbu-primary/10 pb-2">Company Details</h3>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Company Name</label>
                                        <select
                                            className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.companyName ? 'border-red-500' : 'border-slate-200'}`}
                                            value={applyData.companyName}
                                            onChange={e => {
                                                const selected = companies.find(c => c.name === e.target.value);
                                                if (selected) {
                                                    setApplyData({ ...applyData, companyName: selected.name, location: selected.location || '' });
                                                } else {
                                                    setApplyData({ ...applyData, companyName: e.target.value });
                                                }
                                                setErrors({ ...errors, companyName: null });
                                            }}
                                        >
                                            <option value="">Select or Type Name...</option>
                                            {companies.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                            <option value="other">--- Other (Type Below) ---</option>
                                        </select>
                                        {applyData.companyName === 'other' && (
                                            <input
                                                placeholder="Enter Company Name"
                                                className={`w-full px-6 py-4 mt-2 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.companyName ? 'border-red-500' : 'border-slate-200'}`}
                                                onChange={e => setApplyData({ ...applyData, companyName: e.target.value })}
                                            />
                                        )}
                                    </div>
                                    <input placeholder="Location" className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.location ? 'border-red-500' : 'border-slate-200'}`} value={applyData.location} onChange={e => { setApplyData({ ...applyData, location: e.target.value }); setErrors({ ...errors, location: null }); }} />
                                    <input placeholder="Field (e.g Website Dev)" className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.field ? 'border-red-500' : 'border-slate-200'}`} value={applyData.field} onChange={e => { setApplyData({ ...applyData, field: e.target.value }); setErrors({ ...errors, field: null }); }} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Start Date</label>
                                            <input required type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold" value={applyData.startDate} onChange={e => setApplyData({ ...applyData, startDate: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">End Date</label>
                                            <input required type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold" value={applyData.endDate} onChange={e => setApplyData({ ...applyData, endDate: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-dbu-primary uppercase tracking-widest border-b border-dbu-primary/10 pb-2">Supervisor Contact</h3>
                                <div className="space-y-4">
                                    <input placeholder="Full Name" className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.companySupervisorName ? 'border-red-500' : 'border-slate-200'}`} value={applyData.companySupervisorName} onChange={e => { setApplyData({ ...applyData, companySupervisorName: e.target.value }); setErrors({ ...errors, companySupervisorName: null }); }} />
                                    <input placeholder="Phone Number" className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.companySupervisorPhone ? 'border-red-500' : 'border-slate-200'}`} value={applyData.companySupervisorPhone} onChange={e => { setApplyData({ ...applyData, companySupervisorPhone: e.target.value }); setErrors({ ...errors, companySupervisorPhone: null }); }} />
                                    <input type="email" placeholder="Email Address" className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.companySupervisorEmail ? 'border-red-500' : 'border-slate-200'}`} value={applyData.companySupervisorEmail} onChange={e => { setApplyData({ ...applyData, companySupervisorEmail: e.target.value }); setErrors({ ...errors, companySupervisorEmail: null }); }} />
                                </div>
                            </div>
                        </div>
                        <button disabled={submitting} type="submit" className="w-full py-5 bg-dbu-primary text-white rounded-2xl font-black tracking-widest text-xs hover:bg-dbu-accent transition shadow-xl flex items-center justify-center gap-3">
                            {submitting && <Loader2 size={16} className="animate-spin" />}
                            SUBMIT APPLICATION
                        </button>
                    </form>

                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {internship ? (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-8 bg-slate-50/50 border-b border-slate-100">
                                    <h2 className="text-xl font-black text-slate-800">Active Placement</h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{internship.company?.name || internship.companyName}</p>
                                </div>
                                <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Industry Field</p>
                                        <p className="text-sm font-bold text-slate-700">{internship.field}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                                        <p className="text-sm font-bold text-slate-700">{new Date(internship.startDate).toLocaleDateString()} - {new Date(internship.endDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supervisor</p>
                                        <p className="text-sm font-bold text-slate-700">{internship.companySupervisorName}</p>
                                    </div>
                                    <div className="col-span-2 md:col-span-1 pt-6 border-t border-slate-50">
                                        <p className="text-[10px] font-black text-dbu-primary uppercase tracking-widest">Assigned Advisor</p>
                                        <p className="text-sm font-bold text-slate-700">{internship.advisor?.name || internship.advisor_id?.name || 'Pending Assignment'}</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 flex gap-4">
                                    <button
                                        onClick={() => navigate('/student/reports')}
                                        className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black tracking-widest hover:border-dbu-primary hover:text-dbu-primary transition flex items-center justify-center gap-2"
                                    >
                                        <FileText size={16} />
                                        MANAGE REPORTS
                                    </button>
                                    <button
                                        onClick={() => navigate('/messages')}
                                        className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black tracking-widest hover:border-dbu-primary hover:text-dbu-primary transition flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare size={16} />
                                        CONTACT ADVISOR
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center flex flex-col items-center gap-4">
                                <Briefcase size={64} className="text-slate-200" />
                                <div>
                                    <h3 className="text-lg font-black text-slate-400">No Internship Data</h3>
                                    <p className="text-sm text-slate-400 max-w-xs mx-auto">Click "Apply for Internship" to start your internship workflow and submit your company details.</p>
                                </div>
                            </div>
                        )}

                        {/* Result / Grading Section */}
                        {status === 'COMPLETED' || internship?.finalGrade ? (
                            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-200 overflow-hidden relative">
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div>
                                        <h3 className="text-xl font-black text-dbu-accent uppercase tracking-widest mb-2">Internship Completed</h3>
                                        <p className="text-white/50 text-sm max-w-md">Your final performance evaluation has been submitted by your advisor.</p>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Final Score</p>
                                            <p className="text-4xl font-black text-white">{internship?.finalGrade?.total || internship?.finalGrade?.advisorScore}%</p>
                                        </div>
                                        <div className="w-px h-12 bg-white/10"></div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Grade</p>
                                            <p className="text-4xl font-black text-dbu-accent">{internship?.finalGrade?.letterGrade}</p>
                                        </div>
                                    </div>
                                </div>
                                <Activity size={150} className="absolute -right-10 -bottom-10 text-white/5" />
                            </div>
                        ) : null}
                    </div>

                    {/* Sidebar / Activity */}
                    <div className="space-y-8">
                        {/* Profile Info */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Information</h3>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="text-[10px] font-black text-dbu-primary hover:text-dbu-accent uppercase tracking-widest transition-colors flex items-center gap-1"
                                >
                                    Update Profile <ChevronRight size={12} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500"><Mail size={18} /></div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Email</p>
                                            <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Completed</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-700 truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user?.phoneNumber ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}><Phone size={18} /></div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Phone</p>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${user?.phoneNumber ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                                                {user?.phoneNumber ? 'Completed' : 'Missing'}
                                            </span>
                                        </div>
                                        <p className={`text-xs font-bold ${user?.phoneNumber ? 'text-slate-700' : 'text-red-500 italic'}`}>{user?.phoneNumber || 'Missing Info'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user?.studentProfile?.cbeAccount ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}><CreditCard size={18} /></div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">CBE Account</p>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${user?.studentProfile?.cbeAccount ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                                                {user?.studentProfile?.cbeAccount ? 'Linked' : 'Missing'}
                                            </span>
                                        </div>
                                        <p className={`text-xs font-bold ${user?.studentProfile?.cbeAccount ? 'text-slate-700' : 'text-red-500 italic'}`}>{user?.studentProfile?.cbeAccount || 'Not linked'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</h3>
                            <div className="space-y-6">
                                {activities.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
                                ) : (
                                    activities.slice(0, 5).map((act, i) => (
                                        <div key={i} className="flex gap-4 relative">
                                            {i < 4 && <div className="absolute left-4 top-8 bottom-[-24px] w-px bg-slate-100"></div>}
                                            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 relative z-10">
                                                <div className="w-2 h-2 rounded-full bg-dbu-primary"></div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{act.action.replace('_', ' ').toUpperCase()}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{act.details}</p>
                                                <p className="text-[9px] text-slate-300 font-bold mt-1 uppercase tracking-tighter">{new Date(act.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
