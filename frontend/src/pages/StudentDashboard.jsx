import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { FileText, Clock, CheckCircle } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [internshipStatus, setInternshipStatus] = useState(null);
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // New logbook form state
  const [activity, setActivity] = useState('');
  const [hours, setHours] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Assuming a GET /api/student/internship endpoint exists backend-side, 
      // otherwise this logic would be expanded. Right now we rely on logbooks to show recent activity
      const logbooksRes = await api.get('/student/logbook?limit=5');
      setLogbooks(logbooksRes.data.logbooks);
      
      // Temporary stub for internship status until we build the specific GET endpoint
      setInternshipStatus('ONGOING'); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogbookSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      await api.post('/student/logbook', {
        activity,
        hoursWorked: Number(hours)
      });
      setMessage('Logbook entry submitted successfully!');
      setActivity('');
      setHours('');
      fetchDashboardData(); // Refresh list
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header Stat Area */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Welcome, {user?.name}</h2>
            <p className="text-slate-500">Student ID: {user?.userId}</p>
         </div>
         <div className="bg-dbu-light text-dbu-primary px-4 py-2 rounded-full border border-dbu-primary/20 flex items-center">
            {internshipStatus === 'ONGOING' ? <Clock className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            <span className="font-semibold tracking-wide text-sm">Status: {internshipStatus || 'NOT_APPLIED'}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Logbook Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Submit Daily Logbook</h3>
            
            {message && (
              <div className={`p-3 mb-4 text-sm rounded ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleLogbookSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hours Worked</label>
                <input 
                  type="number" 
                  min="0" max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Activity Description</label>
                <textarea 
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" 
                  rows="4" 
                  required 
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-dbu-primary text-white py-2 rounded hover:bg-dbu-accent transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Entry'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Recent Logbooks Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 h-full">
             <div className="flex items-center justify-between border-b pb-2 mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-dbu-primary" />
                    Recent Logbook Entries
                </h3>
             </div>

             {logbooks.length === 0 ? (
                <p className="text-slate-500 text-sm">No entries submitted yet.</p>
             ) : (
                <div className="space-y-4">
                  {logbooks.map(log => (
                    <div key={log._id} className="p-4 bg-slate-50 rounded border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded border">
                          {new Date(log.date).toLocaleDateString()}
                        </span>
                        {log.hoursWorked && (
                           <span className="text-xs text-dbu-primary font-medium">{log.hoursWorked} hrs</span>
                        )}
                      </div>
                      <p className="text-slate-800 text-sm">{log.activity}</p>

                      {/* Advisor Feedback Display */}
                      {log.comment && log.comment.text && (
                        <div className="mt-3 bg-blue-50/50 p-3 rounded-md border border-blue-100 text-sm">
                          <p className="text-xs text-dbu-primary font-bold mb-1">Advisor Comment:</p>
                          <p className="text-slate-700 italic">{log.comment.text}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
