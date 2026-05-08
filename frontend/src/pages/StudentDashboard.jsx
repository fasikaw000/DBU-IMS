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
    CreditCard,
    Book,
    AlertCircle,
    Edit3
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
    const [companyInputMode, setCompanyInputMode] = useState('select'); // 'select' or 'manual'

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(null), 2500);
        return () => clearTimeout(timer);
    }, [message]);

    // Form State
    const [applyData, setApplyData] = useState({
        companyName: '',
        country: 'Ethiopia',
        city: '',
        subcity: '',
        field: '',
        startDate: '',
        endDate: '',
        companySupervisorName: '',
        companySupervisorPhone: '',
        companySupervisorEmail: ''
    });

    useEffect(() => {
        fetchData();
        
        // Refresh data when window is refocused (e.g. returning to tab)
        const handleFocus = () => {
            console.log("Window focused, refreshing student data...");
            fetchData();
        };
        
        window.addEventListener('focus', handleFocus);
        
        // Also refresh periodically every 30 seconds for near real-time updates
        const interval = setInterval(fetchData, 30000);

        return () => {
            window.removeEventListener('focus', handleFocus);
            clearInterval(interval);
        };
    }, []);

    const fetchData = async () => {
        try {
            const [intRes, actRes, compRes] = await Promise.all([
                api.get('/internships/my-internship'),
                api.get('/users/activity'),
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
        const required = ['companyName', 'country', 'city', 'field', 'startDate', 'endDate', 'companySupervisorName', 'companySupervisorPhone', 'companySupervisorEmail'];

        required.forEach(field => {
            if (!applyData[field]) {
                const label = field.replace(/([A-Z])/g, ' $1').toLowerCase();
                newErrors[field] = `${label.charAt(0).toUpperCase() + label.slice(1)} is required`;
            }
        });

        // Email Validation
        if (applyData.companySupervisorEmail && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(applyData.companySupervisorEmail)) {
            newErrors.companySupervisorEmail = "Please enter a valid supervisor email address";
        }

        // Phone Validation
        if (applyData.companySupervisorPhone && !/^\+?[0-9]{10,15}$/.test(applyData.companySupervisorPhone)) {
            newErrors.companySupervisorPhone = "Phone number must be between 10-15 digits";
        }

        // Date Validation
        if (applyData.startDate && applyData.endDate) {
            if (new Date(applyData.startDate) >= new Date(applyData.endDate)) {
                newErrors.endDate = "The completion date must occur after the start date";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const count = Object.keys(newErrors).length;
            setMessage({ type: 'error', text: `Incomplete Application: ${count} field${count > 1 ? 's' : ''} require${count === 1 ? 's' : ''} your attention.` });
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/internships/apply', applyData);
            setMessage({ type: 'success', text: 'Application submitted successfully!' });
            setApplyData({
                companyName: '',
                country: 'Ethiopia',
                city: '',
                subcity: '',
                field: '',
                startDate: '',
                endDate: '',
                companySupervisorName: '',
                companySupervisorPhone: '',
                companySupervisorEmail: ''
            });
            setErrors({});
            setShowApply(false);
            fetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Submission failed. Please try again later.';
            setMessage({ type: 'error', text: errorMsg });
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
                        {user?.fullName || user?.name} • ID: {user?.studentId || "N/A"}
                    </p>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className={`px-5 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${['APPROVED', 'ACTIVE', 'ONGOING', 'COMPLETED', 'Active', 'Approved'].includes(status)
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : ['PENDING', 'PENDING_APPROVAL', 'Pending', 'RESUBMITTED'].includes(status)
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : status === 'REVISION_REQUIRED'
                                ? 'bg-red-50 text-red-600 border-red-100 animate-pulse'
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
                    {status === 'REVISION_REQUIRED' && (
                        <button
                            onClick={() => {
                                if (internship) {
                                    setApplyData({
                                        companyName: internship.company?.name || '',
                                        country: internship.company?.country || 'Ethiopia',
                                        city: internship.company?.city || '',
                                        subcity: internship.company?.subcity || '',
                                        field: internship.field || '',
                                        startDate: internship.startDate ? new Date(internship.startDate).toISOString().split('T')[0] : '',
                                        endDate: internship.endDate ? new Date(internship.endDate).toISOString().split('T')[0] : '',
                                        companySupervisorName: internship.companySupervisorName || '',
                                        companySupervisorPhone: internship.companySupervisorPhone || '',
                                        companySupervisorEmail: internship.companySupervisorEmail || ''
                                    });
                                }
                                setShowApply(true);
                            }}
                            className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-600/20 flex items-center gap-2"
                        >
                            <Edit3 size={16} />
                            EDIT & RESUBMIT
                        </button>
                    )}
                </div>
            </div>

            {status === 'REVISION_REQUIRED' && internship?.revisionMessage && (
                <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-start gap-4">
                    <div className="bg-red-500 text-white p-2 rounded-xl">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <h4 className="text-red-700 font-black text-xs uppercase tracking-widest mb-1">Correction Required</h4>
                        <p className="text-red-600 text-sm font-bold">"{internship.revisionMessage}"</p>
                    </div>
                </div>
            )}

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
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Company Name</label>

                                        <div className="flex bg-slate-100 p-1 rounded-xl mb-2">
                                            <button
                                                type="button"
                                                onClick={() => setCompanyInputMode('select')}
                                                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${companyInputMode === 'select' ? 'bg-white text-dbu-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Select Existing
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCompanyInputMode('manual')}
                                                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${companyInputMode === 'manual' ? 'bg-white text-dbu-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Enter New
                                            </button>
                                        </div>

                                        {companyInputMode === 'select' ? (
                                            <select
                                                className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.companyName ? 'border-red-500' : 'border-slate-200'}`}
                                                value={applyData.companyName}
                                                onChange={e => {
                                                    const selected = companies.find(c => c.name === e.target.value);
                                                    if (selected) {
                                                        setApplyData({
                                                            ...applyData,
                                                            companyName: selected.name,
                                                            country: selected.country || 'Ethiopia',
                                                            city: selected.city || '',
                                                            subcity: selected.subcity || ''
                                                        });
                                                    } else {
                                                        setApplyData({ ...applyData, companyName: e.target.value });
                                                    }
                                                    setErrors({ ...errors, companyName: null });
                                                }}
                                            >
                                                <option value="">Choose Company...</option>
                                                {companies.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                placeholder="Enter Company Name"
                                                value={applyData.companyName}
                                                className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.companyName ? 'border-red-500' : 'border-slate-200'}`}
                                                onChange={e => {
                                                    setApplyData({ ...applyData, companyName: e.target.value });
                                                    setErrors({ ...errors, companyName: null });
                                                }}
                                            />
                                        )}
                                        {errors.companyName && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.companyName}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Country</label>
                                            <input placeholder="Country" className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.country ? 'border-red-500' : 'border-slate-200'}`} value={applyData.country} onChange={e => { setApplyData({ ...applyData, country: e.target.value }); setErrors({ ...errors, country: null }); }} />
                                            {errors.country && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.country}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">City</label>
                                            <input placeholder="City" className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.city ? 'border-red-500' : 'border-slate-200'}`} value={applyData.city} onChange={e => { setApplyData({ ...applyData, city: e.target.value }); setErrors({ ...errors, city: null }); }} />
                                            {errors.city && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.city}</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Subcity (Optional)</label>
                                        <input placeholder="Subcity" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold" value={applyData.subcity} onChange={e => setApplyData({ ...applyData, subcity: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <input placeholder="Field (e.g Website Dev)" className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.field ? 'border-red-500' : 'border-slate-200'}`} value={applyData.field} onChange={e => { setApplyData({ ...applyData, field: e.target.value }); setErrors({ ...errors, field: null }); }} />
                                        {errors.field && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.field}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Start Date</label>
                                            <input required type="date" className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none text-sm font-bold ${errors.startDate ? 'border-red-500' : 'border-slate-200'}`} value={applyData.startDate} onChange={e => { setApplyData({ ...applyData, startDate: e.target.value }); setErrors({ ...errors, startDate: null }); }} />
                                            {errors.startDate && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.startDate}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">End Date</label>
                                            <input required type="date" className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none text-sm font-bold ${errors.endDate ? 'border-red-500' : 'border-slate-200'}`} value={applyData.endDate} onChange={e => { setApplyData({ ...applyData, endDate: e.target.value }); setErrors({ ...errors, endDate: null }); }} />
                                            {errors.endDate && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.endDate}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-dbu-primary uppercase tracking-widest border-b border-dbu-primary/10 pb-2">Company Supervisor Contact</h3>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <input placeholder="Full Name" className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.companySupervisorName ? 'border-red-500' : 'border-slate-200'}`} value={applyData.companySupervisorName} onChange={e => { setApplyData({ ...applyData, companySupervisorName: e.target.value }); setErrors({ ...errors, companySupervisorName: null }); }} />
                                        {errors.companySupervisorName && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.companySupervisorName}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <input placeholder="Phone Number" className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.companySupervisorPhone ? 'border-red-500' : 'border-slate-200'}`} value={applyData.companySupervisorPhone} onChange={e => { setApplyData({ ...applyData, companySupervisorPhone: e.target.value }); setErrors({ ...errors, companySupervisorPhone: null }); }} />
                                        {errors.companySupervisorPhone && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.companySupervisorPhone}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <input type="email" placeholder="Email Address" className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold ${errors.companySupervisorEmail ? 'border-red-500' : 'border-slate-200'}`} value={applyData.companySupervisorEmail} onChange={e => { setApplyData({ ...applyData, companySupervisorEmail: e.target.value }); setErrors({ ...errors, companySupervisorEmail: null }); }} />
                                        {errors.companySupervisorEmail && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.companySupervisorEmail}</p>}
                                    </div>
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
                            ['APPROVED', 'ACTIVE', 'ONGOING', 'COMPLETED', 'Approved', 'Active'].includes(status) ? (
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
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Supervisor</p>
                                            <p className="text-sm font-bold text-slate-700">{internship.companySupervisorName}</p>
                                            {internship.companySupervisorEmail && <p className="text-[10px] text-slate-500 font-medium truncate">{internship.companySupervisorEmail}</p>}
                                            {internship.companySupervisorPhone && <p className="text-[10px] text-slate-500 font-medium">{internship.companySupervisorPhone}</p>}
                                        </div>
                                        <div className="col-span-2 md:col-span-1 pt-6 border-t border-slate-50">
                                            <p className="text-[10px] font-black text-dbu-primary uppercase tracking-widest">Faculty Advisor</p>
                                            <p className="text-sm font-bold text-slate-700">{internship.advisor?.fullName || internship.advisor?.name || internship.advisor_id?.fullName || internship.advisor_id?.name || 'Pending Assignment'}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-50 flex gap-4">
                                        {(status === 'APPROVED' || status === 'ACTIVE' || status === 'ONGOING' || status === 'Approved' || status === 'Active') ? (
                                            <button
                                                onClick={() => navigate('/student/logbook')}
                                                className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black tracking-widest hover:border-dbu-primary hover:text-dbu-primary transition flex items-center justify-center gap-2"
                                            >
                                                <Book size={16} />
                                                DAILY LOGBOOK
                                            </button>
                                        ) : (
                                            <div className="flex-1 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-[10px] font-black tracking-widest text-slate-400 flex items-center justify-center gap-2 cursor-not-allowed opacity-60">
                                                <Book size={16} />
                                                LOGBOOK (LOCKED)
                                            </div>
                                        )}
                                        <button
                                            onClick={() => navigate('/student/reports')}
                                            className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black tracking-widest hover:border-dbu-primary hover:text-dbu-primary transition flex items-center justify-center gap-2"
                                        >
                                            <FileText size={16} />
                                            REPORTS
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className={`p-8 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${status === 'REVISION_REQUIRED' || status === 'REJECTED'
                                            ? 'bg-red-50/50 border-red-100'
                                            : 'bg-amber-50/50 border-amber-100'
                                        }`}>
                                        <div>
                                            <h2 className={`text-xl font-black ${status === 'REVISION_REQUIRED' || status === 'REJECTED'
                                                    ? 'text-red-800'
                                                    : 'text-slate-800'
                                                }`}>
                                                {status === 'REVISION_REQUIRED'
                                                    ? 'Action Required'
                                                    : status === 'REJECTED'
                                                        ? 'Application Rejected'
                                                        : 'Application Pending Review'}
                                            </h2>
                                            <p className={`text-xs font-bold mt-1 ${status === 'REVISION_REQUIRED' || status === 'REJECTED'
                                                    ? 'text-red-600'
                                                    : 'text-slate-500'
                                                }`}>
                                                {status === 'REVISION_REQUIRED'
                                                    ? 'The Dean has requested some changes to your application.'
                                                    : status === 'REJECTED'
                                                        ? 'Your application was rejected. You can edit your details to resubmit or find a different company.'
                                                        : 'Your application is awaiting review by the Department Dean. You can still edit your details.'}
                                            </p>
                                        </div>
                                        {['PENDING', 'PENDING_APPROVAL', 'Pending', 'RESUBMITTED', 'REVISION_REQUIRED', 'REJECTED'].includes(status) && (
                                            <button
                                                onClick={() => {
                                                    if (internship) {
                                                        setApplyData({
                                                            companyName: internship.company?.name || internship.companyName || '',
                                                            country: internship.company?.country || 'Ethiopia',
                                                            city: internship.company?.city || '',
                                                            subcity: internship.company?.subcity || '',
                                                            field: internship.field || '',
                                                            startDate: internship.startDate ? new Date(internship.startDate).toISOString().split('T')[0] : '',
                                                            endDate: internship.endDate ? new Date(internship.endDate).toISOString().split('T')[0] : '',
                                                            companySupervisorName: internship.companySupervisorName || '',
                                                            companySupervisorPhone: internship.companySupervisorPhone || '',
                                                            companySupervisorEmail: internship.companySupervisorEmail || ''
                                                        });
                                                    }
                                                    setShowApply(true);
                                                }}
                                                className={`px-5 py-2.5 bg-white border rounded-xl font-black text-[10px] tracking-widest transition flex items-center gap-2 shadow-sm ${status === 'REVISION_REQUIRED' || status === 'REJECTED'
                                                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                        : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                                                    }`}
                                            >
                                                <Edit3 size={14} />
                                                EDIT DETAILS
                                            </button>
                                        )}
                                    </div>
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-5">
                                            <h3 className="text-[10px] font-black text-dbu-primary uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                                                <Briefcase size={14} /> Company Details
                                            </h3>
                                            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                                <div className="space-y-1 col-span-2 sm:col-span-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">Company Name</p>
                                                    <p className="text-sm font-bold text-slate-700">{internship.company?.name || internship.companyName || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1 col-span-2 sm:col-span-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">Location</p>
                                                    <p className="text-sm font-bold text-slate-700">
                                                        {internship.company?.country || 'N/A'}, {internship.company?.city || 'N/A'}
                                                        {internship.company?.subcity && ` (${internship.company.subcity})`}
                                                    </p>
                                                </div>
                                                <div className="space-y-1 col-span-2">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">Field</p>
                                                    <p className="text-sm font-bold text-slate-700">{internship.field || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><Calendar size={10} /> Start Date</p>
                                                    <p className="text-sm font-bold text-slate-700">{internship.startDate ? new Date(internship.startDate).toLocaleDateString() : 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><Calendar size={10} /> End Date</p>
                                                    <p className="text-sm font-bold text-slate-700">{internship.endDate ? new Date(internship.endDate).toLocaleDateString() : 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-5">
                                            <h3 className="text-[10px] font-black text-dbu-primary uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                                                <User size={14} /> Company Supervisor Contact
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                                        <User size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Full Name</p>
                                                        <p className="text-sm font-bold text-slate-700">{internship.companySupervisorName || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                                        <Phone size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Phone Number</p>
                                                        <p className="text-sm font-bold text-slate-700">{internship.companySupervisorPhone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                                        <Mail size={14} />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Email Address</p>
                                                        <p className="text-sm font-bold text-slate-700 truncate">{internship.companySupervisorEmail || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
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
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user?.phone ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}><Phone size={18} /></div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Phone</p>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${user?.phone ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                                                {user?.phone ? 'Completed' : 'N/A'}
                                            </span>
                                        </div>
                                        <p className={`text-xs font-bold ${user?.phone ? 'text-slate-700' : 'text-red-500 italic'}`}>{user?.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(user?.cbeAccount || user?.studentProfile?.cbeAccount) ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}><CreditCard size={18} /></div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">CBE Account</p>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${(user?.cbeAccount || user?.studentProfile?.cbeAccount) ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                                                {(user?.cbeAccount || user?.studentProfile?.cbeAccount) ? 'Completed' : 'N/A'}
                                            </span>
                                        </div>
                                        <p className={`text-xs font-bold ${(user?.cbeAccount || user?.studentProfile?.cbeAccount) ? 'text-slate-700' : 'text-red-500 italic'}`}>{(user?.cbeAccount || user?.studentProfile?.cbeAccount) || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={12} className="text-dbu-primary" />
                                Recent Activity
                            </h3>
                            <div className="space-y-6">
                                {activities.length === 0 ? (
                                    <p className="text-[11px] text-slate-400 italic">No recent activity.</p>
                                ) : (
                                    activities.map((act, i) => (
                                        <div key={act.id || i} className="flex gap-4 group">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-dbu-primary/5 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-dbu-primary group-hover:scale-125 transition-transform"></div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-black text-slate-700 leading-relaxed mb-0.5">{act.message}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{new Date(act.time).toLocaleDateString()}</span>
                                                    <span className="text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {act.type.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
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
