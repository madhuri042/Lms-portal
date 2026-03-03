import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader } from '../components/Loader';

type MySubmission = {
  status: string;
  marksObtained?: number;
  feedback?: string;
} | null;

type Assignment = {
  _id: string;
  title: string;
  description: string;
  type?: 'mcq' | 'programming';
  course: { _id: string; title: string } | string;
  instructor: { _id: string; firstName: string; lastName: string } | string;
  dueDate: string;
  totalMarks: number;
  mySubmission?: MySubmission;
  createdAt?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function getCourseName(course: Assignment['course']): string {
  if (typeof course === 'object' && course !== null && 'title' in course) return course.title;
  return '—';
}

function getStatusDisplay(mySubmission: MySubmission): { label: string; slug: 'pending' | 'submitted' | 'evaluated' } {
  if (!mySubmission) return { label: 'Pending', slug: 'pending' };
  if (mySubmission.status === 'Evaluated') return { label: 'Evaluated', slug: 'evaluated' };
  return { label: 'Submitted', slug: 'submitted' };
}

export const AssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'evaluated'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionType, setSubmissionType] = useState<'document' | 'code'>('document');
  const [searchParams] = useSearchParams();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Deep linking: Handle assignment and filter params
  useEffect(() => {
    const assignmentId = searchParams.get('assignment');
    const filterParam = searchParams.get('filter') as any;

    if (assignmentId) {
      setSelectedId(assignmentId);
      // Reset filter to all if assignment is specified to ensure it's visible
      if (!filterParam) setFilter('all');
    }

    if (filterParam && ['all', 'pending', 'submitted', 'evaluated'].includes(filterParam)) {
      setFilter(filterParam);
    }
  }, [searchParams]);

  const fetchAssignments = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Failed to load assignments.');
        setAssignments([]);
        return;
      }
      if (data?.success && Array.isArray(data?.data)) {
        setAssignments(data.data);
      } else {
        setAssignments([]);
      }
    } catch {
      setError('Could not connect to the server.');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view assignments.');
      setLoading(false);
      return;
    }
    fetchAssignments();
  }, []);

  const filtered = assignments.filter((a) => {
    const sub = a.mySubmission ?? null;
    if (filter === 'all') return true;
    if (filter === 'pending') return !sub;
    if (filter === 'submitted') return sub && sub.status !== 'Evaluated';
    if (filter === 'evaluated') return sub && sub.status === 'Evaluated';
    return true;
  });

  const pendingCount = assignments.filter((a) => !a.mySubmission).length;
  const submittedCount = assignments.filter((a) => a.mySubmission && a.mySubmission.status !== 'Evaluated').length;
  const evaluatedCount = assignments.filter((a) => a.mySubmission && a.mySubmission.status === 'Evaluated').length;

  const selected = assignments.find((a) => String(a._id) === selectedId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setSubmitError(`File must be under ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setSubmitError(null);
    setUploadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setSubmitError(`File must be under ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setSubmitError(null);
    setUploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleSubmitAssignment = async () => {
    if (!selectedId || !selected) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    // Only MCQ goes to the exam page to answer questions; programming submits file here
    if (selected.type === 'mcq') {
      navigate(`/dashboard/assignments/${selectedId}`);
      return;
    }
    if (!uploadFile) {
      setSubmitError('Please select a file to upload.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const form = new FormData();
      form.append('file', uploadFile);
      const res = await fetch(`${API_BASE_URL}/api/assignments/${selectedId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data?.message || 'Submission failed.');
        return;
      }
      setUploadFile(null);
      await fetchAssignments();
      setSuccessMessage('Assignment submitted successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setSubmitError('Could not submit. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader message="Loading assignments..." />;

  return (
    <div className="assignments-page">
      <header className="assignments-page__header">
        <h1 className="assignments-page__title">Assignments</h1>
        <p className="assignments-page__subtitle">Submit your coursework and track grades.</p>
      </header>

      {error && (
        <div className="assignments-page__error" role="alert">
          {error}
        </div>
      )}

      <div className="assignments-page__stats">
        <div className="assignments-page__stat">
          <div className="assignments-page__stat-value">{pendingCount}</div>
          <div className="assignments-page__stat-label">Pending</div>
        </div>
        <div className="assignments-page__stat">
          <div className="assignments-page__stat-value">{submittedCount}</div>
          <div className="assignments-page__stat-label">Submitted</div>
        </div>
        <div className="assignments-page__stat">
          <div className="assignments-page__stat-value">{evaluatedCount}</div>
          <div className="assignments-page__stat-label">Evaluated</div>
        </div>
      </div>

      <div className="assignments-page__layout">
        <aside
          className={`assignments-page__list-panel ${!selectedId ? 'assignments-page__list-panel--full' : ''}`}
        >
          <div className="assignments-page__list-header">
            <h2 className="assignments-page__list-title">My assignments</h2>
          </div>
          <div className="assignments-page__filters">
            <button
              type="button"
              className={`assignments-page__filter-btn ${filter === 'all' ? 'assignments-page__filter-btn--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`assignments-page__filter-btn ${filter === 'pending' ? 'assignments-page__filter-btn--active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending {pendingCount > 0 && `(${pendingCount})`}
            </button>
            <button
              type="button"
              className={`assignments-page__filter-btn ${filter === 'submitted' ? 'assignments-page__filter-btn--active' : ''}`}
              onClick={() => setFilter('submitted')}
            >
              Submitted {submittedCount > 0 && `(${submittedCount})`}
            </button>
            <button
              type="button"
              className={`assignments-page__filter-btn ${filter === 'evaluated' ? 'assignments-page__filter-btn--active' : ''}`}
              onClick={() => setFilter('evaluated')}
            >
              Evaluated {evaluatedCount > 0 && `(${evaluatedCount})`}
            </button>
          </div>
          <div className="assignments-page__list">
            {filtered.length === 0 ? (
              <p className="assignments-page__empty-list">No assignments match.</p>
            ) : (
              filtered.map((a) => {
                const statusDisplay = getStatusDisplay(a.mySubmission ?? null);
                const isSelected = String(a._id) === selectedId;
                return (
                  <div
                    key={a._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedId(String(a._id));
                      setSubmitError(null);
                      setUploadFile(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(String(a._id));
                        setSubmitError(null);
                        setUploadFile(null);
                      }
                    }}
                    className={`assignments-page__list-item assignments-page__list-item--${statusDisplay.slug} ${isSelected ? 'assignments-page__list-item--selected' : ''}`}
                  >
                    <span className={`assignments-page__item-status assignments-page__item-status--${statusDisplay.slug}`}>
                      {statusDisplay.label}
                    </span>
                    <p className="assignments-page__item-due">Due {formatDate(a.dueDate)}</p>
                    <p className="assignments-page__item-title">{a.title}</p>
                    <p className="assignments-page__item-course">{getCourseName(a.course)}</p>
                    {a.mySubmission?.status === 'Evaluated' && a.mySubmission.marksObtained != null && (
                      <p className="assignments-page__item-marks">
                        {a.mySubmission.marksObtained} / {a.totalMarks}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {selectedId && (
          <section className="assignments-page__detail-panel">
            <div className="assignments-page__detail-inner">
              {selected ? (
                <>
                  <div className="assignments-page__detail-header">
                    <div>
                      <h2 className="assignments-page__detail-title">{selected.title}</h2>
                      <p className="assignments-page__detail-course">{getCourseName(selected.course)}</p>
                    </div>
                    <button
                      type="button"
                      className="assignments-page__detail-close"
                      onClick={() => setSelectedId(null)}
                      aria-label="Close assignment"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div className="assignments-page__meta-row">
                    <div className="assignments-page__meta-card">
                      <p className="assignments-page__meta-label">Total marks</p>
                      <p className="assignments-page__meta-value">{selected.totalMarks}</p>
                    </div>
                    <div className="assignments-page__meta-card">
                      <p className="assignments-page__meta-label">Due date</p>
                      <p className="assignments-page__meta-value">{formatDate(selected.dueDate)}</p>
                    </div>
                    <div className="assignments-page__meta-card">
                      <p className="assignments-page__meta-label">Status</p>
                      <p className="assignments-page__meta-value">
                        {getStatusDisplay(selected.mySubmission ?? null).label}
                      </p>
                    </div>
                  </div>

                  {selected.mySubmission?.status === 'Evaluated' && (selected.mySubmission.marksObtained != null || selected.mySubmission.feedback) && (
                    <div className="assignments-page__description-card" style={{ marginBottom: 24 }}>
                      <p className="assignments-page__description-title">Evaluation</p>
                      {selected.mySubmission.marksObtained != null && (
                        <p className="assignments-page__description-body" style={{ marginBottom: 8 }}>
                          Marks: <strong>{selected.mySubmission.marksObtained} / {selected.totalMarks}</strong>
                        </p>
                      )}
                      {selected.mySubmission.feedback && (
                        <p className="assignments-page__description-body">{selected.mySubmission.feedback}</p>
                      )}
                    </div>
                  )}

                  <div className="assignments-page__description-card">
                    <p className="assignments-page__description-title">Description</p>
                    <p className="assignments-page__description-body">{selected.description || '—'}</p>
                  </div>

                  {selected.type === 'mcq' && (
                    <div style={{ marginBottom: 24 }}>
                      <button
                        type="button"
                        className="assignments-page__action-btn"
                        onClick={() => navigate(`/dashboard/assignments/${selected._id}`)}
                      >
                        Take MCQ exam
                      </button>
                    </div>
                  )}

                  {selected.type !== 'mcq' && (
                    <>
                      {selected.mySubmission ? (
                        <div className="assignments-page__upload-disabled">
                          <p className="assignments-page__upload-disabled-text">
                            {selected.mySubmission.status === 'Evaluated'
                              ? 'This assignment has been evaluated. Upload is closed.'
                              : 'You have already submitted this assignment. Upload is closed.'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="assignments-page__description-title" style={{ marginBottom: 10 }}>Submission type</p>
                          <div className="assignments-page__type-tabs">
                            <button
                              type="button"
                              className={`assignments-page__type-tab ${submissionType === 'document' ? 'assignments-page__type-tab--active' : ''}`}
                              onClick={() => setSubmissionType('document')}
                            >
                              Document
                            </button>
                            <button
                              type="button"
                              className={`assignments-page__type-tab ${submissionType === 'code' ? 'assignments-page__type-tab--active' : ''}`}
                              onClick={() => setSubmissionType('code')}
                            >
                              Code / ZIP
                            </button>
                          </div>

                          <div
                            role="button"
                            tabIndex={0}
                            className={`assignments-page__upload-zone ${uploadFile ? 'assignments-page__upload-zone--has-file' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileInputRef.current?.click();
                              }
                            }}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
                              onChange={handleFileChange}
                              aria-label="Choose file"
                            />
                            <div className="assignments-page__upload-icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8.5 6.5a.5.5 0 0 0-1 0v3.793L6.354 9.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 10.293V6.5z" />
                                <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
                              </svg>
                            </div>
                            <p className="assignments-page__upload-text">Drop your file here or click to browse</p>
                            <p className="assignments-page__upload-hint">PDF, DOCX, ZIP, JS, PY, etc. — up to {MAX_FILE_SIZE_MB} MB</p>
                            {uploadFile && (
                              <p style={{ marginTop: 12, fontWeight: 600, color: 'var(--ap-accent)' }}>{uploadFile.name}</p>
                            )}
                          </div>

                          {submitError && (
                            <div className="assignments-page__error" style={{ marginBottom: 16 }}>{submitError}</div>
                          )}

                          <button
                            type="button"
                            className="assignments-page__submit-btn"
                            onClick={handleSubmitAssignment}
                            disabled={submitting || !uploadFile}
                          >
                            {submitting ? (
                              'Submitting…'
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
                                </svg>
                                Submit assignment
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                <p className="assignments-page__empty-detail">Assignment unavailable. Select another from the list.</p>
              )}
            </div>
          </section>
        )}
      </div>

      {successMessage && (
        <div className="assignments-page__toast" role="status">
          <span>✓ {successMessage}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setSuccessMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 4 }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
