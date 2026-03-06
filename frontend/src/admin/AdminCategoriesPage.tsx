import React, { useEffect, useState } from 'react';
import { Tags, BookOpen } from 'lucide-react';

type CategoryRow = { name: string; count: number };

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setCategories(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Tags className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
      </div>
      <p className="text-slate-600">Course categories are derived from existing courses. New categories appear when you create or edit a course with a category name.</p>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Courses</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2} className="py-12 text-center text-slate-500">Loading...</td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-12 text-center text-slate-500">No categories yet. Create courses with a category to see them here.</td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.name} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{cat.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{cat.count}</td>
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
