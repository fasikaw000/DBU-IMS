import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

const AccountSettings = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-black text-slate-800 mb-2">Account Settings</h1>
        <p className="text-sm text-slate-500 mb-8">
          Change your password while logged in from your Profile page.
        </p>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="w-5 h-5 text-dbu-primary" />
            <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Use the in-profile password form to update your password securely.
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-dbu-primary text-white font-bold hover:bg-dbu-accent transition-colors"
          >
            Go to Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
