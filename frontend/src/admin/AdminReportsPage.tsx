import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type Analytics = {
  userGrowth: { date: string; count: number; label: string }[];
  courseEnrollments: { name: string; enrollments: number }[];
  assignmentCompletionRate: number;
  totalSubmissions: number;
  evaluatedSubmissions: number;
};

const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#a78bfa', '#8b5cf6'];

export const AdminReportsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/dashboard/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setAnalytics(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const completionData = analytics
    ? [
        { name: 'Evaluated', value: analytics.evaluatedSubmissions, color: '#4f46e5' },
        { name: 'Pending', value: analytics.totalSubmissions - analytics.evaluatedSubmissions, color: '#e2e8f0' },
      ]
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Student Growth (Last 7 Days)</h2>
          {analytics?.userGrowth?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} name="New users" dot={{ fill: '#4f46e5' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">No data</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Course Popularity (Enrollments)</h2>
          {analytics?.courseEnrollments?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.courseEnrollments}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#64748b" angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="enrollments" fill="#4f46e5" name="Enrollments" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">No courses yet</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Assignment Completion Rate</h2>
        {completionData.some((d) => d.value > 0) ? (
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {completionData.map((_, i) => (
                    <Cell key={i} fill={completionData[i].color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center md:text-left">
              <p className="text-4xl font-bold text-indigo-600">{analytics?.assignmentCompletionRate ?? 0}%</p>
              <p className="text-slate-500 mt-1">of submissions evaluated</p>
              <p className="text-sm text-slate-400 mt-2">
                {analytics?.evaluatedSubmissions ?? 0} of {analytics?.totalSubmissions ?? 0} total
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-slate-400">No submission data yet</div>
        )}
      </div>
    </div>
  );
};
