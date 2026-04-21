import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { UserCircle, BadgeCheck } from 'lucide-react';

const Profile = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-black text-slate-800 mb-6">Profile</h1>

        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-dbu-primary/10 flex items-center justify-center text-dbu-primary">
            <UserCircle className="w-9 h-9" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-800">{user?.name || 'Unknown User'}</p>
            <p className="text-xs uppercase tracking-widest font-bold text-dbu-primary">
              {(user?.role || 'unknown').replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Full Name</p>
            <p className="text-sm font-semibold text-slate-700">{user?.name || '-'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Username</p>
            <p className="text-sm font-semibold text-slate-700">{user?.username || '-'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 md:col-span-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Role</p>
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-dbu-primary" />
              {(user?.role || '-').replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
