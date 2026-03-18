import { useState, useEffect } from 'react';
import api from '../utils/api';
import { UserPlus, Shield, Activity, FileText } from 'lucide-react';

const AdminDashboard = () => {
    const [staffData, setStaffData] = useState({ userId: '', email: '', password: '', name: '', role: 'ADVISOR' });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Staff Provisioning Submission
    const handleProvision = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await api.post('/admin/provision', staffData);
            setMessage(`Success: ${staffData.role} account created.`);
            setStaffData({ userId: '', email: '', password: '', name: '', role: 'ADVISOR' });
        } catch (err) {
            setMessage(`Failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-dbu-dark rounded-lg shadow-sm p-8 text-white flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">College Administrative Console</h2>
                    <p className="text-slate-300 max-w-xl">
                        Monitor university-wide metrics, oversee computing department performances, and securely provision staff login credentials.
                    </p>
                </div>
                <Shield className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric Cards */}
                <div className="bg-white rounded-lg border border-slate-200 p-6 flex items-center">
                    <div className="bg-blue-100 text-blue-600 p-4 rounded-full mr-4">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">System Health</p>
                        <h4 className="text-xl font-bold text-slate-800">Operational</h4>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-6 flex items-center">
                    <div className="bg-green-100 text-green-600 p-4 rounded-full mr-4">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Late Reports Auto-Flagged</p>
                        <h4 className="text-xl font-bold text-slate-800">14</h4>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 max-w-2xl">
                <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-dbu-primary" />
                    Provision New Staff Account
                </h3>
                
                {message && (
                    <div className={`p-4 mb-4 rounded text-sm ${message.includes('Success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleProvision} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input type="text" value={staffData.name} onChange={e => setStaffData({...staffData, name: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Staff ID (userId)</label>
                            <input type="text" value={staffData.userId} onChange={e => setStaffData({...staffData, userId: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <input type="email" value={staffData.email} onChange={e => setStaffData({...staffData, email: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                            <input type="password" value={staffData.password} onChange={e => setStaffData({...staffData, password: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required minLength="6" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Assign System Role</label>
                            <select value={staffData.role} onChange={e => setStaffData({...staffData, role: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none bg-white">
                                <option value="ADVISOR">Faculty Advisor</option>
                                <option value="DEPARTMENT_HEAD">Department Head</option>
                                <option value="COLLEGE_DEAN">College Dean (Admin)</option>
                            </select>
                        </div>
                    </div>
                    
                    <button type="submit" disabled={loading} className="mt-4 bg-slate-800 text-white px-6 py-2 rounded shadow hover:bg-slate-900 transition disabled:opacity-50 font-medium">
                        {loading ? 'Provisioning...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminDashboard;
