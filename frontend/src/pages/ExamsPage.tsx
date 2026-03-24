import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

type AcademicExam = {
  _id: string;
  universityName: string;
  examName: string;
  examCode: string;
  examDate?: string | null;
  createdAt?: string;
  hasSyllabus?: boolean;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ExamsPage: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<AcademicExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();
  const syllabusInputRef = useRef<HTMLInputElement>(null);

  const [universityName, setUniversityName] = useState('');
  const [examName, setExamName] = useState('');
  const [examCode, setExamCode] = useState('');
  const [examDate, setExamDate] = useState('');
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
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
    setSyllabusFile(null);
    if (syllabusInputRef.current) syllabusInputRef.current.value = '';
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
    if (!syllabusFile) {
      setFormError('Please upload your syllabus as a PDF.');
      return;
    }
    if (syllabusFile.type !== 'application/pdf' && !syllabusFile.name.toLowerCase().endsWith('.pdf')) {
      setFormError('Syllabus must be a PDF file.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('universityName', u);
      formData.append('examName', n);
      formData.append('examCode', c);
      if (examDate.trim()) formData.append('examDate', new Date(examDate).toISOString());
      formData.append('syllabus', syllabusFile);
      const res = await fetch(`${API_BASE_URL}/api/academic-exams`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data?.message || 'Failed to add exam.');
        return;
      }
      closeModal();
      await fetchExams();
      showToast('Exam added successfully.');
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
      showToast('Exam deleted successfully.');
    } catch {
      setError('Could not delete exam.');
    } finally {
      setDeletingId(null);
    }
  };

  const examIdString = (id: string | { toString?: () => string }) =>
    typeof id === 'string' ? id : String(id);

  const handlePrepare = (exam: AcademicExam) => {
    if (!exam.hasSyllabus) {
      showToast('Add a new exam with a syllabus PDF to use Prepare.');
      return;
    }
    const id = examIdString(exam._id as string | { toString?: () => string });
    const q = new URLSearchParams();
    q.set('prepExam', id);
    q.set('examName', exam.examName);
    q.set('prepTrigger', String(Date.now()));
    navigate(`/dashboard/ai-tutor?${q.toString()}`);
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
            Add exams with a syllabus PDF, then use <strong>Prepare</strong> to open the AI Tutor with a study plan from your syllabus.
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
                    <th>Syllabus</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => {
                    const eid = examIdString(exam._id as string | { toString?: () => string });
                    return (
                    <tr key={eid}>
                      <td>{exam.universityName}</td>
                      <td>{exam.examName}</td>
                      <td><code className="bg-light px-2 py-1 rounded">{exam.examCode}</code></td>
                      <td>{formatExamDate(exam.examDate)}</td>
                      <td>
                        {exam.hasSyllabus ? (
                          <span className="badge text-bg-success">PDF</span>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex flex-wrap gap-1 justify-content-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => handlePrepare(exam)}
                            disabled={!exam.hasSyllabus}
                            title={
                              exam.hasSyllabus
                                ? 'Open AI Tutor with a study plan from your syllabus'
                                : 'Syllabus PDF required'
                            }
                          >
                            Prepare
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(eid)}
                            disabled={deletingId === eid}
                          >
                            {deletingId === eid ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
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
                <div className="mb-3">
                  <label htmlFor="modalSyllabusPdf" className="form-label">
                    Syllabus (PDF) <span className="text-danger">*</span>
                  </label>
                  <input
                    id="modalSyllabusPdf"
                    ref={syllabusInputRef}
                    type="file"
                    className="form-control"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setSyllabusFile(e.target.files?.[0] ?? null)}
                  />
                  <div className="form-text">Required. Used by AI Tutor when you click Prepare.</div>
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
