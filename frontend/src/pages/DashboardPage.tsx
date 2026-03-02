import React, { useEffect, useState } from 'react';

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
  progressReports: ProgressReport[];
};

type DashboardPageProps = {
  user: User;
  onLogout: () => void;
};

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        let body: any = null;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            body = await res.json();
          } catch {
            // ignore JSON parse errors
          }
        }

        if (!res.ok || !body?.success) {
          const message =
            body?.message ||
            (res.status === 0
              ? 'Unable to reach server. Please check your connection or backend.'
              : 'Failed to load dashboard data.');
          throw new Error(message);
        }

        setData(body.data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong while loading dashboard.');
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, [user.role]);


  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="auth-brand" style={{ alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div className="auth-brand-badge">L</div>
          <h2 className="auth-brand-title">Lumina</h2>
          <p className="auth-brand-subtitle">Platform</p>
        </div>

        <nav style={{ flex: 1 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', fontWeight: 600 }}>Main Menu</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', color: 'var(--brand-primary)', fontWeight: 600, fontSize: '14px' }}>Dashboard</div>
          </div>
        </nav>

        <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{user.firstName} {user.lastName}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0, textTransform: 'capitalize' }}>{user.role}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="auth-submit"
            style={{ width: '100%', background: 'white', color: 'var(--error)', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-xs)' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header style={{ marginBottom: '40px' }}>
          <h1 className="auth-heading" style={{ textAlign: 'left', marginBottom: '4px' }}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
          </h1>
          <p className="auth-subheading" style={{ textAlign: 'left', marginBottom: 0 }}>
            Welcome back to your workspace.
          </p>
        </header>

        <section>
          {loading ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '64px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
            </div>
          ) : error ? (
            <div className="stat-card" style={{ textAlign: 'center', borderColor: 'var(--error)' }}>
              <p className="auth-error-text">{error}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="stat-grid">
                {user.role === 'admin' && data && (
                  <>
                    <StatCard label="Total Users" value={(data as AdminDashboardData).totalUsers} />
                    <StatCard label="Total Students" value={(data as AdminDashboardData).totalStudents} />
                    <StatCard label="Total Instructors" value={(data as AdminDashboardData).totalInstructors} />
                    <StatCard label="Total Courses" value={(data as AdminDashboardData).totalCourses} />
                  </>
                )}
                {user.role === 'instructor' && data && (
                  <>
                    <StatCard label="My Courses" value={(data as InstructorDashboardData).totalCourses} />
                    <StatCard label="Students Enrolled" value={(data as InstructorDashboardData).totalStudentsEnrolled} />
                    <StatCard label="Assignments" value={(data as InstructorDashboardData).totalAssignments} />
                  </>
                )}
                {user.role === 'student' && data && (
                  <>
                    <StatCard label="Enrolled Courses" value={(data as StudentDashboardData).totalEnrolledCourses} />
                    <StatCard label="Pending Tasks" value={(data as StudentDashboardData).pendingAssignments} />
                    <StatCard label="Upcoming Exams" value={(data as StudentDashboardData).upcomingExams} />
                  </>
                )}
              </div>

              {user.role === 'student' && data && (data as StudentDashboardData).progressReports.length > 0 && (
                <div className="glass-card">
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Your Learning Progress</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(data as StudentDashboardData).progressReports.map((report) => (
                      <div key={report._id} style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{report.course?.title ?? 'Course Progress'}</span>
                        <span style={{ fontSize: '14px', color: 'var(--brand-primary)', fontWeight: 600, cursor: 'pointer' }}>View Details</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="stat-card">
    <p className="stat-label">{label}</p>
    <p className="stat-value">{value}</p>
  </div>
);

