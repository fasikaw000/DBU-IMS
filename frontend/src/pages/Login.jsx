import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const { login, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLocalError('');

    let newErrors = {};
    if (!username) newErrors.username = "Please fill out all required fields";
    if (!password) newErrors.password = "Please fill out all required fields";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLocalError("Please fill out all required fields");
      return;
    }

    setLoading(true);
    try {
      const userData = await login(username, password);
      switch (userData.role) {
        case 'Student': navigate('/student-dashboard'); break;
        case 'Advisor': navigate('/advisor-dashboard'); break;
        case 'Dean': navigate('/dept-dashboard'); break;
        case 'Admin': navigate('/admin-dashboard'); break;
        default: navigate('/');
      }
    } catch (err) {
      setLocalError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dbu-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-40 w-56 rounded-[2.5rem] overflow-hidden mb-6 flex items-center justify-center bg-dbu-dark">
          <img
            src="/dbu.png"
            alt="Debre Berhan University Logo"
            className="w-full h-full scale-[1.05]"
          />
        </div>
        <h2 className="mt-2 text-3xl font-extrabold text-white">
          DEBRE BERHAN UNIVERSITY
          <span className="block text-lg font-medium text-dbu-light mt-1 uppercase">college of computing</span>
          <span className="block text-xl text-dbu-accent mt-2">Internship Management System</span>
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6 text-center">
            <h3 className="text-xl font-bold text-slate-800 flex items-center justify-center">
              <LogIn className="w-5 h-5 mr-2 text-dbu-primary" /> Sign In
            </h3>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {(error || localError) && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-700">{localError || error}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary text-sm ${errors.username ? 'border-red-500' : 'border-slate-300'}`}
                value={username}
                onChange={(e) => { setUsername(e.target.value.toUpperCase()); setErrors({ ...errors, username: null }); }}
              />
              {errors.username && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.username}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-sm font-bold text-dbu-primary hover:text-dbu-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary text-sm pr-10 ${errors.password ? 'border-red-500' : 'border-slate-300'}`}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: null }); }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-dbu-primary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.password}</p>}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-dbu-primary hover:bg-dbu-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dbu-primary transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              First time?{' '}
              <Link to="/activate" className="font-bold text-dbu-primary hover:text-dbu-accent hover:underline">
                Activate Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
