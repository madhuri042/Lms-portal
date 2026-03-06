import React from 'react';
import { useLocation } from 'react-router-dom';

export const AdminPlaceholderPage: React.FC = () => {
  const location = useLocation();
  const name = location.pathname.split('/').filter(Boolean).pop() || 'Page';
  const title = name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="text-slate-600">This section is coming soon. Use the sidebar to navigate to Dashboard, Users, Courses, Submissions, or Reports.</p>
    </div>
  );
};
