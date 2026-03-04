import React, { useEffect, useState, useCallback } from 'react';
import { Loader } from '../components/Loader';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type StudentDirectoryEntry = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  enrolledCourses: string[];
  progress: number;
  avgGrade: number | null;
  status: string;
};

type CourseOption = {
  _id: string;
  title: string;
};

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  courseId: '',
};

export const ManageStudentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentDirectoryEntry[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentDirectoryEntry | null>(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [form, setForm] = useState(initialForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<StudentDirectoryEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDirectory = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const url = courseFilter
      ? `${API_BASE_URL}/api/instructor/students?courseId=${encodeURIComponent(courseFilter)}`
      : `${API_BASE_URL}/api/instructor/students`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.message || 'Failed to load student directory.');
      setStudents([]);
      setCourses(Array.isArray(data.courses) ? data.courses : []);
      return;
    }
    setError(null);
    setStudents(Array.isArray(data.data) ? data.data : []);
    setCourses(Array.isArray(data.courses) ? data.courses : []);
  }, [courseFilter]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view the student directory.');
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchDirectory().finally(() => setLoading(false));
  }, [fetchDirectory]);

  const openAddModal = () => {
    setForm(initialForm);
    setSubmitError(null);
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setSubmitError(null);
  };

  const openEditModal = (s: StudentDirectoryEntry) => {
    setEditingStudent(s);
    setEditForm({
      firstName: s.firstName || '',
      lastName: s.lastName || '',
      email: s.email || '',
      phone: s.phone || '',
      password: '',
      courseId: '',
    });
    setSubmitError(null);
  };

  const closeEditModal = () => {
    setEditingStudent(null);
    setSubmitError(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) {
      setSubmitError('Please fill all required fields.');
      return;
    }
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setSubmitError('Phone number must be exactly 10 digits.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/instructor/students`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: phoneDigits,
          ...(form.courseId ? { courseId: form.courseId } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data?.message || 'Failed to create student.');
        return;
      }
      closeAddModal();
      await fetchDirectory();
      showToast('Student added successfully.');
    } catch {
      setSubmitError('Could not connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSubmitError(null);
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      setSubmitError('Please fill first name, last name, email, and phone.');
      return;
    }
    const phoneDigits = editForm.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setSubmitError('Phone number must be exactly 10 digits.');
      return;
    }
    if (editForm.password.length > 0 && editForm.password.length < 6) {
      setSubmitError('Password must be at least 6 characters if provided.');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: phoneDigits,
      };
      if (editForm.password) body.password = editForm.password;
      const res = await fetch(`${API_BASE_URL}/api/instructor/students/${editingStudent._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data?.message || 'Failed to update student.');
        return;
      }
      closeEditModal();
      await fetchDirectory();
      showToast('Student updated successfully.');
    } catch {
      setSubmitError('Could not connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const performDelete = async (studentId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setDeleteConfirmId(studentId);
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/instructor/students/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Failed to remove student.');
        return;
      }
      setDeleteConfirmStudent(null);
      await fetchDirectory();
      showToast('Student removed from your courses.');
    } catch {
      setError('Could not connect to the server.');
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  if (loading) return <Loader message="Loading student directory..." />;

  return (
    <div className="manage-students-page">
      <header className="manage-students-header">
        <div>
          <h1 className="manage-students-title">Student Directory</h1>
          <p className="manage-students-subtitle">Monitor engagement and performance across your curriculum.</p>
        </div>
        <div className="manage-students-actions">
          <select
            className="manage-students-select"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            aria-label="Filter by course"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
          <button type="button" className="manage-students-add-btn" onClick={openAddModal} aria-label="Add student">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Add Student
          </button>
        </div>
      </header>

      {error && (
        <div className="manage-students-error" role="alert">
          {error}
        </div>
      )}

      {!error && (
        <div className="manage-students-table-wrap">
          <table className="manage-students-table">
            <thead>
              <tr>
                <th>STUDENT INFORMATION</th>
                <th>ENROLLED COURSE</th>
                <th>PROGRESS</th>
                <th>AVG. GRADE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="manage-students-empty">
                    No students to show. Enroll students in your courses or select a different course filter.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div className="manage-students-info">
                        <div className="manage-students-avatar" aria-hidden>
                          {(s.firstName || s.lastName || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="manage-students-name">
                            {[s.firstName, s.lastName].filter(Boolean).join(' ') || '—'}
                          </div>
                          <div className="manage-students-email">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="manage-students-courses">
                        {s.enrolledCourses.slice(0, 2).map((title, i) => (
                          <span key={i} className="manage-students-course-tag">
                            {title}
                          </span>
                        ))}
                        {s.enrolledCourses.length > 2 && (
                          <span className="manage-students-more">+{s.enrolledCourses.length - 2} more</span>
                        )}
                        {s.enrolledCourses.length === 0 && <span className="manage-students-none">—</span>}
                      </div>
                    </td>
                    <td>
                      <div className="manage-students-progress-wrap">
                        <div
                          className="manage-students-progress-bar"
                          role="progressbar"
                          aria-valuenow={s.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className={`manage-students-progress-fill ${s.progress >= 60 ? 'high' : 'low'}`}
                            style={{ width: `${s.progress}%` }}
                          />
                        </div>
                        <span className="manage-students-progress-pct">{s.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="manage-students-grade">
                        {s.avgGrade != null ? `${s.avgGrade}%` : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="manage-students-status">{s.status || 'ACTIVE'}</span>
                    </td>
                    <td>
                      <div className="manage-students-actions-cell">
                        <button
                          type="button"
                          className="manage-students-btn-modify"
                          onClick={() => openEditModal(s)}
                          aria-label={`Modify ${s.firstName} ${s.lastName}`}
                        >
                          Modify
                        </button>
                        <button
                          type="button"
                          className="manage-students-btn-delete"
                          onClick={() => setDeleteConfirmStudent(s)}
                          disabled={deleting && deleteConfirmId === s._id}
                          aria-label={`Remove ${s.firstName} ${s.lastName} from your courses`}
                        >
                          {deleting && deleteConfirmId === s._id ? 'Removing…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleteConfirmStudent && (
        <div
          className="confirm-popup-backdrop"
          onClick={() => !deleting && setDeleteConfirmStudent(null)}
          role="dialog"
          aria-modal
          aria-labelledby="confirm-popup-title"
        >
          <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-popup__icon-wrap">
              <svg className="confirm-popup__icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 id="confirm-popup-title" className="confirm-popup__title">Remove student?</h3>
            <p className="confirm-popup__message">
              Remove this student from all your courses? They will no longer be enrolled in any of your courses.
            </p>
            <div className="confirm-popup__actions">
              <button
                type="button"
                className="confirm-popup__btn confirm-popup__btn--cancel"
                onClick={() => setDeleteConfirmStudent(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-popup__btn confirm-popup__btn--remove"
                onClick={() => deleteConfirmStudent && performDelete(deleteConfirmStudent._id)}
                disabled={deleting}
              >
                {deleting && deleteConfirmId === deleteConfirmStudent._id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div
          className="manage-students-modal-backdrop"
          onClick={closeEditModal}
          role="dialog"
          aria-modal
          aria-labelledby="edit-student-title"
        >
          <div className="manage-students-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manage-students-modal-header">
              <h2 id="edit-student-title" className="manage-students-modal-title">Modify Student</h2>
              <button type="button" className="manage-students-modal-close" onClick={closeEditModal} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="manage-students-modal-form">
              {submitError && (
                <div className="manage-students-form-error" role="alert">
                  {submitError}
                </div>
              )}
              <div className="manage-students-form-row">
                <label className="manage-students-label" htmlFor="edit-firstName">First name *</label>
                <input
                  id="edit-firstName"
                  type="text"
                  className="manage-students-input"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="manage-students-form-row">
                <label className="manage-students-label" htmlFor="edit-lastName">Last name *</label>
                <input
                  id="edit-lastName"
                  type="text"
                  className="manage-students-input"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                  required
                  autoComplete="family-name"
                />
              </div>
              <div className="manage-students-form-row">
                <label className="manage-students-label" htmlFor="edit-email">Email *</label>
                <input
                  id="edit-email"
                  type="email"
                  className="manage-students-input"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="manage-students-form-row">
                <label className="manage-students-label" htmlFor="edit-phone">Phone (10 digits) *</label>
                <input
                  id="edit-phone"
                  type="tel"
                  className="manage-students-input"
                  value={editForm.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setEditForm((f) => ({ ...f, phone: digits }));
                  }}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  required
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
              <div className="manage-students-form-row">
                <label className="manage-students-label" htmlFor="edit-password">New password (optional)</label>
                <input
                  id="edit-password"
                  type="password"
                  className="manage-students-input"
                  value={editForm.password}
                  onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Leave blank to keep current"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="manage-students-modal-actions">
                <button type="button" className="manage-students-btn-cancel" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="manage-students-btn-submit" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addModalOpen && (
        <div
          className="manage-students-modal-backdrop"
          onClick={closeAddModal}
          role="dialog"
          aria-modal
          aria-labelledby="add-student-title"
        >
          <div className="manage-students-modal" onClick={(e) => e.stopPropagation()}>
            <div className="manage-students-modal-header">
              <h2 id="add-student-title" className="manage-students-modal-title">Add Student</h2>
              <button type="button" className="manage-students-modal-close" onClick={closeAddModal} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="manage-students-modal-form">
              {submitError && (
                <div className="manage-students-form-error" role="alert">
                  {submitError}
                </div>
              )}
              <div className="manage-students-form-row">
                <label className="manage-students-label" htmlFor="add-firstName">First name *</label>
                <input
                  id="add-firstName"
                  type="text"
                  className="manage-students-input"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="manage-students-form-row">
                <label className="manage-students-label" htmlFor="add-lastName">Last name *</label>
                <input
                  id="add-lastName"
                  type="text"
                  className="manage-students-input"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  required
                  autoComplete="family-name"
                />
              </div>
              <div className="manage-students-form-row">
                <label className="manage-students-label" htmlFor="add-email">Email *</label>
                <input
                  id="add-email"
                  type="email"
                  className="manage-students-input"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="manage-students-form-row">
                <label className="manage-students-label" htmlFor="add-phone">Phone (10 digits) *</label>
                <input
                  id="add-phone"
                  type="tel"
                  className="manage-students-input"
                  value={form.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm((f) => ({ ...f, phone: digits }));
                  }}
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  required
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
              <div className="manage-students-form-row">
                <label className="manage-students-label" htmlFor="add-courseId">Enroll in course (optional)</label>
                <select
                  id="add-courseId"
                  className="manage-students-input"
                  value={form.courseId}
                  onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                >
                  <option value="">None</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="manage-students-modal-actions">
                <button type="button" className="manage-students-btn-cancel" onClick={closeAddModal}>
                  Cancel
                </button>
                <button type="submit" className="manage-students-btn-submit" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
