import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader } from '../components/Loader';
import { getCourseCoverUrl } from '../utils/courseCover';

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
  pendingSubmissions?: number;
};

type ProgressReport = {
  _id: string;
  course?: {
    _id: string;
    title: string;
  };
  [key: string]: unknown;
};

type WeeklyActivityDay = {
  dayLabel: string;
  date: string;
  count: number;
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
  weeklyActivity?: WeeklyActivityDay[];
};

type DashboardPageProps = {
  user: User;
  onLogout: () => void;
};

type PendingAssignment = {
  _id: string;
  title: string;
  dueDate: string;
  course: { _id: string; title: string } | string;
};

type DashboardExam = {
  _id: string;
  examName: string;
  universityName: string;
  examCode: string;
  examDate?: string | null;
  createdAt?: string;
};

type DashboardCourse = {
  _id: string;
  title: string;
  description: string;
  coverImage?: string;
  category?: string;
};

type InstructorStudentEntry = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  enrolledCourses: string[];
  progress: number;
  avgGrade: number | null;
  status: string;
};

function getCourseTitle(course: PendingAssignment['course']): string {
  if (typeof course === 'object' && course !== null && 'title' in course) return course.title;
  return '—';
}

function formatDueDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatExamDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return '—';
  }
}

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
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [exams, setExams] = useState<DashboardExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<DashboardExam | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<DashboardCourse[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<DashboardCourse[]>([]);
  const [teachingCourses, setTeachingCourses] = useState<DashboardCourse[]>([]);
  const [instructorStudents, setInstructorStudents] = useState<InstructorStudentEntry[]>([]);
  const recommendedScrollRef = useRef<HTMLDivElement>(null);
  const enrolledScrollRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef<HTMLDivElement>(null);
  const examsScrollRef = useRef<HTMLDivElement>(null);
  const teachingScrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (user.role !== 'student') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchPending = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.success || !Array.isArray(body?.data)) {
          setPendingAssignments([]);
          return;
        }
        const list = body.data as Array<{ _id: string; title: string; dueDate: string; course: PendingAssignment['course']; mySubmission?: unknown }>;
        const pending: PendingAssignment[] = list
          .filter((a) => !a.mySubmission)
          .slice(0, 10)
          .map((a) => ({ _id: a._id, title: a.title, dueDate: a.dueDate, course: a.course }));
        setPendingAssignments(pending);
      } catch {
        setPendingAssignments([]);
      }
    };

    void fetchPending();
  }, [user.role]);

  useEffect(() => {
    if (user.role !== 'student') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchExams = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/academic-exams`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.success || !Array.isArray(body?.data)) {
          setExams([]);
          return;
        }
        setExams((body.data as DashboardExam[]).slice(0, 10));
      } catch {
        setExams([]);
      }
    };

    void fetchExams();
  }, [user.role]);

  useEffect(() => {
    if (user.role !== 'student') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchRecommended = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/recommended-courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(body?.data)) {
          setRecommendedCourses(body.data.slice(0, 20));
        }
      } catch {
        setRecommendedCourses([]);
      }
    };

    const fetchEnrolled = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/courses/enrolled`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(body?.data)) {
          setEnrolledCourses(body.data);
        }
      } catch {
        setEnrolledCourses([]);
      }
    };

    fetchRecommended();
    fetchEnrolled();
  }, [user.role]);

  useEffect(() => {
    if (user.role !== 'instructor') return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const fetchTeaching = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/courses/teaching`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(body?.data)) {
          setTeachingCourses(body.data);
        }
      } catch {
        setTeachingCourses([]);
      }
    };
    fetchTeaching();

    const fetchInstructorStudents = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/instructor/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(body?.data)) {
          setInstructorStudents(body.data.slice(0, 8));
        }
      } catch {
        setInstructorStudents([]);
      }
    };
    fetchInstructorStudents();
  }, [user.role]);

  const scrollRow = useCallback((ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    const el = ref.current;
    if (!el) return;
    const step = 320;
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  }, []);

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

  const welcomeSubtitle =
    user.role === 'instructor'
      ? 'Manage your courses and students here.'
      : user.role === 'admin'
        ? 'Overview of your platform and users.'
        : 'Track your learning goals and achievements here.';

  return (
    <div className="dashboard-page">
      <header className="dashboard-welcome">
        <h1>Welcome back, {firstName}!</h1>
        <p>{welcomeSubtitle}</p>
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

      {/* Instructor dashboard */}
      {user.role === 'instructor' && data && (
        <>
          <div className="dashboard-metrics">
            <Link to="/dashboard/courses" style={{ textDecoration: 'none', color: 'inherit' }}>
              <MetricCard label="My Courses" value={(data as InstructorDashboardData).totalCourses} icon={<IconBook />} color="blue" />
            </Link>
            <Link to="/dashboard/students" style={{ textDecoration: 'none', color: 'inherit' }}>
              <MetricCard label="Students Enrolled" value={(data as InstructorDashboardData).totalStudentsEnrolled} icon={<IconUsers />} color="green" />
            </Link>
            <Link to="/dashboard/assignments" style={{ textDecoration: 'none', color: 'inherit' }}>
              <MetricCard label="Assignments" value={(data as InstructorDashboardData).totalAssignments} icon={<IconClipboard />} color="purple" />
            </Link>
            <Link to="/dashboard/assignments" style={{ textDecoration: 'none', color: 'inherit' }}>
              <MetricCard
                label="Pending to evaluate"
                value={(data as InstructorDashboardData).pendingSubmissions ?? 0}
                icon={<IconSend />}
                color="amber"
              />
            </Link>
            <MetricCard label="Exams" value={(data as InstructorDashboardData).totalExams} icon={<IconGraduation />} color="teal" />
          </div>

          {/* Quick actions */}
          <section className="dashboard-section">
            <h3 className="dashboard-section-title">Quick actions</h3>
            <div className="dashboard-quick-actions">
              <Link to="/dashboard/courses" className="dashboard-quick-action">
                <IconBook />
                <span>My courses</span>
              </Link>
              <Link to="/dashboard/students" className="dashboard-quick-action">
                <IconUsers />
                <span>Manage students</span>
              </Link>
              <Link to="/dashboard/assignments" className="dashboard-quick-action">
                <IconClipboard />
                <span>Assignments</span>
              </Link>
              <Link to="/dashboard/reports" className="dashboard-quick-action">
                <IconPerformance />
                <span>System reports</span>
              </Link>
            </div>
          </section>

          {/* Your courses — horizontal row */}
          <section className="dashboard-section">
            <div className="dashboard-row-header">
              <h3 className="dashboard-section-title mb-0">Your courses</h3>
              {teachingCourses.length > 0 && (
                <div className="dashboard-row-arrows">
                  <button
                    type="button"
                    className="dashboard-arrow-btn"
                    onClick={() => scrollRow(teachingScrollRef, 'left')}
                    aria-label="Scroll left"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button
                    type="button"
                    className="dashboard-arrow-btn"
                    onClick={() => scrollRow(teachingScrollRef, 'right')}
                    aria-label="Scroll right"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}
            </div>
            {teachingCourses.length === 0 ? (
              <p className="dashboard-pending-empty">You don&apos;t have any courses yet.</p>
            ) : (
              <div className="dashboard-courses-row dashboard-row-no-scroll" ref={teachingScrollRef}>
                {teachingCourses.map((course) => (
                  <Link
                    key={course._id}
                    to={`/dashboard/courses/${course._id}`}
                    className="dashboard-course-card"
                  >
                    <div className="dashboard-course-card__cover">
                      <img src={getCourseCoverUrl(API_BASE_URL, course)} alt="" className="dashboard-course-card__img" />
                      {course.category && <span className="dashboard-course-card__category">{course.category}</span>}
                    </div>
                    <div className="dashboard-course-card__body">
                      <h4 className="dashboard-course-card__title">{course.title}</h4>
                      <p className="dashboard-course-card__desc">
                        {course.description ? (course.description.length > 80 ? course.description.slice(0, 80) + '…' : course.description) : '—'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Your students — list below My courses; click -> Manage Students */}
          <section className="dashboard-section">
            <div className="dashboard-row-header">
              <h3 className="dashboard-section-title mb-0">Your students</h3>
              {instructorStudents.length > 0 && (
                <Link to="/dashboard/students" className="dashboard-section-link">
                  Manage students →
                </Link>
              )}
            </div>
            {instructorStudents.length === 0 ? (
              <p className="dashboard-pending-empty">No students enrolled in your courses yet.</p>
            ) : (
              <ul className="dashboard-students-list">
                {instructorStudents.map((s) => (
                  <li key={s._id}>
                    <Link to="/dashboard/students" className="dashboard-student-row">
                      <div className="dashboard-student-avatar" aria-hidden>
                        {[s.firstName, s.lastName].filter(Boolean).join(' ').charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="dashboard-student-info">
                        <span className="dashboard-student-name">
                          {[s.firstName, s.lastName].filter(Boolean).join(' ') || '—'}
                        </span>
                        <span className="dashboard-student-email">{s.email}</span>
                        {s.enrolledCourses.length > 0 && (
                          <span className="dashboard-student-courses">
                            {s.enrolledCourses.slice(0, 2).join(', ')}
                            {s.enrolledCourses.length > 2 ? ` +${s.enrolledCourses.length - 2}` : ''}
                          </span>
                        )}
                      </div>
                      <span className="dashboard-student-progress">{s.progress}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
            <Link to="/dashboard/assignments?filter=all" style={{ textDecoration: 'none', color: 'inherit' }}>
              <MetricCard
                label="Total assignments"
                value={(data as StudentDashboardData).totalAssignments}
                icon={<IconClipboard />}
                color="green"
              />
            </Link>
            <Link to="/dashboard/assignments?filter=submitted" style={{ textDecoration: 'none', color: 'inherit' }}>
              <MetricCard
                label="Submitted"
                value={(data as StudentDashboardData).submittedAssignmentsCount}
                icon={<IconSend />}
                color="amber"
              />
            </Link>
            <Link to="/dashboard/assignments?filter=evaluated" style={{ textDecoration: 'none', color: 'inherit' }}>
              <MetricCard
                label="Evaluated"
                value={(data as StudentDashboardData).evaluatedAssignmentsCount}
                icon={<IconCheckCircle />}
                color="teal"
              />
            </Link>
          </div>

          {/* Weekly Activity — submissions per day (last 7 days) */}
          <div className="dashboard-charts-row">
            <div className="dashboard-card">
              <h3 className="dashboard-card-title">Weekly Activity</h3>
              <p className="dashboard-activity-caption">Assignment submissions in the last 7 days</p>
              <div className="dashboard-activity-bars">
                {((data as StudentDashboardData).weeklyActivity || []).length === 0 ? (
                  <p className="dashboard-activity-empty">No activity data yet.</p>
                ) : (
                  ((data as StudentDashboardData).weeklyActivity || []).map((day) => {
                    const maxCount = Math.max(
                      ...((data as StudentDashboardData).weeklyActivity || []).map((d) => d.count),
                      1
                    );
                    const heightPx = Math.round((day.count / maxCount) * 100) + 8;
                    return (
                      <div key={day.date} className="dashboard-activity-bar-cell">
                        <div
                          className="dashboard-activity-bar"
                          style={{ ['--h' as string]: `${heightPx}px` }}
                          title={`${day.dayLabel}: ${day.count} submission${day.count !== 1 ? 's' : ''}`}
                        />
                        <span className="dashboard-activity-count">{day.count}</span>
                      </div>
                    );
                  })
                )}
              </div>
              {((data as StudentDashboardData).weeklyActivity || []).length > 0 && (
                <div className="dashboard-activity-labels">
                  {((data as StudentDashboardData).weeklyActivity || []).map((day) => (
                    <span key={day.date}>{day.dayLabel}</span>
                  ))}
                </div>
              )}
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
                    ['--progress-color' as string]: 'var(--success)',
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

          {/* Quick actions */}
          <section className="dashboard-section">
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

          {/* Recommended courses — horizontal row with arrows */}
          <section className="dashboard-section">
            <div className="dashboard-row-header">
              <h3 className="dashboard-section-title mb-0">Recommended for you</h3>
              {recommendedCourses.length > 0 && (
                <div className="dashboard-row-arrows">
                  <button
                    type="button"
                    className="dashboard-arrow-btn"
                    onClick={() => scrollRow(recommendedScrollRef, 'left')}
                    aria-label="Scroll left"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button
                    type="button"
                    className="dashboard-arrow-btn"
                    onClick={() => scrollRow(recommendedScrollRef, 'right')}
                    aria-label="Scroll right"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}
            </div>
            {recommendedCourses.length === 0 ? (
              <p className="dashboard-pending-empty">No recommendations right now.</p>
            ) : (
              <div className="dashboard-courses-row dashboard-row-no-scroll" ref={recommendedScrollRef}>
                {recommendedCourses.map((course) => (
                  <Link
                    key={course._id}
                    to={`/dashboard/courses/${course._id}`}
                    className="dashboard-course-card"
                  >
                    <div className="dashboard-course-card__cover">
                      <img src={getCourseCoverUrl(API_BASE_URL, course)} alt="" className="dashboard-course-card__img" />
                      {course.category && <span className="dashboard-course-card__category">{course.category}</span>}
                    </div>
                    <div className="dashboard-course-card__body">
                      <h4 className="dashboard-course-card__title">{course.title}</h4>
                      <p className="dashboard-course-card__desc">
                        {course.description ? (course.description.length > 80 ? course.description.slice(0, 80) + '…' : course.description) : '—'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Enrolled courses — horizontal row with arrows */}
          <section className="dashboard-section">
            <div className="dashboard-row-header">
              <h3 className="dashboard-section-title mb-0">Your enrolled courses</h3>
              {enrolledCourses.length > 0 && (
                <div className="dashboard-row-arrows">
                  <button
                    type="button"
                    className="dashboard-arrow-btn"
                    onClick={() => scrollRow(enrolledScrollRef, 'left')}
                    aria-label="Scroll left"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button
                    type="button"
                    className="dashboard-arrow-btn"
                    onClick={() => scrollRow(enrolledScrollRef, 'right')}
                    aria-label="Scroll right"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}
            </div>
            {enrolledCourses.length === 0 ? (
              <p className="dashboard-pending-empty">You haven&apos;t enrolled in any courses yet.</p>
            ) : (
              <div className="dashboard-courses-row dashboard-row-no-scroll" ref={enrolledScrollRef}>
                {enrolledCourses.map((course) => (
                  <Link
                    key={course._id}
                    to={`/dashboard/courses/${course._id}`}
                    className="dashboard-course-card"
                  >
                    <div className="dashboard-course-card__cover">
                      <img src={getCourseCoverUrl(API_BASE_URL, course)} alt="" className="dashboard-course-card__img" />
                      {course.category && <span className="dashboard-course-card__category">{course.category}</span>}
                    </div>
                    <div className="dashboard-course-card__body">
                      <h4 className="dashboard-course-card__title">{course.title}</h4>
                      <p className="dashboard-course-card__desc">
                        {course.description ? (course.description.length > 80 ? course.description.slice(0, 80) + '…' : course.description) : '—'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Pending assignments — single row with arrows, no scrollbar */}
          <section className="dashboard-section">
            <div className="dashboard-row-header">
              <h3 className="dashboard-section-title mb-0">Pending assignments</h3>
              {pendingAssignments.length > 0 && (
                <div className="dashboard-row-arrows">
                  <button
                    type="button"
                    className="dashboard-arrow-btn"
                    onClick={() => scrollRow(pendingScrollRef, 'left')}
                    aria-label="Scroll left"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button
                    type="button"
                    className="dashboard-arrow-btn"
                    onClick={() => scrollRow(pendingScrollRef, 'right')}
                    aria-label="Scroll right"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}
            </div>
            {pendingAssignments.length === 0 ? (
              <p className="dashboard-pending-empty">No pending assignments right now.</p>
            ) : (
              <div className="dashboard-pending-row dashboard-row-no-scroll" ref={pendingScrollRef}>
                {pendingAssignments.map((a) => (
                  <Link
                    key={a._id}
                    to={`/dashboard/assignments?assignment=${a._id}`}
                    className="dashboard-pending-card"
                  >
                    <span className="dashboard-pending-card__title">{a.title}</span>
                    <span className="dashboard-pending-card__course">{getCourseTitle(a.course)}</span>
                    <span className="dashboard-pending-card__due">Due {formatDueDate(a.dueDate)}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Exams — row with arrows, no scrollbar */}
          <section className="dashboard-section">
            <div className="dashboard-row-header">
              <h3 className="dashboard-section-title mb-0">Exams</h3>
              {exams.length > 0 && (
                <div className="dashboard-row-arrows">
                  <button
                    type="button"
                    className="dashboard-arrow-btn"
                    onClick={() => scrollRow(examsScrollRef, 'left')}
                    aria-label="Scroll left"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button
                    type="button"
                    className="dashboard-arrow-btn"
                    onClick={() => scrollRow(examsScrollRef, 'right')}
                    aria-label="Scroll right"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}
            </div>
            {exams.length === 0 ? (
              <p className="dashboard-pending-empty">No upcoming exams.</p>
            ) : (
              <div className="dashboard-pending-row dashboard-exams-row dashboard-row-no-scroll" ref={examsScrollRef}>
                {exams.map((exam) => (
                  <button
                    key={exam._id}
                    type="button"
                    className="dashboard-exam-card"
                    onClick={() => setSelectedExam(exam)}
                  >
                    <span className="dashboard-pending-card__title">{exam.examName}</span>
                    <span className="dashboard-pending-card__course">{exam.universityName}</span>
                    <span className="dashboard-pending-card__due">{formatExamDate(exam.examDate)}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Exam details popup */}
          {selectedExam && (
            <div
              className="dashboard-exam-popup-backdrop"
              onClick={() => setSelectedExam(null)}
              role="dialog"
              aria-modal
              aria-labelledby="dashboard-exam-popup-title"
            >
              <div
                className="dashboard-exam-popup"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="dashboard-exam-popup__header">
                  <h2 id="dashboard-exam-popup-title" className="dashboard-exam-popup__title">Exam details</h2>
                  <button
                    type="button"
                    className="dashboard-exam-popup__close"
                    onClick={() => setSelectedExam(null)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="dashboard-exam-popup__body">
                  <div className="dashboard-exam-popup__row">
                    <span className="dashboard-exam-popup__label">Exam name</span>
                    <span className="dashboard-exam-popup__value">{selectedExam.examName}</span>
                  </div>
                  <div className="dashboard-exam-popup__row">
                    <span className="dashboard-exam-popup__label">University</span>
                    <span className="dashboard-exam-popup__value">{selectedExam.universityName}</span>
                  </div>
                  <div className="dashboard-exam-popup__row">
                    <span className="dashboard-exam-popup__label">Exam code</span>
                    <span className="dashboard-exam-popup__value">
                      <code className="dashboard-exam-popup__code">{selectedExam.examCode}</code>
                    </span>
                  </div>
                  <div className="dashboard-exam-popup__row">
                    <span className="dashboard-exam-popup__label">Exam date</span>
                    <span className="dashboard-exam-popup__value">{formatExamDate(selectedExam.examDate)}</span>
                  </div>
                  {selectedExam.createdAt && (
                    <div className="dashboard-exam-popup__row">
                      <span className="dashboard-exam-popup__label">Added on</span>
                      <span className="dashboard-exam-popup__value">{formatExamDate(selectedExam.createdAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
