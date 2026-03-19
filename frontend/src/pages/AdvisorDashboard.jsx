import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, FileText, CheckCircle, Clock, MessageSquare, ClipboardList } from 'lucide-react';

const AdvisorDashboard = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [logbooks, setLogbooks] = useState([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      const res = await api.get('/advisor/internships');
      setInternships(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogbooks = async (studentId) => {
    try {
      const res = await api.get(`/logbooks/assigned-logbooks?studentId=${studentId}`);
      setLogbooks(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectStudent = (internship) => {
    setSelectedStudent(internship);
    fetchLogbooks(internship.student_id._id);
  };

  const handleCommentSubmit = async (logbookId) => {
    if (!comment) return;
    try {
      await api.put(`/advisor/logbook/${logbookId}/comment`, { text: comment });
      setComment('');
      fetchLogbooks(selectedStudent.student_id._id);
    } catch (err) {
      console.error(err);
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
            <h2 className="text-2xl font-bold text-slate-800 text-dbu-dark">Faculty Advisor Portal</h2>
            <p className="text-slate-500">Mentor students and provide academic guidance on their internship progress.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold flex items-center text-slate-700">
                <Users className="w-4 h-4 mr-2 text-dbu-primary" />
                MY ASSIGNED STUDENTS
              </h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {internships.length === 0 ? (
                <p className="p-8 text-center text-xs text-slate-400">No students assigned yet.</p>
              ) : (
                internships.map(intern => (
                  <button 
                    key={intern._id}
                    onClick={() => handleSelectStudent(intern)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition border-l-4 ${selectedStudent?._id === intern._id ? 'border-dbu-primary bg-dbu-light/10' : 'border-transparent'}`}
                  >
                    <p className="font-bold text-slate-800 text-sm">{intern.student_id?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-slate-500 font-medium">ID: {intern.student_id?.studentId || 'NO_ID'} | {intern.company_name}</p>
                    <div className="mt-2 flex gap-2">
                       <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {intern.status}
                       </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Details Area */}
        <div className="lg:col-span-2">
           {selectedStudent ? (
             <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                   <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{selectedStudent.student_id?.name}'s Progress</h3>
                        <p className="text-sm text-slate-500">{selectedStudent.company_name} - {selectedStudent.field}</p>
                      </div>
                      <div className="bg-dbu-light text-dbu-primary px-3 py-1 rounded-full text-xs font-bold border border-dbu-primary/20 flex items-center">
                         <Clock className="w-3 h-3 mr-1.5" /> Phase: Placement
                      </div>
                   </div>

                   <div className="border-t border-slate-100 pt-6">
                      <h4 className="text-sm font-bold text-slate-700 flex items-center mb-4">
                         <ClipboardList className="w-4 h-4 mr-2 text-dbu-primary" />
                         DAILY LOGBOOK ENTRIES
                      </h4>
                      {logbooks.length === 0 ? (
                        <p className="text-sm text-slate-400 italic py-8 text-center border rounded-lg border-dashed">No logbook entries submitted by this student yet.</p>
                      ) : (
                        <div className="space-y-4">
                           {logbooks.map(log => (
                             <div key={log._id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex justify-between mb-2">
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.date).toLocaleDateString()}</span>
                                   <span className="text-[10px] font-bold text-dbu-primary">{log.hours_spent} HRS</span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed mb-4">{log.tasks_completed}</p>
                                
                                {log.comment && log.comment.text ? (
                                   <div className="bg-blue-50/50 p-3 rounded border border-blue-100 text-xs italic text-slate-600">
                                      <span className="font-bold text-blue-800 not-italic block mb-1">My Comment:</span>
                                      {log.comment.text}
                                   </div>
                                ) : (
                                   <div className="flex gap-2">
                                      <input 
                                        type="text" 
                                        placeholder="Add a feedback comment..."
                                        className="flex-1 text-xs border rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-dbu-primary"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                      />
                                      <button 
                                        onClick={() => handleCommentSubmit(log._id)}
                                        className="bg-dbu-primary text-white px-3 py-1.5 rounded text-[10px] font-bold hover:bg-dbu-accent"
                                      >
                                        SEND
                                      </button>
                                   </div>
                                )}
                             </div>
                           ))}
                        </div>
                      )}
                   </div>
                </div>
             </div>
           ) : (
             <div className="bg-white rounded-lg border border-dashed border-slate-300 p-20 text-center flex flex-col items-center justify-center text-slate-400">
                <Users className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-medium">Select a student from the sidebar to view their full internship journal.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default AdvisorDashboard;
