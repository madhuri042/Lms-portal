import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader } from '../components/Loader';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'instructor' | 'student' | string;
};

type AdminDashboardData = {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalAssignments: number;
  totalExams: number;
};

type InstructorDashboardData = {
  totalCourses: number;
  totalStudentsEnrolled: number;
  totalAssignments: number;
  totalExams: number;
};

type ProgressReport = {
  _id: string;
  course?: {
    _id: string;
    title: string;
  };
  [key: string]: unknown;
};

type StudentDashboardData = {
  totalEnrolledCourses: number;
  pendingAssignments: number;
  upcomingExams: number;
  totalAssignments: number;
  submittedAssignmentsCount: number;
  evaluatedAssignmentsCount: number;
  totalExamsRemaining: number;
  progressReports: ProgressReport[];
};

type DashboardPageProps = {
  user: User;
  onLogout: () => void;
};

// Icons as inline SVG components for metric cards
const IconBook = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M8 7h8" />
    <path d="M8 11h8" />
  </svg>
);
const IconClipboard = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 14h6" />
    <path d="M9 18h6" />
  </svg>
);
const IconSend = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);
const IconCheckCircle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconGraduation = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
const IconUsers = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconPerformance = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<
    AdminDashboardData | InstructorDashboardData | StudentDashboardData | null
  >(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You are not logged in.');
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        let endpoint = '';
        if (user.role === 'admin') {
          endpoint = `${API_BASE_URL}/api/dashboard/admin`;
        } else if (user.role === 'instructor') {
          endpoint = `${API_BASE_URL}/api/dashboard/instructor`;
        } else {
          endpoint = `${API_BASE_URL}/api/dashboard/student`;
        }

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let body: { success?: boolean; data?: unknown; message?: string } = null as any;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            body = await res.json();
          } catch {
            /* ignore */
          }
        }

        if (!res.ok || !body?.success) {
          if (res.status === 401) {
            onLogout();
            return;
          }
          const message =
            body?.message ||
            (res.status === 0
              ? 'Unable to reach server. Please check your connection or backend.'
              : 'Failed to load dashboard data.');
          throw new Error(message);
        }

        setData(body.data as any);
      } catch (err: any) {
        setError(err.message || 'Something went wrong while loading dashboard.');
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, [user.role, onLogout]);

  if (loading) {
    return <Loader message="Syncing your data..." />;
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card" style={{ textAlign: 'center', borderColor: 'var(--error, #d92d20)' }}>
          <p className="auth-error-text">{error}</p>
        </div>
      </div>
    );
  }

  const firstName = user.firstName || 'there';

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <h1>Welcome back, {firstName}!</h1>
        <p>Track your learning goals and achievements here.</p>
      </header>

      {/* Admin metrics */}
      {user.role === 'admin' && data && (
        <>
          <div className="dashboard-metrics">
            <MetricCard label="Total Users" value={(data as AdminDashboardData).totalUsers} icon={<IconUsers />} color="blue" />
            <MetricCard label="Total Students" value={(data as AdminDashboardData).totalStudents} icon={<IconUsers />} color="green" />
            <MetricCard label="Total Instructors" value={(data as AdminDashboardData).totalInstructors} icon={<IconUsers />} color="amber" />
            <MetricCard label="Total Courses" value={(data as AdminDashboardData).totalCourses} icon={<IconBook />} color="purple" />
          </div>
        </>
      )}

      {/* Instructor metrics */}
      {user.role === 'instructor' && data && (
        <>
          <div className="dashboard-metrics">
            <MetricCard label="My Courses" value={(data as InstructorDashboardData).totalCourses} icon={<IconBook />} color="blue" />
            <MetricCard label="Students Enrolled" value={(data as InstructorDashboardData).totalStudentsEnrolled} icon={<IconUsers />} color="green" />
            <MetricCard label="Assignments" value={(data as InstructorDashboardData).totalAssignments} icon={<IconClipboard />} color="purple" />
            <MetricCard label="Exams" value={(data as InstructorDashboardData).totalExams} icon={<IconGraduation />} color="teal" />
          </div>
        </>
      )}

      {/* Student metrics — reference style: 4 main cards with icons */}
      {user.role === 'student' && data && (
        <>
          <div className="dashboard-metrics">
            <MetricCard
              label="Exams remaining"
              value={(data as StudentDashboardData).totalExamsRemaining}
              icon={<IconGraduation />}
              color="blue"
            />
            <MetricCard
              label="Total assignments"
              value={(data as StudentDashboardData).totalAssignments}
              icon={<IconClipboard />}
              color="green"
            />
            <MetricCard
              label="Submitted"
              value={(data as StudentDashboardData).submittedAssignmentsCount}
              icon={<IconSend />}
              color="amber"
            />
            <MetricCard
              label="Evaluated"
              value={(data as StudentDashboardData).evaluatedAssignmentsCount}
              icon={<IconCheckCircle />}
              color="teal"
            />
          </div>

          {/* Weekly Activity (placeholder bar chart) */}
          <div className="dashboard-charts-row">
            <div className="dashboard-card">
              <h3 className="dashboard-card-title">Weekly Activity</h3>
              <div className="dashboard-activity-bars">
                {['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'].map((day, i) => (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      className="dashboard-activity-bar"
                      style={{ ['--h' as string]: `${[48, 32, 88, 24, 64, 120, 72][i]}px` }}
                    />
                  </div>
                ))}
              </div>
              <div className="dashboard-activity-labels">
                {['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </div>

            {/* Overall Progress — based on evaluated / total assignments */}
            <div className="dashboard-card">
              <h3 className="dashboard-card-title">Overall Progress</h3>
              <div className="dashboard-progress-wrap">
                <div
                  className="dashboard-progress-ring"
                  style={{
                    ['--pct-deg' as string]:
                      (data as StudentDashboardData).totalAssignments > 0
                        ? `${Math.round(
                            ((data as StudentDashboardData).evaluatedAssignmentsCount /
                              (data as StudentDashboardData).totalAssignments) *
                              360
                          )}deg`
                        : '0deg',
                    ['--progress-color' as string]: '#059669',
                  }}
                >
                  <div className="dashboard-progress-ring-inner">
                    <span className="dashboard-progress-value">
                      {(data as StudentDashboardData).totalAssignments > 0
                        ? Math.round(
                            ((data as StudentDashboardData).evaluatedAssignmentsCount /
                              (data as StudentDashboardData).totalAssignments) *
                              100
                          )
                        : 0}
                      %
                    </span>
                    <span className="dashboard-progress-caption">Avg Score</span>
                  </div>
                </div>
                <p className="dashboard-progress-note">Based on your assignment performance.</p>
              </div>
            </div>
          </div>

          {/* Quick actions — use empty space */}
          <section>
            <h3 className="dashboard-section-title">Quick actions</h3>
            <div className="dashboard-quick-actions">
              <Link to="/dashboard/assignments" className="dashboard-quick-action">
                <IconClipboard />
                <span>View assignments</span>
              </Link>
              <Link to="/dashboard/exams" className="dashboard-quick-action">
                <IconGraduation />
                <span>My exams</span>
              </Link>
              <Link to="/dashboard/courses" className="dashboard-quick-action">
                <IconBook />
                <span>My courses</span>
              </Link>
              <Link to="/dashboard/performance" className="dashboard-quick-action">
                <IconPerformance />
                <span>Performance</span>
              </Link>
            </div>
          </section>

          {/* Your Learning Progress */}
          {(data as StudentDashboardData).progressReports.length > 0 && (
            <section style={{ marginTop: 28 }}>
              <h3 className="dashboard-section-title">Your Learning Progress</h3>
              <div className="dashboard-recommended-list">
                {(data as StudentDashboardData).progressReports.map((report) => (
                  <div key={report._id} className="dashboard-recommended-item">
                    <span>{report.course?.title ?? 'Course Progress'}</span>
                    <Link to="/dashboard/courses">View Details</Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'purple' | 'teal';
}> = ({ label, value, icon, color }) => (
  <div className="dashboard-metric-card">
    <div className={`dashboard-metric-icon dashboard-metric-icon--${color}`}>{icon}</div>
    <div className="dashboard-metric-content">
      <p className="dashboard-metric-value">{value}</p>
      <p className="dashboard-metric-label">{label}</p>
    </div>
  </div>
);
