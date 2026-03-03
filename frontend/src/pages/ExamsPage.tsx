import React, { useEffect, useState } from 'react';

type AcademicExam = {
  _id: string;
  universityName: string;
  examName: string;
  examCode: string;
  examDate?: string | null;
  createdAt?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<AcademicExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [universityName, setUniversityName] = useState('');
  const [examName, setExamName] = useState('');
  const [examCode, setExamCode] = useState('');
  const [examDate, setExamDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchExams = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/academic-exams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Failed to load exams.');
        setExams([]);
        return;
      }
      if (data?.success && Array.isArray(data?.data)) {
        setExams(data.data);
      } else {
        setExams([]);
      }
    } catch {
      setError('Could not connect to the server.');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view exams.');
      setLoading(false);
      return;
    }
    fetchExams();
  }, []);

  const openAddModal = () => {
    setUniversityName('');
    setExamName('');
    setExamCode('');
    setExamDate('');
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError(null);
  };

  const formatExamDate = (d: string | null | undefined) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const u = universityName.trim();
    const n = examName.trim();
    const c = examCode.trim();
    if (!u || !n || !c) {
      setFormError('Please fill all fields.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        universityName: u,
        examName: n,
        examCode: c,
      };
      if (examDate.trim()) payload.examDate = new Date(examDate).toISOString();
      const res = await fetch(`${API_BASE_URL}/api/academic-exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data?.message || 'Failed to add exam.');
        return;
      }
      closeModal();
      await fetchExams();
      setSuccessMessage('Exam added successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setFormError('Could not add exam. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/academic-exams/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Failed to delete.');
        return;
      }
      await fetchExams();
      setSuccessMessage('Exam deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Could not delete exam.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
        <div>
          <h1 className="auth-heading mb-1" style={{ textAlign: 'left' }}>
            Academic Exams
          </h1>
          <p className="auth-subheading mb-0" style={{ textAlign: 'left' }}>
            Add and manage your university exams (name and code).
          </p>
        </div>
        <button type="button" className="btn btn-primary px-4 py-2" onClick={openAddModal}>
          <span className="me-2">+</span> Add exam
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Success popup */}
      {successMessage && (
        <div
          className="alert alert-success alert-dismissible fade show shadow-sm position-fixed top-0 start-50 translate-middle-x mt-3"
          style={{ zIndex: 1100, minWidth: 280 }}
          role="alert"
        >
          <span className="me-2">✓</span>
          {successMessage}
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setSuccessMessage(null)}
          />
        </div>
      )}

      {/* List of exams */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom">
          <h5 className="mb-0">My exams</h5>
        </div>
        <div className="card-body p-0">
          {exams.length === 0 ? (
            <div className="text-center text-secondary py-5">
              <p className="mb-0">No exams added yet. Click &quot;Add exam&quot; to add one.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-striped align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>University</th>
                    <th>Exam name</th>
                    <th>Exam code</th>
                    <th>Date</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam._id}>
                      <td>{exam.universityName}</td>
                      <td>{exam.examName}</td>
                      <td><code className="bg-light px-2 py-1 rounded">{exam.examCode}</code></td>
                      <td>{formatExamDate(exam.examDate)}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(exam._id)}
                          disabled={deletingId === exam._id}
                        >
                          {deletingId === exam._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add exam modal */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: 'block', position: 'fixed', inset: 0, zIndex: 1050 }}
          tabIndex={-1}
          aria-labelledby="addExamModalLabel"
          aria-modal
        >
          <div
            className="modal-backdrop fade show"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.35)',
              zIndex: 1040,
            }}
            onClick={closeModal}
            aria-hidden
          />
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ position: 'relative', zIndex: 1055 }}
            onClick={(e) => e.stopPropagation()}
          >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addExamModalLabel">Add exam</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={closeModal}
              />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="modalUniversityName" className="form-label">University name</label>
                  <input
                    id="modalUniversityName"
                    type="text"
                    className="form-control"
                    placeholder="e.g. ABC University"
                    value={universityName}
                    onChange={(e) => setUniversityName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="modalExamName" className="form-label">Exam name</label>
                  <input
                    id="modalExamName"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Mid-term Examination"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="modalExamCode" className="form-label">Exam code</label>
                  <input
                    id="modalExamCode"
                    type="text"
                    className="form-control"
                    placeholder="e.g. CS101-MID"
                    value={examCode}
                    onChange={(e) => setExamCode(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="modalExamDate" className="form-label">Exam date</label>
                  <input
                    id="modalExamDate"
                    type="date"
                    className="form-control"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                  />
                </div>
                {formError && (
                  <div className="alert alert-danger py-2 mb-0">{formError}</div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
