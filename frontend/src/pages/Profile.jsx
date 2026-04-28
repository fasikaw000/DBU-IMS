import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { BadgeCheck, Camera, KeyRound, Save, Loader2, X, Phone, Landmark, Mail, User as UserIcon } from 'lucide-react';
import api from '../utils/api';
import { useLocation, useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentProfile, setStudentProfile] = useState(null);
  const [cbeAccount, setCbeAccount] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => {
      setMessage('');
      setError('');
    }, 2500);
    return () => clearTimeout(timer);
  }, [message, error]);

  useEffect(() => {
    if (!passwordMessage && !passwordError) return;
    const timer = setTimeout(() => {
      setPasswordMessage('');
      setPasswordError('');
    }, 2500);
    return () => clearTimeout(timer);
  }, [passwordMessage, passwordError]);

  useEffect(() => {
    setFullName(user?.name || '');
    setEmail(user?.email || '');
    setPhoneNumber(user?.phoneNumber || '');
  }, [user?._id, user?.name, user?.email, user?.phoneNumber]);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (user?.role !== 'Student') return;
      try {
        const res = await api.get('/users/me/student-profile');
        if (res?.data) {
          setStudentProfile(res.data);
          setCbeAccount(res.data.cbeAccount || '');
        }
      } catch (_err) {
        console.error("Student profile error", _err);
      }
    };
    fetchStudentProfile();
  }, [user?.role]);

  const displayRole = useMemo(() => user?.role || 'Unknown', [user?.role]);

  const getAvatarInitial = (name) => {
    if (!name) return 'U';
    const first = name.split(' ').filter(Boolean)[0] || 'U';
    return first.charAt(0).toUpperCase();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validation
    let newErrors = {};
    if (!fullName.trim()) newErrors.fullName = "Please fill out all required fields";
    if (!email.trim()) newErrors.email = "Please fill out all required fields";
    if (!phoneNumber.trim()) newErrors.phoneNumber = "Please fill out all required fields";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError("Please fill out all required fields");
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.put('/users/me', {
        name: fullName,
        email,
        phoneNumber,
        cbeAccount: user?.role === 'Student' ? cbeAccount : undefined
      });
      
      // Critical Fix: Fetch current user to ensure UI reflects changes instantly
      const updatedUserRes = await api.get('/users/me');
      if (updatedUserRes?.data) {
        setUser(updatedUserRes.data);
        if (updatedUserRes.data.studentProfile) {
            setStudentProfile(updatedUserRes.data.studentProfile);
            setCbeAccount(updatedUserRes.data.studentProfile.cbeAccount || '');
        }
      }
      
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };


  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await api.post('/users/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res?.data) setUser(res.data);
      setMessage('Photo updated successfully');
    } catch (err) {
      setError(err.message || 'Photo upload failed');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await api.put('/users/me/password', {
        currentPassword,
        newPassword,
        confirmNewPassword
      });
      setShowPasswordModal(false);
      setPasswordMessage('Password changed successfully');
      setMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Password change failed');
    } finally {
      setChangingPassword(false);
    }
  };

  const isProfileComplete = useMemo(() => {
    if (user?.role !== 'Student') return true;
    return phoneNumber && cbeAccount && email;
  }, [user?.role, phoneNumber, cbeAccount, email]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!isProfileComplete && user?.role === 'Student' && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl flex items-center gap-3 animate-pulse">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-black text-amber-800">Profile Incomplete</p>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Please add your Phone Number and CBE Account to continue properly.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-dbu-primary/5"></div>

            <div className="relative z-10">
              <div className="w-32 h-32 rounded-[2rem] bg-white border-4 border-white shadow-2xl mx-auto mb-6 relative group overflow-hidden">
                {user?.profilePhoto ? (
                  <img src={`http://localhost:5001${user.profilePhoto}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-dbu-primary/10 flex items-center justify-center text-dbu-primary text-4xl font-black">
                    {getAvatarInitial(user?.name)}
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="text-white w-8 h-8" />
                  <input type="file" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files?.[0])} />
                </label>
              </div>

              <h2 className="text-2xl font-black text-slate-800">{user?.name}</h2>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-dbu-primary mt-1">{displayRole}</p>

              <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Username</p>
                    <p className="text-sm font-bold text-slate-700 font-mono">{user?.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Change Security Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-800">Personal Information</h3>
              {isProfileComplete && <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> Profile Complete</span>}
            </div>

            {(message || error) && (
              <div className={`mb-6 p-4 rounded-2xl text-xs font-bold border animate-in slide-in-from-top-2 ${message ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {message || error}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={fullName}
                      onChange={e => { setFullName(e.target.value); setErrors({ ...errors, fullName: null }); }}
                      className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-dbu-primary ${errors.fullName ? 'border-red-500' : 'border-slate-100'}`}
                      placeholder="Your Full Name"
                    />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={email}
                      onChange={e => { setEmail(e.target.value); setErrors({ ...errors, email: null }); }}
                      className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-dbu-primary ${errors.email ? 'border-red-500' : 'border-slate-100'}`}
                      placeholder="name@example.com"
                      type="email"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={phoneNumber}
                      onChange={e => { setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 15)); setErrors({ ...errors, phoneNumber: null }); }}
                      className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-dbu-primary ${errors.phoneNumber ? 'border-red-500' : 'border-slate-100'}`}
                      placeholder="Enter your phone number"
                      type="tel"
                    />
                  </div>
                  {errors.phoneNumber && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.phoneNumber}</p>}
                </div>

                 {user?.role === 'Student' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CBE Account Number</label>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${cbeAccount ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {cbeAccount ? 'Completed' : 'Not Linked'}
                        </span>
                    </div>
                    <div className="relative">
                      <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={cbeAccount}
                        onChange={e => { setCbeAccount(e.target.value.replace(/\D/g, '').slice(0, 16)); setErrors({ ...errors, cbeAccount: null }); }}
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-dbu-primary font-mono ${errors.cbeAccount ? 'border-red-500' : 'border-slate-100'}`}
                        placeholder="1000XXXXXXXXX"
                      />
                    </div>
                    {errors.cbeAccount && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.cbeAccount}</p>}
                  </div>
                )}
              </div>

               <div className="pt-4 flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-4 bg-dbu-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-dbu-primary/20 hover:bg-dbu-accent transition-all flex items-center justify-center gap-3"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]" onClick={() => setShowPasswordModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[201] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-8 bg-slate-800 text-white flex justify-between items-center">
              <h3 className="text-xl font-black">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="p-8 space-y-6">
              <div className="space-y-4">
                <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm" required />
                <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm" required />
                <input type="password" placeholder="Confirm New Password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm" required />
              </div>
              {passwordError && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{passwordError}</p>}
              <button type="submit" disabled={changingPassword} className="w-full py-4 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all">
                Update Security Key
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;
