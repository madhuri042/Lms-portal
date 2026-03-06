import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader } from '../components/Loader';
import { getYouTubeEmbedUrl } from '../utils/video';
import './CourseLearnPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface CourseVideo {
  title: string;
  videoUrl: string;
}

interface CourseLearn {
  _id: string;
  title: string;
  videos?: CourseVideo[];
}

type MySubmission = { status: string; marksObtained?: number; feedback?: string } | null;

interface CourseAssignment {
  _id: string;
  title: string;
  description?: string;
  dueDate: string;
  totalMarks: number;
  mySubmission?: MySubmission;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function getStatusLabel(sub: MySubmission | undefined): string {
  if (!sub) return 'Pending';
  if (sub.status === 'Evaluated') return 'Evaluated';
  return 'Submitted';
}

export const CourseLearnPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseLearn | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'lectures' | 'submissions'>('lectures');
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const videos = course?.videos ?? [];
  const selectedVideo = videos[selectedIndex];
  const embedUrl = selectedVideo ? getYouTubeEmbedUrl(selectedVideo.videoUrl) : null;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !id) {
      setLoading(false);
      setError('Please log in to view this course.');
      return;
    }

    const fetchCourse = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load course');
        setCourse(data.data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    const fetchProgress = async () => {
      if (!id || !token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/courses/${id}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data?.data?.completionPercentage != null) {
          setProgress(Math.round(Number(data.data.completionPercentage)));
        }
      } catch {
        // ignore
      }
    };

    fetchCourse();
    fetchProgress();
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'submissions' || !id) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setAssignmentsLoading(true);
    fetch(`${API_BASE_URL}/api/courses/${id}/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data?.success && Array.isArray(data?.data)) {
          setAssignments(data.data);
        } else {
          setAssignments([]);
        }
      })
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentsLoading(false));
  }, [activeTab, id]);

  if (loading) return <Loader message="Loading course..." />;
  if (error) return <div className="course-learn-error">{error}</div>;
  if (!course) return <div className="course-learn-error">Course not found.</div>;

  return (
    <div className="course-learn-shell">
      <header className="course-learn-header">
        <div className="course-learn-header-left">
          <Link to={`/dashboard/courses/${id}`} className="course-learn-back" aria-label="Back to course">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 className="course-learn-title">{course.title}</h1>
        </div>

        <nav className="course-learn-tabs" role="tablist">
          <button
            type="button"
            className={`course-learn-tab ${activeTab === 'lectures' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'lectures'}
            onClick={() => setActiveTab('lectures')}
          >
            LECTURES
          </button>
          <button
            type="button"
            className={`course-learn-tab ${activeTab === 'submissions' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'submissions'}
            onClick={() => setActiveTab('submissions')}
          >
            SUBMISSIONS
          </button>
        </nav>

        <div className="course-learn-mastery">
          <div className="course-learn-mastery-circle" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <span className="course-learn-mastery-value">{progress}%</span>
          </div>
          <span className="course-learn-mastery-label">MASTERY %</span>
        </div>
      </header>

      <div className="course-learn-main">
        <section className="course-learn-video-section">
          {activeTab === 'lectures' && (
            <div className="course-learn-video-wrap">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={selectedVideo?.title || 'Course video'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="course-learn-iframe"
                />
              ) : (
                <div className="course-learn-video-placeholder">
                  {videos.length === 0 ? (
                    <p>No lectures added yet.</p>
                  ) : (
                    <p>
                      <a href={selectedVideo?.videoUrl} target="_blank" rel="noopener noreferrer">Watch: {selectedVideo?.title || selectedVideo?.videoUrl}</a>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="course-learn-submissions-panel">
              {assignmentsLoading ? (
                <div className="course-learn-submissions-loading">Loading submissions…</div>
              ) : assignments.length === 0 ? (
                <div className="course-learn-submissions-empty">No assignments in this course yet.</div>
              ) : (
                <ul className="course-learn-submissions-list">
                  {assignments.map((a) => (
                    <li key={a._id} className="course-learn-submission-item">
                      <div className="course-learn-submission-main">
                        <Link to={`/dashboard/assignments/${a._id}`} className="course-learn-submission-title">
                          {a.title}
                        </Link>
                        <span className="course-learn-submission-due">Due {formatDate(a.dueDate)}</span>
                      </div>
                      <div className="course-learn-submission-meta">
                        <span className={`course-learn-submission-status course-learn-submission-status--${!a.mySubmission ? 'pending' : a.mySubmission.status === 'Evaluated' ? 'evaluated' : 'submitted'}`}>
                          {getStatusLabel(a.mySubmission)}
                        </span>
                        {a.mySubmission?.status === 'Evaluated' && a.mySubmission.marksObtained != null && (
                          <span className="course-learn-submission-marks">{a.mySubmission.marksObtained} / {a.totalMarks}</span>
                        )}
                        <Link to={`/dashboard/assignments/${a._id}`} className="course-learn-submission-open">
                          Open →
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <aside className="course-learn-sidebar">
          <div className="course-learn-modules-card">
            <h3 className="course-learn-modules-title">MODULES</h3>
            <p className="course-learn-modules-subtitle">{videos.length} Total Lesson{videos.length !== 1 ? 's' : ''}</p>
            <ul className="course-learn-lesson-list">
              {videos.map((video, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    className={`course-learn-lesson-btn ${selectedIndex === idx ? 'active' : ''}`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <span className="course-learn-lesson-num">{idx + 1}</span>
                    <span className="course-learn-lesson-title">{video.title || `Lesson ${idx + 1}`}</span>
                    <span className="course-learn-lesson-duration">— MINS</span>
                  </button>
                </li>
              ))}
            </ul>
            {videos.length === 0 && (
              <p className="course-learn-no-lessons">No lessons in this course yet.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
