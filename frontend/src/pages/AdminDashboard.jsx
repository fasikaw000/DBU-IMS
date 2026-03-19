import { useState } from 'react';
import api from '../utils/api';
import { UserPlus, Shield, Activity, FileText, Database } from 'lucide-react';

const AdminDashboard = () => {
    const [staffData, setStaffData] = useState({ userId: '', email: '', password: '', name: '', role: 'advisor' });
    const [idSeed, setIdSeed] = useState('');
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
            setStaffData({ userId: '', email: '', password: '', name: '', role: 'advisor' });
        } catch (err) {
            setMessage(`Failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Seed IDs Submission
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
        <div className="space-y-6">
            <div className="bg-dbu-dark rounded-lg shadow-sm p-8 text-white flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">College Administrative Console</h2>
                    <p className="text-slate-300 max-w-xl">
                        Monitor university-wide metrics, oversee computing department performances, and securely provision staff and student access.
                    </p>
                </div>
                <Shield className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Staff Provisioning */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center">
                        <UserPlus className="w-5 h-5 mr-2 text-dbu-primary" />
                        Provision Staff Account
                    </h3>
                    
                    <form onSubmit={handleProvision} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input type="text" value={staffData.name} onChange={e => setStaffData({...staffData, name: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input type="email" value={staffData.email} onChange={e => setStaffData({...staffData, email: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Temp Password</label>
                                <input type="password" value={staffData.password} onChange={e => setStaffData({...staffData, password: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required minLength="6" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">System Role</label>
                            <select value={staffData.role} onChange={e => setStaffData({...staffData, role: e.target.value})} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none bg-white">
                                <option value="advisor">Faculty Advisor</option>
                                <option value="department_head">Department Head</option>
                                <option value="college_head">College Head</option>
                                <option value="admin">System Admin</option>
                            </select>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white py-2 rounded shadow hover:bg-slate-900 transition disabled:opacity-50 font-medium">
                            {loading ? 'Creating...' : 'Create Staff Account'}
                        </button>
                    </form>
                </div>

                {/* Student ID Seeding */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center">
                        <Database className="w-5 h-5 mr-2 text-dbu-primary" />
                        Seed Valid Student IDs
                    </h3>
                    <p className="text-sm text-slate-500 mb-4 text-sm font-semibold">
                        Enter comma-separated IDs to allow students to register.
                    </p>
                    <form onSubmit={handleSeedIds} className="space-y-4">
                        <div>
                            <textarea 
                                value={idSeed} 
                                onChange={e => setIdSeed(e.target.value)} 
                                placeholder="e.g. DBU1100223, DBU1100224, DBU1100225"
                                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none h-32" 
                                required
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white py-2 rounded shadow hover:bg-slate-900 transition disabled:opacity-50 font-medium">
                            {loading ? 'Seeding...' : 'Add Allowed IDs'}
                        </button>
                    </form>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg shadow-sm border ${message.includes('Success') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    <div className="flex items-center">
                        <Activity className="w-5 h-5 mr-2" />
                        <span className="font-medium text-lg">{message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
