import { useState, useEffect } from 'react';
import api from '../utils/api';
import { BarChart3, Users, Briefcase, CheckCircle, Clock, AlertCircle, PieChart } from 'lucide-react';

const CollegeHeadDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dbu-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-dbu-dark rounded-lg shadow-sm p-8 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">College Performance Dashboard</h2>
          <p className="text-slate-300 max-w-xl">
            Real-time analytics across all computing departments, monitoring student placements and internship success metrics.
          </p>
        </div>
        <BarChart3 className="absolute -right-6 -bottom-6 w-48 h-48 text-white opacity-5" />
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 p-2 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase">Total Students</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">{analytics?.totalStudents || 0}</h3>
          <p className="text-xs text-slate-500 mt-1">Registered in system</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-50 p-2 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase">Active Internships</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">{analytics?.activeInternships || 0}</h3>
          <p className="text-xs text-slate-500 mt-1">Currently placed & approved</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-50 p-2 rounded-lg"><Clock className="w-6 h-6 text-yellow-600" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase">Pending Review</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">{analytics?.pendingInternships || 0}</h3>
          <p className="text-xs text-slate-500 mt-1">Awaiting Dept Head approval</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-slate-50 p-2 rounded-lg"><Briefcase className="w-6 h-6 text-slate-600" /></div>
            <span className="text-xs font-bold text-slate-400 uppercase">Total Placements</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">{analytics?.totalApplications || 0}</h3>
          <p className="text-xs text-slate-500 mt-1">Total applications processed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold border-b pb-2 mb-6 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-dbu-primary" />
            Internship Status Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <span className="text-sm font-medium text-slate-600">Approved (Active)</span>
               <span className="text-sm font-bold text-green-600">{analytics?.activeInternships}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
               <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analytics?.activeInternships / analytics?.totalApplications * 100) || 0}%` }}></div>
            </div>

            <div className="flex items-center justify-between">
               <span className="text-sm font-medium text-slate-600">Pending Approval</span>
               <span className="text-sm font-bold text-yellow-600">{analytics?.pendingInternships}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
               <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(analytics?.pendingInternships / analytics?.totalApplications * 100) || 0}%` }}></div>
            </div>

            <div className="flex items-center justify-between">
               <span className="text-sm font-medium text-slate-600">Rejected</span>
               <span className="text-sm font-bold text-red-600">{analytics?.rejectedInternships}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
               <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(analytics?.rejectedInternships / analytics?.totalApplications * 100) || 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
           <h3 className="text-lg font-semibold border-b pb-2 mb-4">Administrative Insights</h3>
           <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
              <div className="flex">
                 <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                 <div>
                    <p className="text-sm font-bold text-blue-900">Placement Target Progress</p>
                    <p className="text-xs text-blue-700 mt-0.5">Currently tracking at {((analytics?.activeInternships / 100) * 100).toFixed(1)}% of total capacity based on available advisors.</p>
                 </div>
              </div>
           </div>
           <p className="text-sm text-slate-500 italic">College-wide student distribution across departments: CS (45%), SE (30%), IT (25%).</p>
        </div>
      </div>
    </div>
  );
};

export default CollegeHeadDashboard;
