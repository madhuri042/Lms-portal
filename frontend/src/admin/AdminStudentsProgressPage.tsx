import React, { useEffect, useState } from 'react';
import { TrendingUp, User, BookOpen } from 'lucide-react';

type ProgressRow = {
  _id: string;
  student: { _id: string; firstName?: string; lastName?: string; email?: string };
  course: { _id: string; title: string };
  completionPercentage: number;
  updatedAt: string;
};

export const AdminStudentsProgressPage: React.FC = () => {
  const [data, setData] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/admin/students/progress', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const studentName = (r: ProgressRow) =>
    [r.student?.firstName, r.student?.lastName].filter(Boolean).join(' ') || r.student?.email || '—';

  const filtered = filterCourse
    ? data.filter((r) => r.course?.title?.toLowerCase().includes(filterCourse.toLowerCase()))
    : data;

  const courses = Array.from(new Set(data.map((r) => r.course?.title).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl font-bold text-slate-900">Students Progress</h1>
      </div>
      <p className="text-slate-600">Track completion percentage per student per course.</p>

      {courses.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Filter by course</label>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 max-w-xs"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Student</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Course</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Completion</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Last updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">Loading...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">No progress data yet.</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{studentName(r)}</span>
                    </td>
                    <td className="py-3 px-4 flex items-center gap-2 text-slate-600">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      {r.course?.title || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${Math.min(100, r.completionPercentage)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{r.completionPercentage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—'}
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
