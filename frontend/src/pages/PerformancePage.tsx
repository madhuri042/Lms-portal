import React, { useEffect, useState } from 'react';
import { Loader } from '../components/Loader';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type MySubmission = {
  status: string;
  marksObtained?: number;
} | null;

type Assignment = {
  _id: string;
  title: string;
  course: { _id: string; title: string } | string;
  totalMarks: number;
  mySubmission?: MySubmission;
};

type AcademicExam = {
  _id: string;
  universityName: string;
  examName: string;
  examCode: string;
  examDate?: string | null;
  createdAt?: string;
};

function getCourseName(course: Assignment['course']): string {
  if (typeof course === 'object' && course !== null && 'title' in course) return course.title;
  return '—';
}

function getGrade(percent: number): { letter: string; className: string } {
  if (percent >= 90) return { letter: 'A', className: 'performance-page__grade-badge--a' };
  if (percent >= 70) return { letter: 'B', className: 'performance-page__grade-badge--b' };
  if (percent >= 50) return { letter: 'C', className: 'performance-page__grade-badge--c' };
  return { letter: 'D', className: 'performance-page__grade-badge--d' };
}

function formatExamDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return '—';
  }
}

export const PerformancePage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<AcademicExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<AcademicExam | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view performance.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const [assignRes, examsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/assignments`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/api/academic-exams`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const assignData = await assignRes.json().catch(() => ({}));
        const examsData = await examsRes.json().catch(() => ({}));
        if (!assignRes.ok) {
          setError(assignData?.message || 'Failed to load data.');
          setAssignments([]);
        } else {
          setAssignments(assignData?.success && Array.isArray(assignData?.data) ? assignData.data : []);
        }
        if (examsRes.ok && examsData?.success && Array.isArray(examsData?.data)) {
          setExams(examsData.data);
        } else {
          setExams([]);
        }
      } catch {
        setError('Could not connect to the server.');
        setAssignments([]);
        setExams([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const evaluated = assignments.filter(
    (a) => a.mySubmission && a.mySubmission.status === 'Evaluated'
  );
  const totalMarksObtained = evaluated.reduce(
    (sum, a) => sum + (a.mySubmission?.marksObtained ?? 0),
    0
  );
  const totalMaxMarks = evaluated.reduce((sum, a) => sum + a.totalMarks, 0);
  const overallPercent =
    totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;
  const grade = getGrade(overallPercent);
  const avgPercent = evaluated.length > 0 ? overallPercent : 0;

  if (loading) return <Loader message="Loading performance..." />;

  return (
    <div className="performance-page">
      <header className="performance-page__header">
        <h1 className="performance-page__title">Performance analytics</h1>
        <p className="performance-page__subtitle">
          Track your scores and progress across evaluated assignments.
        </p>
      </header>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!error && (
        <>
          {/* Stats row */}
          <div className="performance-page__stats">
            <div className="performance-page__stat-card">
              <p className="performance-page__stat-value">{evaluated.length}</p>
              <p className="performance-page__stat-label">Evaluated assignments</p>
            </div>
            <div className="performance-page__stat-card">
              <p className="performance-page__stat-value">{totalMarksObtained} / {totalMaxMarks}</p>
              <p className="performance-page__stat-label">Total marks</p>
            </div>
            <div className="performance-page__stat-card">
              <p className="performance-page__stat-value">{avgPercent}%</p>
              <p className="performance-page__stat-label">Average score</p>
            </div>
            <div className="performance-page__stat-card">
              <p className="performance-page__stat-value">
                <span className={`performance-page__grade-badge ${grade.className}`}>{grade.letter}</span>
              </p>
              <p className="performance-page__stat-label">Grade</p>
            </div>
          </div>

          {/* Overall score ring + chart row */}
          <div className="performance-page__analytics-row">
            <div className="performance-page__card" style={{ marginBottom: 0 }}>
              <h3 className="performance-page__card-title">Overall score</h3>
              <div className="performance-page__score-ring-wrap">
                <div
                  className="performance-page__score-ring"
                  style={{
                    ['--perf-deg' as string]: totalMaxMarks > 0 ? `${(overallPercent / 100) * 360}deg` : '0deg',
                    ['--perf-ring-color' as string]: overallPercent >= 70 ? '#059669' : overallPercent >= 50 ? '#d97706' : '#dc2626',
                  }}
                >
                  <div className="performance-page__score-ring-inner">
                    <span className="performance-page__score-ring-value">{overallPercent}%</span>
                    <span className="performance-page__score-ring-label">of max marks</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="performance-page__card" style={{ marginBottom: 0 }}>
              <h3 className="performance-page__card-title">Marks by assignment</h3>
              {evaluated.length === 0 ? (
                <p className="performance-page__empty">
                  No evaluated assignments yet. Complete and submit assignments to see your scores here.
                </p>
              ) : (
                <div className="performance-page__chart-bars">
                  {evaluated.slice(0, 8).map((a) => {
                    const obtained = a.mySubmission?.marksObtained ?? 0;
                    const max = a.totalMarks || 1;
                    const pct = Math.round((obtained / max) * 100);
                    return (
                      <div key={a._id} className="performance-page__chart-row">
                        <span className="performance-page__chart-label" title={a.title}>{a.title}</span>
                        <div className="performance-page__chart-bar-wrap">
                          <div
                            className="performance-page__chart-bar-fill"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="performance-page__chart-value">{obtained}/{max}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* My exams — fills empty space, View more opens popup */}
          <div className="performance-page__card">
            <h3 className="performance-page__card-title">My exams</h3>
            {exams.length === 0 ? (
              <p className="performance-page__exam-empty">
                No exams added yet. Add exams from the Exams page to see them here.
              </p>
            ) : (
              <div className="performance-page__exams-grid">
                {exams.slice(0, 6).map((exam) => (
                  <div key={exam._id} className="performance-page__exam-card">
                    <p className="performance-page__exam-card-title">{exam.examName}</p>
                    <p className="performance-page__exam-card-meta">{exam.universityName}</p>
                    <span className="performance-page__exam-card-code">{exam.examCode}</span>
                    {exam.examDate && (
                      <p className="performance-page__exam-card-meta" style={{ marginTop: 4 }}>
                        Date: {formatExamDate(exam.examDate)}
                      </p>
                    )}
                    <button
                      type="button"
                      className="performance-page__exam-view-more"
                      onClick={() => setSelectedExam(exam)}
                    >
                      View more
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evaluated assignments table */}
          <div className="performance-page__card">
            <h3 className="performance-page__card-title">Evaluated assignments</h3>
            {evaluated.length === 0 ? (
              <p className="performance-page__empty">
                No evaluated assignments yet. Submit assignments and ask your instructor to evaluate them.
              </p>
            ) : (
              <div className="performance-page__table-wrap">
                <table className="performance-page__table">
                  <thead>
                    <tr>
                      <th>Assignment</th>
                      <th>Course</th>
                      <th style={{ textAlign: 'right' }}>Marks</th>
                      <th style={{ textAlign: 'right' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluated.map((a) => {
                      const obtained = a.mySubmission?.marksObtained ?? 0;
                      const pct = a.totalMarks > 0 ? Math.round((obtained / a.totalMarks) * 100) : 0;
                      return (
                        <tr key={a._id}>
                          <td>{a.title}</td>
                          <td>{getCourseName(a.course)}</td>
                          <td className="perf-marks" style={{ textAlign: 'right' }}>
                            {obtained} / {a.totalMarks}
                          </td>
                          <td style={{ textAlign: 'right' }}>{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Exam details popup */}
          {selectedExam && (
            <div
              className="performance-page__popup-backdrop"
              onClick={() => setSelectedExam(null)}
              role="dialog"
              aria-modal
              aria-labelledby="exam-popup-title"
            >
              <div
                className="performance-page__popup"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="performance-page__popup-header">
                  <h2 id="exam-popup-title" className="performance-page__popup-title">Exam details</h2>
                  <button
                    type="button"
                    className="performance-page__popup-close"
                    onClick={() => setSelectedExam(null)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="performance-page__popup-body">
                  <div className="performance-page__popup-row">
                    <p className="performance-page__popup-label">Exam name</p>
                    <p className="performance-page__popup-value">{selectedExam.examName}</p>
                  </div>
                  <div className="performance-page__popup-row">
                    <p className="performance-page__popup-label">University</p>
                    <p className="performance-page__popup-value">{selectedExam.universityName}</p>
                  </div>
                  <div className="performance-page__popup-row">
                    <p className="performance-page__popup-label">Exam code</p>
                    <p className="performance-page__popup-value">
                      <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 6 }}>
                        {selectedExam.examCode}
                      </code>
                    </p>
                  </div>
                  <div className="performance-page__popup-row">
                    <p className="performance-page__popup-label">Exam date</p>
                    <p className="performance-page__popup-value">{formatExamDate(selectedExam.examDate)}</p>
                  </div>
                  {selectedExam.createdAt && (
                    <div className="performance-page__popup-row">
                      <p className="performance-page__popup-label">Added on</p>
                      <p className="performance-page__popup-value">{formatExamDate(selectedExam.createdAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
