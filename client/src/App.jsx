import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Triage from './pages/Triage';
import Emergency from './pages/Emergency';
import HospitalMap from './pages/HospitalMap';
import Chat from './pages/Chat';
import ReportVault from './pages/ReportVault';
import EmergencyIdViewer from './pages/EmergencyIdViewer';

import LandingPage from './pages/LandingPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Dashboard Redirect for Doctors
const DashboardRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LandingPage />;
  return user?.role === 'doctor' ? <Navigate to="/reports" /> : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes - No Layout Constraint */}
          <Route path="/" element={<DashboardRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public route for viewing health ID from QR scan */}
          <Route path="/health-id" element={<EmergencyIdViewer />} />

          {/* Protected Routes - Wrapped in Layout */}
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/triage" element={<ProtectedRoute><Triage /></ProtectedRoute>} />
                <Route path="/emergency" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute><HospitalMap /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><ReportVault /></ProtectedRoute>} />
                {/* Fallback for protected routes, or add specific Dashboard route if needed inside layout */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
