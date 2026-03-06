import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Edit2, Trash2, UserX, Search } from 'lucide-react';

type UserRow = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt?: string;
};

export const AdminUserManagementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roleFilter = searchParams.get('role') || '';
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'student' | 'instructor' | 'admin'>(roleFilter as any || 'all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const q = filter === 'all' ? '' : `?role=${filter}`;
    fetch(`/api/admin/users${q}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setUsers(res.data);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    if (roleFilter) setFilter(roleFilter as any);
  }, [roleFilter]);

  const filtered = users.filter(
    (u) =>
      !search ||
      [u.firstName, u.lastName, u.email].some((s) => s?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleEdit = (id: string) => {
    // Placeholder: open edit modal
    console.log('Edit', id);
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Delete this user? This cannot be undone.')) console.log('Delete', id);
  };
  const handleSuspend = (id: string) => {
    console.log('Suspend', id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'student', 'instructor', 'admin'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilter(r)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === r ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {r === 'all' ? 'All Users' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-0 focus:ring-0 focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-900">
                      {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-800'
                            : u.role === 'instructor'
                            ? 'bg-violet-100 text-violet-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-600">Active</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(u._id)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSuspend(u._id)}
                          className="p-2 rounded-lg hover:bg-amber-50 text-amber-600"
                          title="Suspend"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u._id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                          title="Delete"
                        >
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
