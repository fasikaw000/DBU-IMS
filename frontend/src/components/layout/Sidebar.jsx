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
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  // Define nav items based on role
  const getNavItems = () => {
    switch (user?.role) {
      case 'STUDENT':
        return [
          { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
          { name: 'Apply', path: '/student/apply', icon: Briefcase },
          { name: 'Logbook', path: '/student/logbook', icon: BookOpen },
          { name: 'Reports', path: '/student/reports', icon: FileText },
        ];
      case 'ADVISOR':
        return [
          { name: 'Dashboard', path: '/advisor/dashboard', icon: LayoutDashboard },
          { name: 'Students', path: '/advisor/students', icon: Users },
        ];
      case 'DEPARTMENT_HEAD':
        return [
          { name: 'Dashboard', path: '/department/dashboard', icon: LayoutDashboard },
          { name: 'Companies', path: '/department/companies', icon: Building },
          { name: 'Assign Advisors', path: '/department/assignments', icon: Users },
        ];
      case 'COLLEGE_DEAN':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Staff', path: '/admin/staff', icon: Users },
          { name: 'Analytics', path: '/admin/analytics', icon: BarChart },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="flex flex-col w-64 bg-dbu-dark min-h-screen text-white border-r border-slate-700 fixed left-0 top-0">
      <div className="flex items-center justify-center h-16 border-b border-slate-700 mt-2">
        <h1 className="text-xl font-bold tracking-wider text-dbu-light">DBU<span className="text-dbu-accent">IMS</span></h1>
      </div>
      
      <div className="flex flex-col flex-1 py-4 overflow-y-auto">
        <nav className="flex-1 px-4 space-y-2">
          {getNavItems().map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
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
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
