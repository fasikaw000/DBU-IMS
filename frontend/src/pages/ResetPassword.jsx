import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password, confirmPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dbu-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-dbu-dark">Reset Password</h2>
            <p className="text-slate-600 mt-2">Enter and confirm your new password</p>
          </div>
          {success ? (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <p className="text-sm text-green-700 font-medium">Password reset successfully! Redirecting to login...</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700">New Password</label>
                <div className="mt-1 relative">
                  <input type={showPassword ? 'text' : 'password'} required minLength={6}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary text-sm pr-10"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-dbu-primary" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
                <div className="mt-1 relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} required
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary text-sm pr-10 ${confirmPassword && password !== confirmPassword ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-dbu-primary" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-dbu-primary hover:bg-dbu-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dbu-primary transition-colors disabled:opacity-50">
                {loading ? 'Resetting...' : <><Lock className="w-5 h-5 mr-2" />Reset Password</>}
              </button>
            </form>
          )}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-dbu-primary hover:text-dbu-accent text-sm font-medium flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
