import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const navSections: Array<{
  label: string;
  to?: string;
  end?: boolean;
  icon: string;
  children?: Array<{ label: string; to: string; icon: string }>;
}> = [
  { label: 'Dashboard', to: '/dashboard/admin', end: true, icon: 'dashboard' },
  {
    label: 'User Management',
    icon: 'users',
    children: [
      { label: 'All Users', to: '/dashboard/admin/users', icon: 'users' },
      { label: 'Students', to: '/dashboard/admin/users?role=student', icon: 'graduation' },
      { label: 'Instructors', to: '/dashboard/admin/users?role=instructor', icon: 'userCog' },
    ],
  },
  {
    label: 'Courses',
    icon: 'book',
    children: [
      { label: 'All Courses', to: '/dashboard/admin/courses', icon: 'book' },
      { label: 'Create Course', to: '/dashboard/admin/courses/create', icon: 'folderPlus' },
      { label: 'Categories', to: '/dashboard/admin/categories', icon: 'tags' },
      { label: 'Course Approvals', to: '/dashboard/admin/courses/approvals', icon: 'fileCheck' },
    ],
  },
  {
    label: 'Students',
    icon: 'graduation',
    children: [
      { label: 'Progress', to: '/dashboard/admin/students/progress', icon: 'activity' },
      { label: 'Performance', to: '/dashboard/admin/students/performance', icon: 'barChart' },
    ],
  },
  {
    label: 'Assignments',
    icon: 'clipboard',
    children: [
      { label: 'Submissions', to: '/dashboard/admin/assignments/submissions', icon: 'clipboard' },
    ],
  },
  {
    label: 'Reports',
    icon: 'barChart',
    children: [
      { label: 'Analytics', to: '/dashboard/admin/reports/analytics', icon: 'barChart' },
      { label: 'Activity Logs', to: '/dashboard/admin/reports/activity', icon: 'activity' },
    ],
  },
  { label: 'Profile', to: '/dashboard/admin/profile', icon: 'profile' },
  { label: 'Settings', to: '/dashboard/admin/settings', icon: 'settings' },
];

const IconSvg = ({ name }: { name: string }) => {
  const size = 18;
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'dashboard':
      return <svg {...common}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
    case 'users':
      return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'graduation':
      return <svg {...common}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" /></svg>;
    case 'userCog':
      return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 20v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" /><circle cx="18" cy="4" r="2" /><path d="M22 10h-2" /><path d="M16 10h-2" /></svg>;
    case 'book':
      return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
    case 'folderPlus':
      return <svg {...common}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" /></svg>;
    case 'tags':
      return <svg {...common}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>;
    case 'fileCheck':
      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 15l2 2 4-4" /></svg>;
    case 'clipboard':
      return <svg {...common}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M9 14h6" /><path d="M9 18h6" /></svg>;
    case 'fileEdit':
      return <svg {...common}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
    case 'barChart':
      return <svg {...common}><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>;
    case 'activity':
      return <svg {...common}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
    case 'profile':
      return <svg {...common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case 'settings':
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    default:
      return <svg {...common}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
  }
};

export const AdminSidebar: React.FC = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
          </svg>
        </div>
        <span className="fw-bold fs-5 text-dark">Vidya Bridge</span>
        <span className="sidebar-admin-badge" title="Administrator">Admin</span>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => {
          if (section.children) {
            const isOpen = openSections[section.label] ?? false;
            return (
              <div key={section.label}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  className="nav-item"
                >
                  <IconSvg name={section.icon} />
                  <span>{section.label}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                    {isOpen ? <polyline points="6 9 12 15 18 9" /> : <polyline points="9 18 15 12 9 6" />}
                  </svg>
                </button>
                {isOpen &&
                  section.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className={({ isActive }) => `nav-item nav-item-sub ${isActive ? 'active' : ''}`}
                    >
                      <IconSvg name={child.icon} />
                      <span>{child.label}</span>
                    </NavLink>
                  ))}
              </div>
            );
          }
          return (
            <NavLink
              key={section.label}
              to={section.to!}
              end={section.end}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              <IconSvg name={section.icon} />
              <span>{section.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
