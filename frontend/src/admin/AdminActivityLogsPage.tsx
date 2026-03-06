import React, { useEffect, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';

type ActivityItem = {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  meta?: Record<string, unknown>;
};

export const AdminActivityLogsPage: React.FC = () => {
  const [data, setData] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    fetch(`/api/admin/activity?page=${page}&limit=20`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
          setTotalPages(res.totalPages ?? 1);
          setTotal(res.total ?? 0);
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString();
  };

  const typeColor = (type: string) => {
    if (type === 'graded') return 'bg-green-100 text-green-800';
    if (type === 'submitted') return 'bg-blue-100 text-blue-800';
    if (type === 'course_created') return 'bg-violet-100 text-violet-800';
    if (type === 'registered') return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
      </div>
      <p className="text-slate-600">Platform-wide activity: submissions, grading, course creation, and registrations.</p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500">Loading...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500">No activity yet.</td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor(item.type)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{item.description}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{formatTime(item.timestamp)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
