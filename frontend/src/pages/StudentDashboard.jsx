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
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [problemsFaced, setProblemsFaced] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [cbeAccount, setCbeAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      try {
        const profileRes = await api.get('/users/me/student-profile');
        if (profileRes?.data?.cbeAccount) {
          setCbeAccount(profileRes.data.cbeAccount);
        } else {
          setCbeAccount('');
        }
      } catch (_err) {
        setCbeAccount('');
      }

      const logbooksRes = await api.get('/logbooks/my-logbooks');
      setLogbooks(logbooksRes.data || []);
      
      try {
        const internshipRes = await api.get('/internships/my-internship');
        const data = internshipRes.data;
        setInternship(data);
        setInternshipStatus(data.status.toUpperCase()); // e.g. PENDING_APPROVAL, APPROVED, COMPLETED
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
      await api.post('/student/logbook', {
        activity,
        hoursWorked: Number(hours),
        tasksCompleted,
        problemsFaced
      });
      setMessage('Logbook entry submitted successfully!');
      setActivity('');
      setHours('');
      setTasksCompleted('');
      setProblemsFaced('');
      fetchDashboardData();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.put('/student/profile', { phone, cbeAccount });
      setMessage('Profile updated successfully!');
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
              internshipStatus === 'APPROVED' || internshipStatus === 'ACTIVE' || internshipStatus === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
              internshipStatus === 'PENDING_APPROVAL' || internshipStatus === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              internshipStatus === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
              'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
                {internshipStatus === 'APPROVED' || internshipStatus === 'ACTIVE' || internshipStatus === 'COMPLETED' ? <CheckCircle className="w-4 h-4 mr-2" /> : 
                 internshipStatus === 'REJECTED' ? <XCircle className="w-4 h-4 mr-2" /> :
                 <Clock className="w-4 h-4 mr-2" />}
                <span className="font-semibold tracking-wide text-sm">
                  Status: {internshipStatus === 'PENDING_APPROVAL' ? 'Pending Approval' : internshipStatus.replace('_', ' ')}
                </span>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor Email</label>
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
                    <User className="w-5 h-5 mr-2 text-dbu-primary" />
                    Student Profile Settings
                </h3>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">CBE Account Number</label>
                    <input 
                      type="text" 
                      value={cbeAccount || ''} 
                      onChange={(e) => setCbeAccount(e.target.value.replace(/\D/g, '').slice(0, 13))} 
                      className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-dbu-primary outline-none" 
                      placeholder="Enter 13-digit CBE account"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-dbu-primary outline-none" 
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-slate-100 text-slate-700 py-2 rounded text-xs font-bold hover:bg-slate-200 transition">
                    UPDATE PROFILE
                  </button>
                </form>
             </div>
            )}

            {internshipStatus === 'APPROVED' && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-dbu-primary" />
                    Company Evaluation
                </h3>
                {internship?.companyEvaluationUrl ? (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-700">Evaluation Uploaded</p>
                        <a 
                            href={`http://localhost:5001${internship.companyEvaluationUrl}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-2 text-xs text-dbu-primary hover:underline block font-bold"
                        >
                            View Document
                        </a>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500 italic">
                            Upload your scanned company evaluation form (PDF only).
                        </p>
                        <input 
                            type="file" 
                            accept=".pdf"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                
                                const formData = new FormData();
                                formData.append('evaluation', file);
                                
                                setSubmitting(true);
                                try {
                                    await api.post('/internships/upload-evaluation', formData, {
                                        headers: { 'Content-Type': 'multipart/form-data' }
                                    });
                                    setMessage('Evaluation uploaded successfully!');
                                    fetchDashboardData();
                                } catch (err) {
                                    setMessage(`Upload failed: ${err.response?.data?.message || err.message}`);
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                            className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-dbu-light file:text-dbu-primary hover:file:bg-dbu-primary hover:file:text-white transition-all cursor-pointer"
                        />
                    </div>
                )}
              </div>
            )}

            {internshipStatus === 'APPROVED' && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold border-b pb-2 mb-4">Submit Daily Logbook</h3>
                <form onSubmit={handleLogbookSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Hours Worked</label>
                      <input type="number" min="0" max="12" value={hours} onChange={(e) => setHours(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Activity Overview</label>
                    <textarea value={activity} onChange={(e) => setActivity(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" rows="2" required placeholder="General summary..."></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tasks Completed</label>
                    <textarea value={tasksCompleted} onChange={(e) => setTasksCompleted(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" rows="2" placeholder="Detail specific tasks..."></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Problems Faced</label>
                    <textarea value={problemsFaced} onChange={(e) => setProblemsFaced(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-dbu-primary outline-none" rows="2" placeholder="Any issues encountered?"></textarea>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-dbu-primary text-white py-2 rounded font-bold hover:bg-dbu-accent transition disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'SUBMIT ENTRY'}
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
