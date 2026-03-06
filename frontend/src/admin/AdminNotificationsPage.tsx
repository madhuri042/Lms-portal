import React, { useEffect, useState } from 'react';
import { Bell, User, FileText } from 'lucide-react';

type NotifRow = {
  _id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  user?: { firstName?: string; lastName?: string; email?: string };
  assignment?: { title: string };
  createdAt: string;
};

export const AdminNotificationsPage: React.FC = () => {
  const [data, setData] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/admin/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const userName = (n: NotifRow) =>
    n.user ? [n.user.firstName, n.user.lastName].filter(Boolean).join(' ') || n.user.email : 'User';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
      </div>
      <p className="text-slate-600">Platform-wide notifications (e.g. assignment submissions).</p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading...</div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No notifications.</div>
          ) : (
            data.map((n) => (
              <div
                key={n._id}
                className={`flex gap-4 p-4 hover:bg-slate-50 ${!n.read ? 'bg-indigo-50/50' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  {n.assignment ? (
                    <FileText className="w-5 h-5 text-slate-600" />
                  ) : (
                    <User className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{n.title}</p>
                  {n.message && <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>}
                  <p className="text-xs text-slate-400 mt-1">
                    {userName(n)} · {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                  </p>
                </div>
                {n.link && (
                  <a
                    href={n.link}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
                  >
                    View
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
