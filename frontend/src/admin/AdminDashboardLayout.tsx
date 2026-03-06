import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import '../admin/admin.css';

type UserType = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

interface AdminDashboardLayoutProps {
  user: UserType;
  onLogout: () => void;
}

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
        <AdminSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader user={user} onLogout={onLogout} onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
