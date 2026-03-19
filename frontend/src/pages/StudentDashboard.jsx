import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { FileText, Clock, CheckCircle, XCircle, Briefcase, MapPin, User, Calendar, Mail, Phone } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [internship, setInternship] = useState(null);
  const [internshipStatus, setInternshipStatus] = useState('NOT_APPLIED');
  const [logbooks, setLogbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyData, setApplyData] = useState({
    company_name: '', location: '', field: '', 
    supervisor_name: '', supervisor_phone: '', supervisor_email: '',
    start_date: '', end_date: ''
  });
  
  const [activity, setActivity] = useState('');
  const [hours, setHours] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const logbooksRes = await api.get('/logbooks/my-logbooks');
      setLogbooks(logbooksRes.data.data || []);
      
      try {
        const internshipRes = await api.get('/internships/my-internship');
        const data = internshipRes.data.data;
        setInternship(data);
        setInternshipStatus(data.status.toUpperCase());
      } catch (err) {
        if (err.response?.status === 404) {
          setInternshipStatus('NOT_APPLIED');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.post('/internships/apply', applyData);
      setMessage('Application submitted successfully!');
      setShowApplyForm(false);
      fetchDashboardData();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogbookSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      await api.post('/logbooks/submit', {
        tasks_completed: activity,
        hours_spent: Number(hours),
        date: new Date().toISOString().split('T')[0]
      });
      setMessage('Logbook entry submitted successfully!');
      setActivity('');
      setHours('');
      fetchDashboardData();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dbu-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Stat Area */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Welcome, {user?.name}</h2>
            <p className="text-slate-500">Student ID: {user?.studentId || 'N/A'}</p>
         </div>
         <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full border flex items-center ${
              internshipStatus === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
              internshipStatus === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              internshipStatus === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
              'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
                {internshipStatus === 'APPROVED' ? <CheckCircle className="w-4 h-4 mr-2" /> : 
                 internshipStatus === 'REJECTED' ? <XCircle className="w-4 h-4 mr-2" /> :
                 <Clock className="w-4 h-4 mr-2" />}
                <span className="font-semibold tracking-wide text-sm">Status: {internshipStatus}</span>
            </div>
            {internshipStatus === 'NOT_APPLIED' && !showApplyForm && (
              <button 
                onClick={() => setShowApplyForm(true)}
                className="bg-dbu-primary text-white px-6 py-2 rounded-lg hover:bg-dbu-accent transition font-medium text-sm"
              >
                Apply for Internship
              </button>
            )}
         </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg shadow-sm border ${message.includes('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {message}
        </div>
      )}

      {showApplyForm ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center">
              <Briefcase className="w-6 h-6 mr-2 text-dbu-primary" />
              Internship Application
            </h3>
            <button onClick={() => setShowApplyForm(false)} className="text-slate-400 hover:text-slate-600 font-bold">CANCEL</button>
          </div>
          <form onSubmit={handleApplySubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                <input type="text" className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required value={applyData.company_name} onChange={e => setApplyData({...applyData, company_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input type="text" className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required value={applyData.location} onChange={e => setApplyData({...applyData, location: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Field of Work</label>
                <input type="text" className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required value={applyData.field} onChange={e => setApplyData({...applyData, field: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Supervisor Name</label>
                <input type="text" className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required value={applyData.supervisor_name} onChange={e => setApplyData({...applyData, supervisor_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor Phone</label>
                <input type="text" className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required value={applyData.supervisor_phone} onChange={e => setApplyData({...applyData, supervisor_phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor Email (Login will be created)</label>
                <input type="email" className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required value={applyData.supervisor_email} onChange={e => setApplyData({...applyData, supervisor_email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input type="date" className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required value={applyData.start_date} onChange={e => setApplyData({...applyData, start_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                <input type="date" className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required value={applyData.end_date} onChange={e => setApplyData({...applyData, end_date: e.target.value})} />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-dbu-primary text-white py-3 rounded-lg hover:bg-dbu-accent transition disabled:opacity-50 font-bold text-lg">
              {submitting ? 'Submitting Application...' : 'Submit Internship Details'}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Col: Info & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {internship && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                 <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-dbu-primary" />
                    Internship Details
                 </h3>
                 <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-slate-100 p-2 rounded mr-3"><Building className="w-4 h-4 text-slate-600" /></div>
                      <div><p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Company</p><p className="text-sm font-medium">{internship.company_name}</p></div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-slate-100 p-2 rounded mr-3"><MapPin className="w-4 h-4 text-slate-600" /></div>
                      <div><p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Location</p><p className="text-sm font-medium">{internship.location}</p></div>
                    </div>
                    <div className="flex items-start border-t pt-4">
                      <div className="bg-slate-100 p-2 rounded mr-3"><User className="w-4 h-4 text-slate-600" /></div>
                      <div><p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Supervisor</p><p className="text-sm font-medium">{internship.supervisor_name}</p></div>
                    </div>
                    {internship.advisor_id && (
                      <div className="flex items-start border-t pt-4">
                        <div className="bg-dbu-light p-2 rounded mr-3"><User className="w-4 h-4 text-dbu-primary" /></div>
                        <div><p className="text-xs text-dbu-primary uppercase font-bold tracking-tighter">Assigned Advisor</p><p className="text-sm font-medium">{internship.advisor_id.name}</p></div>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {internshipStatus === 'APPROVED' && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Submit Daily Logbook</h3>
                <form onSubmit={handleLogbookSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hours Worked</label>
                    <input type="number" min="0" max="12" value={hours} onChange={(e) => setHours(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tasks Completed</label>
                    <textarea value={activity} onChange={(e) => setActivity(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" rows="3" required placeholder="Describe what you did today..."></textarea>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-dbu-primary text-white py-2 rounded hover:bg-dbu-accent transition disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Entry'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Col: Feed */}
          <div className="lg:col-span-2 space-y-6">
             <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                   <h3 className="text-lg font-semibold flex items-center">
                       <FileText className="w-5 h-5 mr-2 text-dbu-primary" />
                       Recent Activity Feed
                   </h3>
                </div>

                {logbooks.length === 0 ? (
                   <div className="text-center py-12">
                      <div className="bg-slate-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 italic font-bold">Log</div>
                      <p className="text-slate-500 text-sm">No activity recorded yet.</p>
                   </div>
                ) : (
                   <div className="space-y-4">
                     {logbooks.map(log => (
                       <div key={log._id} className="p-4 bg-white rounded-lg border border-slate-100 hover:border-dbu-primary/30 transition shadow-sm">
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center">
                             <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                             <span className="text-xs font-semibold text-slate-500">
                               {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                             </span>
                           </div>
                           <span className="text-xs text-dbu-primary bg-dbu-light px-2 py-0.5 rounded-full font-bold">{log.hours_spent} hrs</span>
                         </div>
                         <p className="text-slate-700 text-sm leading-relaxed">{log.tasks_completed}</p>
                       </div>
                     ))}
                   </div>
                )}
             </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
