import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { BadgeCheck, Camera, KeyRound, Save, Loader2, X } from 'lucide-react';
import api from '../utils/api';
import { useLocation, useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setFullName(user?.name || '');
    setEmail(user?.email || '');
  }, [user?._id]);

  const displayRole = useMemo(() => user?.role || 'Unknown', [user?.role]);

  const getAvatarInitial = (name) => {
    if (!name) return 'U';
    const cleaned = String(name).trim().replace(/\.+/g, '.');
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const honorifics = new Set(['dr', 'dr.', 'mr', 'mr.', 'ms', 'ms.', 'mrs', 'mrs.', 'prof', 'prof.']);
    const first = parts.find((p) => !honorifics.has(p.toLowerCase())) || parts[0];
    return (first?.charAt(0) || 'U').toUpperCase();
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpen = params.get('changePassword') === '1';
    if (shouldOpen) {
      setPasswordMessage('');
      setPasswordError('');
      setShowPasswordModal(true);
    }
  }, [location.search]);

  const refreshMe = async () => {
    const res = await api.get('/users/me');
    if (res?.data) setUser(res.data);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await api.put('/users/me', { name: fullName, email });
      if (res?.data) setUser(res.data);
      setMessage(res?.message || 'Profile updated');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    setMessage('');
    setError('');
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await api.post('/users/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res?.data) setUser(res.data);
      setMessage(res?.message || 'Profile photo updated');
    } catch (err) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordMessage('');
    setPasswordError('');
    try {
      const res = await api.put('/users/me/password', {
        currentPassword,
        newPassword,
        confirmNewPassword
      });
      setPasswordMessage(res?.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      await refreshMe();
      setShowPasswordModal(false);
      navigate('/profile', { replace: true });
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleOpenPassword = () => {
    setPasswordMessage('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleClosePassword = () => {
    setShowPasswordModal(false);
    setPasswordMessage('');
    setPasswordError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    navigate('/profile', { replace: true });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-black text-slate-800 mb-6">Profile</h1>

        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-dbu-primary/10 flex items-center justify-center text-dbu-primary overflow-hidden">
              {user?.profilePhoto ? (
                <img src={`http://localhost:5001${user.profilePhoto}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black">{getAvatarInitial(user?.name)}</span>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border border-slate-100 rounded-xl shadow flex items-center justify-center cursor-pointer hover:bg-slate-50">
              {photoUploading ? <Loader2 className="w-4 h-4 animate-spin text-dbu-primary" /> : <Camera className="w-4 h-4 text-slate-500" />}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)}
                disabled={photoUploading}
              />
            </label>
          </div>
          <div>
            <p className="text-lg font-black text-slate-800">{user?.name || 'Unknown User'}</p>
            <p className="text-xs uppercase tracking-widest font-bold text-dbu-primary">
              {displayRole}
            </p>
          </div>
        </div>

        {(message || error) && (
          <div className={`mt-6 p-4 rounded-xl font-bold text-sm ${message ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {message || error}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Full Name</p>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
            />
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Email (optional)</p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
              type="email"
            />
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Username (locked)</p>
            <p className="text-sm font-semibold text-slate-700">{user?.username || '-'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Role</p>
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-dbu-primary" />
              {displayRole}
            </p>
          </div>
          <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-dbu-primary text-white font-bold hover:bg-dbu-accent transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Profile
            </button>
            <button
              type="button"
              onClick={handleOpenPassword}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition-colors"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Change Password
            </button>
          </div>
        </form>

        {showPasswordModal && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={handleClosePassword} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-dbu-primary" />
                    <h2 className="text-lg font-black text-slate-800">Change Password</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleClosePassword}
                    className="w-10 h-10 rounded-2xl hover:bg-slate-50 flex items-center justify-center text-slate-500"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  {(passwordMessage || passwordError) && (
                    <div className={`mb-4 p-4 rounded-xl font-bold text-sm ${passwordMessage ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {passwordMessage || passwordError}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Current Password</p>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
                        required
                      />
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">New Password</p>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
                        required
                      />
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Confirm New Password</p>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-dbu-primary"
                        required
                      />
                    </div>

                    <div className="md:col-span-3 flex flex-col sm:flex-row justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClosePassword}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={changingPassword}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition-colors disabled:opacity-50"
                      >
                        {changingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
