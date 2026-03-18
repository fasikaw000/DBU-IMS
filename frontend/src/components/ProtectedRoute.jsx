import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Protects routes and checks if role is authorized
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dbu-primary"></div>
      </div>
    );
  }

  // Not logged in or token expired relative to state
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Not authorized
  if (allowedRoles && !allowedRoles.includes(user.role)) {
     // Redirect to a generic unauthorized route or force back to login
    return <Navigate to="/login" replace />; // In production, route to a 403 page
  }

  return <Outlet />;
};

export default ProtectedRoute;
