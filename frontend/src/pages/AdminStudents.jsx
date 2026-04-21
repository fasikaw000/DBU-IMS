import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, Search, Activity, Key, Upload, Plus, Printer, Trash2, Mail, UserPlus, Edit, Shield, ShieldOff, X } from 'lucide-react';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [authorizedIds, setAuthorizedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [idSeed, setIdSeed] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Registration Form State
  const [newStudent, setNewStudent] = useState({
    name: '',
    studentId: '',
    department: '',
    year: '',
    role: ''
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    department: '',
    year: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

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
    setActionLoading(true);
    setMessage('');
    try {
      await api.post('/admin/student', newStudent);
      setMessage(`Success: Student ${newStudent.name} registered.`);
      setShowAddModal(false);
      setNewStudent({
        name: '',
        studentId: '',
        department: '',
        year: '',
        role: ''
      });
      await fetchData();
    } catch (err) {
      setMessage(`Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name,
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
      setMessage(`Success: Student ${editForm.name} updated.`);
      setShowEditModal(false);
      await fetchData();
    } catch (err) {
      setMessage(`Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    if (!window.confirm('Are you sure you want to change this user status?')) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${userId}/status`);
      await fetchData();
      setMessage('Success: User status updated.');
    } catch (err) {
      setMessage(`Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const printRecords = (data, titleSuffix) => {
    if (!data || data.length === 0) {
      setMessage('Failed: No data available to print.');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Credentials - DBU IMS</title>
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
            <h2>Student System Credentials (${titleSuffix})</h2>
            <div class="meta">Generated on: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Student ID</th>
                <th>Username</th>
                <th>Department</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(s => `
                <tr>
                  <td style="font-weight: bold;">${s.name}</td>
                  <td class="mono">${s.studentId}</td>
                  <td class="mono">${s.username}</td>
                  <td>${s.department?.name || s.department?.code || 'N/A'}</td>
                  <td>${s.year}</td>
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
  };

  const handlePrintSelected = () => {
    if (selectedIds.length === 0) {
      setMessage('Failed: Please select at least one record to print.');
      return;
    }
    const selectedData = students.filter(s => selectedIds.includes(s._id));
    printRecords(selectedData, 'Selected Records');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSeedIds = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage('');
    try {
      const studentIds = idSeed
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id);
      if (studentIds.length === 0) {
        setMessage('Failed: Please enter at least one student ID.');
        return;
      }
      await api.post('/admin/seed-ids', { studentIds });
      setMessage('Success: Student IDs authorized.');
      setIdSeed('');
      await fetchData();
    } catch (err) {
      setMessage(`Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage('');
    setUploadSummary(null);
    try {
      if (!uploadFile) {
        setMessage('Failed: Please choose a CSV or Excel file first.');
        return;
      }

      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await api.post('/admin/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage(`Success: ${res?.message || 'Students uploaded.'}`);
      setUploadSummary(res?.data || null);
      setUploadFile(null);
      await fetchData();
    } catch (err) {
      setMessage(`Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    (student.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (student.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (student.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (student.studentId || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dbu-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Student Management</h1>
          <p className="text-slate-500 text-sm">
            Register students, manage records, and generate printable credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-dbu-primary text-white p-2.5 rounded-xl font-bold flex items-center shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all animate-in fade-in slide-in-from-right-4 duration-500"
            title="Add Student"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add Student
          </button>
          
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <button
                onClick={() => printRecords(students, 'All Records')}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-tight text-slate-600 hover:bg-slate-50 transition-all border-r border-slate-100"
            >
                Print All
            </button>
            <button
                onClick={() => printRecords(filteredStudents, 'Filtered View')}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-tight text-dbu-primary hover:bg-slate-50 transition-all border-r border-slate-100"
            >
                Print Filtered
            </button>
            <button
                onClick={handlePrintSelected}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-tight text-orange-600 hover:bg-slate-50 transition-all"
            >
                Print Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-bold text-sm ${message.startsWith('Success') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {message}
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
              <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-500">
                <tr>
                <tr>
                  <th className="px-4 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-dbu-primary focus:ring-dbu-primary cursor-pointer"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredStudents.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4">Student (Full Name)</th>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Year</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400 italic">No students found.</td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student._id} className={`${selectedIds.includes(student._id) ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'} transition-colors ${student.status === 'deactivated' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                      <td className="px-4 py-4">
                         <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-dbu-primary focus:ring-dbu-primary cursor-pointer"
                          checked={selectedIds.includes(student._id)}
                          onChange={() => toggleSelect(student._id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{student.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono italic">UID: {student._id.slice(-6)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-mono text-slate-100 bg-dbu-primary px-1.5 py-0.5 rounded">{student.studentId}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{student.username}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{student.department?.code || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-bold">{student.year}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {student.isActivated ? (
                            <span className="bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded">Activated</span>
                          ) : (
                            <span className="bg-orange-50 text-orange-500 text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded">Pending</span>
                          )}
                          {student.status === 'deactivated' && (
                            <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded mt-1 border border-red-100">Deactivated</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleEditStudent(student)}
                            className="p-2 text-slate-400 hover:text-dbu-primary hover:bg-dbu-primary/5 rounded-lg transition-all"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(student.userId)}
                            className={`p-2 rounded-lg transition-all ${student.status === 'active' ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-red-500 hover:text-green-500 hover:bg-green-50'}`}
                            title={student.status === 'active' ? 'Deactivate User' : 'Activate User'}
                          >
                            {student.status === 'active' ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
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
                {actionLoading ? <Activity className="w-5 h-5 animate-spin" /> : 'Upload Students'}
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

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-dbu-primary p-6 text-white">
              <h3 className="text-xl font-black flex items-center">
                <UserPlus className="w-6 h-6 mr-3" />
                Register New Student
              </h3>
              <p className="text-white/70 text-sm mt-1">Manual account creation for students.</p>
            </div>
            
            <form onSubmit={handleRegisterStudent} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                    required
                    placeholder="Enter student's full name"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Student ID</label>
                  <input
                    type="text"
                    value={newStudent.studentId}
                    onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                    required
                    placeholder="DBU......."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Study Year</label>
                  <select
                    value={newStudent.year}
                    onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Department</label>
                  <select
                    value={newStudent.department}
                    onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                    required
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.length > 0 ? (
                      [...departments]
                        .filter(d => d.status === 'Active')
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((dept) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))
                    ) : (
                      <>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Information Systems">Information Systems</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Software Engineering">Software Engineering</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Role</label>
                  <select
                    value={newStudent.role}
                    onChange={(e) => setNewStudent({ ...newStudent, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                    required
                  >
                    <option value="" disabled>Select role</option>
                    <option value="Admin">Admin</option>
                    <option value="Advisor">Advisor</option>
                    <option value="Dean">Dean</option>
                    <option value="Student">Student</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
      {/* Edit Student Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-max-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-dbu-primary p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black flex items-center">
                  <Edit className="w-6 h-6 mr-3" />
                  Edit Student Profile
                </h3>
                <p className="text-white/70 text-sm mt-1">Updating details for {editingStudent?.studentId}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="hover:bg-white/10 p-2 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStudent} className="p-8 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Study Year</label>
                    <select
                      value={editForm.year}
                      onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-dbu-primary transition-all"
                      required
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Department</label>
                    <select
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
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
                    Note: Username and Student ID are immutable for security and tracking records. To deactivate this student, use the shield icon in the list.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-[2] bg-dbu-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all flex items-center justify-center text-sm"
                >
                  {actionLoading ? <Activity className="w-5 h-5 animate-spin" /> : 'Update Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
