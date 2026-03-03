import React, { useEffect, useState } from 'react';
import { Loader } from '../components/Loader';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type Submission = {
  _id: string;
  assignment: { _id: string; title: string; totalMarks: number };
  student: { _id: string; firstName: string; lastName: string; email: string };
  status: string;
  fileUrl?: string;
  marksObtained?: number;
  feedback?: string;
  createdAt: string;
};

export const SubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [marks, setMarks] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchPending = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/assignments/submissions/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Failed to load submissions.');
        setSubmissions([]);
        return;
      }
      setSubmissions(data?.data ?? []);
    } catch {
      setError('Could not connect to the server.');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleEvaluate = async (submissionId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const marksNum = parseInt(marks, 10);
    if (isNaN(marksNum) || marksNum < 0) {
      setError('Please enter a valid marks value.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/assignments/submissions/${submissionId}/evaluate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ marksObtained: marksNum, feedback: feedback.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Failed to evaluate.');
        return;
      }
      setEvaluatingId(null);
      setMarks('');
      setFeedback('');
      setSuccessMessage('Submission evaluated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchPending();
    } catch {
      setError('Could not submit evaluation.');
    } finally {
      setIsSaving(false);
    }
  };

  const openEvaluate = (sub: Submission) => {
    setEvaluatingId(sub._id);
    setMarks(sub.marksObtained != null ? String(sub.marksObtained) : '');
    setFeedback(sub.feedback || '');
  };

  if (loading) return <Loader message="Loading submissions..." />;

  return (
    <div>
      <h1 className="auth-heading" style={{ textAlign: 'left', marginBottom: 4 }}>Submissions to evaluate</h1>
      <p className="auth-subheading" style={{ textAlign: 'left', marginBottom: 24 }}>
        Review and grade student assignment submissions.
      </p>

      {successMessage && (
        <div className="alert alert-success mb-3" role="alert">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="card border shadow-sm">
          <div className="card-body text-center text-secondary py-5">
            <p className="mb-0">No pending submissions to evaluate.</p>
          </div>
        </div>
      ) : (
        <div className="card border shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-striped align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Assignment</th>
                    <th>Student</th>
                    <th>Submitted</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub._id}>
                      <td>{sub.assignment?.title ?? '—'}</td>
                      <td>
                        {sub.student?.firstName} {sub.student?.lastName}
                        {sub.student?.email && (
                          <small className="d-block text-muted">{sub.student.email}</small>
                        )}
                      </td>
                      <td>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => openEvaluate(sub)}
                          disabled={evaluatingId !== null}
                        >
                          Evaluate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {evaluatingId && (
        <div
          className="modal fade show"
          style={{ display: 'block', position: 'fixed', inset: 0, zIndex: 1050 }}
          tabIndex={-1}
        >
          <div
            className="modal-backdrop fade show"
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1040 }}
            onClick={() => setEvaluatingId(null)}
            aria-hidden
          />
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ position: 'relative', zIndex: 1055 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Evaluate submission</h5>
                <button type="button" className="btn-close" onClick={() => setEvaluatingId(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Marks obtained</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Feedback (optional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Comments for the student..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setEvaluatingId(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isSaving}
                  onClick={() => handleEvaluate(evaluatingId!)}
                >
                  {isSaving ? 'Saving...' : 'Save evaluation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
