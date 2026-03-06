import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

type CourseRow = {
  _id: string;
  title: string;
  category: string;
  instructor: { _id: string; firstName?: string; lastName?: string; email?: string };
  students: number;
  status: string;
};

export const AdminCourseApprovalsPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchPending = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/admin/courses?status=pending', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCourses(res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setApprovingId(id);
    fetch(`/api/admin/courses/${id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCourses((prev) => prev.filter((c) => c._id !== id));
      })
      .finally(() => setApprovingId(null));
  };

  const instructorName = (c: CourseRow) =>
    [c.instructor?.firstName, c.instructor?.lastName].filter(Boolean).join(' ') || c.instructor?.email || '—';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Course Approvals</h1>
      <p className="text-slate-600">Review and approve courses that are pending approval.</p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Course</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Instructor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Students</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">Loading...</td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">No pending courses. All courses are approved.</td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{c.title}</td>
                    <td className="py-3 px-4 text-slate-600">{c.category || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{instructorName(c)}</td>
                    <td className="py-3 px-4 text-slate-600">{c.students}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleApprove(c._id)}
                        disabled={!!approvingId}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        {approvingId === c._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Approve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
