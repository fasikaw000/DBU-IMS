import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Users,
    UserPlus,
    Search,
    Edit,
    Shield,
    ShieldOff,
    X,
    Plus,
    Activity,
    ShieldCheck,
    Mail,
    Printer,
    Upload,
    FileText,
    Download
} from 'lucide-react';

const AdminStaff = () => {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [search, setSearch] = useState('');

    // Form States
    const [selectedIds, setSelectedIds] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadSummary, setUploadSummary] = useState(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printModalData, setPrintModalData] = useState([]);
    const [printModalTitle, setPrintModalTitle] = useState('');
    const [statusModal, setStatusModal] = useState({ open: false, userId: null });
    const [staffData, setStaffData] = useState({
        name: '',
        role: '',
        department: ''
    });

    const [editData, setEditData] = useState({
        name: '',
        role: '',
        department: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!message) return;
        const timeout = setTimeout(() => {
            setMessage('');
            setMessageType('success');
        }, 2500);
        return () => clearTimeout(timeout);
    }, [message]);

    const fetchData = async () => {
        try {
            const resStaff = await api.get('/admin/staff');
            const resDepts = await api.get('/admin/departments');

            setUsers(Array.isArray(resStaff?.data) ? resStaff.data : []);
            setDepartments(Array.isArray(resDepts?.data) ? resDepts.data : []);

            if (resDepts?.data?.length > 0) {
                setStaffData(prev => ({ ...prev, department: resDepts.data[0]._id }));
            }
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        let newErrors = {};
        if (!staffData.name) newErrors.name = "Required";
        if (!staffData.role) newErrors.role = "Required";
        if (!staffData.department) newErrors.department = "Required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setMessageType('error');
            setMessage("Please fill out all required fields");
            return;
        }

        setActionLoading(true);
        setMessage('');
        try {
            await api.post('/admin/staff', staffData);
            setMessageType('success');
            setMessage(`Success: Staff account created.`);
            setStaffData({ name: '', role: '', department: departments[0]?._id || '' });
            setShowAddForm(false);
            fetchData();
        } catch (err) {
            setMessageType('error');
            setMessage(`Failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditStaff = (staff) => {
        setEditingStaff(staff);
        setEditData({
            name: staff.name,
            role: staff.role === 'dean' ? 'department_dean' : 'advisor',
            department: staff.department?._id || staff.department
        });
        setShowEditForm(true);
    };

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setMessage('');
        try {
            await api.put(`/admin/staff/${editingStaff._id}`, editData);
            setMessageType('success');
            setMessage(`Success: Staff member ${editData.name} updated.`);
            setShowEditForm(false);
            fetchData();
        } catch (err) {
            setMessageType('error');
            setMessage(`Failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (userId) => {
        setStatusModal({ open: true, userId });
    };

    const confirmToggleStatus = async () => {
        if (!statusModal.userId) return;
        setActionLoading(true);
        try {
            await api.patch(`/admin/users/${statusModal.userId}/status`);
            fetchData();
            setMessageType('success');
            setMessage('Success: Staff status updated.');
        } catch (err) {
            setMessageType('error');
            setMessage(`Failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setActionLoading(false);
            setStatusModal({ open: false, userId: null });
        }
    };

    const handleBulkUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            setMessageType('error');
            setMessage('Please select a file first.');
            return;
        }

        const fileExt = uploadFile.name.split('.').pop().toLowerCase();
        if (!['csv', 'xlsx', 'xls'].includes(fileExt)) {
            setMessageType('error');
            setMessage('Invalid file format. Please upload a CSV file.');
            return;
        }

        setActionLoading(true);
        setMessage('');
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            const res = await api.post('/admin/staff/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessageType('success');
            setMessage(res.data?.message || 'Upload completed successfully');
            setUploadSummary(res.data);
            setUploadFile(null);
            fetchData();
        } catch (err) {
            setMessageType('error');
            const errorMsg = err.response?.data?.message || err.message;
            const detailErrors = err.response?.data?.errors;

            if (Array.isArray(detailErrors) && detailErrors.length > 0) {
                setMessage(`${errorMsg}\n• ${detailErrors.slice(0, 5).join('\n• ')}${detailErrors.length > 5 ? '\n...' : ''}`);
            } else {
                setMessage(errorMsg.replace(/^Failed: /i, ''));
            }
        } finally {
            setActionLoading(false);
        }
    };

    const openPrintModal = (data, titleSuffix) => {
        if (!data || data.length === 0) {
            setMessageType('error');
            setMessage('Failed: No data available to print.');
            return;
        }
        setPrintModalData(data);
        setPrintModalTitle(titleSuffix);
        setShowPrintModal(true);
    };

    const handleExportStaffCSV = () => {
        const data = printModalData;
        if (!data || data.length === 0) return;
        const headers = 'Full Name,Department,Username,Role';
        const rows = data.map(s =>
            `"${s.name}","${s.department?.name || 'Central'}","${s.username}","${s.role}"`
        ).join('\n');
        const csvContent = 'data:text/csv;charset=utf-8,' + headers + '\n' + rows;
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `Staff_Records_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowPrintModal(false);
    };

    const printRecords = (data, titleSuffix) => {
        if (!data || data.length === 0) {
            setMessageType('error');
            setMessage('Failed: No data available to print.');
            return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head>
              <title>Staff Credentials - DBU IMS</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; line-height: 1.5; }
                .header { text-align: center; border-bottom: 3px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; }
                h1 { font-weight: 900; font-size: 28px; color: #1e293b; margin: 0; text-transform: uppercase; letter-spacing: -0.02em; }
                h2 { font-weight: 700; font-size: 18px; color: #64748b; margin: 5px 0 0 0; }
                .meta { margin-top: 10px; font-size: 12px; font-weight: bold; color: #94a3b8; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                th, td { border: 1px solid #e2e8f0; padding: 12px 15px; text-align: left; font-size: 11px; }
                th { background-color: #f8fafc; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
                tr:nth-child(even) { background-color: #fdfdfd; }
                .mono { font-family: monospace; font-weight: bold; color: #1e293b; background: #f1f5f9; padding: 2px 4px; rounded: 4px; }
                .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                @media print {
                  body { padding: 0px; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Debre Berhan University</h1>
                <h2>DBU Internship Management System</h2>
                <h2>Staff System Credentials (${titleSuffix})</h2>
                <div class="meta">Generated on: ${new Date().toLocaleString()}</div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Department</th>
                    <th>Username</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.map(s => `
                    <tr>
                      <td style="font-weight: bold;">${s.name}</td>
                      <td>${s.department?.name || 'Central'}</td>
                      <td class="mono">${s.username}</td>
                      <td style="text-transform: uppercase; font-weight: bold;">${s.role}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Debre Berhan University. Administrative Use Only.</p>
              </div>
              <script>
                window.onload = function() { 
                  window.print(); 
                  setTimeout(() => { window.close(); }, 500);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        setShowPrintModal(false);
    };

    const handlePrintSelected = () => {
        if (selectedIds.length === 0) {
            setMessageType('error');
            setMessage('please select to print');
            return;
        }
        const selectedData = users.filter(s => selectedIds.includes(s._id));
        openPrintModal(selectedData, 'Selected Records');
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredStaff.length && filteredStaff.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredStaff.map(s => s._id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredStaff = users.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.username.toLowerCase().includes(search.toLowerCase())
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
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Staff Management</h1>
                    <p className="text-slate-500 text-sm">Manage staff accounts, assign roles, and control access permissions within the internship management system.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-dbu-primary text-white p-2.5 rounded-xl font-bold flex items-center shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all"
                        title="Add Staff"
                    >
                        <UserPlus className="w-5 h-5 mr-1.5" />
                        Add Staff
                    </button>

                    <button
                        onClick={() => openPrintModal(users, 'All Staff')}
                        className="bg-dbu-primary text-white px-4 py-2.5 rounded-xl font-bold flex items-center shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all text-xs"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl font-bold text-sm transition-opacity duration-300 whitespace-pre-line ${messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search staff..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-dbu-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-dbu-primary focus:ring-dbu-primary cursor-pointer"
                                            checked={selectedIds.length > 0 && selectedIds.length === filteredStaff.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-4">Staff (Full Name)</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Username</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-4 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-slate-400 italic">No staff members found.</td>
                                    </tr>
                                ) : (filteredStaff.map((staff) => (
                                    <tr key={staff._id} className={`${selectedIds.includes(staff._id) ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'} transition-colors ${staff.isActive === false ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-dbu-primary focus:ring-dbu-primary cursor-pointer"
                                                checked={selectedIds.includes(staff._id)}
                                                onChange={() => toggleSelect(staff._id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{staff.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{staff.department?.code || 'Central'}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-slate-600">{staff.username}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded ${staff.role === 'dean' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {staff.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {staff.activationStatus === 'Activated' ? (
                                                    <span className="bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded inline-flex items-center">
                                                        Activation: Activated
                                                    </span>
                                                ) : (
                                                    <span className="bg-orange-50 text-orange-500 text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded inline-flex items-center">
                                                        Activation: Pending
                                                    </span>
                                                )}
                                                {staff.isActive === false ? (
                                                    <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded mt-1 border border-red-100">Account: Inactive</span>
                                                ) : (
                                                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded mt-1 border border-blue-100">Account: Active</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleEditStaff(staff)}
                                                    className="p-2 text-slate-400 hover:text-dbu-primary hover:bg-dbu-primary/5 rounded-lg transition-all"
                                                    title="Edit Staff Member"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(staff.userId)}
                                                    className={`p-2 rounded-lg transition-all ${staff.isActive !== false ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-red-500 hover:text-green-500 hover:bg-green-50'}`}
                                                    title={staff.isActive !== false ? 'Deactivate User' : 'Activate User'}
                                                >
                                                    {staff.isActive !== false ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
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

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <Upload className="w-5 h-5 mr-3 text-dbu-primary" />
                            Upload Staff (CSV/Excel)
                        </h3>
                        <form onSubmit={handleBulkUpload} className="space-y-4">
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                className="w-full text-sm file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-dbu-primary file:text-white hover:file:bg-dbu-accent"
                            />
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full bg-dbu-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all flex items-center justify-center"
                            >
                                {actionLoading ? <Activity className="w-5 h-5 animate-spin" /> : 'Upload Staff'}
                            </button>
                        </form>
                        <p className="text-[11px] text-slate-500 mt-3">
                            Required columns: Full Name, Department, Role (Advisor, Dean)
                        </p>
                        {uploadSummary && (
                            <div className="mt-4 text-xs bg-slate-50 border border-slate-100 rounded-xl p-3">
                                <p className="font-bold text-slate-700">Created: {uploadSummary.createdCount || 0}</p>
                                <p className="font-bold text-slate-700">Failed: {uploadSummary.failedCount || 0}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Manual Add Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-dbu-primary p-6 text-white">
                            <h3 className="text-xl font-black flex items-center">
                                <UserPlus className="w-6 h-6 mr-3" />
                                Register New Staff
                            </h3>
                            <p className="text-white/70 text-sm mt-1">Manual account creation for staff.</p>
                        </div>

                        <form onSubmit={handleCreateStaff} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter staff's full name"
                                        value={staffData.name}
                                        onChange={e => { setStaffData({ ...staffData, name: e.target.value }); setErrors({ ...errors, name: null }); }}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all ${errors.name ? 'border-red-500' : 'border-slate-200'}`}
                                    />
                                    {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.name}</p>}
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Department</label>
                                    <select
                                        value={staffData.department}
                                        onChange={e => { setStaffData({ ...staffData, department: e.target.value }); setErrors({ ...errors, department: null }); }}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all ${errors.department ? 'border-red-500' : 'border-slate-200'}`}
                                    >
                                        <option value="" disabled>Select Department</option>
                                        {departments.length > 0 ? (
                                            [...departments]
                                                .filter(d => d.status === 'Active')
                                                .sort((a, b) => a.name.localeCompare(b.name))
                                                .map(dept => <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>)
                                        ) : null}
                                    </select>
                                    {errors.department && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.department}</p>}
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Role</label>
                                    <select
                                        value={staffData.role}
                                        onChange={e => { setStaffData({ ...staffData, role: e.target.value }); setErrors({ ...errors, role: null }); }}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all ${errors.role ? 'border-red-500' : 'border-slate-200'}`}
                                    >
                                        <option value="" disabled>Select role</option>
                                        <option value="Advisor">Advisor</option>
                                        <option value="Dean">Department Dean</option>
                                    </select>
                                    {errors.role && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.role}</p>}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-[2] bg-dbu-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all flex items-center justify-center text-sm"
                                >
                                    {actionLoading ? <Activity className="w-5 h-5 animate-spin" /> : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Edit Staff Modal */}
            {showEditForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-dbu-primary p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black flex items-center">
                                    <Edit className="w-6 h-6 mr-3" />
                                    Edit Staff Profile
                                </h3>
                                <p className="text-white/70 text-sm mt-1">Updating details for {editingStaff?.username}</p>
                            </div>
                            <button onClick={() => setShowEditForm(false)} className="hover:bg-white/10 p-2 rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateStaff} className="p-8 space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={e => setEditData({ ...editData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Role</label>
                                        <select
                                            value={editData.role}
                                            onChange={e => setEditData({ ...editData, role: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                                            required
                                        >
                                            <option value="advisor">University Advisor</option>
                                            <option value="department_dean">Department Dean</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Department</label>
                                        <select
                                            value={editData.department}
                                            onChange={e => setEditData({ ...editData, department: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                                            required
                                        >
                                            {departments.map((dept) => (
                                                <option key={dept._id} value={dept._id}>
                                                    {dept.code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                                    <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                                        Note: Username is immutable for security and tracking records. To deactivate this staff member, use the shield icon in the list.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditForm(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-[2] bg-dbu-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all flex items-center justify-center text-sm"
                                >
                                    {actionLoading ? <Activity className="w-5 h-5 animate-spin" /> : 'Update Staff Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {statusModal.open && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-black text-slate-800">Confirm Status Change</h3>
                        <p className="text-sm text-slate-600 mt-2">Are you sure you want to change this user status?</p>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                                onClick={() => setStatusModal({ open: false, userId: null })}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-xl bg-dbu-primary text-white font-bold hover:bg-dbu-accent disabled:opacity-60"
                                onClick={confirmToggleStatus}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print / Export Modal */}
            {showPrintModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-800 p-6 text-white flex items-center justify-between">
                            <h3 className="text-lg font-black flex items-center gap-2">
                                <Printer className="w-5 h-5" /> Export Staff Data
                            </h3>
                            <button onClick={() => setShowPrintModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400">Records Ready: <span className="text-slate-800">{printModalData.length}</span></p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">Set: <span className="text-slate-800">{printModalTitle}</span></p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => printRecords(printModalData, printModalTitle)}
                                    className="w-full py-4 bg-dbu-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-dbu-primary/20 hover:bg-dbu-accent transition-all flex items-center justify-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    Generate Document
                                </button>
                                <button
                                    onClick={handleExportStaffCSV}
                                    className="w-full py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Export Spreadsheet
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStaff;
