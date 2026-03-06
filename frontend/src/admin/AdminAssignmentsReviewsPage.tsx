import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Award } from 'lucide-react';

type ReviewRow = {
  _id: string;
  student: { _id: string; firstName?: string; lastName?: string; email?: string };
  assignment: { _id: string; title: string; totalMarks?: number };
  course: { _id: string; title: string } | null;
  submittedDate: string;
};

export const AdminAssignmentsReviewsPage: React.FC = () => {
  const [data, setData] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/admin/assignments/reviews', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const studentName = (r: ReviewRow) =>
    [r.student?.firstName, r.student?.lastName].filter(Boolean).join(' ') || r.student?.email || '—';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Assignment Reviews</h1>
      <p className="text-slate-600">Submissions waiting for grading. Open the assignment to evaluate.</p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Student</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Assignment</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Course</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Submitted</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">Loading...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">No submissions pending review.</td>
                </tr>
              ) : (
                data.map((r) => (
                  <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{studentName(r)}</td>
                    <td className="py-3 px-4 text-slate-600">{r.assignment?.title || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{r.course?.title || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{r.submittedDate ? new Date(r.submittedDate).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/dashboard/assignments/${r.assignment?._id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                      >
                        <Eye className="w-4 h-4" />
                        Review & Grade
                      </Link>
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
