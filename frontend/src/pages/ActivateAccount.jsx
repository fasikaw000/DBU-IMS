import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserCheck, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

const ActivateAccount = () => {
  const [role, setRole] = useState('student');
  const [username, setUsername] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleActivate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (role === 'student' && username !== studentId) {
      setError('Student ID must match username');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/activate', {
        username,
        student_id: role === 'student' ? studentId : undefined,
        email,
        password,
        confirmPassword
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Activation failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dbu-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-dbu-dark">Activate Account</h2>
            <p className="text-slate-600 mt-2">Enter your credentials to set your password</p>
          </div>

          {success ? (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700 font-medium">
                    Account activated successfully! Redirecting to login...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleActivate}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary text-sm"
                >
                  <option value="student">Student</option>
                  <option value="advisor">Advisor</option>
                  <option value="department_dean">Department Dean</option>
                  <option value="college_admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your username"
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                />
              </div>

              {role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID (Students only)</label>
                  <input
                    type="text"
                    required
                    placeholder="DBU1501198"
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary text-sm"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Create Password</label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary text-sm pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-dbu-primary transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                <div className="mt-1 relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary text-sm pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-dbu-primary transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-dbu-primary hover:bg-dbu-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dbu-primary transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (
                    <>
                      <UserCheck className="w-5 h-5 mr-2" />
                      Activate Account
                    </>
                  )}
                </button>
              </div>
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

export default ActivateAccount;
