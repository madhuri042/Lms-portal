import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Header } from '../components/Header';
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
  return (
    <div className="dashboard-shell">
      <AdminSidebar />
      <div className="main-container">
        <Header user={user} onLogout={onLogout} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
