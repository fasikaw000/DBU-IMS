import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Briefcase, 
  Search, 
  Eye, 
  CheckCircle, 
  Clock, 
  Building, 
  Folder, 
  Calendar,
  XCircle,
  FileText,
  Activity
} from 'lucide-react';

const AdminInternships = () => {
  const [internships, setInternships] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedInternship, setSelectedInternship] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get('/admin/internships'),
        api.get('/admin/internships/dashboard-stats')
      ]);
      setInternships(listRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load internships", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/admin/internships/${id}/status`, { status: newStatus });
      fetchData();
      if (selectedInternship?._id === id) {
        setSelectedInternship(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const filtered = internships.filter(i => {
    const matchesSearch = 
      i.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.student?.studentId?.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'ALL') return matchesSearch;
    return matchesSearch && i.status === filter;
  });

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dbu-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Internship Management</h1>
          <p className="text-slate-500 text-sm">Monitor and manage student internship assignments and statuses.</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Placements', value: stats.total, icon: Folder, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Approval', value: stats.pending, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Active / Ongoing', value: stats.active, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-slate-600', bg: 'bg-slate-50' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
              <p className="text-xl font-black text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, ID or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-dbu-primary outline-none"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'ONGOING', 'COMPLETED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap ${
                  filter === f ? 'bg-dbu-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No internships found.</td>
                </tr>
              ) : (
                filtered.map((intern) => (
                  <tr key={intern._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{intern.student?.name}</span>
                        <span className="text-[10px] text-slate-400">{intern.student?.studentId} • {intern.student?.department?.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">{intern.company?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(intern.startDate).toLocaleDateString()} - {new Date(intern.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg ${
                        intern.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        intern.status === 'PENDING_APPROVAL' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {intern.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedInternship(intern)}
                        className="p-2 text-slate-400 hover:text-dbu-primary transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedInternship && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            <div className="bg-dbu-primary p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black">Internship Details</h3>
                <p className="text-dbu-light/80 text-sm">Managing workflow for {selectedInternship.student?.name}</p>
              </div>
              <button onClick={() => setSelectedInternship(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Student & Academic</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block lowercase">Full Name</label>
                    <p className="text-sm font-bold text-slate-800">{selectedInternship.student?.name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block lowercase">University Advisor</label>
                    <p className="text-sm font-bold text-slate-800">{selectedInternship.advisor_id?.name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block lowercase">Status</label>
                    <p className="text-sm font-bold text-dbu-primary">{selectedInternship.status.replace('_', ' ')}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Company Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block lowercase">Partner Company</label>
                    <p className="text-sm font-bold text-slate-800">{selectedInternship.company?.name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block lowercase">Supervisor Name</label>
                    <p className="text-sm font-bold text-slate-800">{selectedInternship.companySupervisorName}</p>
                  </div>
                   <div>
                    <label className="text-[10px] text-slate-400 block lowercase">Supervisor Phone</label>
                    <p className="text-sm font-bold text-slate-800">{selectedInternship.companySupervisorPhone}</p>
                  </div>
                </div>
              </section>

              <div className="col-span-full bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-slate-800">Change Workflow Status</h5>
                  <p className="text-[10px] text-slate-500">Update the stage of this internship</p>
                </div>
                <div className="flex gap-2">
                  {selectedInternship.status === 'PENDING_APPROVAL' && (
                    <button 
                      onClick={() => handleStatusUpdate(selectedInternship._id, 'APPROVED')}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all"
                    >
                      Approve
                    </button>
                  )}
                  {['APPROVED', 'PENDING_APPROVAL'].includes(selectedInternship.status) && (
                    <button 
                      onClick={() => handleStatusUpdate(selectedInternship._id, 'ONGOING')}
                      className="bg-dbu-primary text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-dbu-primary/20 hover:bg-dbu-accent transition-all"
                    >
                      Start
                    </button>
                  )}
                  {selectedInternship.status !== 'COMPLETED' && (
                    <button 
                      onClick={() => handleStatusUpdate(selectedInternship._id, 'COMPLETED')}
                      className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-900 transition-all"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInternships;
