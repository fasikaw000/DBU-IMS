import { useState, useEffect } from 'react';
import api from '../utils/api';
import { UserPlus, Shield, Activity, FileText, Database, Building } from 'lucide-react';

const AdminDashboard = () => {
    const [userData, setUserData] = useState({ name: '', email: '', role: 'student', studentId: '', department: '', cbeAccount: '' });
    const [deptData, setDeptData] = useState({ name: '', code: '', description: '' });
    const [departments, setDepartments] = useState([]);
    
    const [idSeed, setIdSeed] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await api.get('/admin/departments');
                setDepartments(res.data.data);
                if (res.data.data.length > 0) {
                    setUserData(prev => ({ ...prev, department: res.data.data[0]._id }));
                }
            } catch (err) {
                console.error("Failed to load departments", err);
            }
        };
        fetchDepartments();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const endpoint = userData.role === 'student' ? '/admin/student' : '/admin/staff';
            const payload = { ...userData };
            
            await api.post(endpoint, payload);
            setMessage(`Success: ${userData.role} account provisioned. Username generated.`);
            setUserData({ ...userData, name: '', email: '', studentId: '', cbeAccount: '' });
        } catch (err) {
            setMessage(`Failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDept = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const res = await api.post('/admin/departments', deptData);
            setDepartments([...departments, res.data.data]);
            setMessage(`Success: Department ${deptData.name} created.`);
            setDeptData({ name: '', code: '', description: '' });
            if (!userData.department) {
                setUserData(prev => ({ ...prev, department: res.data.data._id }));
            }
        } catch (err) {
            setMessage(`Failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSeedIds = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const studentIds = idSeed.split(',').map(id => id.trim()).filter(id => id);
            if (studentIds.length === 0) return;
            await api.post('/admin/seed-ids', { studentIds });
            setMessage('Success: Student IDs seeded.');
            setIdSeed('');
        } catch (err) {
            setMessage(`Failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 px-4 py-6 max-w-7xl mx-auto">
            <div className="bg-dbu-dark rounded-xl shadow-lg p-8 text-white flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">College Administrative Console</h2>
                    <p className="text-slate-300 max-w-xl">
                        Monitor university-wide metrics, oversee computing department performances, and securely provision staff and student access.
                    </p>
                </div>
                <Shield className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-5" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Lifecycle Management */}
                <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
                    <h3 className="text-xl font-bold border-b border-slate-100 pb-4 mb-6 flex items-center text-slate-800">
                        <UserPlus className="w-6 h-6 mr-3 text-dbu-primary" />
                        Provision New Access
                    </h3>
                    
                    <form onSubmit={handleCreateUser} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                                <input type="text" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-dbu-primary outline-none transition-all" required placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">System Role</label>
                                <select value={userData.role} onChange={e => setUserData({...userData, role: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-dbu-primary outline-none transition-all">
                                    <option value="student">Student</option>
                                    <option value="advisor">Advisor</option>
                                    <option value="department_dean">Department Dean</option>
                                    <option value="college_admin">College Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Academic Email</label>
                                <input type="email" value={userData.email} onChange={e => setUserData({...userData, email: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-dbu-primary outline-none transition-all" placeholder="name@dbu.edu.et (Optional)" />
                            </div>
                            <div>
                                {userData.role === 'student' && (
                                    <>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student ID</label>
                                        <input type="text" value={userData.studentId} onChange={e => setUserData({...userData, studentId: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-dbu-primary outline-none transition-all" required placeholder="DBU1234567" />
                                    </>
                                )}
                            </div>
                        </div>

                        {userData.role === 'student' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CBE Account Number</label>
                                <input type="text" value={userData.cbeAccount} onChange={e => setUserData({...userData, cbeAccount: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-dbu-primary outline-none transition-all" required placeholder="1000..." />
                            </div>
                        )}

                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                            <select value={userData.department} onChange={e => setUserData({...userData, department: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-dbu-primary outline-none" required>
                                {departments.map(dept => (
                                    <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-dbu-primary text-white py-3 rounded-lg shadow-lg hover:bg-dbu-accent transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 font-bold tracking-wide">
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <Activity className="animate-spin h-5 w-5 mr-2" /> Creating Account...
                                </span>
                            ) : `Provision ${userData.role} Access`}
                        </button>
                    </form>
                </div>

                {/* Create Department */}
                <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 flex flex-col">
                    <h3 className="text-xl font-bold border-b border-slate-100 pb-4 mb-6 flex items-center text-slate-800">
                        <Building className="w-6 h-6 mr-3 text-dbu-primary" />
                        Create Department
                    </h3>
                    <form onSubmit={handleCreateDept} className="space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department Name</label>
                                <input type="text" value={deptData.name} onChange={e => setDeptData({...deptData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-dbu-primary outline-none" required placeholder="Computer Science" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department Code</label>
                                <input type="text" value={deptData.code} onChange={e => setDeptData({...deptData, code: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-dbu-primary outline-none" required placeholder="CS" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-slate-700 text-white py-3 rounded-lg shadow hover:bg-slate-800 transition-all font-bold mt-4">
                            {loading ? 'Creating...' : 'Create Department'}
                        </button>
                    </form>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl shadow-lg border-2 animate-in fade-in zoom-in-95 ${message.includes('Success') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    <div className="flex items-center px-2">
                        <Activity className={`w-6 h-6 mr-3 ${message.includes('Success') ? 'text-green-500' : 'text-red-500'}`} />
                        <span className="font-bold text-lg">{message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminDashboard;
