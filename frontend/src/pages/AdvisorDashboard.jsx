import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, FileText, CheckCircle, XCircle } from 'lucide-react';

const AdvisorDashboard = () => {
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/advisor/students?limit=10&page=1');
      setStudentsData(res.data.internships); // The backend array holding populated students
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading assigned students...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Advisor Dashboard</h2>
            <p className="text-slate-500">Monitor and Grade your Assigned Students</p>
         </div>
      </div>

      {/* Primary students table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="w-5 h-5 mr-2 text-dbu-primary" />
            Assigned Workload
          </h3>
          <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Total: {studentsData.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-medium">Student Name</th>
                <th className="p-4 font-medium">Company</th>
                <th className="p-4 font-medium">Field</th>
                <th className="p-4 font-medium">Lifecycle Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {studentsData.length === 0 ? (
                 <tr><td colSpan="5" className="p-4 text-center text-slate-500">No students assigned yet.</td></tr>
              ) : (
                studentsData.map((internship) => (
                  <tr key={internship._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{internship.student.user.name}</p>
                      <p className="text-xs text-slate-500">{internship.student.studentId}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">
                      {internship.company?.name || 'N/A'}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <span className="bg-dbu-light text-dbu-primary px-2 py-1 rounded text-xs">
                        {internship.field}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        internship.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        internship.status === 'ONGOING' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {internship.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                       {/* Action buttons mapping to standard UI modules */}
                       <button className="text-xs bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded transition">
                         View Logbooks
                       </button>
                       <button className="text-xs bg-dbu-primary border border-dbu-primary text-white hover:bg-dbu-accent px-3 py-1.5 rounded transition">
                         Grade Reports
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

export default AdvisorDashboard;
