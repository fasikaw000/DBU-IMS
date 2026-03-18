import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import StudentDashboard from './pages/StudentDashboard';
import AdvisorDashboard from './pages/AdvisorDashboard';
import DeptDashboard from './pages/DeptDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ReportUpload from './pages/ReportUpload';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Role Protected Routes Wrapped in Standard Layout */}
      <Route element={<DashboardLayout />}>
        <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/reports" element={<ReportUpload />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADVISOR']} />}>
          <Route path="/advisor/dashboard" element={<AdvisorDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['DEPARTMENT_HEAD']} />}>
          <Route path="/department/dashboard" element={<DeptDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['COLLEGE_DEAN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
