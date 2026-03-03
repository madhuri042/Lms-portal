import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader } from '../components/Loader';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type McqQuestion = {
  _id: string;
  questionText: string;
  options: string[];
  marks: number;
};

type AssignmentDetail = {
  _id: string;
  title: string;
  description: string;
  type: 'mcq' | 'programming';
  course: { _id: string; title: string };
  instructor: { firstName: string; lastName: string };
  dueDate: string;
  totalMarks: number;
  questions?: McqQuestion[];
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return iso;
  }
}

export const AssignmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MCQ state
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [mcqSubmitting, setMcqSubmitting] = useState(false);
  const [mcqSubmitted, setMcqSubmitted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !id) {
      setError('Missing token or assignment id.');
      setLoading(false);
      return;
    }
    const fetchAssignment = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/assignments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let data: { success?: boolean; data?: AssignmentDetail; message?: string } = {};
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await res.json().catch(() => ({}));
        }
        if (!res.ok) {
          const msg =
            data?.message ||
            (res.status === 404
              ? 'This assignment was not found. It may have been removed.'
              : `Failed to load assignment (${res.status})`);
          setError(msg);
          setAssignment(null);
          return;
        }
        if (data?.success && data?.data) {
          const assign = data.data;
          if (assign.type !== 'mcq') {
            setLoading(false);
            navigate(`/dashboard/assignments?assignment=${id}`, { replace: true });
            return;
          }
          setAssignment(assign);
          if (assign.questions) {
            const initial: Record<string, string> = {};
            assign.questions.forEach((q: McqQuestion) => { initial[q._id] = ''; });
            setMcqAnswers(initial);
          }
        } else {
          setError(data?.message || 'Assignment not found.');
          setAssignment(null);
        }
      } catch {
        setError('Could not connect to the server. Is the backend running?');
        setAssignment(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [id, navigate]);

  const handleMcqSubmit = async () => {
    if (!assignment || assignment.type !== 'mcq' || !assignment.questions?.length) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const answers = assignment.questions.map((q) => ({
      questionId: q._id,
      answerGiven: mcqAnswers[q._id] || '',
    }));
    setMcqSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/assignments/${id}/submit-mcq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setMcqSubmitted(true);
      } else {
        setError(data?.message || 'Failed to submit.');
      }
    } catch {
      setError('Could not submit.');
    } finally {
      setMcqSubmitting(false);
    }
  };

  if (loading) return <Loader message="Loading assignment..." />;

  if (error || !assignment) {
    return (
      <div>
        <button
          type="button"
          className="btn btn-outline-secondary mb-3"
          onClick={() => navigate('/dashboard/assignments')}
        >
          ← Back to Assignments
        </button>
        <div className="alert alert-danger">
          {error || 'Assignment not found.'}
          <p className="mb-0 mt-2 small">Return to the list to see current assignments.</p>
        </div>
      </div>
    );
  }

  /* MCQ-only: this page is only used for MCQ assignments; programming redirects to submission page */
  return (
    <div>
      <button type="button" className="btn btn-outline-secondary mb-3" onClick={() => navigate('/dashboard/assignments')}>
        ← Back to Assignments
      </button>

      <div className="card border shadow-sm">
        <div className="card-header bg-light">
          <h5 className="mb-0">{assignment.title}</h5>
          <small className="text-secondary">
            {assignment.course?.title} · Due {formatDate(assignment.dueDate)} · {assignment.totalMarks} marks
          </small>
        </div>
        <div className="card-body">
          {assignment.description && <p className="text-secondary mb-4">{assignment.description}</p>}
          {mcqSubmitted ? (
            <div className="alert alert-success">Your answers have been submitted successfully.</div>
          ) : (
            <>
              {assignment.questions && assignment.questions.length > 0 ? (
                <>
                  {assignment.questions.map((q, idx) => (
                    <div key={q._id} className="mb-4 p-3 border rounded">
                      <p className="fw-semibold mb-2">
                        {idx + 1}. {q.questionText} <span className="text-muted">({q.marks} mark{q.marks !== 1 ? 's' : ''})</span>
                      </p>
                      <div className="ms-3">
                        {q.options?.map((opt, i) => (
                          <div key={i} className="form-check">
                            <input
                              type="radio"
                              name={q._id}
                              id={`${q._id}-${i}`}
                              className="form-check-input"
                              value={opt}
                              checked={mcqAnswers[q._id] === opt}
                              onChange={() => setMcqAnswers((prev) => ({ ...prev, [q._id]: opt }))}
                            />
                            <label className="form-check-label" htmlFor={`${q._id}-${i}`}>
                              {opt}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleMcqSubmit}
                    disabled={mcqSubmitting}
                  >
                    {mcqSubmitting ? 'Submitting...' : 'Submit assignment'}
                  </button>
                </>
              ) : (
                <p className="text-secondary">No questions in this assignment.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
