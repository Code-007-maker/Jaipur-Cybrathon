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
import EmergencyIdViewer from './pages/EmergencyIdViewer';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public route for viewing health ID from QR scan */}
          <Route path="/health-id" element={<EmergencyIdViewer />} />

          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                {/* Placeholders for other routes */}
                <Route path="/triage" element={<ProtectedRoute><Triage /></ProtectedRoute>} />
                <Route path="/emergency" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute><HospitalMap /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
