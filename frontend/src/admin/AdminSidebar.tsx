import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCog,
  BookOpen,
  FolderPlus,
  Tags,
  FileCheck,
  ClipboardList,
  FileEdit,
  BarChart3,
  Activity,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const navSections = [
  {
    label: 'Dashboard',
    to: '/dashboard/admin',
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'User Management',
    icon: Users,
    children: [
      { label: 'All Users', to: '/dashboard/admin/users', icon: Users },
      { label: 'Students', to: '/dashboard/admin/users?role=student', icon: GraduationCap },
      { label: 'Instructors', to: '/dashboard/admin/users?role=instructor', icon: UserCog },
    ],
  },
  {
    label: 'Courses',
    icon: BookOpen,
    children: [
      { label: 'All Courses', to: '/dashboard/admin/courses', icon: BookOpen },
      { label: 'Create Course', to: '/dashboard/admin/courses/create', icon: FolderPlus },
      { label: 'Categories', to: '/dashboard/admin/categories', icon: Tags },
      { label: 'Course Approvals', to: '/dashboard/admin/courses/approvals', icon: FileCheck },
    ],
  },
  {
    label: 'Students',
    icon: GraduationCap,
    children: [
      { label: 'Progress', to: '/dashboard/admin/students/progress', icon: Activity },
      { label: 'Performance', to: '/dashboard/admin/students/performance', icon: BarChart3 },
    ],
  },
  {
    label: 'Assignments',
    icon: ClipboardList,
    children: [
      { label: 'Submissions', to: '/dashboard/admin/assignments/submissions', icon: ClipboardList },
      { label: 'Reviews', to: '/dashboard/admin/assignments/reviews', icon: FileEdit },
    ],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    children: [
      { label: 'Analytics', to: '/dashboard/admin/reports/analytics', icon: BarChart3 },
      { label: 'Activity Logs', to: '/dashboard/admin/reports/activity', icon: Activity },
    ],
  },
  {
    label: 'Notifications',
    to: '/dashboard/admin/notifications',
    icon: Bell,
  },
  {
    label: 'Settings',
    to: '/dashboard/admin/settings',
    icon: Settings,
  },
];

export const AdminSidebar: React.FC = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'User Management': true,
    Courses: true,
  });

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-5 border-b border-slate-200 flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-slate-800 text-lg">Lumina</span>
        <span className="ml-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-medium">Admin</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navSections.map((section) => {
          if ('children' in section && section.children) {
            const isOpen = openSections[section.label] ?? false;
            const Icon = section.icon;
            return (
              <div key={section.label} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium flex-1 text-left">{section.label}</span>
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {isOpen && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {section.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-700 font-medium'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`
                          }
                        >
                          <ChildIcon className="w-4 h-4 shrink-0" />
                          {child.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          const Icon = section.icon;
          return (
            <NavLink
              key={section.label}
              to={section.to!}
              end={section.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {section.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
