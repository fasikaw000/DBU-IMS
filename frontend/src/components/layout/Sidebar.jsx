import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Users,
  Building,
  Briefcase,
  BarChart,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Settings
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  // Define nav items based on role
  const getNavItems = () => {
    switch (user?.role) {
      case 'Student':
        return [
          { name: 'Dashboard', path: '/student-dashboard', icon: LayoutDashboard },
          { name: 'Reports', path: '/student/reports', icon: FileText },
          { name: 'Messages', path: '/messages', icon: MessageSquare },
        ];
      case 'Advisor':
        return [
          { name: 'Dashboard', path: '/advisor-dashboard', icon: LayoutDashboard },
          { name: 'Students', path: '/students', icon: Users },
          { name: 'Messages', path: '/messages', icon: MessageSquare },
        ];
      case 'Dean':
        return [
          { name: 'Dashboard', path: '/dept-dashboard', icon: LayoutDashboard },
          { name: 'Companies', path: '/companies', icon: Building },
          { name: 'Assignments', path: '/assignments', icon: Users },
          { name: 'Messages', path: '/messages', icon: MessageSquare },
        ];
      case 'Admin':
        return [
          { name: 'Dashboard', path: '/admin-dashboard', icon: LayoutDashboard },
          { name: 'Students', path: '/admin/students', icon: Users },
          { name: 'Staff', path: '/admin/staff', icon: ShieldCheck },
          { name: 'Departments', path: '/admin/departments', icon: Building },
          { name: 'Internships', path: '/admin/internships', icon: Briefcase },
          { name: 'Reports', path: '/admin/reports', icon: BarChart },
          { name: 'Messages', path: '/messages', icon: MessageSquare },
          { name: 'Settings', path: '/admin/settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="flex flex-col w-64 bg-dbu-dark min-h-screen text-white border-r border-slate-700 fixed left-0 top-0">
      <div className="flex items-center px-4 h-24 border-b border-slate-700 mt-2 bg-slate-900/50">
        <div className="h-14 w-20 rounded-xl overflow-hidden mr-3 flex items-center justify-center">
          <img 
            src="/dbu.png" 
            alt="Logo" 
            className="w-full h-full scale-[1.05] object-contain" 
          />
        </div>
        <h1 className="text-xl font-bold tracking-wider text-dbu-light leading-tight">
          DBU<span className="text-dbu-accent">IMS</span>
        </h1>
      </div>

      <div className="flex flex-col flex-1 py-4 overflow-y-auto">
        <nav className="flex-1 px-4 space-y-2">
          {getNavItems().map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                  ? 'bg-dbu-primary text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
