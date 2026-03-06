import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Building2, Lock } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    platformName: 'Lumina',
    supportEmail: '',
    minCourseApproval: '1',
    allowPublicSignup: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: would call API to save settings
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <SettingsIcon className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>
      <p className="text-slate-600">Platform and security settings. Changes are stored locally in this demo.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-500" />
            General
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Platform name</label>
              <input
                type="text"
                name="platformName"
                value={form.platformName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Support email</label>
              <input
                type="email"
                name="supportEmail"
                value={form.supportEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="support@lumina.com"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-500" />
            Security & access
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowPublicSignup"
                name="allowPublicSignup"
                checked={form.allowPublicSignup}
                onChange={handleChange}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="allowPublicSignup" className="text-sm text-slate-700">
                Allow public signup (students and instructors)
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min. approvers for course approval</label>
              <select
                name="minCourseApproval"
                value={form.minCourseApproval}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1">1 (single admin)</option>
                <option value="2">2</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            <Save className="w-4 h-4" />
            Save changes
          </button>
          {saved && <span className="text-sm text-green-600">Saved (demo: not persisted to server).</span>}
        </div>
      </form>
    </div>
  );
};
