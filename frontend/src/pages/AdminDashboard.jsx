import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
    Users,
    Building,
    Briefcase,
    Activity,
    ArrowUpRight,
    Clock,
    Shield,
    ShieldCheck,
    CheckCircle2,
    PieChart
} from 'lucide-react';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalStaff: 0,
        totalDepartments: 0,
        activeInternships: 0,
        completedInternships: 0,
        departmentStats: [],
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                const payload = res?.data || {};
                setStats({
                    totalStudents: payload.totalStudents ?? 0,
                    totalStaff: payload.totalStaff ?? 0,
                    totalDepartments: payload.totalDepartments ?? 0,
                    activeInternships: payload.activeInternships ?? 0,
                    completedInternships: payload.completedInternships ?? 0,
                    departmentStats: Array.isArray(payload.departmentStats) ? payload.departmentStats : [],
                    recentActivity: Array.isArray(payload.recentActivity) ? payload.recentActivity : []
                });
            } catch (err) {
                console.error("Failed to load stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Total Staff', value: stats.totalStaff, icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
        { title: 'Total Departments', value: stats.totalDepartments, icon: Building, color: 'text-orange-600', bg: 'bg-orange-50' },
        { title: 'Active Internships', value: stats.activeInternships, icon: Briefcase, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'Completed Internships', value: stats.completedInternships, icon: CheckCircle2, color: 'text-slate-600', bg: 'bg-slate-100' },
    ];

    if (loading) return (
        <div className="flex h-96 items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dbu-primary"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Console Overview</h1>
                <p className="text-slate-500 mt-1">Welcome back. Here's what's happening with the system today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg flex items-center">
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                Live
                            </span>
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium">{stat.title}</h3>
                        <p className="text-3xl font-black text-slate-800 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center">
                            <Activity className="w-5 h-5 mr-3 text-dbu-primary" />
                            Recent System Activity
                        </h2>
                        <button className="text-sm font-bold text-dbu-primary hover:text-dbu-accent transition-colors">View All Logs</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {stats.recentActivity.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic">No recent activity found.</div>
                        ) : (
                            stats.recentActivity.map((log, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-slate-800">{log.action.replace(/_/g, ' ').toUpperCase()}</p>
                                            <span className="text-[10px] text-slate-400 font-medium">{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-0.5">{log.details}</p>
                                        <div className="flex items-center mt-2 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                            <span className="text-dbu-primary mr-2">Admin:</span>
                                            {log.user?.name || 'System'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Shortcuts / Insights */}
                <div className="space-y-6">
                    <div className="bg-dbu-dark rounded-2xl p-6 text-white relative overflow-hidden">
                        <Shield className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10" />
                        <h3 className="text-lg font-bold relative z-10">System Status</h3>
                        <p className="text-dbu-light/80 text-sm mt-1 relative z-10">All modules are operating normally.</p>
                        <div className="mt-6 flex items-center gap-2 relative z-10">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <span className="text-xs font-bold text-green-400">HEALTHY</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Tasks</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/admin/students')}
                                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-dbu-primary hover:bg-slate-50 transition-all text-sm font-medium text-slate-600 flex items-center"
                            >
                                <Users className="w-4 h-4 mr-3 text-dbu-primary" />
                                Add New Student
                            </button>
                            <button
                                onClick={() => navigate('/admin/staff')}
                                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-dbu-primary hover:bg-slate-50 transition-all text-sm font-medium text-slate-600 flex items-center"
                            >
                                <ShieldCheck className="w-4 h-4 mr-3 text-dbu-primary" />
                                Add New Staff
                            </button>
                            <button
                                onClick={() => navigate('/admin/departments')}
                                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-dbu-primary hover:bg-slate-50 transition-all text-sm font-medium text-slate-600 flex items-center"
                            >
                                <Building className="w-4 h-4 mr-3 text-dbu-primary" />
                                Add New Department
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Department Distribution Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        <PieChart className="w-5 h-5 mr-3 text-dbu-primary" />
                        Department-Level Analytics
                    </h2>
                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded">Organization View</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Department Name</th>
                                <th className="px-6 py-4">Students</th>
                                <th className="px-6 py-4">Advisors</th>
                                <th className="px-6 py-4">Deans</th>
                                <th className="px-6 py-4 text-right">Coverage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {stats.departmentStats.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400 italic">No department data available.</td>
                                </tr>
                            ) : (
                                stats.departmentStats.map((dept, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800">{dept.name}</span>
                                                <span className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{dept.code}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{dept.studentsCount}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">{dept.advisorsCount}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">{dept.deansCount}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden ml-auto">
                                                <div
                                                    className="h-full bg-dbu-primary"
                                                    style={{ width: `${Math.min(100, (dept.studentsCount / (stats.totalStudents || 1)) * 100)}%` }}
                                                />
                                            </div>
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

export default AdminDashboard;
