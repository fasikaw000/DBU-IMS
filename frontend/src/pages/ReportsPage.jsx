import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    FileText, 
    UploadCloud, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertCircle, 
    History,
    Calendar,
    ArrowRight,
    Loader2,
    ExternalLink,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

const ReportsPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    
    // Upload Form State
    const [showUpload, setShowUpload] = useState(false);
    const [type, setType] = useState('WEEKLY');
    const [dueDate, setDueDate] = useState('');
    const [fileUrl, setFileUrl] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get('/student/reports');
            setReports(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);
        try {
            // Fake cloudinary URL for now as per previous implementation logic
            const fakeUrl = `https://cloudinary.com/dbu-ims/rep_${Math.random().toString(36).substring(7)}.pdf`;
            
            const res = await api.post('/student/reports', {
                type,
                fileUrl: fileUrl || fakeUrl,
                dueDate
            });
            
            setMessage({ 
                type: 'success', 
                text: `${type} Report (v${res.data.version}) submitted successfully! ${res.data.isLate ? 'Flagged as LATE submission.' : ''}` 
            });
            setShowUpload(false);
            fetchReports();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Upload failed' });
        } finally {
            setSubmitting(false);
        }
    };

    // Grouping reports by type for history view
    const reportGroups = reports.reduce((acc, report) => {
        if (!acc[report.type]) acc[report.type] = [];
        acc[report.type].push(report);
        return acc;
    }, {});

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-dbu-primary" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Report Management</h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <FileText size={16} className="text-dbu-primary" />
                        Upload weekly, monthly, and final internship reports.
                    </p>
                </div>
                <button 
                    onClick={() => setShowUpload(true)}
                    className="px-6 py-4 bg-dbu-primary text-white rounded-2xl font-black text-[10px] tracking-widest hover:bg-dbu-accent transition shadow-xl flex items-center gap-2"
                >
                    <UploadCloud size={18} />
                    NEW SUBMISSION
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                }`}>
                    {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    <p className="font-bold text-sm">{message.text}</p>
                </div>
            )}

            {/* Upload Modal/Form */}
            {showUpload && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800">Submit New Report</h2>
                            <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors">Close</button>
                        </div>
                        <form onSubmit={handleUpload} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Report Type</label>
                                    <select 
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-dbu-primary transition text-sm font-bold appearance-none"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        <option value="WEEKLY">Weekly Report</option>
                                        <option value="MONTHLY">Monthly Report</option>
                                        <option value="FINAL">Final Project Report</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Due Date</label>
                                    <input 
                                        required
                                        type="date"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                    <p className="text-[9px] text-slate-400 ml-1 italic">* Submissions past this date will be flagged as LATE automatically.</p>
                                </div>
                                <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/30 group hover:border-dbu-primary transition-colors cursor-pointer">
                                    <UploadCloud className="w-10 h-10 text-slate-200 mx-auto mb-3 group-hover:text-dbu-primary transition-colors" />
                                    <p className="text-xs font-bold text-slate-400 group-hover:text-dbu-primary">Click to select PDF or DOCX file</p>
                                    <p className="text-[10px] text-slate-300 mt-1">Maximum file size: 10MB</p>
                                </div>
                            </div>
                            <button disabled={submitting} type="submit" className="w-full py-5 bg-dbu-primary text-white rounded-2xl font-black tracking-widest text-xs hover:bg-dbu-accent transition shadow-xl flex items-center justify-center gap-3">
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                UPLOAD REPORT (V{ (reports.filter(r => r.type === type).length || 0) + 1 })
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Reports List/History */}
            <div className="space-y-12">
                {Object.keys(reportGroups).length === 0 ? (
                    <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4">
                        <FileText size={64} className="text-slate-100 mx-auto" />
                        <div>
                            <h3 className="text-lg font-black text-slate-400 tracking-tight">No Reports Uploaded</h3>
                            <p className="text-sm text-slate-300 max-w-xs mx-auto">Start by uploading your first weekly report using the "New Submission" button.</p>
                        </div>
                    </div>
                ) : (
                    Object.entries(reportGroups).map(([type, items]) => (
                        <div key={type} className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <span className="w-8 h-8 bg-dbu-primary rounded-lg flex items-center justify-center text-white">
                                        {type === 'WEEKLY' ? 'W' : type === 'MONTHLY' ? 'M' : 'F'}
                                    </span>
                                    {type} REPORT HISTORY
                                </h2>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{items.length} Versions</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {items.map((report) => (
                                    <div key={report._id} className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6 relative overflow-hidden transition-all hover:shadow-md ${!report.isLatest ? 'opacity-60 bg-slate-50/50 grayscale-[0.5]' : 'border-l-4 border-l-dbu-primary'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">VERSION {report.version}</p>
                                                <h3 className="font-black text-slate-800">
                                                    {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </h3>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                                                report.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                report.status === 'Revision Required' ? 'bg-red-50 text-red-600 border-red-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                {report.status}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-dbu-primary" />
                                                    Due: {new Date(report.dueDate).toLocaleDateString()}
                                                </div>
                                                {report.isLate && (
                                                    <div className="flex items-center gap-1.5 text-red-500 bg-red-50 px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter">
                                                        <Clock size={12} />
                                                        LATE
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <a 
                                                    href={`http://localhost:5001${report.fileUrl}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 text-dbu-primary text-[10px] font-black tracking-widest hover:underline"
                                                >
                                                    <ExternalLink size={14} />
                                                    VIEW DOCUMENT
                                                </a>
                                                {report.isLatest && <span className="text-[8px] font-black text-slate-300 uppercase">Current Version</span>}
                                            </div>

                                            {report.feedback && (
                                                <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-2">
                                                    <div className="flex items-center gap-2 text-dbu-accent">
                                                        <History size={12} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Advisor Feedback</span>
                                                    </div>
                                                    <p className="text-xs italic text-white/70 leading-relaxed font-medium">"{report.feedback}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReportsPage;
