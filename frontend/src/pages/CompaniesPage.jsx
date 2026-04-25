import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Building2,
    Plus,
    Search,
    Edit2,
    Trash2,
    Power,
    Mail,
    Phone,
    MapPin,
    User,
    Users,
    X,
    CheckCircle,
    AlertCircle,
    Loader2,
    Check,
    X as XIcon
} from 'lucide-react';

const CompaniesPage = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        industry: '',
        contactPerson: '',
        email: '',
        phone: '',
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive, pending
    const [allStudents, setAllStudents] = useState([]);
    const [viewingStudentsFor, setViewingStudentsFor] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [compRes, studRes] = await Promise.all([
                api.get('/department/companies'),
                api.get('/department/students')
            ]);
            setCompanies(compRes.data);
            setAllStudents(studRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await api.patch(`/department/companies/${id}/status`);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleApprove = async (id, status) => {
        try {
            await api.patch(`/department/companies/${id}/approve`, { status });
            setMessage({ type: 'success', text: `Company ${status.toLowerCase()} successfully!` });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this company?')) return;
        try {
            await api.delete(`/department/companies/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);
        try {
            if (editingCompany) {
                await api.put(`/department/companies/${editingCompany._id}`, formData);
                setMessage({ type: 'success', text: 'Company updated successfully!' });
            } else {
                await api.post('/department/companies', formData);
                setMessage({ type: 'success', text: 'Company added successfully!' });
            }
            setIsModalOpen(false);
            setEditingCompany(null);
            setFormData({ name: '', location: '', industry: '', contactPerson: '', email: '', phone: '', description: '' });
            fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Something went wrong' });
            setTimeout(() => setMessage(null), 3000);
        } finally {
            setSubmitting(false);
        }
    };

    const openEdit = (company) => {
        setEditingCompany(company);
        setFormData({
            name: company.name,
            location: company.location,
            industry: company.industry,
            contactPerson: company.contactPerson || '',
            email: company.email || '',
            phone: company.phone || '',
            description: company.description || ''
        });
        setIsModalOpen(true);
    };

    const filteredCompanies = companies.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.industry.toLowerCase().includes(search.toLowerCase()) ||
            c.location.toLowerCase().includes(search.toLowerCase());
        
        let matchesStatus = true;
        if (statusFilter === 'active') matchesStatus = c.isActive && c.approvalStatus === 'APPROVED';
        else if (statusFilter === 'inactive') matchesStatus = !c.isActive && c.approvalStatus === 'APPROVED';
        else if (statusFilter === 'pending') matchesStatus = c.approvalStatus === 'PENDING';
        
        return matchesSearch && matchesStatus;
    });

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-dbu-primary" />
        </div>
    );

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Building2 className="w-8 h-8 text-dbu-primary" />
                        Company Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage approved internship companies and student placements.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingCompany(null);
                        setFormData({ name: '', location: '', industry: '', contactPerson: '', email: '', phone: '', description: '' });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-dbu-primary text-white rounded-xl font-black text-xs tracking-widest hover:bg-dbu-accent transition shadow-lg shadow-dbu-primary/20"
                >
                    <Plus size={18} />
                    ADD COMPANY
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search companies by name, industry or location..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="relative md:w-48">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm font-bold text-slate-600 appearance-none"
                    >
                        <option value="all">All Companies</option>
                        <option value="active">Active (Approved)</option>
                        <option value="pending">Pending Approval</option>
                        <option value="inactive">Deactivated</option>
                    </select>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                    }`}>
                    {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    <p className="font-bold text-sm">{message.text}</p>
                </div>
            )}

            {/* Company Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">No companies found matching your search</p>
                    </div>
                ) : (
                    filteredCompanies.map((company) => (
                        <div key={company._id} className={`bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl transition-all group relative overflow-hidden ${!company.isActive ? 'opacity-60' : ''}`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-dbu-primary/10 rounded-xl flex items-center justify-center text-dbu-primary">
                                    <Building2 size={24} />
                                </div>
                                <div className="flex gap-1">
                                    {company.approvalStatus === 'PENDING' ? (
                                        <>
                                            <button onClick={() => handleApprove(company._id, 'APPROVED')} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition" title="Approve">
                                                <Check size={16} />
                                            </button>
                                            <button onClick={() => handleApprove(company._id, 'REJECTED')} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition" title="Reject">
                                                <XIcon size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => openEdit(company)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-dbu-primary transition">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleToggleStatus(company._id)} className={`p-2 hover:bg-slate-100 rounded-lg transition ${company.isActive ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                <Power size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(company._id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-black text-slate-800">{company.name}</h3>
                                {company.approvalStatus === 'PENDING' && (
                                    <span className="bg-amber-100 text-amber-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        Pending
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-black text-dbu-primary uppercase tracking-widest bg-dbu-primary/5 px-2 py-0.5 rounded">
                                {company.industry}
                            </span>

                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <MapPin size={16} className="text-slate-300" />
                                    <span className="text-xs font-medium">{company.location}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500">
                                    <User size={16} className="text-slate-300" />
                                    <span className="text-xs font-medium">{company.contactPerson || 'No contact person'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Mail size={16} className="text-slate-300" />
                                    <span className="text-xs font-medium">{company.email || 'No email'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Phone size={16} className="text-slate-300" />
                                    <span className="text-xs font-medium">{company.phone || 'No phone'}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => setViewingStudentsFor(company)}
                                    className="w-full py-2 bg-slate-50 text-dbu-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-dbu-primary hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <Users size={14} />
                                    View Assigned Students
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                {editingCompany ? 'Edit Company' : 'Add New Company'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        {message && isModalOpen && (
                            <div className={`m-6 p-4 rounded-xl border flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                                <p className="font-bold text-sm">{message.text}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className={`${message ? 'px-8 pb-8 pt-2' : 'p-8'} space-y-6`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Industry / Field</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm"
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Person</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Description</label>
                                <textarea
                                    rows="3"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-dbu-primary outline-none transition text-sm resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs tracking-widest hover:bg-slate-200 transition"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-6 py-4 bg-dbu-primary text-white rounded-2xl font-black text-xs tracking-widest hover:bg-dbu-accent transition shadow-lg shadow-dbu-primary/20 flex items-center justify-center gap-2"
                                >
                                    {submitting && <Loader2 size={16} className="animate-spin" />}
                                    {editingCompany ? 'UPDATE COMPANY' : 'SAVE COMPANY'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Students Modal */}
            {viewingStudentsFor && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-800 text-white">
                            <div>
                                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                                    <Users size={20} /> Students at {viewingStudentsFor.name}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Active Placements</p>
                            </div>
                            <button onClick={() => setViewingStudentsFor(null)} className="p-2 hover:bg-white/10 rounded-xl transition">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1">
                            {(() => {
                                const assigned = allStudents.filter(s => s.internship?.companyId === viewingStudentsFor._id || s.internship?.company?.name === viewingStudentsFor.name || s.internship?.companyName === viewingStudentsFor.name);
                                if (assigned.length === 0) {
                                    return (
                                        <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold text-sm">No students assigned to this company currently.</p>
                                        </div>
                                    );
                                }
                                return (
                                    <div className="space-y-4">
                                        {assigned.map(s => (
                                            <div key={s._id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-dbu-primary/10 rounded-xl flex items-center justify-center text-dbu-primary font-black">
                                                        {s.user?.name?.charAt(0) || 'S'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{s.user?.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{s.studentId}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.internship?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                    {s.internship?.status || 'Unknown'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompaniesPage;
