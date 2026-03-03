import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isUpgraded?: boolean;
  upgradeExpiry?: string;
  remainingDays?: number;
  subscriptionStatus?: string;
};

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader } from './components/Loader';
import { DashboardLayout } from './components/DashboardLayout';
import { MyCoursesPage } from './pages/MyCoursesPage';
import { RecommendedPage } from './pages/RecommendedPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { AssignmentDetailPage } from './pages/AssignmentDetailPage';
import { ExamsPage } from './pages/ExamsPage';
import { PerformancePage } from './pages/PerformancePage';
import { AITutorPage } from './pages/AITutorPage';
import { SystemReportsPage } from './pages/SystemReportsPage';
import { SubmissionsPage } from './pages/SubmissionsPage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        setCurrentUser(parsed);
      } catch {
        // ignore parse errors
      }
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentUser(null);
      setIsLoggingOut(false);
    }, 800); // Small delay to show the loader as requested
  };

  if (loading) {
    return <Loader message="Initializing Lumina..." />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage onLoginSuccess={handleAuthSuccess} />
          }
        />
        <Route
          path="/signup"
          element={
            currentUser ? <Navigate to="/dashboard" replace /> : <SignupPage onSignupSuccess={handleAuthSuccess} />
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            currentUser ? (
              <DashboardLayout user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<DashboardPage user={currentUser!} onLogout={handleLogout} />} />
          <Route path="courses" element={<MyCoursesPage />} />
          <Route path="recommended" element={<RecommendedPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="assignments/:id" element={<AssignmentDetailPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="ai-tutor" element={<AITutorPage />} />
          <Route path="reports" element={<SystemReportsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Fallback for undefined routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {isLoggingOut && <Loader message="Signing out securely..." />}
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
