import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import { ToastProvider } from './context/ToastContext';
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
import { ManageStudentsPage } from './pages/ManageStudentsPage';
import { SubmissionsPage } from './pages/SubmissionsPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { CourseLearnPage } from './pages/CourseLearnPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardLayout } from './admin/AdminDashboardLayout';
import { AdminDashboardPage } from './admin/AdminDashboardPage';
import { AdminUserManagementPage } from './admin/AdminUserManagementPage';
import { AdminCoursesPage } from './admin/AdminCoursesPage';
import { AdminSubmissionsPage } from './admin/AdminSubmissionsPage';
import { AdminReportsPage } from './admin/AdminReportsPage';
import { AdminCategoriesPage } from './admin/AdminCategoriesPage';
import { AdminCourseApprovalsPage } from './admin/AdminCourseApprovalsPage';
import { AdminCreateCoursePage } from './admin/AdminCreateCoursePage';
import { AdminStudentsProgressPage } from './admin/AdminStudentsProgressPage';
import { AdminStudentsPerformancePage } from './admin/AdminStudentsPerformancePage';
import { AdminAssignmentsReviewsPage } from './admin/AdminAssignmentsReviewsPage';
import { AdminActivityLogsPage } from './admin/AdminActivityLogsPage';
import { AdminNotificationsPage } from './admin/AdminNotificationsPage';
import { AdminSettingsPage } from './admin/AdminSettingsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';

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

  const handleProfileUpdate = (updated: User) => {
    setCurrentUser(updated);
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
    return <Loader message="Initializing Vidya Bridge..." />;
  }

  return (
    <ToastProvider>
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
        <Route
          path="/admin/login"
          element={
            currentUser
              ? <Navigate to={currentUser.role === 'admin' ? '/dashboard/admin' : '/dashboard'} replace />
              : <AdminLoginPage onLoginSuccess={handleAuthSuccess} />
          }
        />

        {/* Admin Dashboard (Vidya Bridge Admin Panel) */}
        <Route
          path="/dashboard/admin"
          element={
            currentUser?.role === 'admin' ? (
              <AdminDashboardLayout user={currentUser} onLogout={handleLogout} />
            ) : currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<AdminDashboardPage user={currentUser!} />} />
          <Route path="users" element={<AdminUserManagementPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="courses/create" element={<AdminCreateCoursePage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="courses/approvals" element={<AdminCourseApprovalsPage />} />
          <Route path="students/progress" element={<AdminStudentsProgressPage />} />
          <Route path="students/performance" element={<AdminStudentsPerformancePage />} />
          <Route path="assignments/submissions" element={<AdminSubmissionsPage />} />
          <Route path="assignments/reviews" element={<AdminAssignmentsReviewsPage />} />
          <Route path="reports/analytics" element={<AdminReportsPage />} />
          <Route path="reports/activity" element={<AdminActivityLogsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="profile" element={<ProfileSettingsPage user={currentUser!} onProfileUpdate={handleProfileUpdate} />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Protected Dashboard Routes (instructor / student) */}
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
          <Route
            index
            element={
              currentUser?.role === 'admin' ? (
                <Navigate to="/dashboard/admin" replace />
              ) : (
                <DashboardPage user={currentUser!} onLogout={handleLogout} />
              )
            }
          />
          <Route path="courses" element={<MyCoursesPage />} />
          <Route path="recommended" element={<RecommendedPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="assignments/:id" element={<AssignmentDetailPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="students" element={<ManageStudentsPage />} />
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="courses/:id/learn" element={<CourseLearnPage />} />
          <Route path="ai-tutor" element={<AITutorPage />} />
          <Route path="reports" element={<SystemReportsPage />} />
          <Route path="settings" element={<ProfileSettingsPage user={currentUser!} onProfileUpdate={handleProfileUpdate} />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Fallback for undefined routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {isLoggingOut && <Loader message="Signing out securely..." />}
      </BrowserRouter>
    </ToastProvider>
  );
};

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
