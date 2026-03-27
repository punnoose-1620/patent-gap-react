import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import RequestDemoPage from './pages/public/RequestDemoPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import ContactPage from './pages/public/ContactPage';
import PatentDetail from './pages/dashboard/PatentDetailPage';


// ✅ Reusable auth guard — checks localStorage session
const ProtectedRoute = ({ children }) => {
  const session = JSON.parse(localStorage.getItem('session') || '{}');
  const isAuthenticated = !!(session.user_id || session.user?.id);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const { initializeAuth } = useAuth();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
           <Routes>
          {/* Public routes */}
          <Route path="/"        element={<HomePage />} />
          <Route path="/login"   element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot"  element={<ForgotPasswordPage />} />
          <Route path="/request-demo"    element={<RequestDemoPage />} />
         
          <Route path="/contact" element={<ContactPage />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/patent-detail" element={
            <ProtectedRoute><PatentDetail /></ProtectedRoute>
          } />
          <Route path="/cases/:id" element={
            <ProtectedRoute><PatentDetail /></ProtectedRoute>
          } />
        </Routes>
      
  );
};

export default App;
