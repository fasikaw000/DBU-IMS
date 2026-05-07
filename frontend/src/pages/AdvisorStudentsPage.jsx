import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    GraduationCap,
    Search,
    Filter,
    User,
    Briefcase,
    Calendar,
    FileText,
    ClipboardList,
    MessageSquare,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronRight,
    ExternalLink,
    Star,
    Send,
    Loader2,
    ArrowLeft,
    Download
} from 'lucide-react';
import FilePreviewModal from '../components/FilePreviewModal';

const AdvisorStudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // View state
    const [view, setView] = useState('list'); // list, profile
    const [selectedInternship, setSelectedInternship] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // overview, reports, logbook, evaluation

    // Sub-data state
    const [reports, setReports] = useState([]);
    const [logbooks, setLogbooks] = useState([]);
    const [subDataLoading, setSubDataLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [previewData, setPreviewData] = useState(null);

    // Evaluation form state
    const [grades, setGrades] = useState({
        companyGrade: '',
        documentationGrade: '',
        implementationGrade: '',
        presentationGrade: '',
        advisorComment: ''
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/advisor/students');
            const studentData = res?.data || (Array.isArray(res) ? res : []);
            setStudents(Array.isArray(studentData) ? studentData : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentDetails = async (internship) => {
        setSubDataLoading(true);
        setSelectedInternship(internship);
        setView('profile');
        setActiveTab('overview');
        setMessage(null);

        try {
            const [reportsRes, logbooksRes] = await Promise.all([
                api.get(`/advisor/reports/${internship._id}`),
                api.get(`/logbooks/assigned-logbooks?studentId=${internship.student?._id}`)
            ]);
            
            const reportsData = reportsRes?.data || (Array.isArray(reportsRes) ? reportsRes : []);
            setReports(Array.isArray(reportsData) ? reportsData : []);

            const logData = logbooksRes?.data?.logbooks || logbooksRes?.data || (Array.isArray(logbooksRes) ? logbooksRes : []);
            setLogbooks(Array.isArray(logData) ? logData : []);

            // If internship is already graded, populate form
            if (internship.finalGrade) {
                setGrades({
                    companyGrade: internship.finalGrade.companyGrade || '',
                    documentationGrade: internship.finalGrade.documentationGrade || '',
                    implementationGrade: internship.finalGrade.implementationGrade || '',
                    presentationGrade: internship.finalGrade.presentationGrade || '',
                    advisorComment: internship.finalGrade.description || ''
                });
            } else {
                setGrades({ companyGrade: '', documentationGrade: '', implementationGrade: '', presentationGrade: '', advisorComment: '' });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubDataLoading(false);
        }
    };

    const handleReportReview = async (reportId, status, feedback) => {
        setActionLoading(true);
        try {
            await api.put(`/advisor/report/${reportId}`, { status, feedback });
            // Refresh reports
            const res = await api.get(`/advisor/reports/${selectedInternship._id}`);
            const reportsData = res?.data || (Array.isArray(res) ? res : []);
            setReports(Array.isArray(reportsData) ? reportsData : []);
            setMessage({ type: 'success', text: `Report ${status.toLowerCase()} successfully.` });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update report status.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogbookComment = async (logId, text) => {
        if (!text.trim()) return;
        setActionLoading(true);
        try {
            await api.post(`/logbooks/${logId}/comment`, { text });
            // Refresh logbooks
            const res = await api.get(`/logbooks/assigned-logbooks?studentId=${selectedInternship.student?._id}`);
            const logData = res?.data?.logbooks || res?.data || (Array.isArray(res) ? res : []);
            setLogbooks(Array.isArray(logData) ? logData : []);
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleFinalEvaluation = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setMessage(null);
        try {
            const res = await api.post(`/advisor/internship/${selectedInternship._id}/evaluate`, grades);
            setMessage({ type: 'success', text: res.message || 'Evaluation completed successfully!' });
            fetchStudents(); // Refresh main list
            // Update selected internship state locally
            setSelectedInternship(prev => ({
                ...prev,
                status: 'GRADED',
                finalGrade: {
                    ...grades,
                    total: res.data.advisorScore
                }
            }));
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Grading failed.' });
        } finally {
            setActionLoading(false);
        }
    };

    const filteredStudents = Array.isArray(students) ? students.filter(s => {
        const matchesSearch = s.student?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.student?.studentId?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filterStatus === 'All' || s.status === filterStatus;
        return matchesSearch && matchesFilter;
    }) : [];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-dbu-primary" />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            {view === 'list' ? (
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                <GraduationCap className="w-8 h-8 text-dbu-primary" />
                                Faculty Advisor Supervision
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">Manage assigned students and evaluate their internship performance as a faculty advisor.</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by student name or ID..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-slate-400" />
                            <select
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-dbu-primary"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="GRADED">Graded</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/30">
                                        <th className="p-6">Student Information</th>
                                        <th className="p-6">Company & Field</th>
                                        <th className="p-6">Internship Duration</th>
                                        <th className="p-6">Status</th>
                                        <th className="p-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-20 text-center text-slate-400 font-bold">
                                                No students found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((intern) => (
                                            <tr key={intern._id} className="hover:bg-slate-50/50 transition">
                                                <td className="p-6">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-800">{intern.student?.user?.name}</span>
                                                            {intern.student?.user?.isActive === false && (
                                                                <span className="px-1.5 py-0.5 bg-red-50 text-red-500 text-[8px] font-black uppercase rounded border border-red-100 tracking-tighter">Deactivated</span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-slate-400 font-medium">{intern.student?.studentId}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-slate-700 text-sm">{intern.company?.name || 'N/A'}</span>
                                                        <span className="text-[10px] text-dbu-primary font-black uppercase tracking-wider">{intern.field}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex flex-col gap-1 text-[11px] text-slate-600 font-medium">
                                                        <span>{new Date(intern.startDate).toLocaleDateString()}</span>
                                                        <span className="text-slate-300">to</span>
                                                        <span>{new Date(intern.endDate).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${intern.status === 'ACTIVE' || intern.status === 'Active'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : intern.status === 'COMPLETED'
                                                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                                : 'bg-slate-50 text-slate-600 border-slate-100'
                                                        }`}>
                                                        {intern.status}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <button
                                                        onClick={() => fetchStudentDetails(intern)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-dbu-primary text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-dbu-accent transition shadow-sm"
                                                    >
                                                        SUPERVISE
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                /* Student Profile View */
                <div className="animate-in slide-in-from-right-4 duration-300">
                    {/* Sub Header */}
                    <div className="bg-white border-b border-slate-200 p-6 sticky top-0 z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setView('list')}
                                className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500"
                            >
                                <ArrowLeft size={20} />
                            </button>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedInternship.student?.user?.name}</h2>
                                    {selectedInternship.student?.user?.isActive === false && (
                                        <span className="px-1.5 py-0.5 bg-red-50 text-red-500 text-[8px] font-black uppercase rounded border border-red-100 tracking-tighter">Deactivated</span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 font-medium">{selectedInternship.student?.studentId} • {selectedInternship.company?.name || 'N/A'}</p>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {['overview', 'reports', 'logbook', 'evaluation'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${activeTab === tab ? 'bg-white text-dbu-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 max-w-5xl mx-auto space-y-8">
                        {message && (
                            <div className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                }`}>
                                {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                                <p className="font-bold text-sm">{message.text}</p>
                            </div>
                        )}

                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 space-y-8">
                                    {/* Student Card */}
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                            <User size={20} className="text-dbu-primary" />
                                            Student Profile
                                        </h3>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                                                <p className="text-sm font-bold text-slate-700">{selectedInternship.student?.user?.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student ID</p>
                                                <p className="text-sm font-bold text-slate-700">{selectedInternship.student?.studentId}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                                                <p className="text-sm font-bold text-slate-700">{selectedInternship.student?.user?.email || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                                                <p className="text-sm font-bold text-slate-700">{selectedInternship.student?.user?.phone || selectedInternship.student?.phone || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</p>
                                                <p className="text-sm font-bold text-dbu-primary uppercase tracking-wider">{selectedInternship.student?.department?.name || 'Computer Science'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Placement Card */}
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                            <Briefcase size={20} className="text-dbu-primary" />
                                            Placement Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Company</p>
                                                <p className="text-sm font-bold text-slate-700">{selectedInternship.company?.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Internship Field</p>
                                                <p className="text-sm font-bold text-slate-700">{selectedInternship.field}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date</p>
                                                <p className="text-sm font-bold text-slate-700">{new Date(selectedInternship.startDate).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</p>
                                                <p className="text-sm font-bold text-slate-700">{new Date(selectedInternship.endDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">{selectedInternship.companySupervisorName}</p>
                                                <p className="text-[10px] text-slate-400">Company Supervisor • {selectedInternship.companySupervisorEmail}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl shadow-slate-200">
                                        <h4 className="text-sm font-black uppercase tracking-widest mb-6 opacity-50">Internship Progress</h4>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase opacity-60">Status</span>
                                                <span className="text-sm font-black text-dbu-accent">{selectedInternship.status}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase opacity-60">Reports</span>
                                                <span className="text-sm font-black">{reports.length} Uploaded</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase opacity-60">Logbooks</span>
                                                <span className="text-sm font-black">{logbooks.length} Entries</span>
                                            </div>
                                            <div className="pt-6 border-t border-white/10">
                                                <p className="text-[10px] font-black uppercase opacity-40 mb-2">Final Evaluation</p>
                                                {selectedInternship.finalGrade ? (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-4xl font-black">{selectedInternship.finalGrade.total}%</span>
                                                        <span className="text-xl font-black text-dbu-accent">{selectedInternship.finalGrade.letterGrade}</span>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-white/60 italic">Pending faculty advisor evaluation</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedInternship.companyEvaluationUrl && (
                                        <div className="bg-dbu-primary/5 border border-dbu-primary/10 p-6 rounded-3xl space-y-4">
                                            <div className="flex items-center gap-3 text-dbu-primary">
                                                <FileText size={20} />
                                                <span className="text-sm font-black uppercase tracking-widest">Company Evaluation</span>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed">Student has uploaded the required evaluation form from the company supervisor.</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setPreviewData({ url: selectedInternship.companyEvaluationUrl, name: `Company Evaluation - ${selectedInternship.student?.user?.name}` })}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-dbu-primary text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-dbu-accent transition shadow-lg shadow-dbu-primary/20"
                                                >
                                                    <ExternalLink size={14} />
                                                    VIEW REPORT
                                                </button>
                                                <a
                                                    href={`http://localhost:5001${selectedInternship.companyEvaluationUrl}`}
                                                    download
                                                    className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-dbu-primary hover:border-dbu-primary transition-all flex items-center justify-center shadow-sm"
                                                    title="Download File"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <FileText className="w-6 h-6 text-dbu-primary" />
                                        Student Reports Review
                                    </h3>

                                    {reports.length === 0 ? (
                                        <div className="py-20 text-center text-slate-400 italic">No reports submitted yet.</div>
                                    ) : (
                                        <div className="space-y-6">
                                            {reports.map((report) => (
                                                <div key={report._id} className="border border-slate-100 rounded-2xl p-6 hover:bg-slate-50 transition-all space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-dbu-primary/10 rounded-xl flex items-center justify-center text-dbu-primary font-black">
                                                                {report.type === 'WEEKLY' ? 'W' : 'F'}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-800">{report.type} REPORT</h4>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(report.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${report.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                report.status === 'Revision Required' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                            }`}>
                                                            {report.status}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                        <div className="flex items-center gap-4">
                                                            <button
                                                                onClick={() => setPreviewData({ url: report.fileUrl, name: `${report.type} Report - ${selectedInternship.student?.user?.name}` })}
                                                                className="text-[10px] font-black text-dbu-primary hover:underline flex items-center gap-1.5 transition-all"
                                                            >
                                                                <ExternalLink size={12} />
                                                                VIEW REPORT
                                                            </button>
                                                            <a
                                                                href={`http://localhost:5001${report.fileUrl}`}
                                                                download
                                                                className="flex items-center gap-1.5 text-slate-400 hover:text-dbu-primary text-[10px] font-black tracking-widest transition-all"
                                                            >
                                                                <Download size={12} />
                                                                DOWNLOAD
                                                            </a>
                                                        </div>

                                                        {report.status === 'Pending' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        const feedback = prompt("Enter revision feedback:");
                                                                        if (feedback) handleReportReview(report._id, 'Revision Required', feedback);
                                                                    }}
                                                                    disabled={actionLoading || selectedInternship.student?.user?.isActive === false}
                                                                    className="px-3 py-1.5 text-[9px] font-black bg-white text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition disabled:opacity-30"
                                                                >
                                                                    REQUEST REVISION
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReportReview(report._id, 'Approved')}
                                                                    disabled={actionLoading || selectedInternship.student?.user?.isActive === false}
                                                                    className="px-3 py-1.5 text-[9px] font-black bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-30"
                                                                >
                                                                    APPROVE
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {report.feedback && (
                                                        <div className="mt-4 p-4 bg-slate-100 rounded-xl text-xs text-slate-600 italic">
                                                            <span className="font-black not-italic text-[9px] uppercase tracking-widest text-slate-400 block mb-1">Feedback:</span>
                                                            "{report.feedback}"
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'logbook' && (
                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <ClipboardList className="w-6 h-6 text-dbu-primary" />
                                        Internship Journal (Logbook)
                                    </h3>

                                    {logbooks.length === 0 ? (
                                        <div className="py-20 text-center text-slate-400 italic">No logbook entries found.</div>
                                    ) : (
                                        <div className="space-y-6">
                                            {logbooks.map((log) => (
                                                <div key={log._id} className="border-l-4 border-dbu-primary bg-slate-50/50 p-6 rounded-r-2xl space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                        <span className="text-[10px] font-black text-dbu-primary bg-dbu-primary/10 px-2 py-0.5 rounded">{log.hoursWorked} HRS</span>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Activity</h5>
                                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{log.activity}</p>
                                                    </div>
                                                    {log.tasksCompleted && (
                                                        <div>
                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Tasks Completed</h5>
                                                            <p className="text-xs text-slate-600">{log.tasksCompleted}</p>
                                                        </div>
                                                    )}
                                                    {log.problemsFaced && (
                                                        <div>
                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Issues/Remarks</h5>
                                                            <p className="text-xs text-slate-500 italic">{log.problemsFaced}</p>
                                                        </div>
                                                    )}

                                                    <div className="pt-4 border-t border-slate-200">
                                                        {log.comment && log.comment.text ? (
                                                            <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-100">
                                                                <MessageSquare size={16} className="text-dbu-primary mt-1" />
                                                                <div>
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Faculty Advisor Comment</p>
                                                                    <p className="text-xs text-slate-600 font-medium">{log.comment.text}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder={selectedInternship.student?.user?.isActive === false ? "Account deactivated..." : "Add a comment or guidance..."}
                                                                    disabled={selectedInternship.student?.user?.isActive === false}
                                                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-dbu-primary outline-none transition disabled:bg-slate-100 disabled:text-slate-400"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleLogbookComment(log._id, e.target.value);
                                                                    }}
                                                                />
                                                                <button
                                                                    onClick={(e) => {
                                                                        const input = e.currentTarget.previousSibling;
                                                                        handleLogbookComment(log._id, input.value);
                                                                    }}
                                                                    disabled={selectedInternship.student?.user?.isActive === false}
                                                                    className="p-2 bg-dbu-primary text-white rounded-xl hover:bg-dbu-accent transition disabled:opacity-30"
                                                                >
                                                                    <Send size={16} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'evaluation' && (
                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3 mb-8">
                                        <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Final Academic Performance</h3>
                                            <p className="text-sm text-slate-500">Rate the student across key professional and technical criteria.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleFinalEvaluation} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {[
                                                { id: 'companyGrade', label: 'Company Supervisor Rating (30%)', hint: 'Rating from company evaluation form' },
                                                { id: 'documentationGrade', label: 'Reports & Documentation (25%)', hint: 'Quality of weekly/final reports' },
                                                { id: 'implementationGrade', label: 'Technical Implementation (25%)', hint: 'Quality of project work' },
                                                { id: 'presentationGrade', label: 'Final Presentation (20%)', hint: 'Communication and defense' }
                                            ].map((field) => (
                                                <div key={field.id} className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label}</label>
                                                        <span className="text-[10px] font-black text-dbu-primary bg-dbu-primary/5 px-2 py-0.5 rounded">WEIGHTED</span>
                                                    </div>
                                                    <input
                                                        required
                                                        type="number"
                                                        min="0" max="100"
                                                        placeholder="Score / 100"
                                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm font-bold"
                                                        value={grades[field.id]}
                                                        onChange={(e) => setGrades({ ...grades, [field.id]: e.target.value })}
                                                    />
                                                    <p className="text-[9px] text-slate-400 font-medium italic">{field.hint}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faculty Advisor Summative Comment</label>
                                            <textarea
                                                rows="4"
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm font-medium resize-none"
                                                placeholder="Provide a professional summary of the student's internship progress, strengths, and areas for improvement as a faculty advisor..."
                                                value={grades.advisorComment}
                                                onChange={(e) => setGrades({ ...grades, advisorComment: e.target.value })}
                                            ></textarea>
                                        </div>

                                        <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl shadow-slate-300">
                                            <div className="flex items-center gap-6">
                                                <div className="w-20 h-20 bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-white/10">
                                                    <p className="text-[8px] font-black uppercase tracking-tighter opacity-40">Total</p>
                                                    <p className="text-3xl font-black">
                                                        {(Number(grades.companyGrade) * 0.3 + Number(grades.documentationGrade) * 0.25 + Number(grades.implementationGrade) * 0.25 + Number(grades.presentationGrade) * 0.2).toFixed(1)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-dbu-accent uppercase tracking-widest">Final Submission</p>
                                                    <p className="text-xs text-white/50 max-w-xs">By finalizing, you confirm this grade is an accurate reflection of the student's performance.</p>
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={actionLoading || selectedInternship.status === 'COMPLETED' || selectedInternship.student?.user?.isActive === false}
                                                className="px-10 py-5 bg-dbu-primary text-white rounded-2xl font-black text-xs tracking-widest hover:bg-dbu-accent transition shadow-lg shadow-dbu-primary/20 flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                                                {selectedInternship.student?.user?.isActive === false ? 'ACCOUNT DEACTIVATED' : (selectedInternship.status === 'COMPLETED' ? 'COMPLETED & LOCKED' : 'FINALIZE & SUBMIT')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <FilePreviewModal 
                isOpen={!!previewData} 
                onClose={() => setPreviewData(null)} 
                fileUrl={previewData?.url} 
                fileName={previewData?.name} 
            />
        </div>
    );
};

export default AdvisorStudentsPage;
