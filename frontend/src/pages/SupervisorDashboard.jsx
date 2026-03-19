import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, Star, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const SupervisorDashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [evaluation, setEvaluation] = useState({
    company_rating: 5,
    skills_rating: 5,
    comments: ''
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/internships/supervisor/students');
      setStudents(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvalSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.post('/evaluations/submit', {
        internship_id: selectedInternship._id,
        supervisor_name: selectedInternship.supervisor_name,
        supervisor_email: selectedInternship.supervisor_email,
        ...evaluation
      });
      setMessage('Evaluation submitted successfully!');
      setSelectedInternship(null);
      setEvaluation({ company_rating: 5, skills_rating: 5, comments: '' });
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
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-slate-800 text-dbu-dark">Supervisor Dashboard</h2>
            <p className="text-slate-500">Manage your assigned interns and provide performance feedback.</p>
         </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg shadow-sm border ${message.includes('Error') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student List */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-dbu-primary" />
            Assigned Interns
          </h3>
          {students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm italic">No students assigned to you yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map(intern => (
                <div key={intern._id} className="p-4 bg-slate-50 rounded border border-slate-100 flex justify-between items-center hover:border-dbu-primary/30 transition shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-800">{intern.student_id?.name}</h4>
                    <p className="text-xs text-slate-500">ID: {intern.student_id?.studentId} | Dept: {intern.student_id?.department}</p>
                    <div className="mt-1">
                       <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${intern.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {intern.status}
                       </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedInternship(intern)}
                    className="bg-white text-dbu-primary border border-dbu-primary px-4 py-1.5 rounded-full hover:bg-dbu-primary hover:text-white transition text-xs font-bold"
                  >
                    Provide Evaluation
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evaluation Form */}
        {selectedInternship ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 animate-in slide-in-from-right duration-300">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4 flex items-center">
               <Star className="w-5 h-5 mr-2 text-yellow-500" />
               Performance Feedback: {selectedInternship.student_id?.name}
            </h3>
            <form onSubmit={handleEvalSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Company Culture Adaptation</label>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button type="button" key={num} onClick={() => setEvaluation({...evaluation, company_rating: num})} className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold transition ${evaluation.company_rating === num ? 'bg-dbu-primary text-white border-dbu-primary shadow-lg scale-110' : 'bg-white text-slate-400 border-slate-200 hover:border-dbu-primary'}`}>{num}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Technical Skills & Execution</label>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button type="button" key={num} onClick={() => setEvaluation({...evaluation, skills_rating: num})} className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold transition ${evaluation.skills_rating === num ? 'bg-dbu-primary text-white border-dbu-primary shadow-lg scale-110' : 'bg-white text-slate-400 border-slate-200 hover:border-dbu-primary'}`}>{num}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Performance Summary & Comments</label>
                <textarea 
                  value={evaluation.comments}
                  onChange={(e) => setEvaluation({...evaluation, comments: e.target.value})}
                  className="w-full px-4 py-3 border rounded focus:ring-2 focus:ring-dbu-primary outline-none bg-slate-50" 
                  rows="5" 
                  placeholder="Describe the student's contributions and areas for improvement..."
                  required
                ></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-dbu-primary text-white py-3 rounded-lg hover:bg-dbu-accent transition disabled:opacity-50 font-bold">
                  {submitting ? 'Submitting...' : 'Submit Evaluation'}
                </button>
                <button type="button" onClick={() => setSelectedInternship(null)} className="px-6 py-3 border border-slate-200 rounded-lg text-slate-500 font-medium hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center bg-white rounded-lg border border-dashed border-slate-300 p-12 text-center">
             <div className="bg-slate-50 p-4 rounded-full mb-4">
                <FileText className="w-12 h-12 text-slate-300" />
             </div>
             <p className="text-slate-500 font-medium">Select an intern from the list to begin the evaluation process.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorDashboard;
