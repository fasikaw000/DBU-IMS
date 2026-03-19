import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Building, ShieldCheck, Database, UserCheck, AlertCircle } from 'lucide-react';

const DeptDashboard = () => {
    const [internships, setInternships] = useState([]);
    const [advisors, setAdvisors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [intRes, advRes] = await Promise.all([
                api.get('/internships/pending'),
                api.get('/admin/users?role=advisor')
            ]);
            setInternships(intRes.data.data);
            setAdvisors(advRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        setApproving(true);
        setMessage('');
        try {
            await api.put(`/internships/${id}/approve`);
            setMessage('Internship approved. Now assign an advisor.');
            fetchData();
        } catch (err) {
            setMessage(`Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setApproving(false);
        }
    };

    const handleAssignAdvisor = async (internshipId, advisorId) => {
        if (!advisorId) return;
        setMessage('');
        try {
            await api.put(`/internships/${internshipId}/assign-advisor`, { advisor_id: advisorId });
            setMessage('Advisor assigned successfully!');
            fetchData();
        } catch (err) {
            setMessage(`Error: ${err.response?.data?.message || err.message}`);
        }
    };

    if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dbu-primary"></div>
      </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 text-dbu-dark">Department Head Panel</h2>
                    <p className="text-slate-500">Review student applications and coordinate advisor workloads.</p>
                </div>
                <div className="flex gap-4">
                   <div className="bg-dbu-light/50 px-4 py-2 rounded-lg border border-dbu-primary/10">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</p>
                      <p className="text-xl font-black text-dbu-primary">{internships.length}</p>
                   </div>
                   <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Advisors</p>
                      <p className="text-xl font-black text-slate-700">{advisors.length}</p>
                   </div>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg border shadow-sm ${message.includes('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    <div className="flex items-center">
                       {message.includes('Error') ? <AlertCircle className="w-5 h-5 mr-3" /> : <ShieldCheck className="w-5 h-5 mr-3" />}
                       <span className="font-bold text-sm tracking-tight">{message}</span>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-bold flex items-center text-slate-800">
                        <Building className="w-5 h-5 mr-2 text-dbu-primary" />
                        Awaiting Placement Approval
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="p-4">Student Identity</th>
                                <th className="p-4">Placement Target</th>
                                <th className="p-4">Field</th>
                                <th className="p-4">Faculty Advisor</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {internships.length === 0 ? (
                              <tr><td colSpan="5" className="p-12 text-center text-slate-400 italic">No pending applications at this time.</td></tr>
                            ) : (
                              internships.map(intern => (
                                <tr key={intern._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800">{intern.student_id?.name || 'Unknown User'}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{intern.student_id?.studentId || 'NO_ID_RECORDED'}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm font-bold text-slate-700">{intern.company_name}</p>
                                        <p className="text-[10px] text-slate-400 capitalize">{intern.location}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-dbu-light text-dbu-primary px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest">{intern.field}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <UserCheck className="w-4 h-4 text-slate-300" />
                                            <select 
                                              className="text-xs border rounded-md p-1.5 outline-none focus:ring-2 focus:ring-dbu-primary bg-white font-medium text-slate-600 w-full max-w-[180px]"
                                              onChange={(e) => handleAssignAdvisor(intern._id, e.target.value)}
                                              defaultValue={intern.advisor_id || ""}
                                            >
                                              <option value="" disabled>Select Advisor</option>
                                              {advisors.map(adv => (
                                                <option key={adv._id} value={adv._id}>{adv.name}</option>
                                              ))}
                                            </select>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                          onClick={() => handleApprove(intern._id)}
                                          disabled={approving || intern.status === 'approved'}
                                          className={`text-[10px] font-black tracking-widest px-4 py-2 rounded-lg transition shadow-md ${
                                            intern.status === 'approved' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-dbu-primary text-white hover:bg-dbu-accent'
                                          }`}
                                        >
                                          {intern.status === 'approved' ? 'APPROVED' : 'APPROVE'}
                                        </button>
                                    </td>
                                </tr>
                              ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DeptDashboard;
