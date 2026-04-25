import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import {
    Book,
    Plus,
    Calendar,
    Activity,
    CheckCircle,
    AlertCircle,
    Loader2,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    Send,
    User,
    Clock,
    ClipboardList,
    AlertTriangle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const LogbookPage = () => {
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const targetStudentId = searchParams.get('studentId'); // For Advisor view
    
    const [logbooks, setLogbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    
    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        activity: '',
        tasksCompleted: '',
        problemsFaced: '',
        hoursWorked: 8
    });

    // Advisor Comment State
    const [commentText, setCommentText] = useState('');
    const [commentingId, setCommentingId] = useState(null);

    useEffect(() => {
        fetchLogbooks();
    }, [targetStudentId]);

    const fetchLogbooks = async () => {
        setLoading(true);
        try {
            let res;
            if (user?.role === 'Advisor') {
                res = await api.get(`/logbooks/assigned-logbooks${targetStudentId ? `?studentId=${targetStudentId}` : ''}`);
            } else {
                res = await api.get('/logbooks/my-logbooks');
            }
            setLogbooks(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/logbooks/submit', formData);
            setMessage({ type: 'success', text: 'Logbook entry added successfully!' });
            setShowAddModal(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                activity: '',
                tasksCompleted: '',
                problemsFaced: '',
                hoursWorked: 8
            });
            fetchLogbooks();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add entry' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddComment = async (id) => {
        if (!commentText.trim()) return;
        try {
            await api.post(`/logbooks/${id}/comment`, { text: commentText });
            setCommentText('');
            setCommentingId(null);
            fetchLogbooks();
            setMessage({ type: 'success', text: 'Comment added successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add comment' });
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-dbu-primary" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Book className="text-dbu-primary w-8 h-8" />
                        Internship Logbook
                    </h1>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <Clock size={16} className="text-dbu-primary" />
                        {user?.role === 'Student' ? 'Track your daily activities and tasks.' : 'Review student daily logs and provide feedback.'}
                    </p>
                </div>
                {user?.role === 'Student' && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-4 bg-dbu-primary text-white rounded-2xl font-black text-[10px] tracking-widest hover:bg-dbu-accent transition shadow-xl flex items-center gap-2"
                    >
                        <Plus size={18} />
                        ADD LOG ENTRY
                    </button>
                )}
            </div>

            {message && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                    {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    <p className="font-bold text-sm">{message.text}</p>
                </div>
            )}

            {/* Log Entries List */}
            <div className="space-y-4">
                {logbooks.length === 0 ? (
                    <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4">
                        <ClipboardList size={64} className="text-slate-100 mx-auto" />
                        <div>
                            <h3 className="text-lg font-black text-slate-400 tracking-tight">No Logbook Entries Found</h3>
                            <p className="text-sm text-slate-300 max-w-xs mx-auto">
                                {user?.role === 'Student' ? 'Start by adding your first daily log entry.' : 'No log entries submitted by the student yet.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    logbooks.map((log) => (
                        <div key={log._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div 
                                className="p-6 cursor-pointer flex items-center justify-between"
                                onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                            {new Date(log.date).toLocaleString('default', { month: 'short' })}
                                        </span>
                                        <span className="text-xl font-black text-slate-800">
                                            {new Date(log.date).getDate()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-lg leading-tight">{log.activity}</h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <Clock size={12} /> {log.hoursWorked} Hours
                                            </span>
                                            {user?.role === 'Advisor' && (
                                                <span className="text-[10px] font-black text-dbu-primary uppercase tracking-widest flex items-center gap-1">
                                                    <User size={12} /> {log.student?.user?.name || 'Student'}
                                                </span>
                                            )}
                                            {log.comment?.text && (
                                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                                                    <MessageSquare size={10} /> Commented
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {expandedId === log._id ? <ChevronUp className="text-slate-300" /> : <ChevronDown className="text-slate-300" />}
                            </div>

                            {expandedId === log._id && (
                                <div className="px-8 pb-8 pt-2 space-y-6 animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tasks Completed</label>
                                                <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-700 font-medium border border-slate-100">
                                                    {log.tasksCompleted || 'No tasks specified.'}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Issues Faced</label>
                                                <div className={`p-4 rounded-2xl text-sm font-medium border ${log.problemsFaced ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-400 italic border-slate-100'}`}>
                                                    {log.problemsFaced || 'No issues reported.'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Advisor Feedback</label>
                                            {log.comment?.text ? (
                                                <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
                                                    <div className="relative z-10">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <MessageSquare size={14} className="text-dbu-accent" />
                                                            <span className="text-[10px] font-black text-dbu-accent uppercase tracking-widest">Feedback Received</span>
                                                        </div>
                                                        <p className="text-sm italic text-white/80 leading-relaxed">"{log.comment.text}"</p>
                                                        <p className="text-[9px] text-white/30 mt-4 font-black uppercase tracking-widest">
                                                            Posted on {new Date(log.comment.dateAdded).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Activity size={100} className="absolute -right-10 -bottom-10 text-white/5" />
                                                </div>
                                            ) : user?.role === 'Advisor' ? (
                                                <div className="space-y-3">
                                                    <textarea 
                                                        placeholder="Add a comment or guidance for this entry..."
                                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all resize-none"
                                                        rows="3"
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                    ></textarea>
                                                    <button 
                                                        onClick={() => handleAddComment(log._id)}
                                                        className="w-full py-3 bg-dbu-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Send size={14} />
                                                        SUBMIT FEEDBACK
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                                                    <p className="text-xs text-slate-300 italic font-medium">Waiting for advisor review...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add Entry Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800">New Logbook Entry</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest transition-colors">Close</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hours Worked</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        max="24"
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold"
                                        value={formData.hoursWorked}
                                        onChange={(e) => setFormData({ ...formData, hoursWorked: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activity Title</label>
                                <input
                                    required
                                    placeholder="e.g. Backend API Development"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold"
                                    value={formData.activity}
                                    onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tasks Completed</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="List the specific tasks you finished today..."
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold resize-none"
                                    value={formData.tasksCompleted}
                                    onChange={(e) => setFormData({ ...formData, tasksCompleted: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                    <AlertTriangle size={12} className="text-amber-500" /> Issues Faced (Optional)
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Any bugs or blockers you encountered?"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold resize-none"
                                    value={formData.problemsFaced}
                                    onChange={(e) => setFormData({ ...formData, problemsFaced: e.target.value })}
                                />
                            </div>
                            <button disabled={submitting} type="submit" className="w-full py-5 bg-dbu-primary text-white rounded-2xl font-black tracking-widest text-xs hover:bg-dbu-accent transition shadow-xl flex items-center justify-center gap-3">
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                SAVE ENTRY
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogbookPage;
