import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Users,
    Search,
    Printer,
    MessageSquare,
    ChevronRight,
    ArrowLeft,
    AlertCircle,
    CheckCircle,
    X,
    Filter,
    Edit,
    Shield,
    ShieldOff,
    FileText,
    Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const DeanStudents = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [departmentName, setDepartmentName] = useState('');
    const [message, setMessage] = useState(null);
    const { user } = useContext(AuthContext);

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

    // Default all fields to true on mount
    useEffect(() => {
        const allTrue = Object.keys(printFields).reduce((acc, key) => ({ ...acc, [key]: true }), {});
        setPrintFields(allTrue);
    }, []);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(null), 2500);
        return () => clearTimeout(timer);
    }, [message]);

    const fetchData = async () => {
        try {
            const res = await api.get('/department/students');
            setStudents(res.data);
            if (res.data.length > 0) {
                const dept = res.data[0].department;
                setDepartmentName(dept?.name || dept?.code);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const activeFields = Object.keys(printFields).filter(f => printFields[f]);
        const fieldLabels = {
            name: 'Student Name',
            studentId: 'Student ID',
            username: 'Username',
            year: 'Year',
            cbeAccount: 'CBE Account',
            phone: 'Phone Number',
            status: 'Placement Status'
        };

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Department Records - ${departmentName}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        h1 { color: #1e3a8a; text-align: center; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 11px; }
                        th { background: #f8fafc; }
                    </style>
                </head>
                <body>
                    <h1>${user?.department?.name || departmentName || 'Department'} - Student Records</h1>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr>${activeFields.map(f => `<th>${fieldLabels[f]}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${students.map(s => `
                                <tr>
                                    ${activeFields.map(f => {
            if (f === 'name') return `<td>${s.user?.name}</td>`;
            if (f === 'status') return `<td>${s.internship?.status || 'NOT APPLIED'}</td>`;
            if (f === 'phone') return `<td>${s.phone || s.user?.phone || 'N/A'}</td>`;
            return `<td>${s[f] || 'N/A'}</td>`;
        }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        setShowPrintModal(false);
    };

    const handleExportCSV = () => {
        if (!students || students.length === 0) return;

        const csvData = students.map((s) => ({
            Name: s.user?.name || '',
            Email: s.user?.email || '',
            StudentID: s.studentId || '',
            Department: user?.department?.name || departmentName || '',
            Year: s.year || '',
            Status: s.internship?.status || 'NOT APPLIED'
        }));

        const headers = Object.keys(csvData[0]).join(",");
        const rows = csvData.map((row) =>
            Object.values(row).map(val => `"${val}"`).join(",")
        );

        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Department_Data_${(user?.department?.name || departmentName || 'Records').replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowPrintModal(false);
    };

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        Department Students
                        <span className="bg-dbu-primary/10 text-dbu-primary text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                            {user?.department?.name || departmentName || 'Loading...'}
                        </span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 font-medium">Viewing all students registered in your department.</p>
                </div>
                <button
                    onClick={() => setShowPrintModal(true)}
                    className="bg-dbu-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-dbu-primary/20 hover:bg-dbu-accent transition-all flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    Export
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or student ID..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50">
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Username</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4 text-center">Year</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">CBE Account</th>
                                <th className="px-6 py-4 text-center">Internship</th>
                                <th className="px-6 py-4 text-center">Account</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStudents.map(s => (
                                <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 text-sm">{s.fullName}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{s.studentId}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-[10px] font-mono font-bold text-slate-500">{s.username}</td>
                                    <td className="px-6 py-6 text-[10px] font-bold text-slate-500">{s.email}</td>
                                    <td className="px-6 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{s.department}</td>
                                    <td className="px-6 py-6 text-center text-[11px] font-bold text-slate-600">{s.year}</td>
                                    <td className="px-6 py-6 text-[11px] font-bold text-slate-600">{s.phone}</td>
                                    <td className="px-6 py-6 text-[11px] font-mono font-bold text-dbu-primary">{s.cbeAccount}</td>
                                    <td className="px-6 py-6 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.internshipStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                s.internshipStatus === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-slate-50 text-slate-400 border-slate-100'
                                            }`}>
                                            {s.internshipStatus?.replace('_', ' ') || 'NOT APPLIED'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {s.isActivated ? (
                                                <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100">Activated</span>
                                            ) : (
                                                <span className="bg-amber-50 text-amber-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-100">Pending</span>
                                            )}
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${s.isActive ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                {s.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/messages?userId=${s.userId}`)}
                                                className="p-2.5 bg-dbu-primary/10 text-dbu-primary rounded-xl hover:bg-dbu-primary hover:text-white transition-all shadow-sm hover:scale-110 cursor-pointer"
                                                title="Send Message"
                                            >
                                                <MessageSquare size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center text-slate-400 italic">No students found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Print Modal */}
            {showPrintModal && (
                <>
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" onClick={() => setShowPrintModal(false)} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden border border-slate-100 animate-in zoom-in-95">
                        <div className="p-8 bg-slate-800 text-white flex justify-between items-center">
                            <h3 className="text-xl font-black flex items-center gap-2"><Download className="w-5 h-5" /> Export Department Data</h3>
                            <button onClick={() => setShowPrintModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                {Object.keys(printFields).map(f => (
                                    <label key={f} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${printFields[f] ? 'bg-dbu-primary/5 border-dbu-primary shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
                                        <input type="checkbox" checked={printFields[f]} onChange={e => setPrintFields({ ...printFields, [f]: e.target.checked })} className="w-4 h-4 rounded text-dbu-primary focus:ring-dbu-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{f.replace(/([A-Z])/g, ' $1')}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button onClick={handlePrint} className="w-full py-4 bg-dbu-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-dbu-primary/20 hover:bg-dbu-accent transition-all flex items-center justify-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Generate Document
                                </button>
                                <button onClick={handleExportCSV} className="w-full py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Export Spreadsheet
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DeanStudents;
