import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const ForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/auth/forgot-password', { username, email });
      setSuccess(res.message || 'Password reset link sent to your email.');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dbu-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-dbu-dark">Forgot Password</h2>
            <p className="text-slate-600 mt-2">Enter your username and email to receive a reset link</p>
          </div>
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5 shrink-0" />
                <p className="text-sm text-green-700 font-medium">{success}</p>
              </div>
            </div>
          )}
          
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
                <label className="block text-sm font-medium text-slate-700">Username</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-dbu-primary focus:border-dbu-primary text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-dbu-primary hover:bg-dbu-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dbu-primary transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : <><Mail className="w-5 h-5 mr-2" />Send Reset Link</>}
              </button>
            </form>
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

export default ForgotPassword;
