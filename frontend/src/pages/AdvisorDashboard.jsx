import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, FileText, CheckCircle, Clock, MessageSquare, ClipboardList, User, Mail } from 'lucide-react';

const AdvisorDashboard = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [logbooks, setLogbooks] = useState([]);
  const [comment, setComment] = useState('');
  const [grades, setGrades] = useState({
    companyGrade: '',
    documentationGrade: '',
    implementationGrade: '',
    presentationGrade: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      const res = await api.get('/advisor/students');
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
    if (internship.student?._id) {
      fetchLogbooks(internship.student._id);
    }
  };

  const handleEvaluateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);
    setMessage('');
    try {
      const res = await api.post(`/advisor/internship/${selectedStudent._id}/evaluate`, {
        ...grades,
        advisorComment: comment
      });
      setMessage(res.data.message);
      fetchInternships();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotal = () => {
    const total = (Number(grades.companyGrade) * 0.30) +
      (Number(grades.documentationGrade) * 0.25) +
      (Number(grades.implementationGrade) * 0.25) +
      (Number(grades.presentationGrade) * 0.20);
    return isNaN(total) ? 0 : total.toFixed(2);
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
          <h2 className="text-2xl font-bold text-slate-800">Faculty Advisor Portal</h2>
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
                    <p className="font-bold text-slate-800 text-sm">{intern.student?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-slate-500 font-medium">ID: {intern.student?.studentId || 'NO_ID'} | {intern.companyName}</p>
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
                    <h3 className="text-xl font-bold text-slate-800">{selectedStudent.student?.name}'s Progress</h3>
                    <p className="text-sm text-slate-500">{selectedStudent.companyName} - {selectedStudent.field}</p>
                  </div>
                  <div className="bg-dbu-light text-dbu-primary px-3 py-1 rounded-full text-xs font-bold border border-dbu-primary/20 flex items-center">
                    <Clock className="w-3 h-3 mr-1.5" /> Phase: Placement
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center">
                      <div className="bg-slate-100 p-2 rounded-lg mr-3"><User className="w-5 h-5 text-slate-400" /></div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-tighter">Supervisor</p>
                        <p className="text-sm font-semibold text-slate-700">{selectedStudent.companySupervisorName}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-slate-400" />
                      <p className="text-xs font-medium text-slate-700">{selectedStudent.companySupervisorEmail}</p>
                    </div>
                  </div>

                  {selectedStudent.companyEvaluationUrl && (
                    <div className="mb-8 p-4 bg-dbu-light rounded-xl border border-dbu-primary/20 flex items-center justify-between">
                      <div className="flex items-center text-dbu-primary">
                        <FileText className="w-6 h-6 mr-3" />
                        <div>
                          <p className="text-sm font-bold">Company Evaluation Form</p>
                          <p className="text-xs opacity-70">Scanned PDF Document</p>
                        </div>
                      </div>
                      <a
                        href={`http://localhost:5001${selectedStudent.companyEvaluationUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-dbu-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-dbu-accent transition"
                      >
                        VIEW PDF
                      </a>
                    </div>
                  )}

                  {selectedStudent.status !== 'COMPLETED' && selectedStudent.status !== 'GRADED' && (
                    <div className="mt-8 border-t pt-8">
                      <h4 className="text-sm font-black text-slate-800 flex items-center mb-6 uppercase tracking-widest">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Final Performance Evaluation
                      </h4>
                      {message && (
                        <div className={`mb-4 p-3 rounded text-xs font-bold ${message.includes('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                          {message}
                        </div>
                      )}
                      <form onSubmit={handleEvaluateSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Company Performance (30%)</label>
                            <input
                              type="number"
                              min="0" max="100"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-dbu-primary outline-none"
                              value={grades.companyGrade}
                              onChange={(e) => setGrades({ ...grades, companyGrade: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Reports & Documentation (25%)</label>
                            <input
                              type="number"
                              min="0" max="100"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-dbu-primary outline-none"
                              value={grades.documentationGrade}
                              onChange={(e) => setGrades({ ...grades, documentationGrade: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Project Implementation (25%)</label>
                            <input
                              type="number"
                              min="0" max="100"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-dbu-primary outline-none"
                              value={grades.implementationGrade}
                              onChange={(e) => setGrades({ ...grades, implementationGrade: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Project Presentation (20%)</label>
                            <input
                              type="number"
                              min="0" max="100"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-dbu-primary outline-none"
                              value={grades.presentationGrade}
                              onChange={(e) => setGrades({ ...grades, presentationGrade: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Advisor Final Comments</label>
                          <textarea
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-dbu-primary outline-none"
                            rows="3"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Summarize the student's overall performance..."
                          ></textarea>
                        </div>
                        <div className="flex items-center justify-between bg-slate-900 rounded-xl p-6 text-white">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Calculated Total</p>
                            <p className="text-3xl font-black">{calculateTotal()}%</p>
                          </div>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="bg-dbu-primary hover:bg-dbu-accent text-white px-8 py-3 rounded-lg font-black tracking-widest text-xs transition shadow-lg shadow-dbu-primary/20"
                          >
                            {submitting ? 'SUBMITTING...' : 'FINALIZE EVALUATION'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <h4 className="text-sm font-bold text-slate-700 flex items-center mb-4 border-t pt-6">
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
