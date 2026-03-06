import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2 } from 'lucide-react';

type Instructor = { _id: string; firstName?: string; lastName?: string; email?: string };

export const AdminCreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    instructor: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/admin/users?role=instructor', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setInstructors(res.data);
        if (res.data?.length) setForm((f) => ({ ...f, instructor: res.data[0]._id }));
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!form.description.trim()) {
      setError('Description is required.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    setError('');
    const body: Record<string, string> = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
    };
    if (form.instructor) body.instructor = form.instructor;

    fetch('/api/courses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) navigate('/dashboard/admin/courses');
        else setError(res.message || 'Failed to create course');
      })
      .catch(() => setError('Request failed'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Create Course</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Course title"
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Course description"
            maxLength={1000}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <input
            type="text"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g. Programming, Design"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Instructor</label>
          <select
            name="instructor"
            value={form.instructor}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {instructors.length === 0 && <option value="">No instructors found</option>}
            {instructors.map((i) => (
              <option key={i._id} value={i._id}>
                {[i.firstName, i.lastName].filter(Boolean).join(' ') || i.email}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Course
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/admin/courses')}
            className="px-4 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
