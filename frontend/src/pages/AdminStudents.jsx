import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, Search, Activity, Key, Upload, Plus, Printer, Trash2, Mail, UserPlus, Edit, Shield, ShieldOff, X, CheckCircle, FileText, Download, XCircle, AlertCircle } from 'lucide-react';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [authorizedIds, setAuthorizedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [search, setSearch] = useState('');
  const [idSeed, setIdSeed] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusModal, setStatusModal] = useState({ open: false, userId: null });
  const [errors, setErrors] = useState({});

  // Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printFields, setPrintFields] = useState({
    fullName: true,
    studentId: true,
    username: true,
    department: true,
    year: true,
    cbeAccount: false,
    email: false,
    phone: false,
    internshipStatus: true,
    companyName: true
  });
  const [printData, setPrintData] = useState([]);

  // Registration Form State
  const [newStudent, setNewStudent] = useState({
    fullName: '',
    studentId: '',
    department: '',
    year: ''
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    fullName: '',
    department: '',
    year: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => {
      setMessage('');
      setMessageType('success');
    }, 4000);
    return () => clearTimeout(timeout);
  }, [message]);

  const fetchData = async () => {
    try {
      const [studentsRes, deptsRes, idsRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/departments'),
        api.get('/admin/authorized-ids')
      ]);
      setStudents(Array.isArray(studentsRes?.data) ? studentsRes.data : []);
      setDepartments(Array.isArray(deptsRes?.data) ? deptsRes.data : []);
      setAuthorizedIds(Array.isArray(idsRes?.data) ? idsRes.data : []);
    } catch (err) {
      console.error('Failed to load student management data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    let newErrors = {};
    if (!newStudent.fullName) newErrors.fullName = "Required";
    if (!newStudent.studentId) newErrors.studentId = "Required";
    if (!newStudent.department) newErrors.department = "Required";
    if (!newStudent.year) newErrors.year = "Required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMessageType('error');
      setMessage("Please fill out all required fields");
      return;
    }

    setActionLoading(true);
    setMessage('');
    try {
      await api.post('/admin/student', newStudent);
      setMessageType('success');
      setMessage(`Success: Student ${newStudent.fullName} registered.`);
      setShowAddModal(false);
      setNewStudent({ fullName: '', studentId: '', department: '', year: '' });
      await fetchData();
    } catch (err) {
      setMessageType('error');
      setMessage(`Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditForm({
      fullName: student.fullName || student.name,
      department: student.department?._id || student.department,
      year: student.year
    });
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage('');
    try {
      await api.put(`/admin/students/${editingStudent._id}`, editForm);
      setMessageType('success');
      setMessage(`Success: Student ${editForm.fullName} updated.`);
      setShowEditModal(false);
      await fetchData();
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
      await fetchData();
      setMessageType('success');
      setMessage('Success: User status updated.');
    } catch (err) {
      setMessageType('error');
      setMessage(`Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
      setStatusModal({ open: false, userId: null });
    }
  };

  const printRecords = () => {
    const data = printData;
    if (!data || data.length === 0) return;

    const activeFields = Object.keys(printFields).filter(f => printFields[f]);
    const fieldLabels = {
      fullName: 'Full Name',
      studentId: 'Student ID',
      username: 'Username',
      department: 'Department',
      year: 'Year',
      cbeAccount: 'CBE Account',
      email: 'Email',
      phone: 'Phone',
      internshipStatus: 'Internship Status',
      companyName: 'Company'
    };

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Records - DBU IMS</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { font-weight: 900; font-size: 24px; color: #1e3a5f; margin: 0; text-transform: uppercase; }
            h2 { font-weight: 700; font-size: 16px; color: #64748b; margin: 5px 0 0 0; }
            .meta { margin-top: 10px; font-size: 10px; font-weight: bold; color: #94a3b8; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 10px; }
            th { background-color: #f8fafc; font-weight: 900; text-transform: uppercase; color: #475569; }
            .mono { font-family: monospace; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Debre Berhan University</h1>
            <h2>Internship Management System</h2>
            <h2>Student Record Export</h2>
            <div class="meta">Exported on: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                ${activeFields.map(f => `<th>${fieldLabels[f]}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(s => `
                <tr>
                  ${activeFields.map(f => {
      let val = '';
      if (f === 'department') val = s.department?.name || s.department?.code || 'N/A';
      else if (f === 'cbeAccount') val = s.studentProfile?.cbeAccount || s.cbeAccount || 'N/A';
      else if (f === 'phone') val = s.phone || 'N/A';
      else val = s[f] || 'N/A';

      const isMono = ['studentId', 'username', 'cbeAccount', 'phone'].includes(f);
      return `<td class="${isMono ? 'mono' : ''}">${val}</td>`;
    }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Debre Berhan University. Administrative Document.</p>
          </div>
          <script>window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setShowPrintModal(false);
  };

  const handleExportCSV = () => {
    const data = printData;
    if (!data || data.length === 0) return;
    const activeFields = Object.keys(printFields).filter(f => printFields[f]);
    const fieldLabels = {
      fullName: 'Full Name',
      studentId: 'Student ID',
      username: 'Username',
      department: 'Department',
      year: 'Year',
      cbeAccount: 'CBE Account',
      email: 'Email',
      phone: 'Phone',
      internshipStatus: 'Internship Status',
      companyName: 'Company'
    };
    const headers = activeFields.map(f => fieldLabels[f]).join(',');
    const rows = data.map(s => {
      return activeFields.map(f => {
        let val = '';
        if (f === 'department') val = s.department?.name || s.department?.code || '';
        else if (f === 'cbeAccount') val = s.studentProfile?.cbeAccount || s.cbeAccount || '';
        else if (f === 'phone') val = s.phone || 'N/A';
        else val = s[f] || '';
        return `"${val}"`;
      }).join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + headers + '\n' + rows.join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Student_Records_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowPrintModal(false);
  };

  const handleOpenPrintModal = (type) => {
    let data = [];
    if (type === 'all') data = students;
    else if (type === 'filtered') data = filteredStudents;
    else if (type === 'selected') data = students.filter(s => selectedIds.includes(s._id));

    if (data.length === 0) {
      setMessageType('error');
      setMessage('please select to print');
      return;
    }

    // Pre-fill fields based on type
    if (type === 'all') {
      const allTrue = Object.keys(printFields).reduce((acc, key) => ({ ...acc, [key]: true }), {});
      setPrintFields(allTrue);
    } else {
      const defaultFields = Object.keys(printFields).reduce((acc, key) => ({
        ...acc,
        [key]: !['cbeAccount', 'email', 'phone'].includes(key)
      }), {});
      setPrintFields(defaultFields);
    }

    setPrintData(data);
    setShowPrintModal(true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) setSelectedIds([]);
    else setSelectedIds(filteredStudents.map(s => s._id));
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage('');
    try {
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
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await api.post('/admin/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessageType('success');
      setMessage(res.data?.message || 'Upload completed successfully');
      setUploadSummary(res.data);
      setUploadFile(null);
      await fetchData();
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

  const filteredStudents = students.filter((student) =>
    (student.fullName || student.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (student.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (student.studentId || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Student Management</h1>
          <p className="text-slate-500 text-sm">Manage student records, credentials, and account statuses.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-dbu-primary text-white p-2.5 rounded-xl font-bold flex items-center shadow-lg hover:bg-dbu-accent transition-all"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add Student
          </button>

          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => handleOpenPrintModal('all')}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-tight text-slate-600 hover:bg-slate-50 transition-all border-r border-slate-100"
            >
              Print All
            </button>
            <button
              onClick={() => handleOpenPrintModal('filtered')}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-tight text-dbu-primary hover:bg-slate-50 transition-all border-r border-slate-100"
            >
              Print Filtered
            </button>
            <button
              onClick={() => handleOpenPrintModal('selected')}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-tight text-orange-600 hover:bg-slate-50 transition-all"
            >
              Print Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-bold text-sm border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${messageType === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          <div className="flex items-center gap-3">
            {messageType === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <p className="whitespace-pre-line">{message}</p>
          </div>
          <button 
            onClick={() => setMessage('')}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors shrink-0"
          >
            <XCircle size={18} className="opacity-50 hover:opacity-100" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 bg-slate-50/30">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
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
                      checked={selectedIds.length > 0 && selectedIds.length === filteredStudents.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4 text-center">Year</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">CBE Account</th>
                  <th className="px-6 py-4">Internship</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className={`${selectedIds.includes(student._id) ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'} transition-colors ${student.isActive === false ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-dbu-primary focus:ring-dbu-primary cursor-pointer"
                        checked={selectedIds.includes(student._id)}
                        onChange={() => toggleSelect(student._id)}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800 whitespace-nowrap">{student.name}</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{student.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600">{student.studentId}</td>
                    <td className="px-6 py-4 text-[10px] font-mono text-slate-500">{student.username}</td>
                    <td className="px-6 py-4 text-[10px] font-black text-slate-600">{student.department?.code || student.department?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-center text-[10px] font-bold text-slate-500">{student.year || 'N/A'}</td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-600">{student.phone || 'N/A'}</td>
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-dbu-primary bg-slate-50/50 px-2 py-1 rounded">
                      {student.studentProfile?.cbeAccount || student.cbeAccount || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full w-fit ${student.internshipStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                          student.internshipStatus === 'NOT_APPLIED' ? 'bg-slate-50 text-slate-400' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                          {student.internshipStatus.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600 mt-1 truncate max-w-[100px]">{student.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {student.isActivated ? (
                          <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase px-2 py-1 rounded-full border border-emerald-100 whitespace-nowrap">Activated</span>
                        ) : (
                          <span className="bg-amber-50 text-amber-600 text-[8px] font-black uppercase px-2 py-1 rounded-full border border-amber-100 whitespace-nowrap">Pending</span>
                        )}
                        {student.isActive === false ? (
                          <span className="bg-red-50 text-red-600 text-[8px] font-black uppercase px-2 py-1 rounded-full border border-red-100">Inactive</span>
                        ) : (
                          <span className="bg-blue-50 text-blue-600 text-[8px] font-black uppercase px-2 py-1 rounded-full border border-blue-100">Active</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditStudent(student)}
                          className="p-2 text-slate-400 hover:text-dbu-primary hover:bg-dbu-primary/10 rounded-lg transition-all cursor-pointer hover:scale-110"
                          title="Edit Student"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(student.userId)}
                          className={`p-2 rounded-lg transition-all cursor-pointer hover:scale-110 ${student.isActive !== false ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-red-500 hover:text-green-500 hover:bg-green-50'}`}
                          title={student.isActive !== false ? 'Deactivate User' : 'Activate User'}
                        >
                          {student.isActive !== false ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-3 text-dbu-primary" />
              Upload Students (CSV/Excel)
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
                {actionLoading ? 'Uploading...' : 'Upload Students'}
              </button>
            </form>
            <p className="text-[11px] text-slate-500 mt-3">
              Required columns: Full Name, Student ID, Department, Year
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

      {/* Print Settings Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-dbu-primary" />
                Print Credentials
              </h3>
              <button onClick={() => setShowPrintModal(false)} className="p-2 hover:bg-slate-200 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select fields to include in print:</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(printFields).map(field => (
                  <label key={field} className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${printFields[field] ? 'bg-dbu-primary/5 border-dbu-primary' : 'border-slate-100 hover:border-slate-200'}`}>
                    <input
                      type="checkbox"
                      checked={printFields[field]}
                      onChange={(e) => setPrintFields({ ...printFields, [field]: e.target.checked })}
                      className="w-4 h-4 rounded text-dbu-primary focus:ring-dbu-primary"
                    />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600">
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400">Total Records to Print: <span className="text-slate-800">{printData.length}</span></p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={printRecords}
                  className="w-full py-4 bg-dbu-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-dbu-primary/20 hover:bg-dbu-accent transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate Document
                </button>
                <button
                  onClick={handleExportCSV}
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

      {/* Other Modals... (Add/Edit shortened for brevity in this tool call, but I will ensure they are preserved or updated if needed) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-dbu-primary p-6 text-white"><h3 className="text-xl font-black">Add New Student</h3></div>
            <form onSubmit={handleRegisterStudent} className="p-8 space-y-4">
              <div className="space-y-1">
                <input type="text" placeholder="Full Name" value={newStudent.fullName} onChange={e => { setNewStudent({ ...newStudent, fullName: e.target.value }); setErrors({ ...errors, fullName: null }); }} className={`w-full p-3 border rounded-xl ${errors.fullName ? 'border-red-500' : ''}`} />
                {errors.fullName && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.fullName}</p>}
              </div>
              <div className="space-y-1">
                <input type="text" placeholder="Student ID" value={newStudent.studentId} onChange={e => { setNewStudent({ ...newStudent, studentId: e.target.value }); setErrors({ ...errors, studentId: null }); }} className={`w-full p-3 border rounded-xl ${errors.studentId ? 'border-red-500' : ''}`} />
                {errors.studentId && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.studentId}</p>}
              </div>
              <div className="space-y-1">
                <select value={newStudent.department} onChange={e => { setNewStudent({ ...newStudent, department: e.target.value }); setErrors({ ...errors, department: null }); }} className={`w-full p-3 border rounded-xl ${errors.department ? 'border-red-500' : ''}`}>
                  <option value="">Select Dept</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                {errors.department && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.department}</p>}
              </div>
              <div className="space-y-1">
                <input type="text" placeholder="Year" value={newStudent.year} onChange={e => { setNewStudent({ ...newStudent, year: e.target.value }); setErrors({ ...errors, year: null }); }} className={`w-full p-3 border rounded-xl ${errors.year ? 'border-red-500' : ''}`} />
                {errors.year && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.year}</p>}
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 p-3 border rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={actionLoading} className="flex-[2] p-3 bg-dbu-primary text-white rounded-xl font-bold">
                  {actionLoading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-dbu-primary p-6 text-white"><h3 className="text-xl font-black">Edit Student</h3></div>
            <form onSubmit={handleUpdateStudent} className="p-8 space-y-4">
              <input type="text" value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} className="w-full p-3 border rounded-xl" required />
              <select value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} className="w-full p-3 border rounded-xl" required>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              <input type="text" value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })} className="w-full p-3 border rounded-xl" required />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 p-3 border rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-[2] p-3 bg-dbu-primary text-white rounded-xl font-bold">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusModal.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            <h3 className="text-lg font-black text-slate-800 mb-2">Change User Status?</h3>
            <p className="text-sm text-slate-500 mb-6">This will enable/disable account access.</p>
            <div className="flex gap-3">
              <button onClick={() => setStatusModal({ open: false, userId: null })} className="flex-1 py-3 border rounded-xl font-bold">No</button>
              <button onClick={confirmToggleStatus} className="flex-1 py-3 bg-dbu-primary text-white rounded-xl font-bold">Yes, Change</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
