import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Edit2, Trash2, Plus, Clock, Loader2 } from 'lucide-react';

type CourseRow = {
  _id: string;
  title: string;
  category: string;
  instructor: { _id: string; firstName?: string; lastName?: string; email?: string };
  students: number;
  status: string;
};

export const AdminCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchCourses = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCourses(res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
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
        if (res.success) fetchCourses();
      })
      .finally(() => setApprovingId(null));
  };

  const instructorName = (c: CourseRow) =>
    [c.instructor?.firstName, c.instructor?.lastName].filter(Boolean).join(' ') || c.instructor?.email || '—';

  const isApproved = (c: CourseRow) => (c.status || 'approved') === 'approved';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Course Management</h1>
        <Link
          to="/dashboard/admin/courses/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Course
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Course</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Instructor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Students</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">Loading...</td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">No courses yet</td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium text-slate-900">{c.title}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{c.category || '—'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{instructorName(c)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{c.students}</td>
                    <td className="py-3 px-4">
                      {isApproved(c) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isApproved(c) && (
                          <button
                            type="button"
                            onClick={() => handleApprove(c._id)}
                            disabled={!!approvingId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            {approvingId === c._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                        )}
                        <button type="button" className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button type="button" className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
