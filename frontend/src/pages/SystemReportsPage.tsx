import React, { useEffect, useState } from 'react';
import { Loader } from '../components/Loader';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type EnrollmentByCourse = {
  courseId: string;
  courseTitle: string;
  count: number;
};

type ProgressBucket = {
  range: string;
  count: number;
};

type TopStudent = {
  _id: string;
  name: string;
  email: string;
  progress: number;
  avgGrade: number | null;
};

type StudentAnalytics = {
  totalStudents: number;
  enrollmentByCourse: EnrollmentByCourse[];
  progressDistribution: ProgressBucket[];
  averageProgress: number;
  averageGrade: number | null;
  studentsWithGrades: number;
  topStudents: TopStudent[];
};

export const SystemReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StudentAnalytics | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view reports.');
      setLoading(false);
      return;
    }
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports/student-analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(body?.message || 'Failed to load analytics.');
          return;
        }
        if (body?.success && body?.data) {
          setData(body.data);
        }
      } catch {
        setError('Could not connect to the server.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <Loader message="Loading analytics..." />;

  if (error) {
    return (
      <div className="reports-page">
        <header className="reports-header">
          <h1 className="reports-title">System Reports</h1>
          <p className="reports-subtitle">Student analytics and performance overview.</p>
        </header>
        <div className="reports-error" role="alert">
          {error}
        </div>
      </div>
    );
  }

  const analytics = data!;
  const maxEnrollment = Math.max(...analytics.enrollmentByCourse.map((c) => c.count), 1);
  const maxProgressCount = Math.max(...analytics.progressDistribution.map((b) => b.count), 1);

  return (
    <div className="reports-page">
      <header className="reports-header">
        <h1 className="reports-title">System Reports</h1>
        <p className="reports-subtitle">Student analytics and performance overview.</p>
      </header>

      <section className="reports-kpi-grid">
        <div className="reports-kpi-card">
          <div className="reports-kpi-icon reports-kpi-icon--blue">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="reports-kpi-content">
            <span className="reports-kpi-value">{analytics.totalStudents}</span>
            <span className="reports-kpi-label">Total Students</span>
          </div>
        </div>
        <div className="reports-kpi-card">
          <div className="reports-kpi-icon reports-kpi-icon--green">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="reports-kpi-content">
            <span className="reports-kpi-value">{analytics.averageProgress}%</span>
            <span className="reports-kpi-label">Avg. Progress</span>
          </div>
        </div>
        <div className="reports-kpi-card">
          <div className="reports-kpi-icon reports-kpi-icon--amber">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="reports-kpi-content">
            <span className="reports-kpi-value">{analytics.averageGrade != null ? `${analytics.averageGrade}%` : '—'}</span>
            <span className="reports-kpi-label">Avg. Grade</span>
          </div>
        </div>
        <div className="reports-kpi-card">
          <div className="reports-kpi-icon reports-kpi-icon--purple">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M9 14h6" />
              <path d="M9 18h6" />
            </svg>
          </div>
          <div className="reports-kpi-content">
            <span className="reports-kpi-value">{analytics.studentsWithGrades}</span>
            <span className="reports-kpi-label">Graded</span>
          </div>
        </div>
      </section>

      <div className="reports-grid">
        <section className="reports-card">
          <h3 className="reports-card-title">Enrollment by course</h3>
          {analytics.enrollmentByCourse.length === 0 ? (
            <p className="reports-empty">No courses with enrollments.</p>
          ) : (
            <ul className="reports-enrollment-list">
              {analytics.enrollmentByCourse.map((c) => (
                <li key={c.courseId} className="reports-enrollment-item">
                  <div className="reports-enrollment-info">
                    <span className="reports-enrollment-title">{c.courseTitle}</span>
                    <span className="reports-enrollment-count">{c.count} students</span>
                  </div>
                  <div className="reports-enrollment-bar-wrap">
                    <div
                      className="reports-enrollment-bar"
                      style={{ width: `${(c.count / maxEnrollment) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="reports-card">
          <h3 className="reports-card-title">Progress distribution</h3>
          <div className="reports-progress-bars">
            {analytics.progressDistribution.map((b) => (
              <div key={b.range} className="reports-progress-row">
                <span className="reports-progress-label">{b.range}</span>
                <div className="reports-progress-track">
                  <div
                    className="reports-progress-fill"
                    style={{ width: `${(b.count / maxProgressCount) * 100}%` }}
                  />
                </div>
                <span className="reports-progress-count">{b.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={`reports-card reports-card--full ${analytics.topStudents.length === 0 ? 'reports-card--compact' : ''}`}>
        <h3 className="reports-card-title">Top performers</h3>
        {analytics.topStudents.length === 0 ? (
          <p className="reports-empty">No graded submissions yet.</p>
        ) : (
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Progress</th>
                  <th>Avg. grade</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topStudents.map((s) => (
                  <tr key={s._id}>
                    <td className="reports-table-name">{s.name}</td>
                    <td className="reports-table-email">{s.email}</td>
                    <td>
                      <span className="reports-table-progress">{s.progress}%</span>
                    </td>
                    <td>
                      <span className="reports-table-grade">
                        {s.avgGrade != null ? `${s.avgGrade}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
