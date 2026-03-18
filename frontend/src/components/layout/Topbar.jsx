import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Bell, UserCircle } from 'lucide-react';

const Topbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div className="flex-1">
        {/* Breadcrumbs or Search could go here */}
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-slate-400 hover:text-slate-500 relative transition-colors">
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          <Bell className="h-6 w-6" />
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <div className="flex items-center">
          <div className="flex flex-col text-right mr-3 hidden sm:block">
            <span className="text-sm font-medium text-slate-700">{user?.name}</span>
            <span className="text-xs text-slate-500">{user?.role.replace('_', ' ')}</span>
          </div>
          <UserCircle className="h-8 w-8 text-dbu-primary" />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
