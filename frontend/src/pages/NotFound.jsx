import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <h1 className="text-3xl font-black text-slate-800">404</h1>
        <p className="text-slate-600 mt-2">Page not found.</p>
        <Link
          to="/login"
          className="inline-block mt-6 px-4 py-2 rounded-xl bg-dbu-primary text-white font-bold hover:bg-dbu-accent transition-colors"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
