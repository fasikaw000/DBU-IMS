import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Building,
    Plus,
    Search,
    Settings,
    Activity,
    Users,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Edit3
} from 'lucide-react';

const AdminDepartments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');

    // Form States
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingDept, setEditingDept] = useState(null);
    const [deptData, setDeptData] = useState({
        name: '',
        code: '',
        college: '',
        description: '',
        status: 'Active'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/admin/departments');
            setDepartments(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to load departments", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDept = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setMessage('');
        try {
            if (editingDept) {
                await api.put(`/admin/departments/${editingDept._id}`, deptData);
                setMessage(`Success: Department updated.`);
            } else {
                await api.post('/admin/departments', deptData);
                setMessage(`Success: Department ${deptData.name} created.`);
            }
            setDeptData({ name: '', code: '', college: '', description: '', status: 'Active' });
            setShowAddForm(false);
            setEditingDept(null);
            fetchData();
        } catch (err) {
            setMessage(`Failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (id) => {
        setActionLoading(true);
        try {
            await api.patch(`/admin/departments/${id}`);
            fetchData();
        } catch (err) {
            setMessage(`Failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const startEdit = (dept) => {
        setEditingDept(dept);
        setDeptData({
            name: dept.name,
            code: dept.code,
            college: dept.college || '',
            description: dept.description || '',
            status: dept.status || 'Active'
        });
        setShowAddForm(true);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete the department "${name}"? This only works if no students or staff are registered under it.`)) return;
        setActionLoading(true);
        try {
            await api.delete(`/admin/departments/${id}`);
            setMessage(`Success: Department ${name} deleted.`);
            fetchData();
        } catch (err) {
            setMessage(`Failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setActionLoading(false);
        }
    };
    const filteredDepts = departments.filter(d =>
        (d?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (d?.code || '').toLowerCase().includes(search.toLowerCase()) ||
        (d?.college || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dbu-primary"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Department Management</h1>
                    <p className="text-slate-500 text-sm">Create and manage departments used across students and staff.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingDept(null);
                        setDeptData({ name: '', code: '', college: '', description: '', status: 'Active' });
                        setShowAddForm(true);
                    }}
                    className="bg-dbu-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Department
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl font-bold text-sm ${message.includes('Success') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {message}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search departments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-dbu-primary outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Department Name</th>
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">College</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredDepts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400 italic">No departments found.</td>
                                </tr>
                            ) : (
                                filteredDepts.map((dept) => (
                                    <tr key={dept._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-800">{dept.name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-mono text-slate-100 bg-dbu-primary px-1.5 py-0.5 rounded">{dept.code}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{dept.college || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            {dept.status === 'Active' ? (
                                                <span className="text-green-600 text-xs font-bold inline-flex items-center">
                                                    <Activity className="w-3 h-3 mr-1" /> Active
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs font-bold">Inactive</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => startEdit(dept)} className="p-2 text-slate-400 hover:text-dbu-primary transition-colors" title="Edit">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(dept._id, dept.name)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Permanently Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleToggleStatus(dept._id)} className={`p-2 transition-colors ${dept.status === 'Active' ? 'text-green-500 hover:text-orange-500' : 'text-slate-300 hover:text-green-500'}`} title={dept.status === 'Active' ? 'Deactivate' : 'Activate'}>
                                                    {dept.status === 'Active' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
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

            {/* Manual Add/Edit Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-dbu-primary p-6 text-white">
                            <h3 className="text-xl font-black flex items-center">
                                <Building className="w-6 h-6 mr-3" />
                                {editingDept ? 'Edit Department' : 'Add New Department'}
                            </h3>
                            <p className="text-white/70 text-sm mt-1">
                                {editingDept ? 'Update department details.' : 'Manual account creation for departments.'}
                            </p>
                        </div>
                        
                        <form onSubmit={handleCreateDept} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Department Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Computer Science"
                                        value={deptData.name}
                                        onChange={e => setDeptData({ ...deptData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Department Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. CS"
                                        value={deptData.code}
                                        onChange={e => setDeptData({ ...deptData, code: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">College / Faculty</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. College of Computing"
                                        value={deptData.college}
                                        onChange={e => setDeptData({ ...deptData, college: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Description (Optional)</label>
                                    <textarea
                                        placeholder="Brief description of the department..."
                                        value={deptData.description}
                                        onChange={e => setDeptData({ ...deptData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all h-24 resize-none"
                                    />
                                </div>

                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Status</label>
                                        <select
                                            value={deptData.status}
                                            onChange={e => setDeptData({ ...deptData, status: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all cursor-pointer"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setEditingDept(null);
                                    }}
                                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-[2] bg-dbu-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all flex items-center justify-center text-sm"
                                >
                                    {actionLoading ? <Activity className="w-5 h-5 animate-spin" /> : (editingDept ? 'Update Details' : 'Create Department')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDepartments;
