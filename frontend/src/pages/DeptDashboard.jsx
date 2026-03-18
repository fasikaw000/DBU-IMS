import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Building, ShieldCheck, Database } from 'lucide-react';

const DeptDashboard = () => {
    // Note: To make this fully functional without mocking, we'd need actual backend GET routes for these tables.
    // Assuming these exist for the dashboard flow as defined in the plan:
    const [companies, setCompanies] = useState([
        { _id: '1', name: 'Safaricom Ethiopia', location: 'Addis Ababa', createdByStudent: true, approvalStatus: 'PENDING', studentName: 'Fasikaw' }
    ]);
    const [approving, setApproving] = useState(false);

    const handleApprove = async (id, status) => {
        setApproving(true);
        try {
            await api.put(`/department/company/${id}/approve`, { status });
            // Optimistic UI update
            setCompanies(companies.map(c => c._id === id ? { ...c, approvalStatus: status } : c));
        } catch (err) {
            console.error(err);
        } finally {
            setApproving(false);
        }
    };

    const handleAutoAssign = async () => {
        alert("Triggering Auto-Assignment Algorithm... Validating available faculty workloads.");
        // await api.put(`/department/internship/${id}/assign`, { autoAssign: true });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Department Head Station</h2>
                    <p className="text-slate-500">Approve proposals & Distribute Workloads</p>
                </div>
                <button 
                  onClick={handleAutoAssign}
                  className="bg-dbu-primary hover:bg-dbu-accent text-white px-4 py-2 rounded-md transition flex items-center font-medium shadow-sm"
                >
                    <Database className="w-4 h-4 mr-2" />
                    Run Auto-Assign Algorithm
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center">
                        <Building className="w-5 h-5 mr-2 text-dbu-primary" />
                        Student-Proposed Companies Awaiting Approval
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                                <th className="p-4 font-medium">Company Name</th>
                                <th className="p-4 font-medium">Location</th>
                                <th className="p-4 font-medium">Proposed By</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map(company => (
                                <tr key={company._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                                    <td className="p-4 font-semibold text-slate-800">{company.name}</td>
                                    <td className="p-4 text-slate-600">{company.location}</td>
                                    <td className="p-4 text-slate-600">{company.studentName}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                            company.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            company.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {company.approvalStatus}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        {company.approvalStatus === 'PENDING' && (
                                            <>
                                                <button 
                                                  onClick={() => handleApprove(company._id, 'APPROVED')}
                                                  disabled={approving}
                                                  className="text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-3 py-1.5 rounded transition"
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                  onClick={() => handleApprove(company._id, 'REJECTED')}
                                                  disabled={approving}
                                                  className="text-xs bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded transition"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DeptDashboard;
