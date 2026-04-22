import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const getDefaultRouteByRole = (role) => {
  switch (role) {
    case 'Admin':
      return '/admin-dashboard';
    case 'Dean':
      return '/dept-dashboard';
    case 'Advisor':
      return '/advisor-dashboard';
    case 'Student':
      return '/student-dashboard';
    default:
      return '/login';
  }
};

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
    return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
