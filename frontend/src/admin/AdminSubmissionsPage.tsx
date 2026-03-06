import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Award, CheckCircle } from 'lucide-react';

type SubRow = {
  _id: string;
  student: { _id: string; firstName?: string; lastName?: string; email?: string };
  assignment: { _id: string; title: string };
  course: { _id: string; title: string } | null;
  status: string;
  submittedDate: string;
  marksObtained?: number;
};

export const AdminSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/admin/submissions', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSubmissions(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const studentName = (s: SubRow) =>
    [s.student?.firstName, s.student?.lastName].filter(Boolean).join(' ') || s.student?.email || '—';

  const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString() : '—');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Assignment Submissions</h1>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Student</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Assignment</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Course</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Submitted Date</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">Loading...</td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">No submissions yet</td>
                </tr>
              ) : (
                submissions.map((s) => (
                  <tr key={s._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">{studentName(s)}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{s.assignment?.title || '—'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{s.course?.title || '—'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.status === 'Evaluated'
                            ? 'bg-green-100 text-green-800'
                            : s.status === 'Submitted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{formatDate(s.submittedDate)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/dashboard/assignments/${s.assignment?._id}`}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                          title="Review"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-amber-50 text-amber-600"
                          title="Grade"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-green-50 text-green-600"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
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
