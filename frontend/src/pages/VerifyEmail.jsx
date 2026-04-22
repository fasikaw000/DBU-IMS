import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.get(`/users/verify-email/${token}`);
        setStatus('success');
        setMessage(res?.message || 'Email verified successfully.');
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Invalid or expired verification link.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
        <h1 className="text-2xl font-black text-slate-800">Email Verification</h1>
        <p className={`mt-4 text-sm font-medium ${status === 'success' ? 'text-green-700' : status === 'error' ? 'text-red-700' : 'text-slate-600'}`}>
          {message}
        </p>
        <Link
          to="/login"
          className="inline-block mt-6 px-4 py-2 rounded-xl bg-dbu-primary text-white font-bold hover:bg-dbu-accent transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
