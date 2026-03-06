import React, { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  UserCog,
  BookOpen,
  CheckCircle,
  Clock,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type UserType = { id: string; firstName: string; lastName: string; email: string; role: string };

interface AdminDashboardPageProps {
  user: UserType;
}

type DashboardStats = {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  activeCourses: number;
  pendingApprovals: number;
};

type ActivityItem = {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userId?: string;
};

type Analytics = {
  userGrowth: { date: string; count: number; label: string }[];
  courseEnrollments: { name: string; enrollments: number }[];
  assignmentCompletionRate: number;
  totalSubmissions: number;
  evaluatedSubmissions: number;
};

const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/dashboard/admin', { headers }).then((r) => r.json()),
      fetch('/api/dashboard/admin/activity', { headers }).then((r) => r.json()),
      fetch('/api/dashboard/admin/analytics', { headers }).then((r) => r.json()),
    ])
      .then(([statsRes, activityRes, analyticsRes]) => {
        if (statsRes.success) setStats(statsRes.data);
        if (activityRes.success) setActivity(activityRes.data);
        if (analyticsRes.success) setAnalytics(analyticsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Admin';

  const statCards = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, bg: 'bg-blue-50', iconColor: 'text-blue-600' },
        { label: 'Total Students', value: stats.totalStudents, icon: GraduationCap, bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
        { label: 'Total Instructors', value: stats.totalInstructors, icon: UserCog, bg: 'bg-violet-50', iconColor: 'text-violet-600' },
        { label: 'Total Courses', value: stats.totalCourses, icon: BookOpen, bg: 'bg-amber-50', iconColor: 'text-amber-600' },
        { label: 'Active Courses', value: stats.activeCourses, icon: CheckCircle, bg: 'bg-green-50', iconColor: 'text-green-600' },
        { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock, bg: 'bg-orange-50', iconColor: 'text-orange-600' },
      ]
    : [];

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {name}!</h1>
        <p className="text-slate-600 mt-1">Overview of your platform and users.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="text-sm text-slate-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">User Growth (Last 7 Days)</h2>
          {analytics?.userGrowth?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={analytics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" fill="#818cf8" fillOpacity={0.4} name="New users" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-slate-400">No data</div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Assignment Completion Rate</h2>
          {analytics != null ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Evaluated', value: analytics.evaluatedSubmissions, color: '#4f46e5' },
                      { name: 'Pending', value: analytics.totalSubmissions - analytics.evaluatedSubmissions, color: '#e2e8f0' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[0, 1].map((i) => (
                      <Cell key={i} fill={[COLORS[0], '#e2e8f0'][i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-2xl font-bold text-indigo-600">{analytics.assignmentCompletionRate}%</p>
              <p className="text-sm text-slate-500">completion rate</p>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-slate-400">No data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Course Enrollments (Top 10)</h2>
          {analytics?.courseEnrollments?.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.courseEnrollments} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="enrollments" fill="#4f46e5" name="Enrollments" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-400">No courses yet</div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Recent Activity
          </h2>
          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {activity.length === 0 ? (
              <p className="text-slate-500 text-sm">No recent activity</p>
            ) : (
              activity.slice(0, 10).map((item) => (
                <div key={item.id} className="flex gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800">{item.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatTime(item.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
