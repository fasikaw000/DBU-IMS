import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Registration fields
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('CS');
  const [phone, setPhone] = useState('');

  const { login, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');
    setSuccessMsg('');

    try {
      if (isRegister) {
        await api.post('/auth/register-student', {
          name,
          email,
          password,
          student_id: studentId,
          department,
          phone
        });
        setSuccessMsg('Registration successful! Please sign in with your credentials.');
        setIsRegister(false);
      } else {
        const userData = await login(email, password);
        // Role-Based Redirect
        switch (userData.role) {
          case 'student':
            navigate('/student/dashboard');
            break;
          case 'advisor':
            navigate('/advisor/dashboard');
            break;
          case 'supervisor':
            navigate('/supervisor/dashboard');
            break;
          case 'department_head':
            navigate('/department/dashboard');
            break;
          case 'college_head':
            navigate('/college-head/dashboard');
            break;
          case 'admin':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/');
        }
      }
    } catch (err) {
      setLocalError(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dbu-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-white">
          DBU Internship System
        </h2>
        <p className="mt-2 text-sm text-dbu-light/80">
          Computing Science College
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex mb-6 border-b border-slate-200">
            <button
              onClick={() => { setIsRegister(false); setLocalError(''); setSuccessMsg(''); }}
              className={`flex-1 pb-4 text-sm font-medium ${!isRegister ? 'text-dbu-primary border-b-2 border-dbu-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setLocalError(''); setSuccessMsg(''); }}
              className={`flex-1 pb-4 text-sm font-medium ${isRegister ? 'text-dbu-primary border-b-2 border-dbu-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Register Student
            </button>
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

            {successMsg && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex items-center">
                  <p className="text-sm text-green-700">{successMsg}</p>
                </div>
              </div>
            )}

            {isRegister && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary sm:text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-slate-700">Student ID (DBUXXXXXXX)</label>
                  <input
                    id="studentId"
                    type="text"
                    required
                    placeholder="e.g. DBU1234567"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary sm:text-sm"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-slate-700">Department</label>
                    <select
                      id="department"
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary sm:text-sm"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="CS">CS</option>
                      <option value="IS">IS</option>
                      <option value="IT">IT</option>
                      <option value="DS">DS</option>
                      <option value="SE">SE</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone</label>
                    <input
                      id="phone"
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary sm:text-sm"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <input
                id="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-dbu-primary hover:bg-dbu-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dbu-primary transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : (
                  <>
                    {isRegister ? <UserPlus className="w-5 h-5 mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
                    {isRegister ? 'Register' : 'Sign In'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
